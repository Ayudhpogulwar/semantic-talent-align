import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Search, FileText } from "lucide-react";

export default function FacultyApplicationsTable() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
        <h4 className="mb-0">Student Job & Internship Applications</h4>
        <div className="d-flex gap-2">
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search title, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <select
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Selected">Selected</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle bg-white">
          <thead className="table-light">
            <tr>
              <th>App ID</th>
              <th>Opportunity</th>
              <th>Organization</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-4 text-muted">Loading applications…</td></tr>
            )}
            {!loading && filteredApps.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-muted">No applications found. Students can apply from the Student Dashboard.</td></tr>
            )}
            {!loading && filteredApps.map(a => (
              <tr key={a.id || a.application_id}>
                <td><code>{a.id || a.application_id}</code></td>
                <td className="fw-bold">{a.opportunity_title}</td>
                <td>{a.organization}</td>
                <td>{a.applied_date}</td>
                <td><span className="badge bg-primary">{a.status}</span></td>
                <td className="text-muted small">{a.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
