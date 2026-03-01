# ADU Marketplace - IrvineHacks 2026

ADU Marketplace is California's first dedicated platform for Accessory Dwelling Units (ADUs). It simplifies the entire process of evaluating a property's ADU potential, generating feasibility reports via AI, and seamlessly creating marketplace listings for rental income.

## ✨ Features
* **AI Feasibility Reports**: Automatically generate comprehensive ADU build plans, financial breakdowns, and zoning considerations using Gemini AI.
* **Automated Listing Generation**: Convert your AI feasibility reports directly into pre-filled marketplace listings with intelligently extracted details (rent estimates, square footage, amenities, and generated descriptions).
* **Interactive Map & Lot Analysis**: Check if your property qualifies for an ADU build with interactive mapping tools.
* **Dedicated ADU Escapes**: A specialized marketplace filtered specifically for evaluating, renting, and finding ADUs, removing the noise of standard large-scale housing sites.

## 🛠 Tech Stack
### Frontend
* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Components**: React, specialized UI cards, interactive Hero Section.

### Backend
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **AI Integration**: [Litellm](https://github.com/BerriAI/litellm) wrapping `gemini-2.5-flash` for high-speed structured data extraction and report generation.
* **Package Management**: `uv`

## 🚀 Getting Started

To run this project locally, you will need two terminal tabs open—one for the frontend and one for the backend.

### 1. Backend Setup (FastAPI)
The backend requires Python and handles the AI interactions. Make sure you have your `.env` configured with the necessary API keys (like `GEMINI_API_KEY`).

```bash
# Install dependencies from the newly generated requirements file
uv pip install -r requirements.txt

# Start the FastAPI server on port 8000
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (Next.js)
The frontend is located in the `ADUmarketplace` directory.

```bash
# Navigate to the frontend directory or use the prefix flag
cd ADUmarketplace

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```
Alternatively, you can run the frontend from the root directory using:
`npm run dev --prefix ADUmarketplace`

### 3. Usage
Once both servers are running:
1. Open your browser to `http://localhost:3000`.
2. Evaluate a lot or play around with the mock data to create an AI Feasibility Report.
3. In the "My Projects" dashboard, view the report and click **"Generate Listing"** to see the automated extraction convert the report directly into a ready-to-publish ADU listing.

---
*Built for IrvineHacks 2026.*
