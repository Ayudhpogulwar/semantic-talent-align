import React, { useState } from 'react';
import { Briefcase, Search, Filter, MapPin, DollarSign, Calendar, Clock, CheckCircle, ChevronRight, AlertCircle, X } from 'lucide-react';

export default function OpportunitiesModule({ opportunities, applications, onApply }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyMessage, setApplyMessage] = useState(null);

  const domains = ['All', 'Data Science', 'Software Dev', 'Social Work/NGO', 'Cloud / DevOps'];
  const modes = ['All', 'Hybrid', 'Remote', 'On-site'];

  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDomain = selectedDomain === 'All' || opp.domain.toLowerCase().includes(selectedDomain.toLowerCase());
    const matchesMode = selectedMode === 'All' || opp.mode === selectedMode;

    return matchesSearch && matchesDomain && matchesMode;
  });

  const isApplied = (oppId) => applications.some(a => String(a.opportunity_id) === String(oppId) || String(a.id) === String(oppId));

  const handleApplyClick = async (oppId) => {
    try {
      await onApply(oppId);
      setApplyMessage({ type: 'success', text: 'Application submitted successfully with your verified student profile!' });
    } catch (err) {
      setApplyMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setApplyMessage(null), 4000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase color="#10b981" /> Verified Internship & NGO Opportunities
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Browse verified institutional listings. Apply in one click using your active profile & resume version.
          </p>
        </div>

        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: '#fff' }}>{filteredOpps.length}</strong> available positions
        </div>
      </div>

      {applyMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: applyMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: applyMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
          color: applyMessage.type === 'success' ? '#34d399' : '#f43f5e',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {applyMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {applyMessage.text}
        </div>
      )}

      {/* Main Grid: Filter Panel (Left) & Opportunity Cards (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 280px) 1fr',
        gap: '24px'
      }}>
        
        {/* Filter Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <Filter size={16} color="#38bdf8" /> Search & Filters
          </h3>

          {/* Search input */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Role, org, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Domain / Sector</label>
            <select
              className="form-control"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Work Mode</label>
            <select
              className="form-control"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              {modes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            onClick={() => { setSearchQuery(''); setSelectedDomain('All'); setSelectedMode('All'); }}
            style={{ background: 'none', border: '1px dashed var(--border-color)', color: 'var(--text-dim)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}
          >
            Reset Filters
          </button>
        </div>

        {/* Opportunity Card List with horizontal scroll containment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflowX: 'auto' }}>
          {filteredOpps.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              No opportunities found matching your filter criteria.
            </div>
          ) : (
            filteredOpps.map(opp => {
              const applied = isApplied(opp.id);
              return (
                <div key={opp.id} className="glass-panel" style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: applied ? '4px solid var(--accent-emerald)' : '4px solid var(--primary)',
                  overflowX: 'auto',
                  minWidth: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{opp.domain}</span>
                        <span className="badge badge-cyan">{opp.mode}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>ID: {opp.id}</span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-light)', wordBreak: 'break-word', margin: '4px 0' }}>
                        {opp.required_skills && opp.required_skills.length > 0 
                          ? `${opp.required_skills.map(s => s.toUpperCase()).join(' / ')} DEVELOPER`
                          : (opp.title || "SOFTWARE DEVELOPER")}
                      </h3>
                      <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, marginTop: '2px', wordBreak: 'break-word' }}>
                        Company: {opp.organization}
                      </div>
                    </div>

                    {applied ? (
                      <span className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <CheckCircle size={14} /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyClick(opp.id || opp.opportunity_id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        One-Click Apply
                      </button>
                    )}
                  </div>

                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    wordBreak: 'break-all',
                    margin: 0
                  }} title={opp.description}>
                    {opp.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} color="#34d399" /> {opp.stipend}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} color="#38bdf8" /> {opp.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} color="#fbbf24" /> Duration: {opp.duration}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} color="#f43f5e" /> Deadline: {opp.deadline}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {opp.required_skills.map(s => (
                        <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Full Details →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Opportunity Detail View Modal (Screen 5) */}
      {selectedOpportunity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '650px',
            width: '100%',
            padding: '28px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-primary">{selectedOpportunity.domain}</span>
                <h2 style={{ fontSize: '1.4rem', color: '#fff', marginTop: '6px' }}>{selectedOpportunity.title}</h2>
                <div style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{selectedOpportunity.organization}</div>
              </div>
              <button onClick={() => setSelectedOpportunity(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '4px' }}>Description</h4>
                <p>{selectedOpportunity.description}</p>
              </div>

              <div>
                <h4 style={{ color: '#fff', marginBottom: '4px' }}>Eligibility Criteria</h4>
                <p style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {selectedOpportunity.eligibility}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
                <div>Stipend: <strong style={{ color: '#fff' }}>{selectedOpportunity.stipend}</strong></div>
                <div>Location: <strong style={{ color: '#fff' }}>{selectedOpportunity.location}</strong></div>
                <div>Mode: <strong style={{ color: '#fff' }}>{selectedOpportunity.mode}</strong></div>
                <div>Application Deadline: <strong style={{ color: '#f43f5e' }}>{selectedOpportunity.deadline}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOpportunity(null)}>Close</button>
              {isApplied(selectedOpportunity.id) ? (
                <button className="btn btn-secondary" disabled style={{ opacity: 0.7 }}>Already Applied</button>
              ) : (
                <button className="btn btn-primary" onClick={() => { handleApplyClick(selectedOpportunity.id); setSelectedOpportunity(null); }}>
                  Confirm Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
