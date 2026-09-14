import React from 'react';
import { Sparkles, BrainCircuit, CheckCircle, AlertCircle, ArrowRight, Zap, Target, Cpu, FileText, Upload, Briefcase, Building } from 'lucide-react';

export default function AIRecommendations({ recommendations = [], onApply, resume = null, opportunities = [], setActiveTab }) {
  const hasResume = Boolean(resume && resume.filename);
  const displayList = recommendations.length > 0 ? recommendations : opportunities.map(o => ({
    id: o.id || o.opportunity_id,
    title: o.title,
    organization: o.organization,
    stipend: o.stipend,
    description: o.description,
    domain: o.domain,
    match_score: 70,
    model_source: "Institutional Verification Engine",
    explanation: "Curated approved opportunity available for institutional applications.",
    matched_skills: o.required_skills || [],
    missing_skills: []
  }));

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
            Semantic AI Engine Architecture
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800, margin: 0 }}>
          Personalized Opportunity Recommendations
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '800px', lineHeight: '1.5', marginBottom: 0 }}>
          Powered by <strong>Sentence-BERT Embedding</strong> → <strong>Semantic Similarity Matching</strong> → <strong>JobFormer Transformer Engine</strong> → <strong>CareerBERT Resume Matching</strong>. Each match is fully explainable.
        </p>
      </div>

      {/* If No Resume Uploaded Yet Banner */}
      {!hasResume && (
        <div className="glass-panel" style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', color: '#38bdf8' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                Upload Your Resume for Tailored AI Recommendations
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
                You have not uploaded a resume yet. Upload your PDF or DOCX resume to extract your skills and experience, and our Semantic-BERT AI will automatically rank opportunities with personalized compatibility scores.
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('resume')}
              style={{ padding: '10px 20px', fontSize: '0.88rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload size={16} /> Upload Resume
            </button>
          )}
        </div>
      )}

      {/* Recommendations Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {displayList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <AlertCircle size={32} color="var(--accent-amber)" style={{ marginBottom: '12px' }} />
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>No Opportunities Available</h4>
            <p style={{ fontSize: '0.88rem' }}>Check back soon as faculty adds and approves new institutional opportunities.</p>
          </div>
        ) : (
          displayList.map(opp => (
            <div key={opp.id} className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top Bar with Match Score Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {hasResume ? (
                      <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.9rem', padding: '6px 14px', fontWeight: 800 }}>
                        <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> {opp.match_score}% Match Score
                      </span>
                    ) : (
                      <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        <Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} /> Verified Opportunity
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Source: {opp.model_source}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Role / Position:</span>
                      <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>{opp.title}</h3>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Organization:</span>
                      <Building size={15} color="var(--accent-cyan)" /> {opp.organization} • <span style={{ color: 'var(--text-muted)' }}>{opp.stipend}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => onApply(opp.id)}
                  style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Apply Now <ArrowRight size={16} />
                </button>
              </div>

              {/* Explainability Snippet Box */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BrainCircuit size={16} /> Explainable AI Rationale:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                  {hasResume 
                    ? opp.explanation 
                    : "Verified institutional opportunity matching general undergraduate engineering and project curriculum."}
                </div>

                {Array.isArray(opp.matched_skills) && opp.matched_skills.length > 0 && (
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                    <div style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> {hasResume ? 'Matched Skills:' : 'Key Skills:'} {opp.matched_skills.join(', ')}
                    </div>
                    {hasResume && Array.isArray(opp.missing_skills) && opp.missing_skills.length > 0 && (
                      <div style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Recommended gap closing: {opp.missing_skills.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                {opp.description}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
