"""
One-time ingest for ADU RAG.

Reads the ADU handbook PDF, chunks text, creates embeddings with
sentence-transformers (all-MiniLM-L6-v2), and writes a local JSON index.

Run from repo root:
    python rag_adu/ingest.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

RAG_DIR = Path(__file__).resolve().parent
DATA_DIR = RAG_DIR / "data"
PDF_PATH = DATA_DIR / "adu-handbook-update.pdf"
INDEX_PATH = DATA_DIR / "adu_index.json"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
PDF_URL = (
    "https://www.hcd.ca.gov/sites/default/files/docs/policy-and-research/"
    "adu-handbook-update.pdf"
)


def ensure_pdf() -> None:
    """Download PDF if missing."""
    if PDF_PATH.exists():
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        import httpx
        print(f"Downloading PDF from {PDF_URL}...")
        r = httpx.get(PDF_URL, follow_redirects=True, timeout=60)
        r.raise_for_status()
        PDF_PATH.write_bytes(r.content)
        print(f"Saved to {PDF_PATH}")
    except Exception as e:
        raise FileNotFoundError(
            f"PDF not found at {PDF_PATH} and download failed: {e}. "
            "Download it manually and place at rag_adu/data/adu-handbook-update.pdf"
        ) from e


def extract_text_from_pdf() -> list[tuple[int, str]]:
    """Return list of (page_number, text)."""
    from pypdf import PdfReader
    reader = PdfReader(PDF_PATH)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            pages.append((i, text))
    return pages


def chunk_text(pages: list[tuple[int, str]]) -> list[tuple[int, str, str]]:
    """Return (page, chunk_text, chunk_id) for each overlapping text chunk."""
    chunks: list[tuple[int, str, str]] = []
    for page_num, text in pages:
        start = 0
        idx = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            chunk = text[start:end]
            if chunk.strip():
                chunk_id = f"p{page_num}_c{idx}"
                chunks.append((page_num, chunk, chunk_id))
                idx += 1
            start = end - CHUNK_OVERLAP
            if start >= len(text):
                break
    return chunks


def main() -> None:
    ensure_pdf()
    print("Extracting text from PDF...")
    pages = extract_text_from_pdf()
    print(f"  {len(pages)} pages with text")
    chunks = chunk_text(pages)
    print(f"  {len(chunks)} chunks")

    print(f"Loading embedding model {EMBEDDING_MODEL}...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(EMBEDDING_MODEL)

    print("Embedding chunks...")
    texts = [c[1] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=True)

    print("Writing local index...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    entries = []
    for (page, text, chunk_id), emb in zip(chunks, embeddings.tolist(), strict=True):
        entries.append(
            {
                "id": chunk_id,
                "page": page,
                "source": "hcd_adu_handbook",
                "text": text,
                "embedding": emb,
            }
        )

    payload = {
        "model": EMBEDDING_MODEL,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "count": len(entries),
        "entries": entries,
    }
    INDEX_PATH.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Done. Wrote {len(entries)} chunks to {INDEX_PATH}")


if __name__ == "__main__":
    main()
