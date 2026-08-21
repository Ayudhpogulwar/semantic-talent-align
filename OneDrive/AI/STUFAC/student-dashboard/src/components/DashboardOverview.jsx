import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  CheckCircle, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Target,
  User
} from 'lucide-react';

export default function DashboardOverview({ profile, resume, readiness, applications, recommendations, setActiveTab }) {
  const pendingAppsCount = applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length;
  const topMatch = recommendations[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner Card */}
      <div className="glass-panel glass-panel-glow" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '12px' }}>
            <BrainCircuit size={14} /> Semantic AI Matching Engine Active
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Welcome back, <span className="gradient-text">{profile.name}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            Your student profile is active. Sentence-BERT has scored your resume against <strong>{recommendations.length} curated opportunities</strong> with a top compatibility match of <strong>{topMatch ? topMatch.match_score : 92}%</strong>.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('recommendations')}>
              <Sparkles size={16} /> View AI Matches ({recommendations.length})
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('opportunities')}>
              <Briefcase size={16} /> Browse All Listings
            </button>
          </div>
        </div>

        {/* Dynamic Graphic */}
        <div style={{ zIndex: 1, opacity: 0.85 }} className="banner-graphic">
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(6, 182, 212, 0) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
            border: '2px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <Target size={54} color="#818cf8" />
          </div>
        </div>
      </div>

      {/* Snapshot Metric Cards (PRD Section 8) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Profile Completion Card */}
        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Completion</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{profile.profile_completion_pct}%</h3>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <User size={20} />
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', marginTop: '14px', overflow: 'hidden' }}>
            <div style={{ width: `${profile.profile_completion_pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: '3px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Verification Status</span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Faculty Verified</span>
          </div>
        </div>

        {/* Readiness Score Card */}
        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => setActiveTab('readiness')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Placement Readiness</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {readiness.overall_score} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
              </h3>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
            <TrendingUp size={14} /> +6 pts improvement this week
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Resume: {readiness.category_scores.resume_quality}/100 • Skills: {readiness.category_scores.skill_coverage}/100
          </div>
        </div>

        {/* Pending Applications */}
        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => setActiveTab('tracker')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Applications</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>{pendingAppsCount}</h3>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total Submitted: {applications.length} applications
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            1 Application Shortlisted for Technical Interview
          </div>
        </div>

        {/* AI Recommendations Highlight */}
        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => setActiveTab('recommendations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI Match Matches</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>{recommendations.length}</h3>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>
            Top: {topMatch ? topMatch.title : 'Data Analyst'} ({topMatch ? topMatch.match_score : 92}%)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            CareerBERT + JobFormer AI Engine
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recommended Opportunities & Actionable Improvement Plan */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Top Recommended Opportunities List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#818cf8" /> Top Recommended Opportunities
            </h3>
            <button 
              onClick={() => setActiveTab('recommendations')} 
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recommendations.slice(0, 2).map(opp => (
              <div key={opp.id} style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-primary">{opp.match_score}% Match</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{opp.domain}</span>
                  </div>
                  <h4 style={{ fontSize: '0.98rem', color: 'var(--text-main)', fontWeight: 700 }}>{opp.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{opp.organization} • {opp.stipend}</div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '6px', fontStyle: 'italic' }}>
                    "{opp.explanation}"
                  </div>
                </div>

                <button 
                  className="btn btn-outline-cyan" 
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => setActiveTab('opportunities')}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Improvement Plan Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#f59e0b" /> Readiness Improvement Plan
            </h3>
            <button 
              onClick={() => setActiveTab('readiness')} 
              style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Full Breakdown <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {readiness.actionable_suggestions.map((suggestion, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <div style={{ background: '#f59e0b', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
