# ADU RAG Chatbot (standalone)

RAG-powered chatbot that answers ADU questions using the [California HCD ADU Handbook](https://www.hcd.ca.gov/sites/default/files/docs/policy-and-research/adu-handbook-update.pdf). Embeddings use **sentence-transformers** (all-MiniLM-L6-v2, free). Answers are generated via **Groq** (free tier) or **Google Gemini** (free tier).

## Setup

1. **Install dependencies** (from repo root or a venv):
   ```bash
   pip install -r rag_adu/requirements.txt
   ```

2. **Place the PDF** at `rag_adu/data/adu-handbook-update.pdf`.  
   Or download it from the link above and save it there. The ingest script can also download it if the file is missing.

3. **Run ingest once** (chunk PDF, embed, write local vector index):
   ```bash
   python rag_adu/ingest.py
   ```
   This creates `rag_adu/data/adu_index.json`. Run again only if you change the PDF or chunking.

4. **Set an API key** for the chat LLM (embeddings are local and free):
   - **Groq (recommended):** Get a key at [console.groq.com](https://console.groq.com). In repo root `.env` add:
     ```env
     GROQ_API_KEY=your_key_here
     ```
   - **Or Google Gemini:** Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). In `.env` add:
     ```env
     GOOGLE_API_KEY=your_key_here
     ```

5. **Start the RAG server** (from repo root):
   ```bash
   uvicorn rag_adu.server:app --port 8001
   ```

6. **Frontend:** In `frontend/.env.local` set (optional; default in code is 8001):
   ```env
   NEXT_PUBLIC_RAG_API_URL=http://localhost:8001
   ```
   Then run the Next.js app and open **http://localhost:3000/adu-chat** in the browser (no link from the main map page; open this URL directly).

## Usage

- **Chat UI:** Go to `http://localhost:3000/adu-chat`. Type a question about ADUs, requirements, or the handbook; the app sends it to the RAG API and shows the answer and optional source pages.
- **API:** `POST http://localhost:8001/chat` with body `{ "message": "your question" }` returns `{ "answer": "...", "sources": [...] }`.

## No impact on main project

This module does not modify `api/main.py`, `frontend/src/app/page.tsx`, or any other existing file. The map at `/` is unchanged. The RAG chatbot is reached only by opening `/adu-chat` directly.
