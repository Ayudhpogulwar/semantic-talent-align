import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Search, FileText, RefreshCw, User, Briefcase, Building } from "lucide-react";

const STATUS_PILL_STYLE_LIGHT = {
  "Applied": { background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" },
  "Under Review": { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  "Shortlisted": { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
  "Interview": { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" },
  "Selected": { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }
};

const STATUS_PILL_STYLE_DARK = {
  "Applied": { background: "rgba(6, 182, 212, 0.18)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.4)" },
  "Under Review": { background: "rgba(245, 158, 11, 0.18)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)" },
  "Shortlisted": { background: "rgba(16, 185, 129, 0.18)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" },
  "Interview": { background: "rgba(99, 102, 241, 0.18)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.4)" },
  "Selected": { background: "rgba(16, 185, 129, 0.25)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.5)" }
};

export default function FacultyApplicationsTable() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewingApp, setViewingApp] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const handleTheme = () => setTheme(localStorage.getItem("theme") || "dark");
    window.addEventListener("themeChange", handleTheme);
    window.addEventListener("storage", handleTheme);
    return () => {
      window.removeEventListener("themeChange", handleTheme);
      window.removeEventListener("storage", handleTheme);
    };
  }, []);

  const pillPalette = theme === "light" ? STATUS_PILL_STYLE_LIGHT : STATUS_PILL_STYLE_DARK;

  const fetchApplications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // Real-time polling every 4 seconds so student applications appear automatically
    const timer = setInterval(() => {
      fetchApplications();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    const updatedNotes = `Status updated to ${newStatus} by Faculty.`;
    setApplications(prev => prev.map(a => 
      (String(a.id) === String(appId) || String(a.application_id) === String(appId)) 
        ? { ...a, status: newStatus, notes: updatedNotes } 
        : a
    ));

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

  const handleDelete = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this application record?")) return;
    setApplications(prev => prev.filter(a => String(a.id) !== String(appId) && String(a.application_id) !== String(appId)));
    try {
      await fetch(`http://127.0.0.1:8000/api/applications/${appId}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete application on server:", err);
    }
  };

  const filteredApps = applications.filter(a => {
    const s = search.toLowerCase();
    const matchesSearch = search === "" || 
      (a.opportunity_title && a.opportunity_title.toLowerCase().includes(s)) ||
      (a.organization && a.organization.toLowerCase().includes(s)) ||
      (a.student_name && a.student_name.toLowerCase().includes(s)) ||
      (a.student_email && a.student_email.toLowerCase().includes(s)) ||
      (a.id && String(a.id).toLowerCase().includes(s)) ||
      (a.application_id && String(a.application_id).toLowerCase().includes(s));

    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = applications.length;
  const appliedCount = applications.filter(a => a.status === "Applied").length;
  const reviewCount = applications.filter(a => a.status === "Under Review").length;
  const shortlistedCount = applications.filter(a => a.status === "Shortlisted").length;
  const selectedCount = applications.filter(a => a.status === "Selected").length;

  return (
    <div className="student-verification-table">
      {/* Top Header & Real-time Refresh */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Applications Review</h4>
          <span className="small text-muted">Real-time student applications stream from the Student Portal</span>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            style={{ borderRadius: "8px" }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          
          <input
            type="search"
            className="form-control faculty-search-input"
            placeholder="Search student, opportunity, org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 220, color: "var(--text-main)" }}
          />
          
          <select
            className="form-select faculty-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 145, color: "var(--text-main)" }}
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied ({appliedCount})</option>
            <option value="Under Review">Under Review ({reviewCount})</option>
            <option value="Shortlisted">Shortlisted ({shortlistedCount})</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected ({selectedCount})</option>
          </select>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="p-2 px-3 rounded border text-center" style={{ background: "var(--input-bg)" }}>
            <span className="text-muted small d-block uppercase fw-bold">Total Applications</span>
            <strong className="fs-5" style={{ color: "var(--text-main)" }}>{totalCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-2 px-3 rounded border text-center" style={{ background: "var(--input-bg)" }}>
            <span className="text-muted small d-block uppercase fw-bold">Pending Review</span>
            <strong className="fs-5 text-warning">{appliedCount + reviewCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-2 px-3 rounded border text-center" style={{ background: "var(--input-bg)" }}>
            <span className="text-muted small d-block uppercase fw-bold">Shortlisted</span>
            <strong className="fs-5 text-info">{shortlistedCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-2 px-3 rounded border text-center" style={{ background: "var(--input-bg)" }}>
            <span className="text-muted small d-block uppercase fw-bold">Selected / Placed</span>
            <strong className="fs-5 text-success">{selectedCount}</strong>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="faculty-table-container">
        <table className="table table-hover align-middle faculty-table mb-0">
          <thead>
            <tr>
              <th className="text-center fw-bold">APP ID</th>
              <th className="text-start fw-bold">STUDENT APPLICANT</th>
              <th className="text-start fw-bold">OPPORTUNITY</th>
              <th className="text-start fw-bold">ORGANIZATION</th>
              <th className="text-center fw-bold">APPLIED DATE</th>
              <th className="text-center fw-bold">STATUS</th>
              <th className="text-center fw-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-4 text-muted">Loading applications…</td></tr>
            )}
            {!loading && filteredApps.length === 0 && (
              <tr><td colSpan={7} className="text-center py-4 text-muted">No applications found. When students click "One-Click Apply" in the Student Dashboard, their applications will appear here dynamically.</td></tr>
            )}
            {!loading && filteredApps.map(a => {
              const currentStatus = a.status || "Applied";
              const pillStyle = pillPalette[currentStatus] || pillPalette["Applied"];
              const studentName = a.student_name || "Student Applicant";
              const initials = studentName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "ST";

              return (
                <tr key={a.id || a.application_id}>
                  <td className="text-center fw-semibold">
                    <code className="px-2 py-1 rounded border">{a.id || a.application_id}</code>
                  </td>
                  
                  {/* Real Student Info */}
                  <td className="text-start">
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                        style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #a855f7)", fontSize: "0.78rem" }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: "var(--text-main)" }}>{studentName}</div>
                        {a.student_email && (
                          <div className="small text-muted" style={{ fontSize: "0.76rem" }}>{a.student_email}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="text-start">
                    <button
                      className="btn btn-link p-0 fw-semibold text-decoration-none text-primary text-start"
                      onClick={() => setViewingApp(a)}
                    >
                      {a.opportunity_title}{" "}
                      <span className="small text-primary">↗</span>
                    </button>
                  </td>
                  <td className="text-start" style={{ color: "var(--text-main)" }}>{a.organization}</td>
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
                    <div className="d-flex gap-1 justify-content-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setViewingApp(a)}
                        style={{ borderRadius: "6px" }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(a.id || a.application_id)}
                        style={{ borderRadius: "6px" }}
                      >
                        Delete
                      </button>
                    </div>
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
                  💼 Application Dossier: {viewingApp.opportunity_title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingApp(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-3 g-2 p-3 rounded border" style={{ background: "var(--input-bg)" }}>
                  <div className="col-md-3 col-6">
                    <small className="text-muted d-block fw-bold uppercase">Application ID</small>
                    <span className="fw-bold">{viewingApp.id || viewingApp.application_id}</span>
                  </div>
                  <div className="col-md-3 col-6">
                    <small className="text-muted d-block fw-bold uppercase">Student Applicant</small>
                    <span className="fw-bold text-primary">{viewingApp.student_name || "Student Applicant"}</span>
                    {viewingApp.student_email && (
                      <span className="d-block small text-muted">{viewingApp.student_email}</span>
                    )}
                  </div>
                  <div className="col-md-3 col-6">
                    <small className="text-muted d-block fw-bold uppercase">Organization</small>
                    <span>{viewingApp.organization}</span>
                  </div>
                  <div className="col-md-3 col-6">
                    <small className="text-muted d-block fw-bold uppercase">Applied Date</small>
                    <span>{viewingApp.applied_date}</span>
                  </div>
                </div>

                <div className="p-4 rounded text-center my-3 border" style={{ background: "var(--bg-card-subtle)" }}>
                  <div className="fs-1 mb-2">📄</div>
                  <h5 className="fw-bold" style={{ color: "var(--text-main)" }}>STUDENT APPLICATION DOSSIER</h5>
                  <p className="text-muted small mb-2">
                    Applicant: <strong>{viewingApp.student_name || "Student"}</strong> applied for <strong>{viewingApp.opportunity_title}</strong> at <strong>{viewingApp.organization}</strong>
                  </p>
                  <p className="text-secondary small">
                    Audit Log: {viewingApp.notes || "Applied via Student Portal with Verified Profile"}
                  </p>
                  {viewingApp.last_updated && (
                    <p className="text-muted small mb-0">Last Updated: {viewingApp.last_updated}</p>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top border-secondary justify-content-between">
                <div className="d-flex gap-2 align-items-center">
                  <span className="small text-muted fw-bold">Update Status:</span>
                  <select
                    className="form-select form-select-sm fw-bold faculty-select-filter"
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
