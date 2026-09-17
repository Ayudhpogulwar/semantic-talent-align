import React, { useState, useEffect } from 'react';

function convertCanvasToPdfBlob(canvas) {
  const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64Str = jpegUrl.split(',')[1];
  const binaryStr = window.atob(base64Str);
  const imgLen = binaryStr.length;

  const imgBytes = new Uint8Array(imgLen);
  for (let i = 0; i < imgLen; i++) {
    imgBytes[i] = binaryStr.charCodeAt(i);
  }

  const w = 842;
  const h = 595;

  const encoder = new TextEncoder();
  const header = encoder.encode('%PDF-1.4\n');
  const body1 = encoder.encode(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  const body2 = encoder.encode(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  const body3 = encoder.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im1 4 0 R >> >> /MediaBox [0 0 ${w} ${h}] /Contents 5 0 R >>\nendobj\n`);
  const body4Head = encoder.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`);
  const body4Tail = encoder.encode(`\nendstream\nendobj\n`);
  const contentStreamStr = `q ${w} 0 0 ${h} 0 0 cm /Im1 Do Q`;
  const body5 = encoder.encode(`5 0 obj\n<< /Length ${contentStreamStr.length} >>\nstream\n${contentStreamStr}\nendstream\nendobj\n`);

  const offsets = [];
  let currentOffset = header.length;

  offsets.push(currentOffset);
  currentOffset += body1.length;

  offsets.push(currentOffset);
  currentOffset += body2.length;

  offsets.push(currentOffset);
  currentOffset += body3.length;

  offsets.push(currentOffset);
  currentOffset += body4Head.length + imgBytes.length + body4Tail.length;

  offsets.push(currentOffset);
  currentOffset += body5.length;

  const xrefStart = currentOffset;
  let xrefStr = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xrefStr += String(off).padStart(10, '0') + ` 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const xrefBuf = encoder.encode(xrefStr);

  const totalLength = currentOffset + xrefBuf.length;
  const pdfBytes = new Uint8Array(totalLength);

  let pos = 0;
  pdfBytes.set(header, pos); pos += header.length;
  pdfBytes.set(body1, pos); pos += body1.length;
  pdfBytes.set(body2, pos); pos += body2.length;
  pdfBytes.set(body3, pos); pos += body3.length;
  pdfBytes.set(body4Head, pos); pos += body4Head.length;
  pdfBytes.set(imgBytes, pos); pos += imgBytes.length;
  pdfBytes.set(body4Tail, pos); pos += body4Tail.length;
  pdfBytes.set(body5, pos); pos += body5.length;
  pdfBytes.set(xrefBuf, pos);

  return new Blob([pdfBytes], { type: 'application/pdf' });
}
import { User, Mail, Hash, BookOpen, Calendar, Award, Phone, Globe, Code, Save, ShieldCheck, Check } from 'lucide-react';

export default function ProfileModule({ profile, onUpdateProfile }) {
  const [formData, setFormData] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCertFile, setNewCertFile] = useState('');
  const [viewingCert, setViewingCert] = useState(null);

  useEffect(() => {
    if (profile && Object.keys(profile).length > 0) {
      setFormData({ ...profile });
    }
  }, [profile]);

  const [certificates, setCertificates] = useState(() => {
    try {
      const stored = localStorage.getItem("stufac_certificates");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'CERT-101', student_id: profile.roll_no || 'GH23412', file: 'data_analyst_intern.pdf', issue_date: '2026-08-31', verification_status: 'PENDING' },
      { id: 'CERT-102', student_id: profile.roll_no || 'GH23412', file: 'Java_Intern.pdf', issue_date: '2026-08-31', verification_status: 'VERIFIED' },
      { id: 'CERT-103', student_id: 'STU-10234', file: 'Machine_Learning_Specialization.pdf', issue_date: '2026-08-15', verification_status: 'VERIFIED' }
    ];
  });

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

  const [newCertData, setNewCertData] = useState({
    cert_type: 'CERTIFICATE OF INTERNSHIP',
    organization: 'PSK Technologies Private Limited',
    course_title: 'React JS & Fullstack Development',
    department: 'Development Department',
    duration: '45-day internship from 5th Jan 2026 to 12th Mar 2026',
    file_name: ''
  });

  const handleAddCertificate = (e) => {
    e.preventDefault();
    const fileNameToUse = newCertData.file_name.trim() || 'Academic_Certificate.pdf';

    const newRecord = {
      id: `CERT-${Date.now().toString().slice(-4)}`,
      student_id: formData.roll_no || 'GH23412',
      student_name: formData.name || profile.name || 'Mr. Yash Mahesh Fokmare',
      cert_type: newCertData.cert_type,
      organization: newCertData.organization.trim(),
      course_title: newCertData.course_title.trim(),
      department: newCertData.department.trim(),
      duration: newCertData.duration.trim(),
      file: fileNameToUse,
      issue_date: new Date().toISOString().split('T')[0],
      verification_status: 'PENDING'
    };

    const updated = [newRecord, ...certificates];
    setCertificates(updated);
    try {
      localStorage.setItem("stufac_certificates", JSON.stringify(updated));
    } catch (err) {}

    setNewCertData({
      cert_type: 'CERTIFICATE OF INTERNSHIP',
      organization: 'PSK Technologies Private Limited',
      course_title: 'React JS & Fullstack Development',
      department: 'Development Department',
      duration: '45-day internship from 5th Jan 2026 to 12th Mar 2026',
      file_name: ''
    });
    setShowUploadModal(false);
  };

  const handleDownloadCert = async (cert) => {
    const fileName = cert.file || cert.file_name || 'Academic_Certificate.pdf';
    
    if (cert.file_url && cert.file_url !== '#' && cert.file_url !== '') {
      try {
        if (cert.file_url.startsWith('blob:')) {
          const resp = await fetch(cert.file_url);
          if (!resp.ok) throw new Error("Blob expired or inaccessible");
          const blob = await resp.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          return;
        } else {
          const a = document.createElement('a');
          a.href = cert.file_url;
          a.download = fileName;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      } catch (err) {
        console.warn("Direct file URL download failed, falling back to canvas generation:", err);
      }
    }

    const studentId = cert.student_id || formData.roll_no || 'GH23412';
    const rawName = cert.student_name || cert.name || formData.name || profile.name || (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Yash Mahesh Fokmare');
    const formattedName = rawName.toLowerCase().startsWith('mr.') || rawName.toLowerCase().startsWith('ms.') ? rawName : `Mr. ${rawName}`;
    const orgName = cert.organization || 'Microsoft';
    const certType = (cert.cert_type || 'CERTIFICATE OF COMPLETION').toUpperCase();
    const courseTitle = cert.course_title || cert.file?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || 'Git & Github';
    const dept = cert.department || 'Technical Certification Department';
    const duration = cert.duration || 'professional course';
    const issueDate = cert.issue_date || '2026-08-31';
    const status = (cert.verification_status || cert.status || 'PENDING').toUpperCase();

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1131; // A4 Landscape ratio
    const ctx = canvas.getContext('2d');

    // 1. Subtle Ivory Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1131);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#fafaf9');
    bgGrad.addColorStop(1, '#f5f5f4');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1131);

    // 2. Borders & Corner Accents
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 1540, 1071);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 1504, 1035);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, 1480, 1011);

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(140, 30); ctx.lineTo(30, 140); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1570, 30); ctx.lineTo(1460, 30); ctx.lineTo(1570, 140); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, 1101); ctx.lineTo(140, 1101); ctx.lineTo(30, 991); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1570, 1101); ctx.lineTo(1460, 1101); ctx.lineTo(1570, 991); ctx.fill();

    // 3. Organization Header & Certificate Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 22px "Georgia", serif';
    ctx.fillText(orgName.toUpperCase(), 800, 130);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 48px "Georgia", serif';
    ctx.fillText(certType, 800, 210);

    ctx.fillStyle = '#d97706';
    ctx.font = 'italic 24px "Georgia", serif';
    ctx.fillText('This document officially certifies and validates the achievement of', 800, 270);

    // 4. Student Full Name & Roll ID
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 52px "Georgia", serif';
    ctx.fillText(formattedName.replace(/^Mr\.\s+|^Ms\.\s+/i, ''), 800, 340);

    // 4. Student Full Name & Enrollment No
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(`Student Enrollment No / ID: ${studentId}`, 800, 390);

    ctx.fillStyle = '#334155';
    ctx.font = '22px "Helvetica Neue", sans-serif';
    ctx.fillText('for successful submission & institutional verification of credential:', 800, 440);

    // 5. Credential Highlight Box (Course Title)
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(300, 470, 1000, 90, 16);
    } else {
      ctx.rect(300, 470, 1000, 90);
    }
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 36px "Helvetica Neue", sans-serif';
    ctx.fillText(courseTitle, 800, 528);

    // 6. Verification Status & Details
    ctx.fillStyle = '#475569';
    ctx.font = '20px "Helvetica Neue", sans-serif';
    ctx.fillText(`Issue Date: ${issueDate}   |   Verification ID: ${cert.id || 'CERT-2e84bb'}`, 800, 620);

    ctx.fillStyle = status === 'VERIFIED' ? '#059669' : (status === 'REJECTED' ? '#dc2626' : '#d97706');
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(620, 660, 360, 50, 25);
    } else {
      ctx.rect(620, 660, 360, 50);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Helvetica Neue", sans-serif';
    ctx.fillText(`STATUS: ${status}`, 800, 693);

    // 7. Security Seal Stamp
    ctx.save();
    ctx.translate(800, 840);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SAIOTAF', 0, -20);
    ctx.fillText('VERIFIED', 0, 0);
    ctx.fillText('SEAL', 0, 20);
    ctx.restore();

    // 8. Signatures
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(250, 930); ctx.lineTo(550, 930); ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px "Georgia", serif';
    ctx.fillText('Dr. Aris Thorne', 400, 960);
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText('Head of Placement & Verification', 400, 985);

    ctx.beginPath(); ctx.moveTo(1050, 930); ctx.lineTo(1350, 930); ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px "Georgia", serif';
    ctx.fillText('Prof. Elena Rostova', 1200, 960);
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText('Dean of Academic Affairs', 1200, 985);

    if (fileName.toLowerCase().endsWith('.pdf')) {
      const pdfBlob = convertCanvasToPdfBlob(canvas);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000);
    } else {
      const image = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = image;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getBadgeStyle = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'VERIFIED') return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
    if (s === 'REJECTED') return { background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' };
    return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
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
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{profile.profile_completion_pct}%</div>
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
                <option value="MBA">MBA</option>
                <option value="BCA">BCA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Academic Year <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </label>
              <select name="year" className="form-control" value={formData.year || ''} onChange={handleChange} required>
                <option value="">-- Select Academic Year --</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
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
                min="2000"
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

      {/* Verified Student Certificates Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Award color="#38bdf8" size={20} /> Verified Academic & Skill Certificates
          </h3>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            + Upload Certificate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {certificates.filter(c => (c.verification_status || '').toUpperCase() === 'VERIFIED').length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '12px 0' }}>
              No verified certificates yet. Certificates uploaded by students will be displayed here once verified by Faculty.
            </div>
          )}

          {certificates
            .filter(cert => (cert.verification_status || '').toUpperCase() === 'VERIFIED')
            .map((cert) => {
              const badgeStyle = getBadgeStyle(cert.verification_status);
            return (
              <div
                key={cert.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    📄 {cert.file}
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    ...badgeStyle
                  }}>
                    {cert.verification_status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Issue Date: {cert.issue_date || '2026-08-31'}</span>
                  <span>ID: {cert.student_id}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setViewingCert(cert)}
                    style={{
                      flex: 1,
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCert(cert)}
                    style={{
                      flex: 1,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Certificate Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel" style={{ maxWidth: '560px', width: '100%', padding: '28px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '16px' }}>
              + Upload & Add Skill Certificate
            </h4>

            <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Certificate Type *
                </label>
                <select
                  className="form-control"
                  value={newCertData.cert_type}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, cert_type: e.target.value }))}
                >
                  <option value="CERTIFICATE OF INTERNSHIP">CERTIFICATE OF INTERNSHIP</option>
                  <option value="CERTIFICATE OF PARTICIPATION">CERTIFICATE OF PARTICIPATION</option>
                  <option value="CERTIFICATE OF ACHIEVEMENT">CERTIFICATE OF ACHIEVEMENT</option>
                  <option value="CERTIFICATE OF COMPLETION">CERTIFICATE OF COMPLETION</option>
                  <option value="CERTIFICATE OF SPECIALIZATION">CERTIFICATE OF SPECIALIZATION</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Organization / Issuer Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. PSK Technologies Private Limited"
                  value={newCertData.organization}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, organization: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Course / Technology Title *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. React JS & Fullstack Development"
                  value={newCertData.course_title}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, course_title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Department *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Development Department"
                  value={newCertData.department}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Internship / Event Duration & Dates *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 45-day internship from 5th Jan 2026 to 12th Mar 2026"
                  value={newCertData.duration}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Certificate File Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. React_JS_Internship_Cert.pdf"
                  value={newCertData.file_name}
                  onChange={(e) => setNewCertData(prev => ({ ...prev, file_name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload & Generate Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Certificate Modal */}
      {viewingCert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📜</div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: 800 }}>{viewingCert.file}</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Institutional Verified Certificate Document for Student ID <strong>{viewingCert.student_id}</strong>
            </p>

            <div style={{
              margin: '20px 0',
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justify: 'space-around',
              fontSize: '0.84rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Issue Date</span>
                <strong>{viewingCert.issue_date}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Verification Status</span>
                <strong style={{ color: viewingCert.verification_status === 'VERIFIED' ? '#34d399' : '#fbbf24' }}>
                  {viewingCert.verification_status}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleDownloadCert(viewingCert)}
              >
                📥 Download Certificate
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingCert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
