"""
Standalone RAG server for ADU Handbook.

Run from repo root:
  uvicorn rag_adu.server:app --port 8001
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

# Load .env from repo root so GROQ_API_KEY / GOOGLE_API_KEY are available
try:
    from dotenv import load_dotenv
    repo_root = Path(__file__).resolve().parent.parent
    # override=True ensures file values replace blank shell vars.
    load_dotenv(repo_root / ".env", override=True)
    # Optional fallback if user accidentally placed key in frontend env.
    load_dotenv(repo_root / "frontend" / ".env.local", override=True)
except ImportError:
    pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Paths / constants
RAG_DIR = Path(__file__).resolve().parent
DATA_DIR = RAG_DIR / "data"
INDEX_PATH = DATA_DIR / "adu_index.json"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
TOP_K = 6

app = FastAPI(title="ADU RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded globals
_embedding_model = None
_index_entries: list[dict] | None = None


def get_secret(name: str) -> str | None:
    """Read secret from environment, with direct file fallback."""
    value = os.environ.get(name)
    if value and value.strip():
        return value.strip()

    # Fallback parse in case env loading is blocked by shell state.
    repo_root = Path(__file__).resolve().parent.parent
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
    repo_root = Path(__file__).resolve().parent.parent
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
                detail="RAG index not found. Run: python rag_adu/ingest.py",
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


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


def call_groq(prompt: str, system: str) -> str:
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
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
        )
        return resp.choices[0].message.content or ""
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}") from exc


def call_gemini(prompt: str, system: str) -> str:
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
    full_prompt = f"{system}\n\n{prompt}"
    resp = model.generate_content(full_prompt)
    return resp.text or ""


@app.post("/chat", response_model=ChatResponse)
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
        "Keep answers concise and cite page numbers when relevant."
    )
    user_prompt = f"Context from the handbook:\n\n{context}\n\nUser question: {query}"

    # Prefer Groq, fallback to Gemini
    if get_secret("GROQ_API_KEY"):
        answer = call_groq(user_prompt, system)
    elif get_secret("GOOGLE_API_KEY"):
        answer = call_gemini(user_prompt, system)
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


@app.get("/")
def root():
    return {
        "message": "ADU RAG API",
        "docs": "POST /chat with {\"message\": \"your question\"}. GET /health for health check.",
        "chat": "/chat",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/debug/config")
def debug_config():
    # No secrets are returned; only booleans.
    return env_diagnostics()
