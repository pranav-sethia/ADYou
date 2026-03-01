import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents import Agent, Runner, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

set_tracing_disabled(True)
logger = logging.getLogger(__name__)

# Re-use our models from the existing feature branches
from financial_chatbot.schemas import ChatMessage as FinancialChatMessage, ADUParams
from financial_chatbot.chat_engine import chat as run_financial_agent
from api.routers.rag import chat as run_rag_agent, ChatRequest as RAGChatRequest, HistoryMessage

router = APIRouter(prefix="/agent")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OrchestratorRequest(BaseModel):
    message: str
    history: list[HistoryMessage] | None = None
    # Context payload from React frontend
    address: str | None = None
    adu_sqft: float | None = None
    adu_type: str | None = None
    primary_use: str | None = None
    blocker_types: list[str] = Field(default_factory=list)
    has_existing_structure: bool | None = None

class OrchestratorResponse(BaseModel):
    answer: str
    sources: list[dict] = Field(default_factory=list)
    generate_report: bool = False
    report_params: ADUParams | None = None

# ---------------------------------------------------------------------------
# External Tool Adapters (for the Orchestrator)
# ---------------------------------------------------------------------------

def ask_hcd_rag(query: str, request_context: OrchestratorRequest) -> OrchestratorResponse:
    """Invokes the California HCD handbook RAG agent for legal/regulatory questions."""
    logger.info(f"Orchestrator routed to RAG Agent: '{query}'")
    
    # We pass the full history through to the underlying RAG agent
    req = RAGChatRequest(message=query, history=request_context.history)
    try:
        from api.routers.rag import chat
        # The underlying RAG agent is async, but our tool must match its definition. 
        # Our updated RAG `chat` is async.
    except Exception as e:
        logger.error(f"Failed to run RAG agent: {e}")
        return OrchestratorResponse(answer="I'm having trouble accessing my handbook right now. Please try asking again.")
    
    # Returning None, we will await the actual call manually inside the orchestrator flow 
    # since function calling async code from a synchronous litellm block can be tricky.
    pass


# ---------------------------------------------------------------------------
# System Prompt
# ---------------------------------------------------------------------------
_ORCHESTRATOR_PROMPT = """\
You are the ADU Advisor Orchestrator. 
The user is building an Accessory Dwelling Unit (ADU) in California.

Based on the Conversation History and the User's new message, you must decide which specialized agent can best help them.

CRITICAL ROUTING RULE: If the Conversation History shows that the Assistant just asked the user a question about details for a financial estimate (like bedrooms, size, or quality), and the User is answering that question, you MUST route to ROUTE_FINANCE.

Respond with ONLY ONE of the following routing codes:
ROUTE_RAG : Use this if the user asks about rules, laws, setbacks, permitting, HCD handbook advice, or maximum sizes.
ROUTE_FINANCE : Use this if the user asks about costs, loans, ROI, budgets, estimating, construction material prices, OR if they are answering a follow-up question from the financial estimator.
"""

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/orchestrate", response_model=OrchestratorResponse)
async def orchestrate_chat(req: OrchestratorRequest) -> OrchestratorResponse:
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY environment variable not set.")

    # 1. Ask Orchestrator for the route
    orchestrator = Agent(
        name="ADU Orchestrator",
        instructions=_ORCHESTRATOR_PROMPT,
        model=LitellmModel(model="gemini/gemini-2.5-flash", api_key=api_key),
    )

    history_text = "No prior history.\n"
    if req.history:
        history_text = ""
        for turn in req.history[-6:]:
            role = "User" if turn.role == "user" else "Assistant"
            history_text += f"{role}: {turn.content}\n\n"
            
    full_input = f"Conversation History:\n{history_text}\nUser's new message:\n{req.message}"
            
    try:
        route_decision = await Runner.run(orchestrator, input=full_input)
        route = route_decision.final_output.strip().upper()
    except Exception as e:
        logger.error(f"Orchestrator LLM failed: {e}")
        raise HTTPException(status_code=502, detail="Orchestrator failed to route request.")

    # 2. Invoke the corresponding Sub-Agent
    if "ROUTE_FINANCE" in route:
        logger.info("Routing to Financial Agent")
        
        # Build the message history list the Financial Agent expects
        fin_history = []
        if req.history:
            for turn in req.history:
                fin_history.append(FinancialChatMessage(role=turn.role, content=turn.content))
        fin_history.append(FinancialChatMessage(role="user", content=req.message))

        try:
            reply, params = await run_financial_agent(
                messages=fin_history,
                address=req.address,
                adu_sqft=req.adu_sqft
            )
            return OrchestratorResponse(
                answer=reply,
                generate_report=bool(params),
                report_params=params
            )
        except Exception as e:
            logger.error(f"Financial Agent Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    else:
        # Default fallback is always the Regulatory RAG agent
        logger.info("Routing to HCD RAG Agent")
        rag_req = RAGChatRequest(
            message=req.message, 
            history=req.history,
            address=req.address,
            adu_sqft=req.adu_sqft,
            adu_type=req.adu_type,
            primary_use=req.primary_use,
            blocker_types=req.blocker_types,
            has_existing_structure=req.has_existing_structure
        )
        
        try:
            # Our underlying endpoint in api.routers.rag is async
            rag_res = await run_rag_agent(rag_req)
            return OrchestratorResponse(
                answer=rag_res.answer,
                sources=rag_res.sources
            )
        except Exception as e:
             logger.error(f"RAG Agent Error: {e}")
             raise HTTPException(status_code=500, detail=str(e))
