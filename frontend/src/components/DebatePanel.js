import React, { useState } from 'react';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  info: '#6366f1',
};

function ConflictCard({ conflict }) {
  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>⚔️</span>
        <span style={{ color: '#fcd34d', fontSize: 12, fontWeight: 700 }}>CONFLICT {conflict.id}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          {conflict.agents_involved?.join(' vs ')}
        </span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 }}>
        {conflict.description}
      </div>
      <div style={{
        background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 6, padding: '8px 10px'
      }}>
        <span style={{ color: '#67e8f9', fontSize: 11, fontWeight: 600 }}>Resolution: </span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{conflict.resolution}</span>
      </div>
      {conflict.winning_perspective && conflict.winning_perspective !== 'Neither' && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>
          Winner: <span style={{ color: '#67e8f9' }}>{conflict.winning_perspective}</span>
        </div>
      )}
    </div>
  );
}

export function DebatePanel({ debate, allReviews }) {
  const [activeTab, setActiveTab] = useState('summary');
  if (!debate || !debate.final_summary) return null;

  const verdict = debate.overall_verdict;
  const verdictConfig = {
    approve: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'APPROVED TO MERGE', icon: '✓' },
    request_changes: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'CHANGES REQUIRED', icon: '✗' },
    comment: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'COMMENTS ONLY', icon: '◎' },
  };
  const vc = verdictConfig[verdict] || verdictConfig.comment;

  const tabs = ['summary', 'priorities', 'conflicts'];

  // Collect all issues from all agents for priority mapping
  const allIssues = {};
  ['security', 'performance', 'style'].forEach(key => {
    const rev = allReviews?.[key];
    if (rev?.issues) {
      rev.issues.forEach(issue => { allIssues[issue.id] = issue; });
    }
  });

  return (
    <div style={{
      background: 'rgba(6,182,212,0.05)',
      border: '1px solid rgba(6,182,212,0.25)',
      borderRadius: 16,
      padding: '24px 26px',
      marginTop: 24,
      boxShadow: '0 0 40px rgba(6,182,212,0.1)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚖️</span>
          <div>
            <div style={{ color: '#67e8f9', fontWeight: 700, fontSize: 16 }}>Final Verdict</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Debate Moderator Consolidated Review</div>
          </div>
        </div>
        <div style={{
          background: vc.bg, border: `1px solid ${vc.border}`,
          borderRadius: 10, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ color: vc.color, fontSize: 22, fontWeight: 700 }}>{vc.icon}</span>
          <div>
            <div style={{ color: vc.color, fontWeight: 700, fontSize: 13 }}>{vc.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Score: {debate.overall_score}/100</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: activeTab === tab ? 'rgba(6,182,212,0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === tab ? '2px solid #06b6d4' : '2px solid transparent',
            color: activeTab === tab ? '#67e8f9' : 'rgba(255,255,255,0.4)',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            transition: 'all 0.2s',
          }}>
            {tab === 'summary' ? '📋 Summary' : tab === 'priorities' ? '🎯 Priorities' : '⚔️ Conflicts'}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
            {debate.final_summary}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 16 }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                🚨 Must Fix Before Merge ({debate.must_fix_before_merge?.length || 0})
              </div>
              {debate.must_fix_before_merge?.length > 0 ? (
                debate.must_fix_before_merge.map(id => (
                  <div key={id} style={{
                    background: 'rgba(239,68,68,0.1)', borderRadius: 5, padding: '5px 10px',
                    marginBottom: 6, color: '#fca5a5', fontSize: 12, fontFamily: 'monospace'
                  }}>
                    {id} — {allIssues[id]?.title || 'See agent review'}
                  </div>
                ))
              ) : (
                <div style={{ color: '#22c55e', fontSize: 12 }}>✓ Nothing blocking merge</div>
              )}
            </div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 16 }}>
              <div style={{ color: '#86efac', fontWeight: 700, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                💡 Nice to Have ({debate.nice_to_have?.length || 0})
              </div>
              {debate.nice_to_have?.length > 0 ? (
                debate.nice_to_have.map(id => (
                  <div key={id} style={{
                    background: 'rgba(34,197,94,0.1)', borderRadius: 5, padding: '5px 10px',
                    marginBottom: 6, color: '#86efac', fontSize: 12, fontFamily: 'monospace'
                  }}>
                    {id} — {allIssues[id]?.title || 'See agent review'}
                  </div>
                ))
              ) : (
                <div style={{ color: '#86efac', fontSize: 12 }}>✓ All clean</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Priorities Tab */}
      {activeTab === 'priorities' && (
        <div>
          {debate.top_priorities?.length > 0 ? (
            debate.top_priorities.map((p, i) => (
              <div key={p.original_id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `rgba(6,182,212,${0.2 - i * 0.02})`,
                  border: '1px solid rgba(6,182,212,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#67e8f9', fontWeight: 700, fontSize: 12, flexShrink: 0
                }}>
                  {p.priority_rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{p.title}</span>
                    <span style={{
                      background: SEVERITY_COLORS[p.severity] + '33',
                      color: SEVERITY_COLORS[p.severity],
                      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700
                    }}>
                      {p.severity?.toUpperCase()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{p.agent}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.why_prioritized}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: '20px 0' }}>No priorities to display.</div>
          )}
        </div>
      )}

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <div>
          {debate.conflicts?.length > 0 ? (
            debate.conflicts.map(conflict => (
              <ConflictCard key={conflict.id} conflict={conflict} />
            ))
          ) : (
            <div style={{
              color: '#22c55e', fontSize: 13, padding: '20px 0',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              ✓ No conflicts between agents — all reviews aligned.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
