import { useState, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function useReviewStream() {
  const [events, setEvents] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const startReview = useCallback(async ({ code, language, githubPrUrl }) => {
    // Reset state
    setEvents([]);
    setFinalResult(null);
    setError(null);
    setIsRunning(true);

    try {
      const response = await fetch(`${API_URL}/review/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code || null,
          language: language || 'Python',
          github_pr_url: githubPrUrl || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'API request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'final_result') {
                setFinalResult(parsed);
              } else if (parsed.type === 'error') {
                setError(parsed.message);
              } else {
                setEvents(prev => [...prev, parsed]);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setFinalResult(null);
    setError(null);
    setIsRunning(false);
  }, []);

  return { events, finalResult, isRunning, error, startReview, reset };
}
