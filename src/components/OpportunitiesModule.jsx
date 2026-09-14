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
  ChevronRight, 
  AlertCircle, 
  X, 
  Sparkles, 
  FileText, 
  Upload,
  Check,
  Building
} from 'lucide-react';

export default function OpportunitiesModule({ 
  opportunities = [], 
  applications = [], 
  onApply, 
  resume = null, 
  skills = [], 
  recommendations = [], 
  setActiveTab 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyMessage, setApplyMessage] = useState(null);
  const [localApplied, setLocalApplied] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);

  const hasResume = Boolean(resume && resume.filename);

  // Student's normalized skill list
  const userSkillSet = useMemo(() => {
    const list = (resume?.parsed_data?.skills || skills || []).map(s => 
      (typeof s === 'string' ? s : (s.skill_name || '')).toLowerCase().trim()
    ).filter(Boolean);
    return new Set(list);
  }, [resume, skills]);

  // Enrich each opportunity with match intelligence
  const enrichedOpps = useMemo(() => {
    return opportunities.map(opp => {
      const oppIdStr = String(opp.id || opp.opportunity_id || '');
      const rec = recommendations.find(r => String(r.id) === oppIdStr || r.title.toLowerCase() === opp.title.toLowerCase());
      
      let matchScore = 0;
      let matchedSkills = [];
      let missingSkills = [];
      
      if (rec && rec.match_score) {
        matchScore = rec.match_score;
        matchedSkills = rec.matched_skills || [];
        missingSkills = rec.missing_skills || [];
      } else if (hasResume && userSkillSet.size > 0 && Array.isArray(opp.required_skills) && opp.required_skills.length > 0) {
        opp.required_skills.forEach(req => {
          const reqLower = req.toLowerCase().trim();
          let isMatch = false;
          userSkillSet.forEach(u => {
            if (u.includes(reqLower) || reqLower.includes(u)) isMatch = true;
          });
          if (isMatch) matchedSkills.push(req);
          else missingSkills.push(req);
        });
        matchScore = Math.min(98, Math.max(45, Math.round(40 + (matchedSkills.length / opp.required_skills.length) * 55)));
      }

      return {
        ...opp,
        matchScore: hasResume ? matchScore : null,
        matchedSkills,
        missingSkills
      };
    });
  }, [opportunities, recommendations, userSkillSet, hasResume]);

  const domains = ['All', 'Data Science', 'Software Dev', 'Social Work/NGO', 'Cloud / DevOps'];
  const modes = ['All', 'Hybrid', 'Remote', 'On-site', 'Onsite'];

  // Filtering
  const filteredOpps = useMemo(() => {
    let list = enrichedOpps.filter(opp => {
      const titleMatch = (opp.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const orgMatch = (opp.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
      const skillsMatch = Array.isArray(opp.required_skills) && opp.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSearch = !searchQuery || titleMatch || orgMatch || skillsMatch;

      const matchesDomain = selectedDomain === 'All' || (opp.domain || '').toLowerCase().includes(selectedDomain.toLowerCase());
      const matchesMode = selectedMode === 'All' || (opp.mode || '').toLowerCase() === selectedMode.toLowerCase();
      const matchesOnlyMatched = !onlyMatched || (opp.matchScore && opp.matchScore > 50);

      return matchesSearch && matchesDomain && matchesMode && matchesOnlyMatched;
    });

    // If resume is uploaded, prioritize opportunities with highest match score
    if (hasResume) {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return list;
  }, [enrichedOpps, searchQuery, selectedDomain, selectedMode, onlyMatched, hasResume]);

  const isApplied = (oppId) => {
    const idStr = String(oppId || '');
    return localApplied.has(idStr) || applications.some(a => 
      String(a.opportunity_id || '') === idStr || 
      String(a.id || '') === idStr ||
      String(a.application_id || '') === idStr
    );
  };

  const handleApplyClick = async (oppId) => {
    const idStr = String(oppId || '');
    setApplyingId(idStr);
    // Optimistically mark as applied immediately so button updates instantly to 'Applied'
    setLocalApplied(prev => new Set(prev).add(idStr));
    try {
      if (onApply) {
        await onApply(oppId);
      }
      setApplyMessage({ type: 'success', text: 'Application submitted successfully with your verified student profile!' });
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Briefcase color="#10b981" /> Verified Internship & NGO Opportunities
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', marginBottom: 0 }}>
            {hasResume 
              ? 'Opportunities automatically ranked by skill alignment with your uploaded resume.' 
              : 'Browse all verified institutional listings. Upload your resume to see personalized skill match scores.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasResume && (
            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '6px 14px', fontSize: '0.85rem' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> Resume Match Active
            </span>
          )}
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: '#fff' }}>{filteredOpps.length}</strong> available positions
          </div>
        </div>
      </div>

      {/* Resume Status Banner */}
      {!hasResume ? (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', color: '#38bdf8' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '0.98rem', fontWeight: 700 }}>
                Showing All Verified Opportunities (No Resume Uploaded)
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0 0' }}>
                You are currently viewing all institutional opportunities. Upload your resume to calculate AI skill compatibility scores and unlock tailored recommendations!
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('resume')}
              style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={15} /> Upload Resume Now
            </button>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#c084fc" />
            <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              Matched against active resume: <strong style={{ color: '#fff' }}>{resume.filename}</strong>
            </span>
          </div>
          <button 
            onClick={() => setOnlyMatched(!onlyMatched)}
            className={`btn ${onlyMatched ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            {onlyMatched ? '✓ Showing Top Resume Matches' : 'Filter by Resume Matches (>50%)'}
          </button>
        </div>
      )}

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
          <h3 style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
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
            onClick={() => { setSearchQuery(''); setSelectedDomain('All'); setSelectedMode('All'); setOnlyMatched(false); }}
            style={{ background: 'none', border: '1px dashed var(--border-color)', color: 'var(--text-dim)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}
          >
            Reset Filters
          </button>
        </div>

        {/* Opportunity Card List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOpps.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Briefcase size={32} color="var(--text-dim)" style={{ marginBottom: '12px', opacity: 0.6 }} />
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '6px' }}>No Opportunities Found</h4>
              <p style={{ fontSize: '0.88rem' }}>Try broadening your search query or resetting filters.</p>
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
                  borderLeft: applied ? '4px solid var(--accent-emerald)' : (opp.matchScore && opp.matchScore >= 75 ? '4px solid #a855f7' : '4px solid var(--primary)')
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{opp.domain || 'Software Dev'}</span>
                        <span className="badge badge-cyan">{opp.mode || 'Remote'}</span>
                        {opp.matchScore && (
                          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.8rem', padding: '4px 10px', fontWeight: 700 }}>
                            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} /> {opp.matchScore}% Match
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {opp.id}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700 }}>Role:</span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{opp.title || opp.role}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700 }}>Organization:</span>
                          <span style={{ fontSize: '0.95rem', color: 'var(--primary-light)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Building size={14} color="var(--accent-cyan)" /> {opp.organization || opp.organization_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {applied ? (
                      <span className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'default' }}>
                        <CheckCircle size={15} /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyClick(opp.id)}
                        disabled={applyingId === String(opp.id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {applyingId === String(opp.id) ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14, borderWidth: 2 }} aria-hidden="true"></span>
                            Applying...
                          </>
                        ) : (
                          'One-Click Apply'
                        )}
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {opp.description}
                  </p>

                  {/* Matched skills highlight if resume uploaded */}
                  {hasResume && opp.matchedSkills && opp.matchedSkills.length > 0 && (
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#34d399'
                    }}>
                      <Check size={14} />
                      <span><strong>Resume Skills Matched:</strong> {opp.matchedSkills.join(', ')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} color="#34d399" /> {opp.stipend}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} color="#38bdf8" /> {opp.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} color="#fbbf24" /> Duration: {opp.duration}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} color="#f43f5e" /> Deadline: {opp.deadline}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Array.isArray(opp.required_skills) && opp.required_skills.map(s => (
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

      {/* Opportunity Detail View Modal */}
      {selectedOpportunity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.75)',
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{selectedOpportunity.domain || 'Software Dev'}</span>
                  <span className="badge badge-cyan">{selectedOpportunity.mode || 'Remote'}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700, display: 'block' }}>Role / Position</span>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '2px', marginBottom: '4px', fontWeight: 700 }}>{selectedOpportunity.title || selectedOpportunity.role}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700 }}>Organization:</span>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Building size={16} color="var(--accent-cyan)" /> {selectedOpportunity.organization || selectedOpportunity.organization_name}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedOpportunity(null)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {hasResume && selectedOpportunity.matchScore && (
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  background: 'rgba(168, 85, 247, 0.12)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#c084fc" />
                    <span><strong>Resume Compatibility:</strong> {selectedOpportunity.matchScore}% Match Score</span>
                  </div>
                  {selectedOpportunity.matchedSkills && selectedOpportunity.matchedSkills.length > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#34d399' }}>Matched: {selectedOpportunity.matchedSkills.join(', ')}</span>
                  )}
                </div>
              )}

              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '4px', fontSize: '0.95rem' }}>Description</h4>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{selectedOpportunity.description}</p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '6px', fontSize: '0.95rem' }}>Required Skills</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Array.isArray(selectedOpportunity.required_skills) && selectedOpportunity.required_skills.map(s => (
                    <span key={s} style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      background: hasResume && userSkillSet.has(s.toLowerCase().trim()) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                      color: hasResume && userSkillSet.has(s.toLowerCase().trim()) ? '#34d399' : '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: hasResume && userSkillSet.has(s.toLowerCase().trim()) ? '1px solid rgba(16, 185, 129, 0.4)' : 'none'
                    }}>
                      {hasResume && userSkillSet.has(s.toLowerCase().trim()) ? `✓ ${s}` : s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '6px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Stipend / Compensation</span>
                  <strong style={{ color: '#34d399' }}>{selectedOpportunity.stipend}</strong>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Work Mode & Location</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedOpportunity.mode} • {selectedOpportunity.location}</strong>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Duration</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedOpportunity.duration}</strong>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Application Deadline</span>
                  <strong style={{ color: '#f43f5e' }}>{selectedOpportunity.deadline}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedOpportunity(null)}>Close</button>
                {isApplied(selectedOpportunity.id) ? (
                  <span className="badge badge-emerald" style={{ padding: '10px 18px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Already Applied
                  </span>
                ) : (
                  <button 
                    className="btn btn-primary"
                    disabled={applyingId === String(selectedOpportunity.id)}
                    onClick={async () => {
                      await handleApplyClick(selectedOpportunity.id);
                      setSelectedOpportunity(null);
                    }}
                  >
                    {applyingId === String(selectedOpportunity.id) ? 'Applying...' : 'Confirm One-Click Application'}
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
