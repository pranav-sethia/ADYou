"""
API Router for ADU RAG functionality.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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
        "root_env_has_groq": bool(get_secret("GROQ_API_KEY")),
        "root_env_has_google": bool(get_secret("GOOGLE_API_KEY")),
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


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


MAX_HISTORY_TURNS = 10


def call_groq(messages: list[dict]) -> str:
    import groq
    api_key = get_secret("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not set. Add it to .env",
        )
    model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
    client = groq.Groq(api_key=api_key)
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
        )
        return resp.choices[0].message.content or ""
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}") from exc


def call_gemini(messages: list[dict]) -> str:
    try:
        import google.generativeai as genai
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Google Generative AI not installed. pip install google-generativeai",
        )
    api_key = get_secret("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_API_KEY not set. Add it to .env",
        )
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    parts: list[str] = []
    for msg in messages:
        role_label = msg["role"].upper()
        parts.append(f"[{role_label}]\n{msg['content']}")
    full_prompt = "\n\n".join(parts)
    resp = model.generate_content(full_prompt)
    return resp.text or ""


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
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
        f"Context from the handbook:\n\n{context}"
    )

    # Build the full message array with conversation history
    messages: list[dict] = [{"role": "system", "content": system}]

    if req.history:
        for turn in req.history[-MAX_HISTORY_TURNS * 2:]:
            if turn.role in ("user", "assistant"):
                messages.append({"role": turn.role, "content": turn.content})

    messages.append({"role": "user", "content": query})

    # Prefer Groq, fallback to Gemini
    if get_secret("GROQ_API_KEY"):
        answer = call_groq(messages)
    elif get_secret("GOOGLE_API_KEY"):
        answer = call_gemini(messages)
    else:
        diag = env_diagnostics()
        raise HTTPException(
            status_code=503,
            detail=(
                "Set GROQ_API_KEY or GOOGLE_API_KEY. "
                f"Diagnostics: {diag}"
            ),
        )

    return ChatResponse(answer=answer.strip(), sources=sources)


@router.get("/debug/config")
def debug_config():
    # No secrets are returned; only booleans.
    return env_diagnostics()
