/**
 * SAIOTAF - Faculty & Moderator Module
 * OpportunityManager  (FR-FAC-03)
 * View/Edit/Delete/Approve opportunities + bulk CSV import + embeds the
 * UploadOpportunityForm for creating new postings.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { opportunityApi } from "../api/facultyApi";
import UploadOpportunityForm from "./UploadOpportunityForm";

const STATUS_BADGE = {
  DRAFT: "bg-light text-dark",
  PENDING_APPROVAL: "bg-warning text-dark",
  APPROVED: "bg-success",
  REJECTED: "bg-danger",
  CLOSED: "bg-secondary",
  EXPIRED: "bg-dark",
};

export default function OpportunityManager() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await opportunityApi.list({ status: statusFilter || undefined });
      setOpportunities(data.results ?? data);
    } catch {
      setError("Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleApproval = async (id, action) => {
    let rejectionReason = "";
    if (action === "REJECT") {
      rejectionReason = window.prompt("Reason for rejection:") || "";
      if (!rejectionReason.trim()) return;
    }
    try {
      await opportunityApi.approval(id, action, rejectionReason);
      await fetchOpportunities();
    } catch {
      setError("Approval action failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this opportunity permanently?")) return;
    try {
      await opportunityApi.remove(id);
      await fetchOpportunities();
    } catch {
      setError("Delete failed.");
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const { data } = await opportunityApi.bulkImport(file);
      setImportErrors(data.errors || []);
      await fetchOpportunities();
    } catch (err) {
      setError(err.response?.data?.detail || "Bulk import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Opportunities</h4>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 190 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>

          <label className="btn btn-sm btn-outline-secondary mb-0">
            {importing ? "Importing…" : "Bulk Import CSV"}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              hidden
              disabled={importing}
            />
          </label>

          <button className="btn btn-sm btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? "Close Form" : "+ New Opportunity"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {importErrors.length > 0 && (
        <div className="alert alert-warning">
          <strong>{importErrors.length} row(s) failed to import:</strong>
          <ul className="mb-0 small">
            {importErrors.slice(0, 5).map((e, i) => (
              <li key={i}>
                Row {e.row}: {JSON.stringify(e.error)}
              </li>
            ))}
            {importErrors.length > 5 && <li>…and {importErrors.length - 5} more</li>}
          </ul>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-4">
          <UploadOpportunityForm
            onSuccess={() => {
              setShowCreateForm(false);
              fetchOpportunities();
            }}
          />
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover bg-white align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Deadline</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">Loading…</td>
              </tr>
            )}
            {!loading && opportunities.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">No opportunities found.</td>
              </tr>
            )}
            {!loading &&
              opportunities.map((op) => (
                <tr key={op.id}>
                  <td>{op.title}</td>
                  <td>{op.organization_name}</td>
                  <td>{op.opportunity_type}</td>
                  <td>{op.work_mode}</td>
                  <td>{new Date(op.application_deadline).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[op.status]}`}>{op.status}</span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {op.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleApproval(op.id, "APPROVE")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleApproval(op.id, "REJECT")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button className="btn btn-outline-dark" onClick={() => handleDelete(op.id)}>
                        Delete
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
