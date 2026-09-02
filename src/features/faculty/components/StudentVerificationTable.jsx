/**
 * SAIOTAF - Faculty & Moderator Module
 * StudentVerificationTable  (FR-FAC-02)
 *
 * Lists pending student registrations and lets faculty approve / reject /
 * flag each one against institutional roll-number data. Optimistic-ish UX:
 * disables row actions while a request is in-flight, rolls back on error.
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

export default function StudentVerificationTable() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
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
      setRecords(data.results ?? data);
    } catch (err) {
      setError("Failed to load student verification requests. Please retry.");
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
      await fetchRecords();
    } catch (err) {
      setError(
        err.response?.data?.reason?.[0] ||
          err.response?.data?.detail ||
          "Action failed. Please try again."
      );
    } finally {
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

  return (
    <div className="student-verification-table">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold">Student Verification</h4>
        <div className="d-flex gap-2">
          <input
            type="search"
            className="form-control faculty-search-input"
            placeholder="Search name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <select
            className="form-select faculty-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 160 }}
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
        <table className="table table-hover align-middle faculty-table">
          <thead>
            <tr>
              <th className="text-center">Roll Number</th>
              <th className="text-center">Department</th>
              <th className="text-center">Year</th>
              <th className="text-center">Email</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  No student verification requests found.
                </td>
              </tr>
            )}

            {!loading &&
              records.map((r) => (
                <tr key={r.id}>
                  <td className="text-center">
                    <code>{r.roll_number}</code>
                  </td>
                  <td className="text-center fw-bold">{formatDeptShort(r.department)}</td>
                  <td className="text-center">{r.year_of_study}</td>
                  <td className="text-center text-muted">{r.email}</td>
                  <td className="text-center">
                    <span className={`badge ${STATUS_BADGE[r.status] || "badge-closed"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center" role="group" style={{ gap: "12px" }}>
                      <button
                        className="btn btn-action-custom btn-outline-success"
                        disabled={actioningId === r.id || r.status === "APPROVED"}
                        onClick={() => handleApprove(r.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-action-custom btn-outline-danger"
                        disabled={actioningId === r.id || r.status === "REJECTED"}
                        onClick={() => openReasonModal(r.id, "REJECT")}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-action-custom btn-outline-secondary"
                        disabled={actioningId === r.id || r.status === "FLAGGED"}
                        onClick={() => openReasonModal(r.id, "FLAG")}
                      >
                        Flag
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Reason modal for Reject / Flag actions */}
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
                  {reasonModal.action === "REJECT" ? "Reject" : "Flag"} Student Registration
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
