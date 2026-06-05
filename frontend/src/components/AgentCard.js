import React, { useState } from 'react';

const AGENT_META = {
  'Security Auditor': { icon: '🛡️', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', border: '#ef4444' },
  'Performance Critic': { icon: '⚡', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', border: '#f59e0b' },
  'Style Enforcer': { icon: '✦', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', border: '#8b5cf6' },
  'Debate Moderator': { icon: '⚖️', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', border: '#06b6d4' },
};

const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fca5a5', badge: '#ef4444' },
  high: { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fdba74', badge: '#f97316' },
  medium: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fcd34d', badge: '#f59e0b' },
  low: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#86efac', badge: '#22c55e' },
  info: { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', text: '#a5b4fc', badge: '#6366f1' },
};

function CodeBlock({ code, label, color }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </span>
        <button onClick={handleCopy} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)', fontSize: 10, padding: '2px 8px', borderRadius: 4,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        background: '#060912', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6, padding: '10px 12px', margin: 0,
        color: '#e2e8f0', fontSize: 11.5,
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.6, overflowX: 'auto',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        borderLeft: `3px solid ${color}`,
      }}>
        {code}
      </pre>
    </div>
  );
}

function IssueCard({ issue, agentColor }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.info;

  // Determine which extra fields this agent type provides
  const hasExploit = issue.how_to_exploit || issue.exploit_example;
  const hasComplexity = issue.complexity_before || issue.complexity_after || issue.impact;
  const hasMaintainability = issue.maintainability_impact || issue.pattern;
  const hasCode = issue.vulnerable_code || issue.fixed_code;

  return (
    <div style={{
      background: sev.bg, border: `1px solid ${sev.border}`,
      borderRadius: 8, padding: '12px 14px', marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          background: sev.badge, color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1
        }}>{issue.severity}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>{issue.id}</span>
        {issue.cwe && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{issue.cwe}</span>}
        {issue.pattern && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontStyle: 'italic' }}>{issue.pattern}</span>}
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

      {/* Complexity info for performance */}
      {hasComplexity && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          {issue.complexity_before && (
            <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '3px 8px', color: '#fca5a5', fontSize: 11 }}>
              Before: {issue.complexity_before}
            </span>
          )}
          {issue.complexity_after && (
            <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 5, padding: '3px 8px', color: '#86efac', fontSize: 11 }}>
              After: {issue.complexity_after}
            </span>
          )}
        </div>
      )}
      {issue.impact && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, color: '#fcd34d', fontSize: 12 }}>
          📊 <strong>Impact:</strong> {issue.impact}
        </div>
      )}

      {/* Maintainability impact for style */}
      {issue.maintainability_impact && (
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, color: '#c4b5fd', fontSize: 12 }}>
          🔧 <strong>Maintainability:</strong> {issue.maintainability_impact}
        </div>
      )}

      {/* Recommendation */}
      {issue.recommendation && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 10px', marginBottom: 8, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          💡 <strong>Fix:</strong> {issue.recommendation}
        </div>
      )}

      {/* Expand button for exploit + code */}
      {(hasExploit || hasCode) && (
        <button onClick={() => setExpanded(!expanded)} style={{
          background: expanded ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'inherit',
          width: '100%', textAlign: 'left', marginTop: 4,
          transition: 'all 0.2s',
        }}>
          {expanded ? '▲ Hide details' : `▼ Show ${hasExploit ? 'exploit scenario' : ''}${hasExploit && hasCode ? ' + ' : ''}${hasCode ? 'code diff' : ''}`}
        </button>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {/* Exploit scenario - Security only */}
          {issue.how_to_exploit && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                ⚠️ HOW THIS CAN BE EXPLOITED
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.7 }}>
                {issue.how_to_exploit}
              </div>
              {issue.exploit_example && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: '#fca5a5', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Attack Payload:</div>
                  <pre style={{
                    background: '#060912', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 5, padding: '8px 10px', margin: 0,
                    color: '#fca5a5', fontSize: 11.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: 'auto', whiteSpace: 'pre-wrap'
                  }}>
                    {issue.exploit_example}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Vulnerable code */}
          {issue.vulnerable_code && (
            <CodeBlock
              code={issue.vulnerable_code}
              label="❌ Vulnerable / Problematic Code"
              color="#ef4444"
            />
          )}

          {/* Fixed code */}
          {issue.fixed_code && (
            <div style={{ marginTop: 10 }}>
              <CodeBlock
                code={issue.fixed_code}
                label="✅ Fixed / Optimized Code"
                color="#22c55e"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score, color }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace"
      }}>{score}</span>
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
      borderRadius: 14, padding: '20px 22px', marginBottom: 16,
      boxShadow: isDone ? `0 0 24px ${meta.glow}` : 'none',
      transition: 'all 0.4s ease',
      opacity: isActive || isDone ? 1 : 0.45,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{meta.icon}</span>
          <div>
            <div style={{ color: meta.color, fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
              {agentName}
              {isActive && !isDone && (
                <span style={{ marginLeft: 8, animation: 'pulse 1s infinite' }}>●</span>
              )}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {isDone ? review?.summary : (isActive ? 'Analyzing...' : 'Waiting...')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isDone && <span style={{ color: vStyle.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{vStyle.label}</span>}
          {isDone && score !== null && <ScoreRing score={score} color={meta.color} />}
        </div>
      </div>

      {isDone && issues.length > 0 && (
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found — click any issue to see exploit + fix
          </div>
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} agentColor={meta.color} />
          ))}
        </div>
      )}
      {isDone && issues.length === 0 && (
        <div style={{ color: '#22c55e', fontSize: 13, padding: '10px 0' }}>✓ No issues found</div>
      )}
    </div>
  );
}
