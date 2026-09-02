import React, { useState, useEffect } from 'react';
import { User, Mail, Hash, BookOpen, Calendar, Award, Phone, Globe, Code, Save, ShieldCheck, Check, FileText, UploadCloud, Sparkles, Plus, X, Download, Eye, ExternalLink } from 'lucide-react';

export default function ProfileModule({ profile, resume, onUpdateProfile, setActiveTab }) {
  const [formData, setFormData] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Certificate states
  const [certificates, setCertificates] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingCertDoc, setViewingCertDoc] = useState(null); // Certificate object for preview modal
  const [newCertFile, setNewCertFile] = useState("");
  const [newCertDate, setNewCertDate] = useState(new Date().toISOString().split("T")[0]);
  const [submittingCert, setSubmittingCert] = useState(false);

  const activeResume = resume || profile?.resume || null;

  // Load certificates matching student roll_number / ID
  useEffect(() => {
    const loadCertificates = () => {
      try {
        const stored = localStorage.getItem("stufac_certificates");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const currentRoll = (formData.roll_number || "GH23412").trim().toLowerCase();
            const matched = parsed.filter(c => 
              String(c.student_id).trim().toLowerCase() === currentRoll ||
              currentRoll.includes(String(c.student_id).trim().toLowerCase())
            );
            if (matched.length > 0) {
              setCertificates(matched);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
      
      // Seed default certificates matching GH23412 if none found
      setCertificates([
        {
          id: "CERT-2e84bc",
          student_id: formData.roll_number || "GH23412",
          file: "data_analyst_intern.pdf",
          file_name: "data_analyst_intern.pdf",
          issue_date: "2026-08-31",
          verification_status: "PENDING"
        },
        {
          id: "CERT-673bb5",
          student_id: formData.roll_number || "GH23412",
          file: "Java_Intern.pdf",
          file_name: "Java_Intern.pdf",
          issue_date: "2026-08-31",
          verification_status: "VERIFIED"
        }
      ]);
    };

    loadCertificates();
  }, [formData.roll_number]);

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

  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (!newCertFile.trim()) {
      alert("Please enter a valid certificate document filename or upload a file.");
      return;
    }

    setSubmittingCert(true);
    const newCert = {
      id: `CERT-${Date.now().toString().slice(-4)}`,
      student_id: formData.roll_number || "GH23412",
      file: newCertFile.trim(),
      file_name: newCertFile.trim(),
      issue_date: newCertDate || new Date().toISOString().split("T")[0],
      verification_status: "PENDING"
    };

    try {
      const stored = localStorage.getItem("stufac_certificates");
      const list = stored ? JSON.parse(stored) : [];
      const updated = [newCert, ...list];
      localStorage.setItem("stufac_certificates", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setCertificates(prev => [newCert, ...prev]);
    setSubmittingCert(false);
    setShowUploadModal(false);
    setNewCertFile("");
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
            Keep your verified academic credentials and uploaded resume updated for institutional matching.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Completion Progress</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{profile.profile_completion_pct || 85}%</div>
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

      {/* Active Resume Card Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="#818cf8" size={20} /> Verified Active Resume Document
          </h3>
          {setActiveTab && (
            <button 
              type="button" 
              onClick={() => setActiveTab('resume')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UploadCloud size={14} /> Upload / Manage Resume
            </button>
          )}
        </div>

        {activeResume && (activeResume.filename || activeResume.resume_id) ? (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={28} color="#818cf8" />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {activeResume.filename || `Resume_${activeResume.resume_id || 'Active'}.pdf`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Parsed Version v{activeResume.version || 1} • Status: {activeResume.status || 'Active'}
                </div>
              </div>
            </div>

            <span className="badge badge-cyan" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              Verified Document
            </span>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No active resume on file. Click "Upload / Manage Resume" to add one.
          </div>
        )}
      </div>

      {/* Verified Certificates & Credentials Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Award color="#818cf8" size={20} /> Institutional Certificates & Credentials
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', marginBottom: 0 }}>
              Certificates submitted for faculty verification. Approved certificates boost your Placement Readiness Score.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowUploadModal(true)}
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Submit Certificate
          </button>
        </div>

        {certificates.length === 0 ? (
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-color)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem'
          }}>
            No certificates submitted yet for Roll ID: <strong>{formData.roll_number || "GH23412"}</strong>. Click "+ Submit Certificate" to upload course/internship credentials.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {certificates.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(129, 140, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}>
                    <FileText size={20} />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {c.file || c.file_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Issued Date: {c.issue_date || "2026-08-31"} • Student Roll ID: <code style={{ color: '#818cf8', fontWeight: 700 }}>{c.student_id}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: c.verification_status === "VERIFIED" ? 'rgba(16, 185, 129, 0.15)' : (c.verification_status === "REJECTED" ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                    color: c.verification_status === "VERIFIED" ? '#34d399' : (c.verification_status === "REJECTED" ? '#f87171' : '#fbbf24'),
                    border: `1px solid ${c.verification_status === "VERIFIED" ? 'rgba(16, 185, 129, 0.3)' : (c.verification_status === "REJECTED" ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`
                  }}>
                    {c.verification_status === "VERIFIED" ? "🟢 Verified by Faculty" : (c.verification_status === "REJECTED" ? "🔴 Rejected" : "🟡 Pending Review")}
                  </span>

                  <button
                    type="button"
                    onClick={() => setViewingCertDoc(c)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '4px 12px', cursor: 'pointer' }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Personal & Academic Information
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name *</label>
              <input type="text" name="full_name" className="form-control" value={formData.full_name || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Institutional Email *</label>
              <input type="email" name="email" className="form-control" value={formData.email || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Student Roll No. / ID *</label>
              <input type="text" name="roll_number" className="form-control" value={formData.roll_number || ''} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Department / Specialization *</label>
              <input type="text" name="department" className="form-control" value={formData.department || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Year *</label>
              <input type="text" name="year_of_study" className="form-control" value={formData.year_of_study || ''} onChange={handleChange} required />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current Cumulative CGPA *</label>
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
              I grant explicit consent for verified hiring partners to review my resume for placement drives.
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </div>
      </form>

      {/* Document Preview Modal */}
      {viewingCertDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '620px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="#818cf8" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>
                    {viewingCertDoc.file || viewingCertDoc.file_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Student Roll ID: <code style={{ color: '#818cf8', fontWeight: 700 }}>{viewingCertDoc.student_id}</code>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingCertDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Details & Visual Document Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>ISSUE DATE</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '2px' }}>{viewingCertDoc.issue_date || "2026-08-31"}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>VERIFICATION STATUS</div>
                  <div style={{ marginTop: '2px' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: viewingCertDoc.verification_status === "VERIFIED" ? 'rgba(16, 185, 129, 0.15)' : (viewingCertDoc.verification_status === "REJECTED" ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                      color: viewingCertDoc.verification_status === "VERIFIED" ? '#34d399' : (viewingCertDoc.verification_status === "REJECTED" ? '#f87171' : '#fbbf24')
                    }}>
                      {viewingCertDoc.verification_status === "VERIFIED" ? "🟢 Verified by Faculty" : (viewingCertDoc.verification_status === "REJECTED" ? "🔴 Rejected" : "🟡 Pending Review")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Preview Seal Container */}
              <div style={{
                padding: '28px 20px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                textAlign: 'center',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📜</div>
                <h4 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, marginBottom: '6px' }}>
                  INSTITUTIONAL ACADEMIC CREDENTIAL
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '380px', margin: '0 auto 14px' }}>
                  Verified Document for Student Roll ID <strong>{viewingCertDoc.student_id}</strong>.
                </p>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: '#38bdf8',
                  border: '1px dashed rgba(56, 189, 248, 0.3)'
                }}>
                  {viewingCertDoc.file || viewingCertDoc.file_name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => alert(`Downloading ${viewingCertDoc.file || viewingCertDoc.file_name}`)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download Document
              </button>
              <button
                type="button"
                onClick={() => setViewingCertDoc(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit New Certificate Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus color="#818cf8" size={20} /> Submit Certificate for Faculty Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Certificate File / Name *
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setNewCertFile(e.target.files[0].name);
                    }
                  }}
                  className="form-control mb-2"
                />
                <input
                  type="text"
                  placeholder="Or enter filename (e.g. Java_Intern.pdf)"
                  value={newCertFile}
                  onChange={(e) => setNewCertFile(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={newCertDate}
                  onChange={(e) => setNewCertDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCert}
                  className="btn btn-primary"
                >
                  {submittingCert ? "Submitting…" : "Submit Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
