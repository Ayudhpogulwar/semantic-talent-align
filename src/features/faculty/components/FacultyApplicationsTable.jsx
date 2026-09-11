import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Search, FileText } from "lucide-react";

const STATUS_PILL_STYLE = {
  "Applied": { background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" },
  "Under Review": { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  "Shortlisted": { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
  "Interview": { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" },
  "Selected": { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }
};

export default function FacultyApplicationsTable() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewingApp, setViewingApp] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    const updatedNotes = `Status updated to ${newStatus} by Faculty.`;
    setApplications(prev => prev.map(a => (String(a.id) === String(appId) || String(a.application_id) === String(appId)) ? { ...a, status: newStatus, notes: updatedNotes } : a));

    try {
      await fetch(`http://127.0.0.1:8000/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: updatedNotes })
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  const handleDelete = (appId) => {
    if (!window.confirm("Delete this application record?")) return;
    setApplications(prev => prev.filter(a => String(a.id) !== String(appId) && String(a.application_id) !== String(appId)));
  };

  const filteredApps = applications.filter(a => {
    const matchesSearch = search === "" || 
      (a.opportunity_title && a.opportunity_title.toLowerCase().includes(search.toLowerCase())) ||
      (a.organization && a.organization.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="student-verification-table">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Applications Review</h4>
        <div className="d-flex gap-2">
          <input
            type="search"
            className="form-control faculty-search-input"
            placeholder="Search title, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240, color: "var(--text-main)" }}
          />
          <select
            className="form-select faculty-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 150, color: "var(--text-main)" }}
          >
            <option value="All" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>All Statuses</option>
            <option value="Applied" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Applied</option>
            <option value="Under Review" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Under Review</option>
            <option value="Shortlisted" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Shortlisted</option>
            <option value="Interview" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Interview</option>
            <option value="Selected" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Selected</option>
          </select>
        </div>
      </div>

      <div className="faculty-table-container">
        <table className="table table-hover align-middle faculty-table mb-0">
          <thead>
            <tr>
              <th className="text-center fw-bold">APP ID</th>
              <th className="text-center fw-bold">OPPORTUNITY</th>
              <th className="text-center fw-bold">ORGANIZATION</th>
              <th className="text-center fw-bold">APPLIED DATE</th>
              <th className="text-center fw-bold">STATUS</th>
              <th className="text-center fw-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-4 text-muted">Loading applications…</td></tr>
            )}
            {!loading && filteredApps.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-muted">No applications found. Students can apply from the Student Dashboard.</td></tr>
            )}
            {!loading && filteredApps.map(a => {
              const currentStatus = a.status || "Applied";
              const pillStyle = STATUS_PILL_STYLE[currentStatus] || STATUS_PILL_STYLE["Applied"];
              return (
                <tr key={a.id || a.application_id}>
                  <td className="text-center fw-semibold">
                    <code className="px-2 py-1 rounded border">{a.id || a.application_id}</code>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-link p-0 fw-semibold text-decoration-none text-primary"
                      onClick={() => setViewingApp(a)}
                    >
                      {a.opportunity_title}{" "}
                      <span className="small text-primary">↗</span>
                    </button>
                  </td>
                  <td className="text-center">{a.organization}</td>
                  <td className="text-center text-muted small">{a.applied_date}</td>
                  <td className="text-center">
                    <select
                      className="form-select fw-bold mx-auto"
                      style={{
                        cursor: 'pointer',
                        borderRadius: '20px',
                        padding: '4px 28px 4px 12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        width: 'fit-content',
                        minWidth: '135px',
                        boxShadow: 'none',
                        ...pillStyle
                      }}
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(a.id || a.application_id, e.target.value)}
                    >
                      <option value="Applied" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Applied</option>
                      <option value="Under Review" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Under Review</option>
                      <option value="Shortlisted" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Shortlisted</option>
                      <option value="Interview" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Interview</option>
                      <option value="Selected" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Selected</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-action-custom btn-outline-secondary"
                      onClick={() => handleDelete(a.id || a.application_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Viewing Application Details Modal */}
      {viewingApp && (
        <div className="modal show d-block faculty-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content faculty-modal-content">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">
                  💼 Application: {viewingApp.opportunity_title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingApp(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-3 g-2 p-3 rounded border" style={{ background: "var(--input-bg)" }}>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Application ID</small>
                    <span className="fw-bold">{viewingApp.id || viewingApp.application_id}</span>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Organization</small>
                    <span>{viewingApp.organization}</span>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block fw-bold uppercase">Applied Date</small>
                    <span>{viewingApp.applied_date}</span>
                  </div>
                </div>

                <div className="p-4 rounded text-center my-3 border" style={{ background: "var(--bg-card-subtle)" }}>
                  <div className="fs-1 mb-2">📄</div>
                  <h5 className="fw-bold" style={{ color: "var(--text-main)" }}>STUDENT APPLICATION DOSSIER</h5>
                  <p className="text-muted small mb-2">
                    Applied Position: <strong>{viewingApp.opportunity_title}</strong> at <strong>{viewingApp.organization}</strong>
                  </p>
                  <p className="text-secondary small">
                    Audit Log: {viewingApp.notes || "Applied via AI Profile"}
                  </p>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary justify-content-between">
                <div className="d-flex gap-2 align-items-center">
                  <span className="small text-muted fw-bold">Update Status:</span>
                  <select
                    className="form-select form-select-sm fw-bold"
                    style={{ width: 160 }}
                    value={viewingApp.status || "Applied"}
                    onChange={(e) => {
                      handleStatusChange(viewingApp.id || viewingApp.application_id, e.target.value);
                      setViewingApp(prev => ({ ...prev, status: e.target.value, notes: `Status updated to ${e.target.value} by Faculty.` }));
                    }}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Selected">Selected</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewingApp(null)}
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
