# NEXUS — Investigation Intelligence Platform

AI-powered collaborative investigation platform that transforms scattered evidence documents into structured investigative intelligence.

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **MongoDB** running on `localhost:27017` (or set `MONGODB_URI` in `.env`)
- **OpenAI API key** (set in `backend/.env`)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate          # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Edit .env with your OPENAI_API_KEY and MONGODB_URI
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — the NEXUS dashboard.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + Tailwind CSS + Cytoscape.js + vis-timeline |
| Backend | FastAPI (Python) |
| Database | MongoDB (via motor async driver) |
| AI | OpenAI GPT-4o-mini |
| Real-time | WebSockets |

## AI Pipeline

Every uploaded document goes through a 4-layer AI pipeline:

1. **Document Memory** — text extraction, AI summary, claim extraction, entity tagging, timeline events, credibility scoring
2. **Contradiction Detection** — cross-references new claims against existing claims to find logical conflicts
3. **Dead End Detection** — monitors investigation health for exhausted leads, blind spots, and circular patterns
4. **Impact Ranking** — scores each document 0–100 based on unique facts, connections, credibility, and entity coverage

## Features

- 📁 **Case Management** — create, search, and manage investigation cases
- 📤 **Evidence Upload** — PDF, URL, investigator notes
- 🤖 **AI Summaries** — auto-generated 3-line intelligence summaries
- 📋 **Claim Extraction** — individual factual claims stored permanently
- 🕸️ **Entity Graph** — force-directed relationship visualization
- 📅 **Timeline View** — chronological event extraction
- ⚠️ **Contradiction Alerts** — automatic conflict detection
- 🏥 **Investigation Health** — dead-end and blind-spot signals
- 📊 **Impact Ranking** — evidence importance scoring
- ⚡ **Real-time Updates** — WebSocket pipeline progress
