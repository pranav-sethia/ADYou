"""
API Router for ADU RAG functionality.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents import Agent, Runner, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

set_tracing_disabled(True)

# Initialize the router
router = APIRouter()

# Paths / constants
repo_root = Path(__file__).resolve().parent.parent.parent
RAG_DIR = repo_root / "api"
DATA_DIR = RAG_DIR / "data"
INDEX_PATH = DATA_DIR / "adu_index.json"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
TOP_K = 6

# Lazy-loaded globals
_embedding_model = None
_index_entries: list[dict] | None = None


def get_secret(name: str) -> str | None:
    """Read secret from environment, with direct file fallback."""
    value = os.environ.get(name)
    if value and value.strip():
        return value.strip()

    # Fallback parse in case env loading is blocked by shell state.
    for candidate in (repo_root / ".env", repo_root / "frontend" / ".env.local"):
        if not candidate.exists():
            continue
        try:
            for line in candidate.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k.strip() == name and v.strip():
                    return v.strip().strip('"').strip("'")
        except Exception:
            continue
    return None


def env_diagnostics() -> dict:
    root_env = repo_root / ".env"
    fe_env = repo_root / "frontend" / ".env.local"
    return {
        "root_env_exists": root_env.exists(),
        "frontend_env_exists": fe_env.exists(),
        "root_env_has_gemini": bool(get_secret("GEMINI_API_KEY")),
    }


def get_index_entries() -> list[dict]:
    global _index_entries
    if _index_entries is None:
        if not INDEX_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="RAG index not found. Run: python api/scripts/ingest.py",
            )
        try:
            payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
            _index_entries = payload.get("entries", [])
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load index file: {exc}",
            ) from exc
    return _index_entries


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return -1.0
    return dot / (norm_a * norm_b)


def retrieve_top_k(query_embedding: list[float], k: int) -> list[dict]:
    entries = get_index_entries()
    scored = []
    for entry in entries:
        emb = entry.get("embedding")
        if not emb:
            continue
        try:
            score = cosine_similarity(query_embedding, emb)
        except Exception:
            continue
        scored.append((score, entry))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [entry for _, entry in scored[:k]]


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model


class HistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] | None = None
    address: str | None = None
    adu_sqft: float | None = None
    adu_type: str | None = None
    primary_use: str | None = None
    blocker_types: list[str] = Field(default_factory=list)
    has_existing_structure: bool | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


MAX_HISTORY_TURNS = 10


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    query = req.message.strip()

    # Embed query
    model = get_embedding_model()
    query_embedding = model.encode([query]).tolist()[0]

    # Retrieve top chunks
    top_entries = retrieve_top_k(query_embedding, TOP_K)
    docs = [e.get("text", "") for e in top_entries]
    sources = [
        {"page": e.get("page"), "chunk_id": e.get("id"), "source": e.get("source")}
        for e in top_entries
    ]
    context = "\n\n---\n\n".join(docs) if docs else "(No relevant context found.)"

    system = (
        "You are an ADU advisor. Answer only using the following context from the "
        "California HCD ADU Handbook. If the answer is not in the context, say so clearly. "
        "Keep answers concise and cite page numbers when relevant.\n\n"
    )
    
    # Inject frontend map context if available
    if any([req.address, req.adu_sqft, req.adu_type, req.primary_use]):
        system += "**User Property Context (Already Known):**\n"
        if req.address: system += f"- Address: {req.address}\n"
        if req.adu_sqft: system += f"- Planned ADU Size: {req.adu_sqft} sq ft\n"
        if req.adu_type: system += f"- ADU Type: {req.adu_type.replace('_', ' ').title()}\n"
        if req.primary_use: system += f"- Primary Use: {req.primary_use}\n"
        if req.blocker_types: system += f"- Property Blockers: {', '.join(req.blocker_types)}\n"
        system += "\nNote: Do not ask the user for this information if it is already provided above.\n\n"

    system += f"**Context from the handbook:**\n\n{context}"

    history_text = ""
    if req.history:
        for turn in req.history[-MAX_HISTORY_TURNS * 2:]:
            if turn.role in ("user", "assistant"):
                role = "User" if turn.role == "user" else "Assistant"
                history_text += f"{role}: {turn.content}\n\n"

    instructions = system
    if history_text:
        instructions += f"\n\n---\n**Conversation so far:**\n{history_text}"

    api_key = get_secret("GEMINI_API_KEY")
    if not api_key:
        diag = env_diagnostics()
        raise HTTPException(
            status_code=503,
            detail=f"GEMINI_API_KEY not set. Add it to .env. Diagnostics: {diag}",
        )

    agent = Agent(
        name="ADU Advisor",
        instructions=instructions,
        model=LitellmModel(model="gemini/gemini-2.5-flash", api_key=api_key),
    )

    try:
        result = await Runner.run(agent, input=query)
        answer = result.final_output.strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent request failed: {exc}") from exc

    return ChatResponse(answer=answer, sources=sources)


@router.get("/debug/config")
def debug_config():
    # No secrets are returned; only booleans.
    return env_diagnostics()
