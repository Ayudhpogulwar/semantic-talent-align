/**
 * SAIOTAF - Super Admin Module
 * AdminOverrides.jsx (Feature 3: System-Wide Override Controls)
 */

import React, { useState, useEffect } from "react";
import { adminApi } from "../api/adminApi";
import { ShieldAlert, CheckCircle, XCircle, ArrowRightLeft, AlertCircle } from "lucide-react";

export default function AdminOverrides() {
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOverrides = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getOverrides();
        if (isMounted) setOverrides(data);
      } catch (err) {
        if (isMounted) setError("Failed to load pending system override requests.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOverrides();
    return () => { isMounted = false; };
  }, []);

  const handleOverrideAction = async (overrideId, action) => {
    setActioningId(overrideId);
    try {
      await adminApi.submitOverride(overrideId, action);
      setOverrides((prev) => prev.filter((o) => o.id !== overrideId));
      setToastMessage(`Override action '${action}' successfully committed.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setError("Failed to execute override decision.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="admin-overrides animate-fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: "var(--text-main)" }}>System-Wide Override Controls</h4>
          <p className="small mb-0" style={{ color: "var(--text-muted)" }}>
            Bypass Faculty / Moderator decisions & enforce administrative overrides
          </p>
        </div>
        <span className="badge px-3 py-2 fw-semibold" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "20px" }}>
          <ShieldAlert size={14} className="me-1" /> Super Admin Special Powers Active
        </span>
      </div>

      {toastMessage && (
        <div className="alert alert-success py-2 mb-3 d-flex align-items-center gap-2">
          <CheckCircle size={16} /> {toastMessage}
        </div>
      )}

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      <div className="row g-4">
        {/* Override Queue */}
        <div className="col-md-8">
          <div
            className="p-4 rounded-3 border shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text-main)" }}>
              <ArrowRightLeft size={20} className="text-primary" /> Active Override Queue
            </h5>

            {loading && (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status" />
                Loading override queue…
              </div>
            )}

            {!loading && overrides.length === 0 && (
              <div className="text-center py-4 text-muted border border-dashed rounded" style={{ borderColor: "var(--border-color)" }}>
                No active override requests or flagged exceptions found. System decision logs are up to date.
              </div>
            )}

            {!loading &&
              overrides.map((item) => (
                <div
                  key={item.id}
                  className="p-3 mb-3 rounded border"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border-color)" }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-primary me-2">{item.target_type}</span>
                      <strong style={{ color: "var(--text-main)" }}>{item.target_name}</strong>
                      <span className="small ms-2" style={{ color: "var(--text-muted)" }}>({item.target_id})</span>
                    </div>
                    <span className="badge px-2.5 py-1" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                      {item.current_status}
                    </span>
                  </div>

                  <p className="small mb-2" style={{ color: "var(--text-muted)" }}>
                    <strong>Issue / Flag Reason:</strong> {item.issue}
                  </p>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2" style={{ borderColor: "var(--border-color)" }}>
                    <span className="small text-info">
                      Recommended Action: <strong>{item.recommended_action}</strong>
                    </span>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                        disabled={actioningId === item.id}
                        onClick={() => handleOverrideAction(item.id, "FORCE_APPROVE")}
                      >
                        <CheckCircle size={14} /> Force Approve
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        disabled={actioningId === item.id}
                        onClick={() => handleOverrideAction(item.id, "FORCE_REJECT")}
                      >
                        <XCircle size={14} /> Force Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Manual Override Form */}
        <div className="col-md-4">
          <div
            className="p-4 rounded-3 border shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text-main)" }}>
              <AlertCircle size={20} className="text-warning" /> Direct Manual Bypass
            </h5>
            <p className="small mb-3" style={{ color: "var(--text-muted)" }}>
              Manually trigger an immediate status override for any Student ID or Opportunity ID without going through the Moderator review queue.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const entityId = form.entityId.value.trim();
                const overrideState = form.overrideState.value;
                if (!entityId) return;
                handleOverrideAction(entityId, overrideState);
                form.reset();
              }}
            >
              <div className="mb-3">
                <label className="form-label small" style={{ color: "var(--text-muted)" }}>Entity ID (Student Roll / Org ID / Opp ID)</label>
                <input type="text" name="entityId" className="form-control faculty-search-input" placeholder="e.g. 2023CS3920, SVR-20273219, ORG-0bd8" required />
              </div>
              <div className="mb-3">
                <label className="form-label small" style={{ color: "var(--text-muted)" }}>Target Override State</label>
                <select name="overrideState" className="form-select faculty-select-filter">
                  <option value="FORCE_APPROVE">FORCE_APPROVE (Verify / Approve)</option>
                  <option value="FORCE_REJECT">FORCE_REJECT (Reject / Flag)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-warning w-100 fw-semibold text-dark">
                Execute Super Admin Override
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
