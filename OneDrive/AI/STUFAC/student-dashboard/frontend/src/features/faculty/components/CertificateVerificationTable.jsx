/**
 * SAIOTAF - Faculty & Moderator Module
 * CertificateVerificationTable  (FR-FAC-05)
 */

import React, { useState, useEffect, useCallback } from "react";
import { certificateApi } from "../api/facultyApi";

const STATUS_BADGE = {
  PENDING: "bg-warning text-dark",
  VERIFIED: "bg-success",
  REJECTED: "bg-danger",
};

export default function CertificateVerificationTable() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.list({ verification_status: statusFilter || undefined });
      setCerts(data.results ?? data);
    } catch {
      setError("Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const handleReview = async (id, action) => {
    let rejectionReason = "";
    if (action === "REJECT") {
      rejectionReason = window.prompt("Reason for rejection:") || "";
      if (!rejectionReason.trim()) return;
    }
    setActioningId(id);
    try {
      await certificateApi.review(id, action, rejectionReason);
      await fetchCerts();
    } catch {
      setError("Review action failed.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Certificate Verification</h4>
        <select
          className="form-select form-select-sm"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover bg-white align-middle">
          <thead className="table-light">
            <tr>
              <th>Student ID</th>
              <th>File</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">Loading…</td>
              </tr>
            )}
            {!loading && certs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">No certificates found.</td>
              </tr>
            )}
            {!loading &&
              certs.map((c) => (
                <tr key={c.id}>
                  <td>
                    <code>{c.student_id}</code>
                  </td>
                  <td>
                    <a href={c.file_url} target="_blank" rel="noreferrer">
                      View file
                    </a>
                  </td>
                  <td>{c.issue_date || "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[c.verification_status]}`}>
                      {c.verification_status}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        disabled={actioningId === c.id || c.verification_status === "VERIFIED"}
                        onClick={() => handleReview(c.id, "VERIFY")}
                      >
                        Verify
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        disabled={actioningId === c.id || c.verification_status === "REJECTED"}
                        onClick={() => handleReview(c.id, "REJECT")}
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
    </div>
  );
}
