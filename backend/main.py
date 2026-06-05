import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import Optional

from graph import review_graph, ReviewState
from github_fetcher import fetch_pr_diff

app = FastAPI(title="Multi-Agent Code Review API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReviewRequest(BaseModel):
    code: Optional[str] = None
    language: Optional[str] = "Python"
    github_pr_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "ok", "message": "Multi-Agent Code Review API is running"}


@app.post("/review/stream")
async def review_stream(request: ReviewRequest):
    if not request.code and not request.github_pr_url:
        raise HTTPException(
            status_code=400, detail="Provide either 'code' or 'github_pr_url'"
        )

    async def event_generator():
        code = request.code
        language = request.language or "Python"

        if request.github_pr_url:
            yield {
                "event": "message",
                "data": json.dumps(
                    {
                        "type": "fetch_start",
                        "message": "Fetching PR diff from GitHub...",  # ← removed f prefix
                    }
                ),
            }
            try:
                code, language = await fetch_pr_diff(request.github_pr_url)
                yield {
                    "event": "message",
                    "data": json.dumps(
                        {
                            "type": "fetch_done",
                            "message": f"PR fetched. Detected language: {language}. Starting review...",
                        }
                    ),
                }
            except Exception as e:
                yield {
                    "event": "message",
                    "data": json.dumps(
                        {"type": "error", "message": f"Failed to fetch PR: {str(e)}"}
                    ),
                }
                return

        initial_state: ReviewState = {
            "code": code,
            "language": language,
            "security_review": {},
            "performance_review": {},
            "style_review": {},
            "debate_result": {},
            "events": [],
            "error": "",
        }

        try:
            emitted_event_count = 0
            final_state = initial_state.copy()

            def collect_stream():
                collected = []
                for chunk in review_graph.stream(initial_state):
                    collected.append(chunk)
                return collected

            chunks = await asyncio.to_thread(collect_stream)

            for chunk in chunks:
                for node_name, node_output in chunk.items():
                    final_state.update(node_output)

                    all_events = node_output.get("events", [])
                    new_events = all_events[emitted_event_count:]
                    emitted_event_count = len(all_events)

                    for event in new_events:
                        yield {"event": "message", "data": json.dumps(event)}
                        await asyncio.sleep(0.05)

            yield {
                "event": "message",
                "data": json.dumps(
                    {
                        "type": "final_result",
                        "security": final_state.get("security_review", {}),
                        "performance": final_state.get("performance_review", {}),
                        "style": final_state.get("style_review", {}),
                        "debate": final_state.get("debate_result", {}),
                        "language": language,
                    }
                ),
            }

        except Exception as e:
            yield {
                "event": "message",
                "data": json.dumps(
                    {"type": "error", "message": f"Review pipeline failed: {str(e)}"}
                ),
            }

    return EventSourceResponse(event_generator())


@app.get("/")
async def root():
    return {
        "name": "Multi-Agent Code Review API",
        "version": "1.0.0",
        "endpoints": {
            "POST /review/stream": "Stream a code review via SSE",
            "GET /health": "Health check",
        },
    }
