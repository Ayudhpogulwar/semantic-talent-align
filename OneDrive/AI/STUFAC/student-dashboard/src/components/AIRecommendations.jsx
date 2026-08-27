import React from 'react';
import { Sparkles, BrainCircuit, CheckCircle, AlertCircle, ArrowRight, Zap, Target, Cpu } from 'lucide-react';

export default function AIRecommendations({ recommendations = [], applications = [], onApply, onCancel }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* AI Recommendation Header */}
      <div className="glass-panel glass-panel-glow" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Cpu size={20} color="#c084fc" />
          <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Smart Opportunity Matching System
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800 }}>
          Personalized Opportunity Recommendations
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '800px', lineHeight: '1.5' }}>
          Powered by <strong>Intelligent Skill Analysis</strong> → <strong>Semantic Profile Matching</strong> → <strong>Automated Opportunity Scoring</strong>. Each match is fully explainable.
        </p>
      </div>

      {/* Recommendations Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {recommendations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <AlertCircle size={32} color="var(--accent-amber)" style={{ marginBottom: '12px' }} />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '6px' }}>No Recommendations Generated Yet</h4>
            <p style={{ fontSize: '0.88rem' }}>Please add at least 3 skills or upload your resume in the Resume & Skills section to trigger the Semantic AI Engine.</p>
          </div>
        ) : (
          recommendations.map(opp => (
            <div key={opp.id} className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top Bar with Match Score Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.9rem', padding: '6px 14px', fontWeight: 800 }}>
                      <Sparkles size={14} /> {opp.match_score}% Match Score
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 700 }}>{opp.title}</h3>
                  <div style={{ fontSize: '0.92rem', color: 'var(--primary-light)', fontWeight: 600 }}>{opp.organization} • {opp.stipend}</div>
                </div>

                {(() => {
                  const existingApp = applications.find(a => String(a.opportunity_id) === String(opp.id) || String(a.id) === String(opp.id));
                  if (!existingApp) {
                    return (
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          await onApply(opp.id);
                        }}
                        style={{ padding: '10px 20px' }}
                      >
                        Apply Now <ArrowRight size={16} />
                      </button>
                    );
                  }
                  
                  const isAdvancedStage = ['shortlisted', 'interview', 'selected'].includes(String(existingApp.status || '').toLowerCase());
                  
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-emerald" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        <CheckCircle size={14} /> {existingApp.status || 'Applied'}
                      </span>
                      {!isAdvancedStage && (
                        <button
                          className="btn btn-secondary"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to cancel your application for "${opp.title}"?`)) {
                              await onCancel(opp.id);
                            }
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }}
                        >
                          Withdraw Application
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Explainability Snippet Box (PRD FR-7 Acceptance Criteria) */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BrainCircuit size={16} /> Explainable AI Rationale:
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.45', fontWeight: 500 }}>
                  {opp.explanation}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle size={14} /> Matched: {opp.matched_skills.join(', ')}
                  </div>
                  {opp.missing_skills.length > 0 && (
                    <div style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <AlertCircle size={14} /> Recommended gap closing: {opp.missing_skills.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {opp.description}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
