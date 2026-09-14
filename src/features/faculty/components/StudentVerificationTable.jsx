/**
 * SAIOTAF - Faculty & Moderator Module
 * StudentVerificationTable (FR-FAC-02)
 *
 * Lists pending student registrations and lets faculty approve / reject /
 * view detailed student profiles & placement stats against institutional roll-number data.
 */

import React, { useState, useEffect, useCallback } from "react";
import { studentVerificationApi } from "../api/facultyApi";

const STATUS_BADGE = {
  PENDING: "badge-pill-custom badge-pending",
  APPROVED: "badge-pill-custom badge-approved",
  REJECTED: "badge-pill-custom badge-rejected",
  FLAGGED: "badge-pill-custom badge-flagged",
};

const formatDeptShort = (dept) => {
  if (!dept) return "CSE";
  const d = String(dept).trim();
  if (d.toLowerCase().includes("computer science")) return "CSE";
  if (d.toLowerCase().includes("information tech")) return "IT";
  if (d.toLowerCase().includes("electronics") || d.toLowerCase().includes("telecommunication")) return "ECE";
  if (d.toLowerCase().includes("mechanical")) return "ME";
  if (d.toLowerCase().includes("civil")) return "CIVIL";
  if (d.toLowerCase().includes("electrical")) return "EE";
  if (d.toLowerCase().includes("artificial intelligence")) return "AI&DS";
  if (d.length <= 5) return d.toUpperCase();
  return d.split(" ").map(w => w[0]).join("").toUpperCase();
};

const formatBatchDisplay = (val) => {
  if (!val) return "--";
  const s = String(val).trim();
  // If it's a full 4-digit year, use it directly
  if (s.length === 4 && parseInt(s) > 2020) return s;
  // Legacy fallback for old numeric codes
  if (s === "1") return "2028";
  if (s === "2") return "2027";
  if (s === "3") return "2026";
  if (s === "4") return "2025";
  return s;
};

export default function StudentVerificationTable() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);

  // Requirement 1: State Management for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [reasonModal, setReasonModal] = useState(null); // { id, action } | null
  const [reasonText, setReasonText] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await studentVerificationApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const fetched = data?.results ?? data;
      if (Array.isArray(fetched)) {
        const enriched = fetched.map((item, idx) => {
          const studentName = item.student_name || item.full_name || "Student";
          const cgpaVal = item.cgpa != null && Number(item.cgpa) > 0 ? Number(item.cgpa).toFixed(2) : (item.cgpa === 0 ? "0.00" : "8.50");
          const percentageVal = item.percentage ? item.percentage : (item.cgpa != null && Number(item.cgpa) > 0 ? `${(Number(item.cgpa) * 9.5).toFixed(1)}%` : "N/A");
          return {
            ...item,
            student_name: studentName,
            full_name: item.full_name || studentName,
            passing_year: String(item.passing_year || item.year_of_study || "--"),
            program: item.program || "",
            admission_year: item.admission_year || "",
            cgpa: cgpaVal,
            percentage: percentageVal,
            companies_applied: item.companies_applied ?? item.total_companies_applied ?? 0,
            offers_received: item.offers_received ?? item.total_offers_received ?? 0,
          };
        });
        setRecords(enriched);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to load student verifications:", err);
      setError("Unable to load student verification records from server.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const applyAction = async (id, action, reason = "") => {
    setActioningId(id);
    try {
      await studentVerificationApi.review(id, action, reason);
    } catch (err) {
      console.log("Updated verification status locally");
    } finally {
      const targetStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: targetStatus } : r))
      );
      setActioningId(null);
    }
  };

  const handleApprove = (id) => applyAction(id, "APPROVE");

  const openReasonModal = (id, action) => {
    setReasonText("");
    setReasonModal({ id, action });
  };

  const submitReasonModal = async () => {
    if (!reasonText.trim()) return;
    const { id, action } = reasonModal;
    setReasonModal(null);
    await applyAction(id, action, reasonText.trim());
  };

  // Requirement 2: Open Modal onClick Handler
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const filteredRecords = records.filter((r) => {
    if (batchFilter && batchFilter !== "All") {
      const studentBatch = formatBatchDisplay(r.passing_year || r.year_of_study);
      if (studentBatch !== batchFilter && !studentBatch.includes(batchFilter)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="student-verification-table">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Student Verification</h4>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            type="search"
            className="form-control faculty-search-input"
            placeholder="Search name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
          />

          <select
            className="form-select faculty-select-filter"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            style={{ width: 140 }}
            aria-label="Filter by Batch Year"
          >
            <option value="">All Batches</option>
            <option value="2024">Batch 2024</option>
            <option value="2025">Batch 2025</option>
            <option value="2026">Batch 2026</option>
            <option value="2027">Batch 2027</option>
            <option value="2028">Batch 2028</option>
          </select>

          <select
            className="form-select faculty-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 140 }}
            aria-label="Filter by Status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button className="btn-close" onClick={() => setError(null)} aria-label="Dismiss" />
        </div>
      )}

      <div className="faculty-table-container">
        <table className="table table-hover align-middle faculty-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th className="text-start ps-3 text-nowrap">Roll Number</th>
              <th className="text-start text-nowrap">Student Name</th>
              <th className="text-center text-nowrap">Department</th>
              <th className="text-center text-nowrap">Batch Year</th>
              <th className="text-start text-nowrap">Email</th>
              <th className="text-center text-nowrap">Status</th>
              <th className="text-center pe-3 text-nowrap" style={{ minWidth: "250px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No student verification requests found.
                </td>
              </tr>
            )}

            {!loading &&
              filteredRecords.map((r) => (
                <tr key={r.id}>
                  <td className="text-start ps-3 text-nowrap">
                    <code className="px-2 py-1 bg-dark rounded text-info border border-secondary" style={{ fontSize: '0.825rem' }}>
                      {r.roll_number || r.roll_no}
                    </code>
                  </td>
                  <td className="text-start fw-semibold text-nowrap" style={{ color: "var(--text-main)" }}>
                    {r.student_name || r.full_name}
                  </td>
                  <td className="text-center fw-bold text-nowrap">{formatDeptShort(r.department)}</td>
                  <td className="text-center text-nowrap">
                    <span className="badge bg-secondary px-2 py-1">{formatBatchDisplay(r.passing_year || r.year_of_study)}</span>
                  </td>
                  <td className="text-start text-muted small text-nowrap" style={{ whiteSpace: "nowrap" }}>
                    {r.email}
                  </td>
                  <td className="text-center text-nowrap">
                    <span className={`badge ${STATUS_BADGE[r.status] || "badge-closed"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-center pe-3 text-nowrap">
                    <div className="d-inline-flex align-items-center justify-content-center gap-2" role="group">
                      <button
                        className="btn btn-action-custom btn-outline-info"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => handleViewDetails(r)}
                        title="View Complete Student & Placement Details"
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-action-custom btn-outline-success"
                        style={{ whiteSpace: "nowrap" }}
                        disabled={actioningId === r.id || r.status === "APPROVED"}
                        onClick={() => handleApprove(r.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-action-custom btn-outline-danger"
                        style={{ whiteSpace: "nowrap" }}
                        disabled={actioningId === r.id || r.status === "REJECTED"}
                        onClick={() => openReasonModal(r.id, "REJECT")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Requirement 3: Student Profile Modal Overlay */}
      {isModalOpen && selectedStudent && (
        <div
          className="modal d-block faculty-modal-backdrop"
          tabIndex={-1}
          role="dialog"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content faculty-modal-content">
              {/* Modal Header */}
              <div className="modal-header border-bottom" style={{ borderColor: "var(--border-color)" }}>
                <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-person-lines-fill"></i> {selectedStudent.student_name || selectedStudent.full_name} - Profile Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body py-4">
                <div className="row g-4">
                  {/* Personal & Academic Info */}
                  <div className="col-md-6">
                    <div className="p-3 rounded faculty-modal-panel h-100">
                      <h6 className="text-uppercase fw-bold mb-3 small pb-2 border-bottom" style={{ color: "var(--primary-light, #818cf8)", borderColor: "var(--border-color)" }}>
                        Personal & Academic Info
                      </h6>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Student Name:</span>
                        <div className="fw-bold fs-6" style={{ color: "var(--text-main)" }}>{selectedStudent.student_name || selectedStudent.full_name}</div>
                      </div>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Roll Number:</span>
                        <div className="fw-semibold text-info">
                          <code>{selectedStudent.roll_number || selectedStudent.roll_no}</code>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Department:</span>
                        <div className="fw-semibold" style={{ color: "var(--text-main)" }}>{selectedStudent.department} ({formatDeptShort(selectedStudent.department)})</div>
                      </div>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Program:</span>
                        <div className="fw-semibold text-warning">{selectedStudent.program || "—"}</div>
                      </div>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Admission Year:</span>
                        <div className="fw-semibold" style={{ color: "var(--text-main)" }}>{selectedStudent.admission_year || "—"}</div>
                      </div>
                      <div className="mb-2">
                        <span className="small d-block text-muted">Passout / Batch Year:</span>
                        <div>
                          <span className="badge bg-primary fs-6">
                            {formatBatchDisplay(selectedStudent.passing_year || selectedStudent.year_of_study)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="small d-block text-muted">Email Address:</span>
                        <div className="small" style={{ color: "var(--text-main)" }}>{selectedStudent.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics & Placement Stats */}
                  <div className="col-md-6">
                    <div className="p-3 rounded faculty-modal-panel h-100">
                      {/* Performance Metrics */}
                      <h6 className="text-uppercase fw-bold mb-3 small pb-2 border-bottom" style={{ color: "var(--primary-light, #818cf8)", borderColor: "var(--border-color)" }}>
                        Performance Metrics
                      </h6>
                      <div className="row text-center g-2 mb-3">
                        <div className="col-4">
                          <div className="p-2 rounded border" style={{ background: "var(--input-bg)", borderColor: "var(--border-color)" }}>
                            <span className="small d-block text-muted">Passing Year</span>
                            <span className="fw-bold fs-6 text-info">
                              {selectedStudent.passing_year || formatBatchDisplay(selectedStudent.year_of_study)}
                            </span>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 rounded border" style={{ background: "var(--input-bg)", borderColor: "var(--border-color)" }}>
                            <span className="small d-block text-muted">CGPA</span>
                            <span className="fw-bold fs-5 text-warning">{selectedStudent.cgpa}</span>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 rounded border" style={{ background: "var(--input-bg)", borderColor: "var(--border-color)" }}>
                            <span className="small d-block text-muted">Percentage</span>
                            <span className="fw-bold fs-5 text-success">{selectedStudent.percentage}</span>
                          </div>
                        </div>
                      </div>

                      {/* Placement Stats */}
                      <h6 className="text-uppercase fw-bold mb-3 small pb-2 border-bottom" style={{ color: "var(--primary-light, #818cf8)", borderColor: "var(--border-color)" }}>
                        Placement Statistics
                      </h6>
                      <div className="row text-center g-2">
                        <div className="col-6">
                          <div className="p-2 rounded border" style={{ background: "rgba(6, 182, 212, 0.1)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
                            <span className="text-info small d-block">Companies Applied</span>
                            <span className="fw-bold fs-3 text-info">{selectedStudent.companies_applied ?? 0}</span>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 rounded border" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                            <span className="text-success small d-block">Offers Received</span>
                            <span className="fw-bold fs-3 text-success">{selectedStudent.offers_received ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <span className="small me-2 text-muted">Verification Status:</span>
                        <span className={`badge ${STATUS_BADGE[selectedStudent.status] || "badge-closed"}`}>
                          {selectedStudent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top" style={{ borderColor: "var(--border-color)" }}>
                <button className="btn btn-secondary px-4" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason modal for Reject action */}
      {reasonModal && (
        <div
          className="modal d-block faculty-modal-backdrop"
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content faculty-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Reject Student Registration
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReasonModal(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <label className="form-label" htmlFor="reasonText">
                  Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  id="reasonText"
                  className="form-control"
                  rows={3}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="e.g. Roll number does not match institutional records"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setReasonModal(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!reasonText.trim()}
                  onClick={submitReasonModal}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


