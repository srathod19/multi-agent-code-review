# ⚡ CodeReview.AI — Multi-Agent Code Review System

A production-grade, **completely free** multi-agent code review system where 3 specialized AI agents (Security, Performance, Style) independently review your code, then a Debate Moderator agent consolidates their findings and resolves conflicts.

## Architecture

```
Code Input (paste or GitHub PR URL)
           │
           ▼
┌──────────────────────────────────────┐
│         FastAPI + LangGraph           │
│                                      │
│  [Security Agent] → [Perf Agent]     │
│        → [Style Agent]               │
│              → [Debate Agent]        │
│                                      │
│  Streams events via SSE in real-time │
└──────────────────────────────────────┘
           │
           ▼
    React Frontend (Vercel)
```

## Tech Stack (100% Free)

| Component | Technology | Cost |
|-----------|-----------|------|
| LLM | Groq API (LLaMA 3.3 70B) | FREE |
| Agent Orchestration | LangGraph | Open Source |
| Backend | FastAPI + Python | Open Source |
| Frontend | React + Tailwind | Open Source |
| Backend Deploy | Render.com | Free Tier |
| Frontend Deploy | Vercel | Free Forever |
| GitHub PR fetch | GitHub REST API | Free |

---

## Quick Start (Local)

### 1. Get Free API Keys

**Groq (Required — Free LLM)**
1. Go to https://console.groq.com
2. Sign up (no credit card needed)
3. Create an API key

**GitHub (Optional — for PR URL feature)**
1. Go to https://github.com/settings/tokens
2. Create a personal access token with `repo` scope (for private repos) or no scope (for public repos)

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

Test it:
```bash
curl http://localhost:8000/health
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start
```

Frontend runs at: http://localhost:3000

---

## Deploy for Free

### Backend → Render.com

1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, point to `/backend` folder
4. Set environment variables:
   - `GROQ_API_KEY` = your key
   - `GITHUB_TOKEN` = your token (optional)
5. Deploy — Render auto-detects the `render.yaml`

Your backend URL will be: `https://your-app.onrender.com`

> ⚠️ Free Render instances spin down after 15 minutes of inactivity. First request after idle takes ~30s to wake up.

---

### Frontend → Vercel

1. Push frontend folder to GitHub
2. Go to https://vercel.com → New Project
3. Import your repo
4. Set environment variable:
   - `REACT_APP_API_URL` = your Render backend URL
5. Deploy

---

## Features

- **3 Specialized Agents**: Each has a focused system prompt tuned for its domain
- **Real-time SSE Streaming**: Watch agents work live in the terminal log
- **Debate Agent**: Identifies conflicts between agents and resolves them
- **GitHub PR Support**: Paste any public PR URL and review the diff
- **Severity Scoring**: Critical → High → Medium → Low → Info
- **Score Rings**: Visual 0-100 score per agent
- **Conflict Detection**: See when Security and Style agents disagree
- **Must-Fix vs Nice-to-Have**: Clear merge readiness signal

## Project Structure

```
code-review-agents/
├── backend/
│   ├── agents/
│   │   ├── security_agent.py    # Security vulnerability scanning
│   │   ├── performance_agent.py # Performance bottleneck detection
│   │   ├── style_agent.py       # Code quality & style review
│   │   └── debate_agent.py      # Conflict resolution & consolidation
│   ├── graph.py                 # LangGraph orchestration pipeline
│   ├── github_fetcher.py        # GitHub PR diff fetcher
│   ├── main.py                  # FastAPI server with SSE streaming
│   ├── requirements.txt
│   └── render.yaml              # Render.com deployment config
└── frontend/
    ├── src/
    │   ├── hooks/
    │   │   └── useReviewStream.js   # SSE streaming hook
    │   ├── components/
    │   │   ├── AgentCard.js         # Per-agent review card with issues
    │   │   ├── DebatePanel.js       # Consolidated final verdict
    │   │   └── EventLog.js          # Live terminal activity log
    │   └── App.js                   # Main app layout
    ├── public/index.html
    ├── package.json
    └── vercel.json                  # Vercel deployment config
```

## API Reference

### POST /review/stream
Stream a code review via Server-Sent Events.

**Request body:**
```json
{
  "code": "def hello(): pass",
  "language": "Python",
  "github_pr_url": null
}
```

OR:
```json
{
  "code": null,
  "language": null,
  "github_pr_url": "https://github.com/owner/repo/pull/123"
}
```

**SSE Event types:**
- `agent_start` — Agent has begun analysis
- `agent_done` — Agent completed (includes full review data)
- `agent_error` — Agent encountered an error
- `fetch_start` / `fetch_done` — GitHub PR being fetched
- `final_result` — Complete result from all 4 agents
- `review_complete` — All done

---

## Switching LLM Providers

### Use Anthropic Claude (recommended for quality)
```bash
pip install langchain-anthropic
```

In `graph.py`, replace `get_llm()`:
```python
from langchain_anthropic import ChatAnthropic

def get_llm():
    return ChatAnthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        model="claude-3-5-haiku-20241022",  # Fast + cheap
        temperature=0.1,
    )
```

### Use OpenAI
```python
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
```

---

Built with LangGraph + FastAPI + React. 100% free to run and deploy.
