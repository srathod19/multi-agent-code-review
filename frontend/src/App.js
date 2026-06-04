import React, { useState } from 'react';
import { useReviewStream } from './hooks/useReviewStream';
import { AgentCard } from './components/AgentCard';
import { DebatePanel } from './components/DebatePanel';
import { EventLog } from './components/EventLog';

const AGENTS = ['Security Auditor', 'Performance Critic', 'Style Enforcer'];

const SAMPLE_CODE = `import sqlite3
import hashlib

def get_user(username, password):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    
    # Query user from database
    query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    if user:
        return {"id": user[0], "username": user[1], "role": user[3]}
    return None

def process_items(items):
    results = []
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] == items[j] and i != j:
                results.append(items[i])
    return results

def hash_password(p):
    return hashlib.md5(p.encode()).hexdigest()

SECRET_KEY = "super_secret_key_1234"
API_KEY = "sk-prod-abcdef123456"

def validate(x, y, z, a, b, c, d):
    if x:
        if y:
            if z:
                if a:
                    return True
    return False
`;

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'PHP', 'C#', 'Ruby'];

function ScoreBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{score}/100</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 5 }}>
        <div style={{
          width: `${score}%`, height: 5, borderRadius: 4, background: color,
          transition: 'width 1s ease', boxShadow: `0 0 8px ${color}`
        }} />
      </div>
    </div>
  );
}

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState('Python');
  const [prUrl, setPrUrl] = useState('');
  const [inputMode, setInputMode] = useState('code'); // 'code' | 'github'

  const { events, finalResult, isRunning, error, startReview, reset } = useReviewStream();

  const getAgentStatus = (agentName) => {
    const agentKey = {
      'Security Auditor': 'security',
      'Performance Critic': 'performance',
      'Style Enforcer': 'style',
    }[agentName];

    const isDone = !!finalResult?.[agentKey];
    const isActive = isRunning && events.some(e => e.agent === agentName && e.type === 'agent_start') && !isDone;
    return { isDone, isActive };
  };

  const handleStart = () => {
    if (isRunning) return;
    reset();
    if (inputMode === 'github') {
      startReview({ githubPrUrl: prUrl });
    } else {
      startReview({ code, language });
    }
  };

  const avgScore = finalResult
    ? Math.round(([
        finalResult.security?.overall_score,
        finalResult.performance?.overall_score,
        finalResult.style?.overall_score,
      ].filter(Boolean).reduce((a, b) => a + b, 0)) / 3)
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060912',
      color: '#e2e8f0',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        textarea { resize: vertical; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>CodeReview.AI</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Multi-Agent · Debate-Powered · Free</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🛡️ Security', '⚡ Performance', '✦ Style', '⚖️ Debate'].map(a => (
            <span key={a} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)'
            }}>{a}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* LEFT: Input Panel */}
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Input
            </h2>

            {/* Mode Switch */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.04)',
              borderRadius: 10, padding: 4, marginBottom: 18, gap: 4,
              border: '1px solid rgba(255,255,255,0.07)'
            }}>
              {[['code', '📄 Paste Code'], ['github', '🐙 GitHub PR']].map(([mode, label]) => (
                <button key={mode} onClick={() => setInputMode(mode)} style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 7, fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                  background: inputMode === mode ? 'rgba(6,182,212,0.2)' : 'transparent',
                  color: inputMode === mode ? '#67e8f9' : 'rgba(255,255,255,0.4)',
                  fontFamily: 'inherit',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {inputMode === 'code' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12,
                    fontFamily: 'inherit', cursor: 'pointer'
                  }}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  style={{
                    width: '100%', height: 360,
                    background: '#0a0e1a',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 10, padding: 16,
                    color: '#e2e8f0', fontSize: 12.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.7, outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </>
            ) : (
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  GitHub Pull Request URL
                </label>
                <input
                  value={prUrl}
                  onChange={e => setPrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 10, color: '#e2e8f0', fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
                  💡 Add GITHUB_TOKEN in backend .env for private repos
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={isRunning || (!code.trim() && !prUrl.trim())}
              style={{
                width: '100%', marginTop: 16,
                padding: '14px 0',
                background: isRunning
                  ? 'rgba(6,182,212,0.15)'
                  : 'linear-gradient(135deg, #0891b2, #6d28d9)',
                border: 'none', borderRadius: 10, cursor: isRunning ? 'not-allowed' : 'pointer',
                color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: isRunning ? 'none' : '0 4px 20px rgba(6,182,212,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isRunning ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: 16 }}>⟳</span>
                  Agents Working...
                </>
              ) : (
                '▶ Run Multi-Agent Review'
              )}
            </button>

            {finalResult && !isRunning && (
              <button onClick={reset} style={{
                width: '100%', marginTop: 8, padding: '10px 0',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                fontSize: 12, fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
                ↺ Reset
              </button>
            )}

            {/* Score Summary */}
            {finalResult && (
              <div style={{
                marginTop: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: 18,
                animation: 'fadeIn 0.5s ease',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Scores
                </div>
                <ScoreBar label="🛡️ Security" score={finalResult.security?.overall_score || 0} color="#ef4444" />
                <ScoreBar label="⚡ Performance" score={finalResult.performance?.overall_score || 0} color="#f59e0b" />
                <ScoreBar label="✦ Style" score={finalResult.style?.overall_score || 0} color="#8b5cf6" />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 12, paddingTop: 12 }}>
                  <ScoreBar label="⚖️ Overall" score={finalResult.debate?.overall_score || avgScore || 0} color="#06b6d4" />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Results Panel */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Agent Reviews
            </h2>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '14px 16px', marginBottom: 16,
                color: '#fca5a5', fontSize: 13,
              }}>
                ✗ {error}
              </div>
            )}

            <EventLog events={events} isRunning={isRunning} />

            {!isRunning && events.length === 0 && !finalResult && (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                color: 'rgba(255,255,255,0.2)',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div style={{ fontSize: 14 }}>Paste your code and run the review</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>3 agents will analyze it simultaneously</div>
              </div>
            )}

            {AGENTS.map(agentName => {
              const { isDone, isActive } = getAgentStatus(agentName);
              const reviewKey = { 'Security Auditor': 'security', 'Performance Critic': 'performance', 'Style Enforcer': 'style' }[agentName];
              const review = finalResult?.[reviewKey];

              if (!isActive && !isDone && !isRunning) return null;

              return (
                <div key={agentName} style={{ animation: 'fadeIn 0.4s ease' }}>
                  <AgentCard
                    agentName={agentName}
                    review={review}
                    isActive={isActive}
                    isDone={isDone}
                  />
                </div>
              );
            })}

            {finalResult?.debate && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <DebatePanel
                  debate={finalResult.debate}
                  allReviews={finalResult}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
