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
    allow_origins=["*"],  # In production, set to your frontend URL
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
    """
    Stream code review events via Server-Sent Events (SSE).
    Each agent emits events as it works, then the debate agent consolidates.
    """
    if not request.code and not request.github_pr_url:
        raise HTTPException(status_code=400, detail="Provide either 'code' or 'github_pr_url'")

    async def event_generator():
        code = request.code
        language = request.language or "Python"

        # Fetch GitHub PR diff if URL provided
        if request.github_pr_url:
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "fetch_start",
                    "message": f"Fetching PR diff from GitHub..."
                })
            }
            try:
                code, language = await fetch_pr_diff(request.github_pr_url)
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "fetch_done",
                        "message": f"PR fetched. Detected language: {language}. Starting review..."
                    })
                }
            except Exception as e:
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "error",
                        "message": f"Failed to fetch PR: {str(e)}"
                    })
                }
                return

        # Initial state
        initial_state: ReviewState = {
            "code": code,
            "language": language,
            "security_review": {},
            "performance_review": {},
            "style_review": {},
            "debate_result": {},
            "events": [],
            "error": ""
        }

        # Stream events as the graph runs
        seen_events = 0
        
        # Run graph in a thread to avoid blocking
        result = None
        graph_task = asyncio.create_task(
            asyncio.to_thread(review_graph.invoke, initial_state)
        )
        
        # Poll for new events while graph runs
        current_state = initial_state.copy()
        
        # Since LangGraph doesn't natively stream state changes to us here,
        # we run it synchronously in a thread and emit events from the final result.
        # For true per-step streaming, we use the streaming approach below.
        
        try:
            # Use LangGraph's stream method for step-by-step events
            loop = asyncio.get_event_loop()
            
            def run_graph_stream():
                events_to_emit = []
                for chunk in review_graph.stream(initial_state):
                    for node_name, node_output in chunk.items():
                        node_events = node_output.get("events", [])
                        # Get only new events
                        new_events = node_events[seen_events:]
                        events_to_emit.extend(new_events)
                return events_to_emit, chunk
            
            # Stream via synchronous LangGraph stream in thread pool
            all_chunks = []
            final_state = initial_state.copy()
            
            # Collect all stream outputs
            def collect_stream():
                collected = []
                for chunk in review_graph.stream(initial_state):
                    collected.append(chunk)
                return collected
            
            chunks = await asyncio.to_thread(collect_stream)
            
            # Reconstruct state and emit events
            emitted_event_count = 0
            
            for chunk in chunks:
                for node_name, node_output in chunk.items():
                    final_state.update(node_output)
                    
                    all_events = node_output.get("events", [])
                    new_events = all_events[emitted_event_count:]
                    emitted_event_count = len(all_events)
                    
                    for event in new_events:
                        yield {
                            "event": "message",
                            "data": json.dumps(event)
                        }
                        await asyncio.sleep(0.05)  # Small delay for UI to render
            
            # Emit the final complete result
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "final_result",
                    "security": final_state.get("security_review", {}),
                    "performance": final_state.get("performance_review", {}),
                    "style": final_state.get("style_review", {}),
                    "debate": final_state.get("debate_result", {}),
                    "language": language
                })
            }
            
        except Exception as e:
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "error",
                    "message": f"Review pipeline failed: {str(e)}"
                })
            }

    return EventSourceResponse(event_generator())


@app.get("/")
async def root():
    return {
        "name": "Multi-Agent Code Review API",
        "version": "1.0.0",
        "endpoints": {
            "POST /review/stream": "Stream a code review via SSE",
            "GET /health": "Health check"
        }
    }
