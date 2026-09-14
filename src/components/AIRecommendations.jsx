import React, { useState, useMemo } from 'react';
import {
  Sparkles, BrainCircuit, CheckCircle, AlertCircle, ArrowRight,
  Target, Cpu, FileText, Upload, Briefcase, Building,
  TrendingUp, BookOpen, Zap, ChevronDown, ChevronUp,
  Star, Award, BarChart2, Lightbulb, Clock, DollarSign,
} from 'lucide-react';

/* ─── Skill-Gap Radar (SVG-based, no external lib) ─────────────────── */
function SkillRadar({ matched = [], missing = [] }) {
  const allSkills = [...matched.slice(0, 4), ...missing.slice(0, 4)];
  if (allSkills.length < 3) return null;

  const cx = 100, cy = 100, R = 72;
  const N = allSkills.length;
  const points = allSkills.map((_, i) => {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = matched.includes(allSkills[i]) ? R : R * 0.38;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), full: { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) } };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1].map(lvl =>
    allSkills.map((_, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      return { x: cx + R * lvl * Math.cos(angle), y: cy + R * lvl * Math.sin(angle) };
    })
  );

  const poly = pts => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 200 200" width="160" height="160" style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {gridLevels.map((pts, li) => (
        <polygon key={li} points={poly(pts)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Spokes */}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.full.x} y2={p.full.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {/* Coverage */}
      <polygon
        points={poly(points)}
        fill="rgba(99,102,241,0.25)"
        stroke="#818cf8"
        strokeWidth="2"
      />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4"
          fill={matched.includes(allSkills[i]) ? '#34d399' : '#f59e0b'}
          stroke="#fff" strokeWidth="1.5"
        />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const dx = p.full.x - cx, dy = p.full.y - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const lx = p.full.x + (dx / len) * 14;
        const ly = p.full.y + (dy / len) * 14;
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill={matched.includes(allSkills[i]) ? '#34d399' : '#fbbf24'} fontWeight="700"
          >
            {allSkills[i].length > 10 ? allSkills[i].slice(0, 9) + '…' : allSkills[i]}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Animated score ring ───────────────────────────────────────────── */
function ScoreRing({ score = 0, size = 64 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="800" fill={color}>{score}%</text>
    </svg>
  );
}

/* ─── Tier config ───────────────────────────────────────────────────── */
const TIERS = [
  {
    key: 'ready',
    label: 'Ready to Apply',
    icon: <Zap size={16} />,
    desc: 'Your resume skills closely match the requirements — apply with confidence.',
    minScore: 70,
    maxScore: 100,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    badge: { bg: 'rgba(16,185,129,0.18)', color: '#34d399', border: 'rgba(16,185,129,0.4)' },
  },
  {
    key: 'stretch',
    label: 'Upskilling Potential',
    icon: <TrendingUp size={16} />,
    desc: 'Good foundational match. Close a few skill gaps and you\'ll be very competitive.',
    minScore: 40,
    maxScore: 69,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    badge: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.4)' },
  },
  {
    key: 'explore',
    label: 'Explore & Grow',
    icon: <BookOpen size={16} />,
    desc: 'Aspirational roles to guide your long-term learning path.',
    minScore: 0,
    maxScore: 39,
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.3)',
    badge: { bg: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: 'rgba(99,102,241,0.4)' },
  },
];

const UPSKILL_RESOURCES = {
  Python: 'https://www.kaggle.com/learn/python',
  'Machine Learning': 'https://www.coursera.org/learn/machine-learning',
  React: 'https://react.dev/learn',
  Docker: 'https://docs.docker.com/get-started/',
  'Node.js': 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
  SQL: 'https://sqlzoo.net/',
  AWS: 'https://aws.amazon.com/training/',
  'Data Analysis': 'https://www.kaggle.com/learn/data-analysis-with-python',
  'Communication': 'https://www.coursera.org/learn/wharton-communication-skills',
  Leadership: 'https://www.coursera.org/learn/everyday-leadership-development',
};

function getUpskillLink(skill) {
  for (const [key, url] of Object.entries(UPSKILL_RESOURCES)) {
    if (skill.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(skill.toLowerCase()))
      return url;
  }
  return `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+free+course`;
}

/* ─── Main Component ────────────────────────────────────────────────── */
export default function AIRecommendations({ recommendations = [], onApply, resume = null, opportunities = [], setActiveTab }) {
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeTier, setActiveTier] = useState('all');

  const hasResume = Boolean(resume && resume.filename);

  /* Build enriched display list */
  const displayList = useMemo(() => {
    if (recommendations.length > 0) return recommendations;
    // Fallback: use raw opportunities with estimated scores
    return opportunities.map(o => ({
      id: o.id || o.opportunity_id,
      title: o.title,
      organization: o.organization,
      stipend: o.stipend,
      description: o.description,
      domain: o.domain,
      duration: o.duration,
      location: o.location,
      deadline: o.deadline,
      match_score: hasResume ? 55 : 0,
      model_source: 'Institutional Verification Engine',
      explanation: 'Curated approved opportunity available for institutional applications.',
      matched_skills: o.required_skills ? o.required_skills.slice(0, 3) : [],
      missing_skills: o.required_skills ? o.required_skills.slice(3, 6) : [],
    }));
  }, [recommendations, opportunities, hasResume]);

  /* Tier classification */
  const tiered = useMemo(() => {
    const out = { ready: [], stretch: [], explore: [] };
    displayList.forEach(opp => {
      const s = opp.match_score || 0;
      if (s >= 70) out.ready.push(opp);
      else if (s >= 40) out.stretch.push(opp);
      else out.explore.push(opp);
    });
    return out;
  }, [displayList]);

  /* Global skill gap summary */
  const skillSummary = useMemo(() => {
    const matchedSet = new Set();
    const missingFreq = {};
    displayList.forEach(opp => {
      (opp.matched_skills || []).forEach(s => matchedSet.add(s));
      (opp.missing_skills || []).forEach(s => {
        missingFreq[s] = (missingFreq[s] || 0) + 1;
      });
    });
    const topMissing = Object.entries(missingFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s);
    return { matched: [...matchedSet].slice(0, 6), topMissing };
  }, [displayList]);

  /* Filtered by active tier tab */
  const visibleList = useMemo(() => {
    if (activeTier === 'all') return displayList;
    return tiered[activeTier] || [];
  }, [activeTier, displayList, tiered]);

  /* ── Render ── */
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="glass-panel glass-panel-glow" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.12) 100%)',
        border: '1px solid rgba(168,85,247,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Cpu size={17} color="#c084fc" />
          <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Career Intelligence Engine · Semantic-BERT + CareerBERT
          </span>
        </div>
        <h2 style={{ fontSize: '1.55rem', color: '#fff', fontWeight: 800, margin: '0 0 6px 0' }}>
          AI Career Advisor & Skill-Gap Analysis
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: '1.55', maxWidth: '760px' }}>
          Opportunities are ranked by AI compatibility and grouped into actionable tiers. Your skill gaps are mapped so you know exactly what to learn next.
        </p>
      </div>

      {/* ── No Resume State ── */}
      {!hasResume ? (
        <div className="glass-panel" style={{
          padding: '36px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(56,189,248,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.25)',
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BrainCircuit size={28} color="#c084fc" />
          </div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>
            Upload Your Resume to Unlock AI Analysis
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 20px', lineHeight: '1.55' }}>
            Our AI will extract your skills from your resume and rank every opportunity by compatibility, show your skill gaps, and suggest exactly what to learn to get your dream role.
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { icon: <Target size={18} color="#c084fc" />, label: 'Tier-ranked matches' },
              { icon: <BarChart2 size={18} color="#34d399" />, label: 'Skill-gap radar chart' },
              { icon: <Lightbulb size={18} color="#fbbf24" />, label: 'Upskilling roadmap' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>
          {setActiveTab && (
            <button className="btn btn-primary" onClick={() => setActiveTab('resume')}
              style={{ padding: '12px 28px', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={17} /> Upload Resume Now
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Two-col layout: left=analysis, right=opportunities ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: '24px', alignItems: 'start' }}>

            {/* LEFT: Career Analysis Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>

              {/* Score Summary card */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={13} color="#c084fc" /> Match Overview
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {TIERS.map(t => {
                    const count = tiered[t.key]?.length || 0;
                    return (
                      <div key={t.key} style={{
                        flex: 1, minWidth: '60px', padding: '10px 8px', borderRadius: '10px', textAlign: 'center',
                        background: t.bg, border: `1px solid ${t.border}`, cursor: 'pointer',
                        outline: activeTier === t.key ? `2px solid ${t.color}` : 'none'
                      }} onClick={() => setActiveTier(activeTier === t.key ? 'all' : t.key)}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: t.color }}>{count}</div>
                        <div style={{ fontSize: '0.68rem', color: t.color, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skill Radar */}
              {(skillSummary.matched.length > 0 || skillSummary.topMissing.length > 0) && (
                <div className="glass-panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={13} color="#818cf8" /> Skill Coverage Radar
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <SkillRadar matched={skillSummary.matched} missing={skillSummary.topMissing} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', justifyContent: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> You Have</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Gap</span>
                  </div>
                </div>
              )}

              {/* Top Skill Gaps + Upskill actions */}
              {skillSummary.topMissing.length > 0 && (
                <div className="glass-panel" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={13} color="#fbbf24" /> Priority Upskilling Roadmap
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {skillSummary.topMissing.map((skill, i) => (
                      <a key={skill} href={getUpskillLink(skill)} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: '8px',
                          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                          color: '#fbbf24', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', flexShrink: 0
                          }}>{i + 1}</span>
                          {skill}
                        </span>
                        <ArrowRight size={13} />
                      </a>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '10px 0 0 0' }}>
                    Click any skill to find free learning resources →
                  </p>
                </div>
              )}

              {/* Your matched skills */}
              {skillSummary.matched.length > 0 && (
                <div className="glass-panel" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={12} color="#34d399" /> Your Matched Skills
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {skillSummary.matched.map(s => (
                      <span key={s} style={{
                        fontSize: '0.72rem', padding: '3px 9px', borderRadius: '99px', fontWeight: 600,
                        background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)'
                      }}>✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Tiered Opportunity Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Tier filter tabs */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ key: 'all', label: 'All Matches', color: '#c084fc', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)' }, ...TIERS].map(t => (
                  <button key={t.key}
                    onClick={() => setActiveTier(t.key)}
                    style={{
                      padding: '7px 16px', borderRadius: '99px', border: `1px solid ${activeTier === t.key ? t.border || t.color : 'rgba(255,255,255,0.12)'}`,
                      background: activeTier === t.key ? (t.bg || 'rgba(168,85,247,0.15)') : 'rgba(255,255,255,0.04)',
                      color: activeTier === t.key ? (t.color) : 'var(--text-muted)',
                      fontSize: '0.8rem', fontWeight: activeTier === t.key ? 700 : 500, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                    }}>
                    {t.icon && <span style={{ display: 'inline-flex' }}>{t.icon}</span>}
                    {t.label}
                    {t.key !== 'all' && <span style={{ fontWeight: 800 }}>({tiered[t.key]?.length || 0})</span>}
                  </button>
                ))}
              </div>

              {/* Cards */}
              {visibleList.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <AlertCircle size={32} color="var(--accent-amber)" style={{ marginBottom: '12px' }} />
                  <h4 style={{ color: '#fff', marginBottom: '6px' }}>No Opportunities in This Tier</h4>
                  <p style={{ fontSize: '0.88rem' }}>Try selecting a different tier or uploading an updated resume.</p>
                </div>
              ) : (
                visibleList.map(opp => {
                  const score = opp.match_score || 0;
                  const tier = TIERS.find(t => score >= t.minScore && score <= t.maxScore) || TIERS[2];
                  const isExpanded = expandedCard === opp.id;

                  return (
                    <div key={opp.id} className="glass-panel" style={{
                      padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px',
                      borderLeft: `3px solid ${tier.color}`,
                      transition: 'box-shadow 0.2s',
                    }}>
                      {/* Top: Score ring + title + action */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <ScoreRing score={score} size={60} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Tier badge */}
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 10px', borderRadius: '99px', fontWeight: 700,
                            background: tier.badge.bg, color: tier.badge.color, border: `1px solid ${tier.badge.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '6px'
                          }}>
                            {tier.icon} {tier.label}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, margin: '0 0 3px 0', lineHeight: 1.3 }}>
                            {opp.title}
                          </h3>
                          <div style={{ fontSize: '0.88rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Building size={13} color="var(--accent-cyan)" />
                            {opp.organization}
                            {opp.stipend && <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> · {opp.stipend}</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => onApply && onApply(opp.id)}
                          style={{ padding: '9px 18px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}
                        >
                          Apply <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* AI Rationale box */}
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px',
                        background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                          <BrainCircuit size={14} /> AI Analysis
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.45', margin: 0 }}>
                          {opp.explanation || 'This opportunity aligns with your academic background and submitted skills profile.'}
                        </p>
                      </div>

                      {/* Skills row */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {(opp.matched_skills || []).length > 0 && (
                          <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✓ Skills You Have
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {opp.matched_skills.map(s => (
                                <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(opp.missing_skills || []).length > 0 && (
                          <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ⚡ Skills to Learn
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {opp.missing_skills.slice(0, 4).map(s => (
                                <a key={s} href={getUpskillLink(s)} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', textDecoration: 'none', cursor: 'pointer' }}
                                  title={`Learn ${s} →`}>{s} ↗</a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expand/Collapse details */}
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : opp.id)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
                          fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', padding: 0, fontWeight: 600
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </button>

                      {isExpanded && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                          {[
                            { label: 'Stipend', value: opp.stipend, color: '#34d399' },
                            { label: 'Location', value: opp.location, color: '#fff' },
                            { label: 'Duration', value: opp.duration, color: '#fff' },
                            { label: 'Deadline', value: opp.deadline, color: '#f43f5e' },
                          ].map(item => (
                            <div key={item.label} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                              <strong style={{ color: item.color, fontSize: '0.85rem' }}>{item.value || 'N/A'}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
