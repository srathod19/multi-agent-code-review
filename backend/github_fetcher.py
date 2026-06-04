import httpx
import os
import re
from dotenv import load_dotenv

load_dotenv()


def parse_github_pr_url(url: str) -> tuple[str, str, str]:
    """Parse a GitHub PR URL into owner, repo, pr_number."""
    pattern = r"github\.com/([^/]+)/([^/]+)/pull/(\d+)"
    match = re.search(pattern, url)
    if not match:
        raise ValueError(f"Invalid GitHub PR URL: {url}")
    return match.group(1), match.group(2), match.group(3)


async def fetch_pr_diff(pr_url: str) -> tuple[str, str]:
    """
    Fetch the diff of a GitHub PR.
    Returns (diff_content, detected_language).
    """
    owner, repo, pr_number = parse_github_pr_url(pr_url)
    
    headers = {
        "Accept": "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}",
            headers=headers,
            follow_redirects=True,
            timeout=30.0
        )
        
        if response.status_code == 404:
            raise ValueError(f"PR not found: {pr_url}. Make sure the repo is public or provide a GitHub token.")
        if response.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded or access denied. Add a GITHUB_TOKEN to .env")
        if response.status_code != 200:
            raise ValueError(f"GitHub API error: {response.status_code}")

        diff_text = response.text
        
        # Detect dominant language from file extensions in the diff
        language = detect_language_from_diff(diff_text)
        
        # Truncate if too long (Groq has token limits)
        if len(diff_text) > 8000:
            diff_text = diff_text[:8000] + "\n\n... [diff truncated for token limit]"
        
        return diff_text, language


def detect_language_from_diff(diff: str) -> str:
    """Detect the primary language from a diff."""
    extension_map = {
        ".py": "Python",
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".jsx": "JavaScript",
        ".java": "Java",
        ".go": "Go",
        ".rs": "Rust",
        ".rb": "Ruby",
        ".php": "PHP",
        ".cs": "C#",
        ".cpp": "C++",
        ".c": "C",
        ".swift": "Swift",
        ".kt": "Kotlin",
    }
    
    counts = {}
    for ext, lang in extension_map.items():
        count = diff.count(ext)
        if count > 0:
            counts[lang] = count
    
    if counts:
        return max(counts, key=counts.get)
    return "unknown"
