import json
import os
import time
from typing import TypedDict
from langgraph.graph import StateGraph
from langgraph.constants import END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

from agents.security_agent import SECURITY_SYSTEM_PROMPT, get_security_prompt
from agents.performance_agent import PERFORMANCE_SYSTEM_PROMPT, get_performance_prompt
from agents.style_agent import STYLE_SYSTEM_PROMPT, get_style_prompt
from agents.debate_agent import DEBATE_SYSTEM_PROMPT, get_debate_prompt

load_dotenv()

AGENT_DELAY_SECONDS = 15

AGENT_MODELS = {
    "security": [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
    "performance": [
        "llama-3.1-8b-instant",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
    ],
    "style": [
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
        "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
    "debate": [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
    ],
    "default": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-20b",
    ],
}


class ReviewState(TypedDict):
    code: str
    language: str
    security_review: dict
    performance_review: dict
    style_review: dict
    debate_result: dict
    events: list
    error: str


def get_llm(model: str):
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=model,
        temperature=0.1,
        max_tokens=4096,
    )


def call_llm_with_fallback(agent_name: str, messages: list, events: list) -> tuple:
    """Try each fallback model in order until one succeeds."""
    models = AGENT_MODELS.get(agent_name, AGENT_MODELS["default"])

    for i, model in enumerate(models):
        try:
            events.append(
                {
                    "type": "agent_start",
                    "agent": agent_name.title(),
                    "message": f"Trying model: {model}...",
                }
            )
            llm = get_llm(model)
            response = llm.invoke(messages)
            return response, events
        except Exception as e:  # noqa: BLE001
            err = str(e)
            if "rate_limit_exceeded" in err:
                events.append(
                    {
                        "type": "agent_error",
                        "agent": agent_name.title(),
                        "message": f"{model} rate limited — trying next model...",
                    }
                )
            elif "model_decommissioned" in err:
                events.append(
                    {
                        "type": "agent_error",
                        "agent": agent_name.title(),
                        "message": f"{model} decommissioned — trying next model...",
                    }
                )
            else:
                events.append(
                    {
                        "type": "agent_error",
                        "agent": agent_name.title(),
                        "message": f"{model} failed: {err[:80]}",
                    }
                )

            if i < len(models) - 1:
                time.sleep(5)
            else:
                raise Exception(
                    f"All fallback models exhausted for {agent_name}. Last error: {err}"
                ) from e

    raise Exception(f"No models available for {agent_name}")


def safe_parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:  # ← fixed: no bare except
                pass
        return {"error": "Failed to parse response", "raw": text[:500]}


def security_node(state: ReviewState) -> dict:
    events = list(state.get("events", []))
    events.append(
        {
            "type": "agent_start",
            "agent": "Security Auditor",
            "message": "Scanning for vulnerabilities...",
        }
    )
    try:
        messages = [
            SystemMessage(content=SECURITY_SYSTEM_PROMPT),
            HumanMessage(content=get_security_prompt(state["code"], state["language"])),
        ]
        response, events = call_llm_with_fallback("security", messages, events)
        result = safe_parse_json(response.content)
        events.append(
            {
                "type": "agent_done",
                "agent": "Security Auditor",
                "message": f"Found {len(result.get('issues', []))} security issues. Score: {result.get('overall_score', 0)}/100",
                "data": result,
            }
        )
        events.append(
            {
                "type": "agent_start",
                "agent": "Security Auditor",
                "message": f"Waiting {AGENT_DELAY_SECONDS}s before next agent...",
            }
        )
        time.sleep(AGENT_DELAY_SECONDS)
        return {"security_review": result, "events": events}
    except Exception as e:
        events.append(
            {
                "type": "agent_error",
                "agent": "Security Auditor",
                "message": f"All models failed: {str(e)}",
            }
        )
        return {
            "security_review": {
                "agent": "Security Auditor",
                "issues": [],
                "overall_score": 0,
                "verdict": "comment",
                "summary": "Agent failed",
            },
            "events": events,
        }


def performance_node(state: ReviewState) -> dict:
    events = list(state.get("events", []))
    events.append(
        {
            "type": "agent_start",
            "agent": "Performance Critic",
            "message": "Analyzing bottlenecks and complexity...",
        }
    )
    try:
        messages = [
            SystemMessage(content=PERFORMANCE_SYSTEM_PROMPT),
            HumanMessage(
                content=get_performance_prompt(state["code"], state["language"])
            ),
        ]
        response, events = call_llm_with_fallback("performance", messages, events)
        result = safe_parse_json(response.content)
        events.append(
            {
                "type": "agent_done",
                "agent": "Performance Critic",
                "message": f"Found {len(result.get('issues', []))} performance issues. Score: {result.get('overall_score', 0)}/100",
                "data": result,
            }
        )
        events.append(
            {
                "type": "agent_start",
                "agent": "Performance Critic",
                "message": f"Waiting {AGENT_DELAY_SECONDS}s before next agent...",
            }
        )
        time.sleep(AGENT_DELAY_SECONDS)
        return {"performance_review": result, "events": events}
    except Exception as e:
        events.append(
            {
                "type": "agent_error",
                "agent": "Performance Critic",
                "message": f"All models failed: {str(e)}",
            }
        )
        return {
            "performance_review": {
                "agent": "Performance Critic",
                "issues": [],
                "overall_score": 0,
                "verdict": "comment",
                "summary": "Agent failed",
            },
            "events": events,
        }


def style_node(state: ReviewState) -> dict:
    events = list(state.get("events", []))
    events.append(
        {
            "type": "agent_start",
            "agent": "Style Enforcer",
            "message": "Reviewing code quality and patterns...",
        }
    )
    try:
        messages = [
            SystemMessage(content=STYLE_SYSTEM_PROMPT),
            HumanMessage(content=get_style_prompt(state["code"], state["language"])),
        ]
        response, events = call_llm_with_fallback("style", messages, events)
        result = safe_parse_json(response.content)
        events.append(
            {
                "type": "agent_done",
                "agent": "Style Enforcer",
                "message": f"Found {len(result.get('issues', []))} style issues. Score: {result.get('overall_score', 0)}/100",
                "data": result,
            }
        )
        events.append(
            {
                "type": "agent_start",
                "agent": "Style Enforcer",
                "message": f"Waiting {AGENT_DELAY_SECONDS}s before debate agent...",
            }
        )
        time.sleep(AGENT_DELAY_SECONDS)
        return {"style_review": result, "events": events}
    except Exception as e:
        events.append(
            {
                "type": "agent_error",
                "agent": "Style Enforcer",
                "message": f"All models failed: {str(e)}",
            }
        )
        return {
            "style_review": {
                "agent": "Style Enforcer",
                "issues": [],
                "overall_score": 0,
                "verdict": "comment",
                "summary": "Agent failed",
            },
            "events": events,
        }


def debate_node(state: ReviewState) -> dict:
    events = list(state.get("events", []))
    events.append(
        {
            "type": "agent_start",
            "agent": "Debate Moderator",
            "message": "Analyzing conflicts and building final verdict...",
        }
    )
    try:
        messages = [
            SystemMessage(content=DEBATE_SYSTEM_PROMPT),
            HumanMessage(
                content=get_debate_prompt(
                    state["security_review"],
                    state["performance_review"],
                    state["style_review"],
                )
            ),
        ]
        response, events = call_llm_with_fallback("debate", messages, events)
        result = safe_parse_json(response.content)
        events.append(
            {
                "type": "agent_done",
                "agent": "Debate Moderator",
                "message": f"Consolidated review complete. Final verdict: {result.get('overall_verdict', 'unknown').upper()}",
                "data": result,
            }
        )
        events.append({"type": "review_complete", "message": "All agents finished."})
        return {"debate_result": result, "events": events}
    except Exception as e:
        events.append(
            {
                "type": "agent_error",
                "agent": "Debate Moderator",
                "message": f"All models failed: {str(e)}",
            }
        )
        return {
            "debate_result": {
                "conflicts": [],
                "top_priorities": [],
                "overall_verdict": "comment",
                "overall_score": 0,
                "final_summary": f"Agent failed: {str(e)}",
                "must_fix_before_merge": [],
                "nice_to_have": [],
            },
            "events": events,
        }


def build_graph():
    graph = StateGraph(ReviewState)
    graph.add_node("security", security_node)
    graph.add_node("performance", performance_node)
    graph.add_node("style", style_node)
    graph.add_node("debate", debate_node)
    graph.set_entry_point("security")
    graph.add_edge("security", "performance")
    graph.add_edge("performance", "style")
    graph.add_edge("style", "debate")
    graph.add_edge("debate", END)
    return graph.compile()


review_graph = build_graph()
