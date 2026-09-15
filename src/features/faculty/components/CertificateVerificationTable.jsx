/**
 * SAIOTAF - Faculty & Moderator Module
 * CertificateVerificationTable  (FR-FAC-05)
 *
 * Persisted Certificate Verification Dashboard Page with Dual-Layer Database & LocalStorage persistence.
 */

import React, { useState, useEffect, useCallback } from "react";
import { certificateApi } from "../api/facultyApi";

const STATUS_BADGE = {
  PENDING: "bg-warning text-dark",
  VERIFIED: "bg-success text-white",
  REJECTED: "bg-danger text-white",
};

const STUDENT_DIRECTORY = {
  "GH23412": "Yash Mahesh Fokmare",
  "SV-101": "Aditi Sharma",
  "2026CS101": "Aditi Sharma",
  "SV-102": "Rohan Verma",
  "2026IT104": "Rohan Verma",
  "SV-103": "Priya Patel",
  "2025AI108": "Priya Patel",
  "SV-104": "Siddharth Kulkarni",
  "2027EC202": "Siddharth Kulkarni",
  "SV-105": "Ananya Deshmukh",
  "2026ME115": "Ananya Deshmukh"
};

export const resolveStudentName = (c) => {
  if (!c) return "Student Credential Holder";
  
  const id = String(c.student_id || c.studentId || c.roll_number || '').trim();

  if (c.student_name && c.student_name.trim() && c.student_name.trim() !== "Mr. Yash Mahesh Fokmare") {
    return c.student_name.trim();
  }
  if (c.full_name && c.full_name.trim()) return c.full_name.trim();
  if (c.name && c.name.trim()) return c.name.trim();

  if (id && STUDENT_DIRECTORY[id]) return STUDENT_DIRECTORY[id];

  try {
    const stored = localStorage.getItem("stufac_students");
    if (stored) {
      const list = JSON.parse(stored);
      const found = list.find(s => String(s.id).trim() === id || String(s.roll_number).trim() === id || String(s.student_id).trim() === id);
      if (found && (found.student_name || found.full_name || found.name)) {
        return found.student_name || found.full_name || found.name;
      }
    }
  } catch (e) {}

  if (c.student_name && c.student_name.trim()) return c.student_name.trim();
  if (id) return `Student ${id}`;
  return "Yash Mahesh Fokmare";
};

const defaultInitialCerts = [
  {
    id: "CERT-9021",
    student_id: "GH23412",
    student_name: "Yash Mahesh Fokmare",
    file: "Uploaded_Certificate.pdf",
    file_url: "#",
    issue_date: "2026-09-02",
    verification_status: "PENDING",
    cert_type: "CERTIFICATE OF INTERNSHIP",
    organization: "PSK Technologies Private Limited",
    course_title: "Full Stack Web Development",
    department: "Computer Science & Engineering",
    duration: "45-day internship from 5th Jan 2026 to 12th Mar 2026"
  },
  {
    id: "CERT-8842",
    student_id: "2026CS101",
    student_name: "Aditi Sharma",
    file: "AWS_Cloud_Architect_Certificate.pdf",
    file_url: "#",
    issue_date: "2026-08-28",
    verification_status: "VERIFIED",
    cert_type: "CERTIFICATE OF COMPLETION",
    organization: "Amazon Web Services",
    course_title: "AWS Certified Solutions Architect",
    department: "Computer Science & Engineering",
    duration: "6-month professional specialization"
  },
  {
    id: "CERT-7731",
    student_id: "2026IT104",
    student_name: "Rohan Verma",
    file: "React_Native_Mastery.pdf",
    file_url: "#",
    issue_date: "2026-08-15",
    verification_status: "VERIFIED",
    cert_type: "CERTIFICATE OF ACHIEVEMENT",
    organization: "Meta / Coursera",
    course_title: "Advanced React & Cross-Platform Mobile",
    department: "Information Technology",
    duration: "3-month certification program"
  }
];

const INITIAL_FORM = {
  student_id: "",
  student_name: "",
  cert_type: "CERTIFICATE OF INTERNSHIP",
  organization: "PSK Technologies Private Limited",
  course_title: "React JS & Fullstack Development",
  department: "Development Department",
  duration: "45-day internship from 5th Jan 2026 to 12th Mar 2026",
  file_name: "",
  issue_date: new Date().toISOString().split("T")[0],
  status: "PENDING"
};

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

const getStoredCerts = () => {
  try {
    const stored = localStorage.getItem("stufac_certificates");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(c => ({
          ...c,
          student_name: resolveStudentName(c),
          file_url: (c.file_url && c.file_url.startsWith('blob:')) ? '#' : c.file_url
        }));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return defaultInitialCerts;
};

function CertificateDocumentPreview({ cert }) {
  if (!cert) return null;

  const rawName = resolveStudentName(cert);
  const formattedName = rawName.toLowerCase().startsWith('mr.') || rawName.toLowerCase().startsWith('ms.') ? rawName : `Mr. ${rawName}`;
  const orgName = cert.organization || "PSK Technologies Private Limited";
  const certType = (cert.cert_type || "CERTIFICATE OF INTERNSHIP").toUpperCase();
  const courseTitle = cert.course_title || cert.file?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Full Stack Web Development";
  const issueDate = cert.issue_date || "2026-09-12";
  const status = (cert.verification_status || cert.status || "PENDING").toUpperCase();
  const studentId = cert.student_id || cert.studentId || "2023CS2963";

  const isDirectImage = cert.file_url && cert.file_url.startsWith('data:image');
  const isDirectPdf = cert.file_url && cert.file_url.startsWith('data:application/pdf');

  if (isDirectImage) {
    return (
      <div className="text-center p-2 bg-dark rounded border my-2">
        <img src={cert.file_url} alt="Certificate Document" style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px' }} />
      </div>
    );
  }

  if (isDirectPdf) {
    return (
      <div className="rounded border overflow-hidden my-2" style={{ height: '520px' }}>
        <iframe src={cert.file_url} title="Certificate PDF Document" width="100%" height="100%" style={{ border: 'none' }} />
      </div>
    );
  }

  return (
    <div 
      className="p-4 p-md-5 rounded-3 position-relative shadow-lg overflow-hidden text-center my-1"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #fafaf9 50%, #f5f5f4 100%)",
        color: "#0f172a",
        border: "12px solid #1e3a8a",
        outline: "3px solid #d97706",
        outlineOffset: "-8px",
        minHeight: "440px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      {/* Corner Ribbon Accents */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 50, height: 50, background: "#1e3a8a", clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: "#1e3a8a", clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 50, height: 50, background: "#1e3a8a", clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 50, height: 50, background: "#1e3a8a", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />

      {/* Organization Header */}
      <p className="text-uppercase tracking-wider fw-bold mb-1" style={{ color: "#475569", fontFamily: "Georgia, serif", fontSize: "0.82rem", letterSpacing: "2px" }}>
        {orgName}
      </p>
      <h3 className="fw-extrabold mb-1 text-uppercase" style={{ color: "#0f172a", fontFamily: "Georgia, serif", fontSize: "1.6rem", letterSpacing: "1px" }}>
        {certType}
      </h3>
      <p className="fst-italic mb-2 text-muted" style={{ fontFamily: "Georgia, serif", fontSize: "0.88rem" }}>
        This document officially certifies and validates the achievement of
      </p>

      {/* Student Name */}
      <h2 className="fw-black my-2" style={{ color: "#1e3a8a", fontFamily: "Georgia, serif", fontSize: "1.95rem" }}>
        {formattedName}
      </h2>
      <p className="fw-semibold text-secondary mb-2" style={{ fontSize: "0.82rem" }}>
        Student Roll / ID: <code className="bg-light px-2 py-0.5 rounded text-dark border">{studentId}</code>
      </p>

      <p className="text-secondary small mb-2" style={{ fontSize: "0.8rem" }}>
        for successful completion and institutional verification of credential:
      </p>

      {/* Course Title Badge Box */}
      <div 
        className="d-inline-block px-4 py-2 rounded-3 my-2"
        style={{ background: "#f1f5f9", border: "2px solid #6366f1" }}
      >
        <h5 className="fw-bold mb-0" style={{ color: "#4338ca", fontSize: "1.15rem" }}>
          {courseTitle}
        </h5>
      </div>

      {/* Details Bar */}
      <div className="d-flex align-items-center justify-content-center gap-2.5 my-2.5 flex-wrap">
        <span className="small text-muted fw-semibold" style={{ fontSize: "0.78rem" }}>Issue Date: <strong>{issueDate}</strong></span>
        <span className="text-muted">•</span>
        <span className="small text-muted fw-semibold" style={{ fontSize: "0.78rem" }}>Verification ID: <code>{cert.id || "CERT-9021"}</code></span>
        <span className="text-muted">•</span>
        <span className={`badge px-3 py-1 fw-bold ${status === 'VERIFIED' ? 'bg-success' : status === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
          STATUS: {status}
        </span>
      </div>

      {/* Signatures & Seal */}
      <div className="row align-items-end mt-3 pt-3 border-top border-secondary-subtle">
        <div className="col-4 text-center">
          <div style={{ borderBottom: "2px solid #1e293b", width: "75%", margin: "0 auto 4px" }} />
          <strong className="d-block text-dark small" style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem" }}>Dr. Aris Thorne</strong>
          <small className="text-muted" style={{ fontSize: "0.68rem" }}>Head of Verification</small>
        </div>

        <div className="col-4 text-center">
          <div 
            className="d-inline-flex flex-column align-items-center justify-content-center rounded-circle shadow"
            style={{
              width: 68,
              height: 68,
              background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              color: "#ffffff",
              border: "3px double #ffffff",
              boxShadow: "0 4px 10px rgba(217, 119, 6, 0.4)"
            }}
          >
            <small className="fw-bold" style={{ fontSize: "0.52rem", letterSpacing: "1px" }}>SAIOTAF</small>
            <strong style={{ fontSize: "0.62rem", lineHeight: 1 }}>VERIFIED</strong>
            <small className="fw-bold" style={{ fontSize: "0.52rem" }}>SEAL</small>
          </div>
        </div>

        <div className="col-4 text-center">
          <div style={{ borderBottom: "2px solid #1e293b", width: "75%", margin: "0 auto 4px" }} />
          <strong className="d-block text-dark small" style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem" }}>Prof. Elena Rostova</strong>
          <small className="text-muted" style={{ fontSize: "0.68rem" }}>Dean of Academic Affairs</small>
        </div>
      </div>
    </div>
  );
}

export default function CertificateVerificationTable() {
  const [certs, setCerts] = useState(getStoredCerts);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fileObject, setFileObject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localList = getStoredCerts();
      const res = await certificateApi.list({ verification_status: statusFilter || undefined });
      const apiData = res?.data?.results ?? res?.data ?? [];
      
      let merged = [...localList];
      if (Array.isArray(apiData)) {
        apiData.forEach(item => {
          if (!merged.some(m => String(m.id) === String(item.id) || (m.student_id === item.student_id && (m.file === item.file || m.file === item.file_name)))) {
            merged.unshift({
              id: item.id || `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
              student_id: item.student_id || item.roll_number || "STU-101",
              file: item.file || item.file_name || "Certificate_Doc.pdf",
              file_url: item.file_url || "#",
              issue_date: item.issue_date || "2026-08-28",
              verification_status: (item.verification_status || item.status || "PENDING").toUpperCase()
            });
          }
        });
      }
      setCerts(merged);
      localStorage.setItem("stufac_certificates", JSON.stringify(merged));
    } catch (err) {
      console.warn("Using local certificates state fallback:", err);
      setCerts(getStoredCerts());
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  // Filter records dynamically
  const filteredCerts = certs.filter(c => {
    if (!statusFilter || statusFilter === "ALL") return true;
    return c.verification_status.toUpperCase() === statusFilter.toUpperCase();
  });

  // Action Handlers
  const handleVerify = async (id) => {
    setActioningId(id);
    try {
      await certificateApi.review(id, "VERIFY");
    } catch (e) {
      console.log("Updated locally");
    } finally {
      setActioningId(null);
    }

    setCerts(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, verification_status: "VERIFIED" } : c);
      localStorage.setItem("stufac_certificates", JSON.stringify(updated));
      return updated;
    });

    if (viewingCert && viewingCert.id === id) {
      setViewingCert(prev => ({ ...prev, verification_status: "VERIFIED" }));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:") || "Document invalid";
    if (!reason) return;
    setActioningId(id);
    try {
      await certificateApi.review(id, "REJECT", reason);
    } catch (e) {
      console.log("Updated locally");
    } finally {
      setActioningId(null);
    }

    setCerts(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, verification_status: "REJECTED" } : c);
      localStorage.setItem("stufac_certificates", JSON.stringify(updated));
      return updated;
    });

    if (viewingCert && viewingCert.id === id) {
      setViewingCert(prev => ({ ...prev, verification_status: "REJECTED" }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate record?")) return;
    setActioningId(id);
    try {
      await certificateApi.remove(id);
    } catch (e) {
      console.log("Deleted locally");
    } finally {
      setActioningId(null);
    }

    setCerts(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem("stufac_certificates", JSON.stringify(updated));
      return updated;
    });

    if (viewingCert && viewingCert.id === id) {
      setViewingCert(null);
    }
  };

  // Submit new certificate
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.student_id.trim()) {
      alert("Please enter a valid Student ID.");
      return;
    }

    setSubmitting(true);
    const fileNameToUse = fileObject ? fileObject.name : ((formData.file_name || "").trim() || "Uploaded_Certificate.pdf");

    const saveAndProceed = (fileUrlToUse) => {
      const newRecord = {
        id: `CERT-${Date.now().toString().slice(-4)}`,
        student_id: (formData.student_id || "").trim(),
        student_name: (formData.student_name || "").trim() || "Mr. Yash Mahesh Fokmare",
        cert_type: formData.cert_type || "CERTIFICATE OF INTERNSHIP",
        organization: (formData.organization || "").trim() || "PSK Technologies Private Limited",
        course_title: (formData.course_title || "").trim() || "React JS & Fullstack Development",
        department: (formData.department || "").trim() || "Development Department",
        duration: (formData.duration || "").trim() || "45-day internship from 5th Jan 2026 to 12th Mar 2026",
        file: fileNameToUse,
        file_url: fileUrlToUse,
        issue_date: formData.issue_date || new Date().toISOString().split("T")[0],
        verification_status: (formData.status || "PENDING").toUpperCase()
      };

      // 1. Immediately update Local State & LocalStorage
      setCerts(prev => {
        const updatedCerts = [newRecord, ...prev];
        try {
          localStorage.setItem("stufac_certificates", JSON.stringify(updatedCerts));
        } catch (err) {}
        return updatedCerts;
      });

      // 2. Non-blocking API sync
      Promise.race([
        certificateApi.create({
          student_id: newRecord.student_id,
          file_name: newRecord.file,
          issue_date: newRecord.issue_date,
          status: newRecord.verification_status
        }),
        new Promise((res) => setTimeout(() => res(null), 1000))
      ]).catch(() => {});

      // 3. Immediately close modal & reset form
      setSubmitting(false);
      setShowAddModal(false);
      setFormData(INITIAL_FORM);
      setFileObject(null);
    };

    if (fileObject) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveAndProceed(event.target.result);
      };
      reader.onerror = () => {
        saveAndProceed("#");
      };
      reader.readAsDataURL(fileObject);
    } else {
      saveAndProceed("#");
    }
  };

  const handleDownloadCert = async (c) => {
    const fileName = c.file || c.file_name || 'Academic_Certificate.pdf';
    
    // If c.file_url is a persistent data URL or remote http/https URL, download it directly
    if (c.file_url && c.file_url !== '#' && c.file_url !== '') {
      if (c.file_url.startsWith('data:') || c.file_url.startsWith('http://') || c.file_url.startsWith('https://')) {
        const a = document.createElement('a');
        a.href = c.file_url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      if (c.file_url.startsWith('blob:')) {
        try {
          const resp = await fetch(c.file_url);
          if (resp.ok) {
            const blob = await resp.blob();
            if (blob.size > 0) {
              const downloadUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
              return;
            }
          }
        } catch (err) {
          console.warn("Direct blob download failed, falling back to canvas PDF generation:", err);
        }
      }
    }

    const studentId = c.student_id || c.studentId || 'GH23412';
    const rawName = resolveStudentName(c);
    const formattedName = rawName.toLowerCase().startsWith('mr.') || rawName.toLowerCase().startsWith('ms.') ? rawName : `Mr. ${rawName}`;
    const orgName = c.organization || 'Microsoft';
    const certType = (c.cert_type || 'CERTIFICATE OF COMPLETION').toUpperCase();
    const courseTitle = c.course_title || c.file?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || 'Git & Github';
    const dept = c.department || 'Technical Certification Department';
    const duration = c.duration || 'professional course';
    const issueDate = c.issue_date || '2026-08-31';
    const status = (c.verification_status || c.status || 'PENDING').toUpperCase();

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1131;
    const ctx = canvas.getContext('2d');

    // 1. Subtle Ivory Linear Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1131);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#fafaf9');
    bgGrad.addColorStop(1, '#f5f5f4');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1131);

    // 2. Decorative Double Border Frame & Corner Ribbons
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

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 22px "Georgia", serif';
    ctx.fillText(`Student Roll / ID: ${studentId}`, 800, 390);

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
    ctx.fillText(`Issue Date: ${issueDate}   |   Verification ID: ${c.id || 'CERT-2e84bb'}`, 800, 620);

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

    // 7. Gold Official Verification Seal Stamp
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

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold">Certificates</h4>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select faculty-select-filter"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            className="btn btn-sm btn-primary fw-semibold px-3"
            onClick={() => setShowAddModal(true)}
          >
            + Add Certificate
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Main Table Layout Matching Organizations */}
      <div className="faculty-table-container">
        <table className="table table-hover faculty-table align-middle mb-0">
          <thead>
            <tr>
              <th className="fw-bold">Student Details</th>
              <th className="fw-bold">File</th>
              <th className="fw-bold">Issue Date</th>
              <th className="fw-bold">Status</th>
              <th className="text-end fw-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && certs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && filteredCerts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  No certificates found.
                </td>
              </tr>
            )}

            {filteredCerts.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold">
                  <div className="d-flex flex-column">
                    <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{resolveStudentName(c)}</span>
                    <small className="text-muted"><code className="px-1 py-0.5 rounded border" style={{ fontSize: "0.78rem" }}>{c.student_id}</code></small>
                  </div>
                </td>

                <td>
                  <button
                    className="btn btn-link p-0 fw-semibold text-decoration-none text-primary"
                    onClick={() => setViewingCert(c)}
                  >
                    {c.file}{" "}
                    <span className="small text-primary">↗</span>
                  </button>
                </td>

                <td className="text-muted small">{c.issue_date || "—"}</td>

                <td>
                  <span className={`badge ${STATUS_BADGE[c.verification_status] || "badge-closed"}`}>
                    {c.verification_status}
                  </span>
                </td>

                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-action-custom btn-outline-secondary"
                      onClick={() => setViewingCert(c)}
                    >
                      View
                    </button>

                    <button
                      className="btn btn-action-custom btn-outline-info"
                      onClick={() => handleDownloadCert(c)}
                    >
                      Download
                    </button>

                    <button
                      className="btn btn-action-custom btn-outline-success"
                      disabled={actioningId === c.id || c.verification_status === "VERIFIED"}
                      onClick={() => handleVerify(c.id)}
                    >
                      Verify
                    </button>

                    <button
                      className="btn btn-action-custom btn-outline-danger"
                      disabled={actioningId === c.id || c.verification_status === "REJECTED"}
                      onClick={() => handleReject(c.id)}
                    >
                      Reject
                    </button>

                    <button
                      className="btn btn-action-custom btn-outline-secondary"
                      disabled={actioningId === c.id}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Certificate Modal */}
      {showAddModal && (
        <div
          className="modal show d-block faculty-modal-backdrop"
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content faculty-modal-content">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">+ Add Certificate</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Student ID *</label>
                      <input
                        type="text"
                        className="form-control faculty-search-input"
                        required
                        placeholder="e.g. GH23412 or 2026CS101"
                        value={formData.student_id}
                        onChange={(e) => {
                          const idVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            student_id: idVal,
                            student_name: STUDENT_DIRECTORY[idVal.trim()] || prev.student_name
                          }));
                        }}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Student Full Name *</label>
                      <input
                        type="text"
                        className="form-control faculty-search-input"
                        required
                        placeholder="e.g. Mr. Yash Mahesh Fokmare"
                        value={formData.student_name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, student_name: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Certificate Type *</label>
                      <select
                        className="form-select faculty-select-filter"
                        value={formData.cert_type}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cert_type: e.target.value }))
                        }
                      >
                        <option value="CERTIFICATE OF INTERNSHIP">CERTIFICATE OF INTERNSHIP</option>
                        <option value="CERTIFICATE OF PARTICIPATION">CERTIFICATE OF PARTICIPATION</option>
                        <option value="CERTIFICATE OF ACHIEVEMENT">CERTIFICATE OF ACHIEVEMENT</option>
                        <option value="CERTIFICATE OF COMPLETION">CERTIFICATE OF COMPLETION</option>
                        <option value="CERTIFICATE OF SPECIALIZATION">CERTIFICATE OF SPECIALIZATION</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Organization / Issuer *</label>
                      <input
                        type="text"
                        className="form-control faculty-search-input"
                        required
                        placeholder="e.g. PSK Technologies Pvt. Ltd."
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, organization: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Course / Technology Title *</label>
                      <input
                        type="text"
                        className="form-control faculty-search-input"
                        required
                        placeholder="e.g. React JS & Fullstack Development"
                        value={formData.course_title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, course_title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Department *</label>
                      <input
                        type="text"
                        className="form-control faculty-search-input"
                        placeholder="e.g. Development Department"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, department: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Internship / Event Duration *</label>
                    <input
                      type="text"
                      className="form-control faculty-search-input"
                      placeholder="e.g. 45-day internship from 5th Jan 2026 to 12th Mar 2026"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Certificate File *</label>
                    <input
                      type="file"
                      className="form-control faculty-search-input mb-2"
                      accept=".pdf,.png,.jpg,.jpeg,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFileObject(file);
                          setFormData((prev) => ({ ...prev, file_name: file.name }));
                        }
                      }}
                    />
                    <input
                      type="text"
                      className="form-control faculty-search-input"
                      placeholder="Or enter filename (e.g. Internship_Cert.pdf)"
                      value={formData.file_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, file_name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Issue Date *</label>
                      <input
                        type="date"
                        className="form-control faculty-search-input"
                        required
                        value={formData.issue_date}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, issue_date: e.target.value }))
                        }
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold">Status *</label>
                      <select
                        className="form-select faculty-select-filter"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Save Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* Viewing Certificate Document Modal */}
      {viewingCert && (
        <div
          className="modal show d-block faculty-modal-backdrop"
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content faculty-modal-content">
              <div className="modal-header border-bottom border-secondary py-2.5">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <span>📜</span> {viewingCert.file || "Certificate Document"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingCert(null)}
                ></button>
              </div>
              <div className="modal-body p-3">
                <CertificateDocumentPreview cert={viewingCert} />
              </div>
              <div className="modal-footer border-top border-secondary justify-content-between py-2">
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-action-custom btn-outline-info me-2 fw-semibold"
                    onClick={() => handleDownloadCert(viewingCert)}
                  >
                    📥 Download Certificate / PDF
                  </button>
                  {viewingCert.verification_status !== "VERIFIED" && (
                    <button
                      className="btn btn-sm btn-action-custom btn-outline-success me-2 fw-semibold"
                      onClick={() => handleVerify(viewingCert.id)}
                    >
                      ✓ Verify
                    </button>
                  )}
                  {viewingCert.verification_status !== "REJECTED" && (
                    <button
                      className="btn btn-sm btn-action-custom btn-outline-danger me-2 fw-semibold"
                      onClick={() => handleReject(viewingCert.id)}
                    >
                      ✕ Reject
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3"
                  onClick={() => setViewingCert(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
