import React, { useState, useEffect, useCallback } from 'react';
import { User, Save, Check, Award, Download, ShieldCheck, Clock, XCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { downloadCertificateFile } from '../utils/certificateGenerator';

export default function ProfileModule({ profile, onUpdateProfile }) {
  const [formData, setFormData] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [myCerts, setMyCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  useEffect(() => {
    if (profile && Object.keys(profile).length > 0) {
      setFormData({ ...profile });
    }
  }, [profile]);

  const loadCerts = useCallback(() => {
    const rollNo = profile?.roll_no || profile?.enrollment_no || "";
    setCertsLoading(true);
    apiService.getMyCertificates(rollNo)
      .then(list => setMyCerts(Array.isArray(list) ? list : []))
      .catch(() => setMyCerts([]))
      .finally(() => setCertsLoading(false));
  }, [profile?.roll_no, profile?.enrollment_no]);

  // Fetch on mount / when roll_no changes
  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  // Listen for localStorage changes from the faculty portal (same browser, different tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "stufac_certificates" || e.key === null) {
        loadCerts();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadCerts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadCert = (cert) => {
    const studentName = profile?.full_name || profile?.name || 'Ayudh Pogulwar';
    downloadCertificateFile(cert, studentName);
  };

  const STATUS_CONFIG = {
    VERIFIED: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: <ShieldCheck size={13} />, label: 'Verified' },
    PENDING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: <Clock size={13} />,       label: 'Pending' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: <XCircle size={13} />,     label: 'Rejected' },
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User color="#818cf8" /> Student Profile Management
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Keep your verified academic and contact details updated for institutional matching.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Completion Progress</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{profile?.profile_completion_pct || 0}%</div>
        </div>
      </div>

      {savedSuccess && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} /> Profile updated and saved to Database Layer successfully!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Academic Credentials
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input type="text" name="name" className="form-control" value={formData.name || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Institutional Email <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email || ''}
                onChange={handleChange}
                required
                readOnly
                style={{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  opacity: 0.85,
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Student Enrollment No. / ID <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input type="text" name="roll_no" className="form-control" value={formData.roll_no || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Department / Specialization <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input type="text" name="dept" className="form-control" value={formData.dept || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Program <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <select name="program" className="form-control" value={formData.program || ''} onChange={handleChange} required>
                <option value="">-- Select Program --</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E.">B.E.</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="BCA">BCA</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Admission Year <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input
                type="number"
                name="admission_year"
                className="form-control"
                placeholder="e.g. 2022"
                min="2015"
                max="2030"
                value={formData.admission_year || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Passout / Graduation Year <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input
                type="number"
                name="passout_year"
                className="form-control"
                placeholder="e.g. 2026"
                min="2020"
                max="2035"
                value={formData.passout_year || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Current Cumulative CGPA <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <input type="text" name="cgpa" className="form-control" value={formData.cgpa || ''} onChange={handleChange} required />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginTop: '10px' }}>
            Contact & Online Profiles
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Contact Phone *</label>
              <input type="text" name="contact" className="form-control" value={formData.contact || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>LinkedIn URL (Optional)</label>
              <input type="text" name="linkedin" className="form-control" value={formData.linkedin || ''} onChange={handleChange} />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GitHub Portfolio (Optional)</label>
              <input type="text" name="github" className="form-control" value={formData.github || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Professional Summary / Bio</label>
            <textarea name="bio" className="form-control" rows={3} value={formData.bio || ''} onChange={handleChange}></textarea>
          </div>

          {/* Consent Toggle */}
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <input 
              type="checkbox" 
              id="consent" 
              name="consent_resume_sharing" 
              checked={formData.consent_resume_sharing || false} 
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="consent" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              I grant explicit consent for institutional faculty and verified hiring partners to review my resume for placement drives.
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </div>
      </form>

      {/* ── My Certificates (read-only, faculty-issued) ── */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Award color="#818cf8" size={20} /> My Certificates
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadCerts}
              title="Refresh certificate status"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            >
              <RefreshCw size={12} style={{ animation: certsLoading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '3px 10px', borderRadius: '20px' }}>
              Issued by Faculty · Read-only
            </span>
          </div>
        </div>

        {certsLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.88rem' }}>
            Loading certificates…
          </div>
        ) : myCerts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '36px 20px',
            color: 'var(--text-muted)', fontSize: '0.88rem',
            border: '1px dashed var(--border-color)', borderRadius: '12px',
            background: 'rgba(99,102,241,0.03)'
          }}>
            <Award size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <div>No certificates issued yet.</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.7 }}>Certificates added by faculty will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myCerts.map((cert) => {
              const status = (cert.verification_status || 'PENDING').toUpperCase();
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
              return (
                <div key={cert.id} style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Cert type */}
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {cert.cert_type || 'Certificate'}
                    </div>
                    {/* Organization */}
                    {cert.organization && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        🏢 {cert.organization}
                      </div>
                    )}
                    {/* Course */}
                    {cert.course_title && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        📚 {cert.course_title}
                      </div>
                    )}
                    {/* Duration */}
                    {cert.duration && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        🗓 {cert.duration}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    {/* Issue date */}
                    {cert.issue_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Issued: {cert.issue_date}
                      </span>
                    )}
                    {/* Download button */}
                    <button
                      onClick={() => handleDownloadCert(cert)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
