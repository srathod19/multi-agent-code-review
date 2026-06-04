import React, { useEffect, useRef } from 'react';

const EVENT_STYLES = {
  agent_start: { color: '#67e8f9', icon: '▶' },
  agent_done: { color: '#22c55e', icon: '✓' },
  agent_error: { color: '#ef4444', icon: '✗' },
  fetch_start: { color: '#a78bfa', icon: '↓' },
  fetch_done: { color: '#a78bfa', icon: '✓' },
  review_complete: { color: '#fcd34d', icon: '★' },
  error: { color: '#ef4444', icon: '✗' },
};

export function EventLog({ events, isRunning }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (events.length === 0 && !isRunning) return null;

  return (
    <div style={{
      background: '#0a0e1a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 24,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 12,
      maxHeight: 200,
      overflowY: 'auto',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 10, letterSpacing: 1 }}>
        ▪ AGENT ACTIVITY LOG
      </div>
      {events.map((event, i) => {
        const style = EVENT_STYLES[event.type] || { color: 'rgba(255,255,255,0.6)', icon: '·' };
        return (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5, alignItems: 'flex-start' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: 60 }}>
              {String(i + 1).padStart(3, '0')}
            </span>
            <span style={{ color: style.color, minWidth: 14 }}>{style.icon}</span>
            {event.agent && (
              <span style={{ color: 'rgba(255,255,255,0.4)', minWidth: 120 }}>[{event.agent}]</span>
            )}
            <span style={{ color: style.color }}>{event.message}</span>
          </div>
        );
      })}
      {isRunning && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: 60 }}>···</span>
          <span style={{ color: '#67e8f9', animation: 'pulse 1s infinite' }}>▮</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
