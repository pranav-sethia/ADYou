# ADYou

ADYou helps California homeowners figure out whether they can build an accessory dwelling unit (ADU) on their lot, and what it would cost and earn. It won 2nd place at IrvineHacks 2026.

Enter an address and it pulls the real parcel boundary, finds the existing buildings from satellite imagery, applies the local setback rules and shows how much of the lot is buildable. An AI advisor answers questions about state ADU law and the financials, and a feasibility report can be turned straight into a rental listing.

## How it works

**Lot analysis** (`engine/`, `api/main.py`). The parcel boundary comes from the ReportAll USA parcel API. LangSAM (GroundingDINO with SAM) finds the house and other structures in Mapbox satellite imagery and turns them into map polygons. All the geometry is done with Shapely in California State Plane coordinates (EPSG:2230, in feet), so areas and distances come out accurate. The engine subtracts the setbacks and building buffers for the city's zoning rules (`api/config/zoning_rules.py`) and returns the buildable area as GeoJSON for the map.

**The advisor** (`api/routers/orchestrator.py`). One agent reads each question and hands it to the right specialist:

- a retrieval agent over California HCD's ADU handbook, which embeds the question, pulls the closest handbook passages and answers with page citations (`api/routers/rag.py`)
- a financial agent that works out build cost, rent and break-even for the planned unit (`financial_chatbot/`)

The agents use the OpenAI Agents SDK with Gemini 2.5 Flash through LiteLLM.

**Reports and listings** (`api/routers/report.py`). Gemini writes a feasibility report covering the build plan, zoning and finances. From the dashboard, a report can be converted into a pre-filled marketplace listing with rent, square footage and a description.

## Stack

Next.js, TypeScript, Tailwind CSS, Mapbox GL and Turf.js on the frontend. FastAPI, Shapely, LangSAM, sentence-transformers, the OpenAI Agents SDK, LiteLLM and Gemini on the backend.

## Running it locally

You'll need `REPORTALL_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN` and `GEMINI_API_KEY` in a `.env` file (see `.env.example`).

Backend:

```bash
uv pip install -r requirements.txt
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend, in a second terminal:

```bash
cd ADUmarketplace
npm install
npm run dev
```

Then open http://localhost:3000.

## Team

Built at IrvineHacks 2026 by Abhinav Satheesh, Pranai Raina, Pranav Sethia and Rishi Potipireddi.
