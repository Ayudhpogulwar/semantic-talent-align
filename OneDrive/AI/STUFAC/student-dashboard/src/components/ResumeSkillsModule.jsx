import React, { useState } from 'react';
import { FileText, Upload, Sparkles, Plus, Trash2, CheckCircle, RefreshCw, AlertCircle, FileCode } from 'lucide-react';

export default function ResumeSkillsModule({ resume, skills, onUploadResume, onAddSkill, onRemoveSkill }) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [categoryInput, setCategoryInput] = useState('Programming');

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
            Current Version: v{resume.version} ({resume.status})
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
              background: dragActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
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
                cursor: 'pointer'
              }}
            />

            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <RefreshCw size={36} color="#38bdf8" className="pulse-glow" style={{ animation: 'spin 1.5s linear infinite' }} />
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>spaCy NLP Parsing Engine Running...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Extracting entities, work history & technical skill vectors</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCode size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Drag & drop your resume file here</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PDF or DOCX up to 5MB</div>
                </div>
                <button type="button" className="btn btn-outline-cyan" style={{ fontSize: '0.8rem', padding: '6px 16px', marginTop: '6px' }}>
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Current File Metadata */}
          {resume.filename && (
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{resume.filename}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Size: {resume.file_size} • Uploaded: {new Date(resume.upload_date).toLocaleDateString()}</div>
                </div>
              </div>
              <span className="badge badge-emerald">Parsed</span>
            </div>
          )}

          {/* Extracted Education & Work History */}
          {resume.parsed_data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <h4 style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Extracted Experience Highlights:</h4>
              {resume.parsed_data.experience.map((exp, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--primary-light)', color: '#e2e8f0' }}>
                  {exp}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Skills & Interests Tagging (FR-4) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#c084fc" /> Verified Skill Matrix ({skills.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: skills.length >= 3 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
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
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: skill.source === 'parsed' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                    border: skill.source === 'parsed' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(6, 182, 212, 0.35)',
                    fontSize: '0.82rem',
                    color: skill.source === 'parsed' ? '#a5b4fc' : '#38bdf8',
                    fontWeight: 600
                  }}
                >
                  {skill.source === 'parsed' && <Sparkles size={12} color="#a5b4fc" />}
                  <span>{skill.skill_name}</span>
                  <button
                    onClick={() => onRemoveSkill(skill.skill_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
            color: 'var(--text-dim)',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            ℹ️ <strong>spaCy Note:</strong> Skills marked with <Sparkles size={11} inline /> were automatically extracted during resume NLP parsing. You can manually adjust them anytime.
          </div>
        </div>

      </div>

    </div>
  );
}
