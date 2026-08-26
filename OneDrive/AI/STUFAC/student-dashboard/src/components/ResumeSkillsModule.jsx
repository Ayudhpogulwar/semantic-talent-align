import React, { useState } from 'react';
import { FileText, Upload, Sparkles, Plus, Trash2, CheckCircle, RefreshCw, AlertCircle, FileCode, Eye, Download, X, ExternalLink } from 'lucide-react';

export default function ResumeSkillsModule({ resume = {}, skills = [], onUploadResume, onAddSkill, onRemoveSkill }) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [categoryInput, setCategoryInput] = useState('Programming');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeResume = resume || {};

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUpload(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUpload(file);
    }
  };

  const processUpload = async (file) => {
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      alert("Unsupported file format! Please upload a PDF or DOCX file.");
      return;
    }
    setIsUploading(true);
    try {
      await onUploadResume(file);
    } catch (err) {
      console.error("Error during upload process:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSkillSubmit = (e) => {
    e.preventDefault();
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim(), categoryInput);
      setNewSkill('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="#38bdf8" /> Resume Parsing & Skill Alignment
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Upload your resume (PDF/DOCX). spaCy NLP automatically parses skills and feeds downstream Sentence-BERT recommendations.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            Current Version: v{safeResume.version || 1} ({safeResume.status || 'Active'})
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Drag and Drop Resume Upload (FR-3) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#818cf8" /> Resume Document Upload
          </h3>

          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
              background: dragActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 5
              }}
            />

            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <RefreshCw size={36} color="var(--accent-cyan)" className="pulse-glow" style={{ animation: 'spin 1.5s linear infinite' }} />
                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>spaCy NLP Parsing Engine Running...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Extracting entities, work history & technical skill vectors</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCode size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Drag & drop your resume file here</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PDF or DOCX up to 5MB</div>
                </div>
                <button type="button" className="btn btn-outline-cyan" style={{ fontSize: '0.8rem', padding: '6px 16px', marginTop: '6px', pointerEvents: 'none' }}>
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Interactive Green File Metadata Card */}
          {safeResume.filename && (
            <div 
              onClick={() => setShowPreviewModal(true)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
              }}
              title="Click to view & inspect uploaded resume"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={22} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {safeResume.filename} <Eye size={14} color="#34d399" />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Size: {safeResume.file_size || '0.2 MB'} • Uploaded: {safeResume.upload_date ? String(safeResume.upload_date).split('T')[0] : 'Today'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="btn btn-outline"
                  style={{
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderColor: 'rgba(52, 211, 153, 0.5)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '6px'
                  }}
                >
                  <Eye size={13} /> View
                </button>
                <span className="badge badge-emerald">Parsed</span>
              </div>
            </div>
          )}

          {/* Extracted Education & Work History */}
          {resume.parsed_data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <h4 style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 700 }}>Extracted Experience Highlights:</h4>
              {resume.parsed_data.experience.map((exp, idx) => (
                <div key={idx} style={{ fontSize: '0.82rem', padding: '10px 14px', background: 'var(--input-bg)', borderRadius: '8px', borderLeft: '3px solid var(--primary-light)', color: 'var(--text-main)', fontWeight: 500 }}>
                  {exp}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Skills & Interests Tagging (FR-4) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#c084fc" /> Verified Skill Matrix ({skills.length})
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: skills.length >= 3 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {skills.length >= 3 ? '✓ Minimum skill threshold met' : '⚠️ Need ≥3 skills for recommendations'}
            </span>
          </div>

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkillSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Add skill (e.g., Python, AWS, SQL)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="form-control"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="Programming">Programming</option>
              <option value="AI/ML">AI / ML</option>
              <option value="Web Dev">Web Dev</option>
              <option value="Database">Database</option>
              <option value="DevOps">DevOps</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}>
              <Plus size={18} />
            </button>
          </form>

          {/* Skill Tag Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', minHeight: '120px' }}>
            {skills.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', padding: '20px', textAlign: 'center', width: '100%' }}>
                No skills tagged yet. Upload your resume or add skills manually above!
              </div>
            ) : (
              skills.map(skill => (
                <div
                  key={skill.skill_id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: skill.source === 'parsed' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(6, 182, 212, 0.22)',
                    border: skill.source === 'parsed' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(6, 182, 212, 0.45)',
                    fontSize: '0.84rem',
                    color: skill.source === 'parsed' ? 'var(--primary-light)' : 'var(--accent-cyan)',
                    fontWeight: 700
                  }}
                >
                  {skill.source === 'parsed' && <Sparkles size={12} color="var(--primary-light)" />}
                  <span>{skill.skill_name}</span>
                  <button
                    onClick={() => onRemoveSkill(skill.skill_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove skill"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-main)',
            padding: '10px 14px',
            background: 'var(--input-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            ℹ️ <strong style={{ color: 'var(--accent-cyan)' }}>spaCy Note:</strong> Skills marked with <Sparkles size={11} inline /> were automatically extracted during resume NLP parsing. You can manually adjust them anytime.
          </div>
        </div>

      </div>

      {/* Resume Viewer & Inspector Modal */}
      {showPreviewModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(11, 15, 25, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              maxWidth: '900px',
              width: '100%',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.95)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {safeResume.filename || 'Resume_Document.pdf'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Verified PDF Document Viewer • Size: {safeResume.file_size || '0.2 MB'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {safeResume.file_url && (
                  <>
                    <a
                      href={safeResume.file_url}
                      download={safeResume.filename || "Resume.pdf"}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={14} /> Download PDF
                    </a>
                    <a
                      href={safeResume.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Open Full
                    </a>
                  </>
                )}
                <button 
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded Live PDF Viewer / Document Frame */}
            <div style={{ flex: 1, padding: '16px', background: 'rgba(11, 15, 25, 0.95)', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
              {safeResume.file_url ? (
                <iframe
                  src={safeResume.file_url}
                  title="Uploaded Resume PDF Document Viewer"
                  width="100%"
                  height="100%"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    flex: 1
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '14px',
                  padding: '36px',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  overflowY: 'auto',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {safeResume.filename || 'Uploaded Resume Document'}
                      </h1>
                      <div style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '4px' }}>
                        Document ID: {safeResume.resume_id || 'RES-1001'} • Version v{safeResume.version || 1}
                      </div>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> spaCy Verified Parsed
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Parsed Technical Skill Vectors ({safeSkills.length}):
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {safeSkills.map(s => (
                        <span key={s.skill_id} style={{ background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #cbd5e1' }}>
                          ✨ {s.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Document Metadata:
                    </h3>
                    <div style={{ fontSize: '0.86rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>File Name:</strong> {safeResume.filename || 'Resume.pdf'}</div>
                      <div><strong>File Size:</strong> {safeResume.file_size || '0.2 MB'}</div>
                      <div><strong>Status:</strong> Active Parsed for Placement Matching</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <button 
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="btn btn-primary"
                style={{ padding: '8px 22px' }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
