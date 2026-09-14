/**
 * SAIOTAF - Faculty & Moderator Module
 * CertificateVerificationTable  (FR-FAC-05)
 *
 * Persisted Certificate Verification Dashboard Page with Dual-Layer Database & LocalStorage persistence.
 */

import React, { useState, useEffect, useCallback } from "react";
import { certificateApi } from "../api/facultyApi";

const STATUS_BADGE = {
  PENDING: "badge-pill-custom badge-pending",
  VERIFIED: "badge-pill-custom badge-verified",
  REJECTED: "badge-pill-custom badge-rejected",
};

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

const defaultInitialCerts = [];

const getStoredCerts = () => {
  try {
    const stored = localStorage.getItem("stufac_certificates");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return defaultInitialCerts;
};

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
    const fileUrlToUse = fileObject ? URL.createObjectURL(fileObject) : "#";
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

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Certificates</h4>

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
              <th className="fw-bold">Student ID</th>
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
                  <code className="px-2 py-1 rounded border">{c.student_id}</code>
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
                      onClick={() => {
                        const fileName = c.file || c.file_name || 'Academic_Certificate.pdf';
                        if (c.file_url && c.file_url !== '#' && c.file_url !== '') {
                          const a = document.createElement('a');
                          a.href = c.file_url;
                          a.download = fileName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          return;
                        }

                        const studentId = c.student_id || 'GH23412';
                        const rawName = c.student_name || c.name || (c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : 'Yash Mahesh Fokmare');
                        const formattedName = rawName.toLowerCase().startsWith('mr.') || rawName.toLowerCase().startsWith('ms.') ? rawName : `Mr. ${rawName}`;
                        const orgName = c.organization || 'Microsoft';
                        const certType = (c.cert_type || 'CERTIFICATE OF COMPLETION').toUpperCase();
                        const courseTitle = c.course_title || c.file?.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || 'Git & Github';
                        const dept = c.department || 'Technical Certification Department';
                        const duration = c.duration || 'professional course';
                        const issueDate = c.issue_date || '2026-08-31';

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
                        ctx.roundRect(300, 470, 1000, 90, 16);
                        ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#4338ca';
                        ctx.font = 'bold 36px "Helvetica Neue", sans-serif';
                        ctx.fillText(courseTitle, 800, 528);

                        // 6. Verification Status & Details
                        ctx.fillStyle = '#475569';
                        ctx.font = '20px "Helvetica Neue", sans-serif';
                        ctx.fillText(`Issue Date: ${issueDate}   |   Verification ID: ${c.id || 'CERT-2e84bb'}`, 800, 620);

                        ctx.fillStyle = status === 'VERIFIED' ? '#059669' : '#d97706';
                        ctx.beginPath();
                        ctx.roundRect(620, 660, 360, 50, 25);
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

                        const titleText = courseTitle.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
                        const image = canvas.toDataURL('image/png', 1.0);
                        const a = document.createElement('a');
                        a.href = image;
                        a.download = `${formattedName.replace(/[^a-zA-Z0-9]/g, '_')}_${titleText.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
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
                        placeholder="e.g. GH23412 or STU-101"
                        value={formData.student_id}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, student_id: e.target.value }))
                        }
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
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">
                  📄 {viewingCert.file}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingCert(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-3 g-2 p-3 rounded border" style={{ background: "var(--input-bg)" }}>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Student ID</small>
                    <span className="fw-bold">{viewingCert.student_id}</span>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Issue Date</small>
                    <span>{viewingCert.issue_date}</span>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Status</small>
                    <span className={`badge ${STATUS_BADGE[viewingCert.verification_status] || 'badge-closed'}`}>
                      {viewingCert.verification_status}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded text-center my-3 border" style={{ background: "var(--bg-card-subtle)" }}>
                  <div className="fs-1 mb-2">📜</div>
                  <h5 className="fw-bold" style={{ color: "var(--text-main)" }}>ACADEMIC & CREDENTIAL CERTIFICATE</h5>
                  <p className="text-muted small mb-3">
                    Verified Institutional Document for Student <strong>{viewingCert.student_id}</strong>
                  </p>
                  <span className="badge badge-cyan p-2">{viewingCert.file}</span>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary justify-content-between">
                <div>
                  {viewingCert.verification_status !== "VERIFIED" && (
                    <button
                      className="btn btn-sm btn-action-custom btn-outline-success me-2 fw-semibold"
                      onClick={() => handleVerify(viewingCert.id)}
                    >
                      Verify
                    </button>
                  )}
                  {viewingCert.verification_status !== "REJECTED" && (
                    <button
                      className="btn btn-sm btn-action-custom btn-outline-danger me-2 fw-semibold"
                      onClick={() => handleReject(viewingCert.id)}
                    >
                      Reject
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
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
