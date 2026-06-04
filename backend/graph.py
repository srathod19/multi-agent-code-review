import json
import os
from typing import TypedDict, Annotated, Any
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


class ReviewState(TypedDict):
    code: str
    language: str
    security_review: dict
    performance_review: dict
    style_review: dict
    debate_result: dict
    events: list[dict]
    error: str


def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=4096,
    )


def safe_parse_json(text: str) -> dict:
    """Safely parse JSON from LLM response, stripping markdown fences if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except:
                pass
        return {"error": "Failed to parse response", "raw": text[:500]}


def security_node(state: ReviewState) -> dict:
    """Run security audit agent."""
    events = state.get("events", [])
    events.append({"type": "agent_start", "agent": "Security Auditor", "message": "Scanning for vulnerabilities..."})
    
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=SECURITY_SYSTEM_PROMPT),
            HumanMessage(content=get_security_prompt(state["code"], state["language"]))
        ]
        response = llm.invoke(messages)
        result = safe_parse_json(response.content)
        
        events.append({
            "type": "agent_done",
            "agent": "Security Auditor",
            "message": f"Found {len(result.get('issues', []))} security issues. Score: {result.get('overall_score', 0)}/100",
            "data": result
        })
        return {"security_review": result, "events": events}
    except Exception as e:
        error_result = {"agent": "Security Auditor", "issues": [], "overall_score": 0, "verdict": "comment", "error": str(e), "summary": "Agent failed"}
        events.append({"type": "agent_error", "agent": "Security Auditor", "message": f"Error: {str(e)}"})
        return {"security_review": error_result, "events": events}


def performance_node(state: ReviewState) -> dict:
    """Run performance audit agent."""
    events = state.get("events", [])
    events.append({"type": "agent_start", "agent": "Performance Critic", "message": "Analyzing bottlenecks and complexity..."})
    
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=PERFORMANCE_SYSTEM_PROMPT),
            HumanMessage(content=get_performance_prompt(state["code"], state["language"]))
        ]
        response = llm.invoke(messages)
        result = safe_parse_json(response.content)
        
        events.append({
            "type": "agent_done",
            "agent": "Performance Critic",
            "message": f"Found {len(result.get('issues', []))} performance issues. Score: {result.get('overall_score', 0)}/100",
            "data": result
        })
        return {"performance_review": result, "events": events}
    except Exception as e:
        error_result = {"agent": "Performance Critic", "issues": [], "overall_score": 0, "verdict": "comment", "error": str(e), "summary": "Agent failed"}
        events.append({"type": "agent_error", "agent": "Performance Critic", "message": f"Error: {str(e)}"})
        return {"performance_review": error_result, "events": events}


def style_node(state: ReviewState) -> dict:
    """Run style audit agent."""
    events = state.get("events", [])
    events.append({"type": "agent_start", "agent": "Style Enforcer", "message": "Reviewing code quality and patterns..."})
    
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=STYLE_SYSTEM_PROMPT),
            HumanMessage(content=get_style_prompt(state["code"], state["language"]))
        ]
        response = llm.invoke(messages)
        result = safe_parse_json(response.content)
        
        events.append({
            "type": "agent_done",
            "agent": "Style Enforcer",
            "message": f"Found {len(result.get('issues', []))} style issues. Score: {result.get('overall_score', 0)}/100",
            "data": result
        })
        return {"style_review": result, "events": events}
    except Exception as e:
        error_result = {"agent": "Style Enforcer", "issues": [], "overall_score": 0, "verdict": "comment", "error": str(e), "summary": "Agent failed"}
        events.append({"type": "agent_error", "agent": "Style Enforcer", "message": f"Error: {str(e)}"})
        return {"style_review": error_result, "events": events}


def debate_node(state: ReviewState) -> dict:
    """Run debate/merge agent to consolidate all reviews."""
    events = state.get("events", [])
    events.append({"type": "agent_start", "agent": "Debate Moderator", "message": "Analyzing conflicts and building final verdict..."})
    
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=DEBATE_SYSTEM_PROMPT),
            HumanMessage(content=get_debate_prompt(
                state["security_review"],
                state["performance_review"],
                state["style_review"]
            ))
        ]
        response = llm.invoke(messages)
        result = safe_parse_json(response.content)
        
        events.append({
            "type": "agent_done",
            "agent": "Debate Moderator",
            "message": f"Consolidated review complete. Final verdict: {result.get('overall_verdict', 'unknown').upper()}",
            "data": result
        })
        events.append({"type": "review_complete", "message": "All agents finished."})
        return {"debate_result": result, "events": events}
    except Exception as e:
        error_result = {"conflicts": [], "top_priorities": [], "overall_verdict": "comment", "overall_score": 0, "final_summary": f"Debate agent failed: {str(e)}", "must_fix_before_merge": [], "nice_to_have": []}
        events.append({"type": "agent_error", "agent": "Debate Moderator", "message": f"Error: {str(e)}"})
        return {"debate_result": error_result, "events": events}


def build_graph():
    """Build and compile the LangGraph review pipeline."""
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
