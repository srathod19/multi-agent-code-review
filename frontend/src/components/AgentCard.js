import React from 'react';

const AGENT_META = {
  'Security Auditor': {
    icon: '🛡️',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.3)',
    border: '#ef4444',
  },
  'Performance Critic': {
    icon: '⚡',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    border: '#f59e0b',
  },
  'Style Enforcer': {
    icon: '✦',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    border: '#8b5cf6',
  },
  'Debate Moderator': {
    icon: '⚖️',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.3)',
    border: '#06b6d4',
  },
};

const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fca5a5', badge: '#ef4444' },
  high: { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fdba74', badge: '#f97316' },
  medium: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fcd34d', badge: '#f59e0b' },
  low: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#86efac', badge: '#22c55e' },
  info: { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', text: '#a5b4fc', badge: '#6366f1' },
};

function ScoreRing({ score, color }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace"
      }}>
        {score}
      </span>
    </div>
  );
}

function IssueCard({ issue, agentColor }) {
  const sev = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.info;
  return (
    <div style={{
      background: sev.bg,
      border: `1px solid ${sev.border}`,
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          background: sev.badge, color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1
        }}>
          {issue.severity}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>
          {issue.id}
        </span>
        {issue.cwe && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{issue.cwe}</span>
        )}
        {issue.pattern && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontStyle: 'italic' }}>{issue.pattern}</span>
        )}
      </div>
      <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{issue.title}</div>
      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
        {issue.description}
      </div>
      {issue.line_reference && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>
          📍 {issue.line_reference}
        </div>
      )}
      {issue.recommendation && (
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 10px',
          color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6
        }}>
          💡 <strong>Fix:</strong> {issue.recommendation}
        </div>
      )}
      {(issue.complexity_before || issue.complexity_after) && (
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {issue.complexity_before && (
            <span style={{ color: '#ef4444', fontSize: 11 }}>Before: {issue.complexity_before}</span>
          )}
          {issue.complexity_after && (
            <span style={{ color: '#22c55e', fontSize: 11 }}>After: {issue.complexity_after}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentCard({ agentName, review, isActive, isDone }) {
  const meta = AGENT_META[agentName] || AGENT_META['Security Auditor'];
  const issues = review?.issues || [];
  const score = review?.overall_score ?? null;
  const verdict = review?.verdict;

  const verdictStyle = {
    approve: { color: '#22c55e', label: '✓ APPROVED' },
    request_changes: { color: '#ef4444', label: '✗ CHANGES NEEDED' },
    comment: { color: '#f59e0b', label: '◎ COMMENT' },
  };
  const vStyle = verdictStyle[verdict] || { color: '#94a3b8', label: '— PENDING' };

  return (
    <div style={{
      background: 'rgba(15,20,35,0.8)',
      border: `1px solid ${isDone ? meta.border : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14,
      padding: '20px 22px',
      marginBottom: 16,
      boxShadow: isDone ? `0 0 24px ${meta.glow}` : 'none',
      transition: 'all 0.4s ease',
      opacity: isActive || isDone ? 1 : 0.45,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{meta.icon}</span>
          <div>
            <div style={{ color: meta.color, fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
              {agentName}
              {isActive && !isDone && (
                <span style={{ marginLeft: 8, display: 'inline-block', animation: 'pulse 1s infinite' }}>
                  ●
                </span>
              )}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {isDone ? review?.summary : (isActive ? 'Analyzing...' : 'Waiting...')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isDone && (
            <span style={{ color: vStyle.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              {vStyle.label}
            </span>
          )}
          {isDone && score !== null && <ScoreRing score={score} color={meta.color} />}
        </div>
      </div>

      {/* Issues */}
      {isDone && issues.length > 0 && (
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found
          </div>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} agentColor={meta.color} />
          ))}
        </div>
      )}
      {isDone && issues.length === 0 && (
        <div style={{ color: '#22c55e', fontSize: 13, padding: '10px 0' }}>
          ✓ No issues found in this category
        </div>
      )}
    </div>
  );
}
