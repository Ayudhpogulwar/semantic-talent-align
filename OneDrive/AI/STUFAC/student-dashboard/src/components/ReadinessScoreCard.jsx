import React from 'react';
import { Award, Zap, TrendingUp, CheckCircle, Target, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ReadinessScoreCard({ readiness }) {
  const { overall_score, category_scores, actionable_suggestions } = readiness;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award color="#38bdf8" /> Placement Readiness Score
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Composite 0–100 score computed from Resume Quality (ResumeNet), Skill Coverage (SkillRec), and Application Outcomes.
          </p>
        </div>

        <span className="badge badge-emerald" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
          <TrendingUp size={14} /> Top 15% Percentile in Dept
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Composite Radial Gauge Visualization */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `conic-gradient(#6366f1 0% ${overall_score}%, rgba(255,255,255,0.08) ${overall_score}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 0 35px rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{
              width: '145px',
              height: '145px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{overall_score}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>READINESS SCORE</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} /> High Placement Probability
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Score automatically recalculates on resume update or skill changes.
          </div>
        </div>

        {/* Right Column: Category Sub-scores Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Sub-Category Assessment Breakdown
          </h3>

          {/* Sub-score 1: Resume Quality */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#fff', marginBottom: '6px' }}>
              <span>Resume Quality Assessment (ResumeNet)</span>
              <strong style={{ color: '#818cf8' }}>{category_scores.resume_quality} / 100</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${category_scores.resume_quality}%`, height: '100%', background: '#6366f1', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* Sub-score 2: Skill Coverage */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#fff', marginBottom: '6px' }}>
              <span>Skill Coverage & Alignment (SkillRec)</span>
              <strong style={{ color: '#38bdf8' }}>{category_scores.skill_coverage} / 100</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${category_scores.skill_coverage}%`, height: '100%', background: '#06b6d4', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* Sub-score 3: Application Activity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#fff', marginBottom: '6px' }}>
              <span>Application Velocity & Pipeline</span>
              <strong style={{ color: '#fbbf24' }}>{category_scores.application_activity} / 100</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${category_scores.application_activity}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Actionable Suggestions Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap color="#f59e0b" size={18} /> Actionable Steps to Boost Your Readiness Score
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {actionable_suggestions.map((s, idx) => (
            <div key={idx} style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={18} color="#34d399" />
              <div style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
