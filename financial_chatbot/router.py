"""
FastAPI router for the ADU Financial Chatbot.

Endpoints:
  POST /chatbot/chat             — multi-turn conversation
  POST /chatbot/financial-report — direct report generation (no chat)
"""

import logging
from fastapi import APIRouter, HTTPException

from financial_chatbot.schemas import ChatRequest, ChatResponse, FinancialReport
from financial_chatbot.chat_engine import chat
from financial_chatbot.financial_engine import compute_financial_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    """
    Multi-turn ADU financial advisor chat.

    Pass the full conversation history on every request (stateless).
    Once the model has collected all required parameters, the response
    will include a `report` field with the full financial analysis.
    """
    try:
        reply, params = await chat(
            messages=req.messages,
            address=req.address,
            adu_sqft=req.adu_sqft,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    report: FinancialReport | None = None
    if params is not None:
        try:
            report = compute_financial_report(params, address=req.address)
        except Exception as e:
            logger.error(f"Financial engine error: {e}")
            # Don't fail the whole request — just return the reply without a report

    return ChatResponse(
        reply=reply,
        report=report,
        params_so_far=params,
    )


@router.post("/financial-report", response_model=FinancialReport)
async def direct_report(
    sqft: float,
    construction_type: str = "new_build",
    bedrooms: int = 1,
    bathrooms: float = 1.0,
    addons: str = "",
    address: str | None = None,
) -> FinancialReport:
    """
    Generate a financial report directly without going through chat.
    Useful for testing or pre-seeding the UI with known params.
    """
    from financial_chatbot.schemas import ADUParams
    addon_list = [a.strip() for a in addons.split(",") if a.strip()] if addons else []
    params = ADUParams(
        sqft=sqft,
        construction_type=construction_type,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        addons=addon_list,
    )
    return compute_financial_report(params, address=address)
