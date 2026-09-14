import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Upload,
  Building,
  Star,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function OpportunitiesModule({
  opportunities = [],
  applications = [],
  onApply,
  resume = null,
  skills = [],
  recommendations = [],
  setActiveTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyMessage, setApplyMessage] = useState(null);
  const [localApplied, setLocalApplied] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const hasResume = Boolean(resume && resume.filename);

  const domains = ['All', 'Data Science', 'Software Dev', 'Social Work/NGO', 'Cloud / DevOps'];
  const modes = ['All', 'Hybrid', 'Remote', 'On-site', 'Onsite'];

  const filteredOpps = useMemo(() => {
    return opportunities.filter(opp => {
      const titleMatch = (opp.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const orgMatch = (opp.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      const skillsMatch =
        Array.isArray(opp.required_skills) &&
        opp.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSearch = !searchQuery || titleMatch || orgMatch || skillsMatch;
      const matchesDomain =
        selectedDomain === 'All' || (opp.domain || '').toLowerCase().includes(selectedDomain.toLowerCase());
      const matchesMode =
        selectedMode === 'All' || (opp.mode || '').toLowerCase() === selectedMode.toLowerCase();
      return matchesSearch && matchesDomain && matchesMode;
    });
  }, [opportunities, searchQuery, selectedDomain, selectedMode]);

  const isApplied = oppId => {
    const idStr = String(oppId || '');
    return (
      localApplied.has(idStr) ||
      applications.some(
        a =>
          String(a.opportunity_id || '') === idStr ||
          String(a.id || '') === idStr ||
          String(a.application_id || '') === idStr,
      )
    );
  };

  const handleApplyClick = async oppId => {
    const idStr = String(oppId || '');
    setApplyingId(idStr);
    setLocalApplied(prev => new Set(prev).add(idStr));
    try {
      if (onApply) await onApply(oppId);
      setApplyMessage({ type: 'success', text: 'Application submitted successfully!' });
    } catch (err) {
      setLocalApplied(prev => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
      setApplyMessage({ type: 'error', text: err.message || 'Failed to submit application' });
    } finally {
      setApplyingId(null);
    }
    setTimeout(() => setApplyMessage(null), 4000);
  };

  const DomainColors = {
    'Data Science': { bg: 'rgba(99,102,241,0.18)', color: '#818cf8', border: 'rgba(99,102,241,0.35)' },
    'Software Dev': { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: 'rgba(56,189,248,0.35)' },
    'Social Work/NGO': { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'Cloud / DevOps': { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  };
  const getDomainStyle = domain => {
    for (const [key, val] of Object.entries(DomainColors)) {
      if ((domain || '').toLowerCase().includes(key.toLowerCase())) return val;
    }
    return { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'rgba(255,255,255,0.15)' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="glass-panel" style={{
        padding: '26px 28px',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(14,165,233,0.06) 100%)',
        border: '1px solid rgba(56,189,248,0.25)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', background: 'rgba(56,189,248,0.15)', borderRadius: '10px', color: '#38bdf8' }}>
              <Briefcase size={20} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 800, margin: 0 }}>
              Opportunity Directory
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '600px' }}>
            Browse and apply to all verified institutional internships & NGO positions. Use filters to narrow your search.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            padding: '8px 16px', borderRadius: '8px',
            background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
            color: '#38bdf8', fontSize: '0.88rem', fontWeight: 700
          }}>
            {filteredOpps.length} / {opportunities.length} Listings
          </div>
        </div>
      </div>

      {/* ── No-Resume Notice (subtle, non-intrusive) ── */}
      {!hasResume && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(56,189,248,0.07)',
          border: '1px dashed rgba(56,189,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <FileText size={15} color="#38bdf8" />
            Want personalized AI match scores? Go to the <strong style={{ color: '#38bdf8' }}>&nbsp;AI Matches</strong>&nbsp;tab after uploading your resume.
          </div>
          {setActiveTab && (
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('resume')}
              style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={13} /> Upload Resume
            </button>
          )}
        </div>
      )}

      {/* ── Feedback Banner ── */}
      {applyMessage && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          background: applyMessage.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
          border: applyMessage.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
          color: applyMessage.type === 'success' ? '#34d399' : '#f43f5e',
          fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {applyMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {applyMessage.text}
        </div>
      )}

      {/* ── Main Layout: Sidebar + Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 260px) 1fr', gap: '24px' }}>

        {/* Filter Sidebar */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
            <Filter size={15} color="var(--accent-cyan)" /> Search & Filters
          </h3>

          {/* Search */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Keyword Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Role, org, or skill…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
              />
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Domain */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Domain / Sector
            </label>
            <select className="form-control" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)} style={{ fontSize: '0.88rem' }}>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Work Mode
            </label>
            <select className="form-control" value={selectedMode} onChange={e => setSelectedMode(e.target.value)} style={{ fontSize: '0.88rem' }}>
              {modes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setSearchQuery(''); setSelectedDomain('All'); setSelectedMode('All'); }}
            style={{
              background: 'none', border: '1px dashed var(--border-color)',
              color: 'var(--text-dim)', padding: '8px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.color = '#38bdf8'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-dim)'; }}
          >
            ↺ Reset Filters
          </button>

          {/* Quick Stats */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Quick Stats</div>
            {domains.slice(1).map(d => {
              const count = opportunities.filter(o => (o.domain || '').toLowerCase().includes(d.toLowerCase())).length;
              if (!count) return null;
              const ds = getDomainStyle(d);
              return (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setSelectedDomain(d)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.78rem', color: ds.color }}>{d}</span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px', background: ds.bg, color: ds.color, fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOpps.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Briefcase size={36} color="var(--text-dim)" style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '6px' }}>No Opportunities Found</h4>
              <p style={{ fontSize: '0.88rem' }}>Try broadening your search or resetting the filters.</p>
            </div>
          ) : (
            filteredOpps.map(opp => {
              const applied = isApplied(opp.id);
              const ds = getDomainStyle(opp.domain);
              return (
                <div key={opp.id} className="glass-panel" style={{
                  padding: '20px 22px',
                  borderLeft: applied ? '3px solid #10b981' : `3px solid ${ds.color}`,
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  display: 'flex', flexDirection: 'column', gap: '12px'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                >

                  {/* Row 1: Badges + Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', fontWeight: 700,
                        background: ds.bg, color: ds.color, border: `1px solid ${ds.border}`
                      }}>{opp.domain || 'General'}</span>
                      <span style={{
                        fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', fontWeight: 600,
                        background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-color)'
                      }}>{opp.mode || 'Remote'}</span>
                      {applied && (
                        <span style={{
                          fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', fontWeight: 700,
                          background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <CheckCircle size={11} /> Applied
                        </span>
                      )}
                    </div>

                    {applied ? (
                      <span style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={15} /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyClick(opp.id)}
                        disabled={applyingId === String(opp.id)}
                        className="btn btn-primary"
                        style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {applyingId === String(opp.id) ? 'Applying…' : 'Apply Now'}
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Row 2: Title + Org */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      {opp.title || opp.role}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-light)', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Building size={13} color="var(--accent-cyan)" />
                      {opp.organization || opp.organization_name}
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.55', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {opp.description}
                  </p>

                  {/* Row 4: Meta + Details link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={13} color="#34d399" />{opp.stipend}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color="#38bdf8" />{opp.location}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} color="#fbbf24" />{opp.duration}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} color="#f43f5e" />Deadline: {opp.deadline}</span>
                    </div>
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Details <ExternalLink size={12} />
                    </button>
                  </div>

                  {/* Required Skills */}
                  {Array.isArray(opp.required_skills) && opp.required_skills.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {opp.required_skills.map(s => (
                        <span key={s} style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px',
                          background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-color)'
                        }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedOpportunity && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '640px', width: '100%', padding: '28px', maxHeight: '88vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', fontWeight: 700,
                    background: getDomainStyle(selectedOpportunity.domain).bg,
                    color: getDomainStyle(selectedOpportunity.domain).color,
                    border: `1px solid ${getDomainStyle(selectedOpportunity.domain).border}`
                  }}>{selectedOpportunity.domain || 'General'}</span>
                  <span style={{
                    fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px',
                    background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-color)'
                  }}>{selectedOpportunity.mode || 'Remote'}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 800, margin: '0 0 4px 0' }}>
                  {selectedOpportunity.title || selectedOpportunity.role}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-light)', fontWeight: 600 }}>
                  <Building size={15} color="var(--accent-cyan)" />
                  {selectedOpportunity.organization || selectedOpportunity.organization_name}
                </div>
              </div>
              <button onClick={() => setSelectedOpportunity(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '6px', fontSize: '0.9rem' }}>Description</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{selectedOpportunity.description}</p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Required Skills</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Array.isArray(selectedOpportunity.required_skills) && selectedOpportunity.required_skills.map(s => (
                    <span key={s} style={{
                      padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                      background: 'var(--bg-card-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)'
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Stipend', value: selectedOpportunity.stipend, color: 'var(--accent-emerald)' },
                  { label: 'Location', value: `${selectedOpportunity.mode} • ${selectedOpportunity.location}`, color: 'var(--text-main)' },
                  { label: 'Duration', value: selectedOpportunity.duration, color: 'var(--text-main)' },
                  { label: 'Deadline', value: selectedOpportunity.deadline, color: 'var(--accent-rose)' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                    <strong style={{ color: item.color, fontSize: '0.9rem' }}>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedOpportunity(null)}>Close</button>
                {isApplied(selectedOpportunity.id) ? (
                  <span className="badge badge-emerald" style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} /> Already Applied
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={applyingId === String(selectedOpportunity.id)}
                    onClick={async () => { await handleApplyClick(selectedOpportunity.id); setSelectedOpportunity(null); }}
                  >
                    {applyingId === String(selectedOpportunity.id) ? 'Applying…' : 'Confirm Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
