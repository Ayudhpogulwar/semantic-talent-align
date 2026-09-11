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
      const token = localStorage.getItem("stufac_auth_token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://127.0.0.1:8000/api/applications", { headers });
      if (res.ok) {
        const data = await res.json();
        const serverApps = Array.isArray(data) ? data : [];
        const localApps = JSON.parse(localStorage.getItem("stufac_applications") || "[]");
        
        // Merge server and local applications without duplicates
        const map = new Map();
        [...serverApps, ...localApps].forEach(item => {
          if (item && (item.id || item.opportunity_id)) {
            map.set(item.id || item.opportunity_id, item);
          }
        });
        setApplications(Array.from(map.values()));
      } else {
        const localApps = JSON.parse(localStorage.getItem("stufac_applications") || "[]");
        setApplications(localApps);
      }
    } catch (err) {
      console.error("Error fetching applications for faculty table:", err);
      const localApps = JSON.parse(localStorage.getItem("stufac_applications") || "[]");
      setApplications(localApps);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appIdKey, newStatus) => {
    // 1. Optimistic UI update
    setApplications(prev => prev.map(item => {
      const key = item.id || item.application_id || item.opportunity_id;
      if (String(key) === String(appIdKey)) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    // 2. Persist in local storage
    const local = JSON.parse(localStorage.getItem("stufac_applications") || "[]");
    const updatedLocal = local.map(item => {
      const key = item.id || item.application_id || item.opportunity_id;
      if (String(key) === String(appIdKey)) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    localStorage.setItem("stufac_applications", JSON.stringify(updatedLocal));

    // 3. Sync to backend API endpoint & push real-time student notification
    try {
      const targetApp = applications.find(a => String(a.id || a.application_id || a.opportunity_id) === String(appIdKey));
      const oppTitle = targetApp?.opportunity_title || "your job application";

      const cleanId = String(appIdKey).replace("APP-", "");
      const res = await fetch(`http://127.0.0.1:8000/api/applications/${cleanId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      // Save notification to local storage for immediate student view
      const localNotifs = JSON.parse(localStorage.getItem("stufac_notifications") || "[]");
      const notifItem = {
        id: `notif-status-${Date.now()}`,
        title: `Application Status: ${newStatus}`,
        message: `Faculty updated status of ${oppTitle} to '${newStatus}'.`,
        timestamp: "Just now",
        read: false
      };
      localStorage.setItem("stufac_notifications", JSON.stringify([notifItem, ...localNotifs]));
    } catch (e) {
      console.error("Failed to sync application status update to server:", e);
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
            {!loading && filteredApps.map(a => {
              const appIdKey = a.id || a.application_id || a.opportunity_id;
              return (
                <tr key={appIdKey}>
                  <td><code>{appIdKey}</code></td>
                  <td className="fw-bold">{a.opportunity_title}</td>
                  <td>{a.organization}</td>
                  <td>{a.applied_date || "2026-08-26"}</td>
                  <td>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={a.status || "Applied"}
                      onChange={(e) => handleStatusChange(appIdKey, e.target.value)}
                      style={{
                        width: 140,
                        backgroundColor: a.status === 'Selected' ? '#dcfce7' : a.status === 'Shortlisted' ? '#dbeafe' : a.status === 'Interview' ? '#fef3c7' : '#f1f5f9',
                        color: a.status === 'Selected' ? '#166534' : a.status === 'Shortlisted' ? '#1e40af' : a.status === 'Interview' ? '#92400e' : '#334155',
                        borderColor: 'transparent'
                      }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview">Interview</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="text-muted small">{a.notes || "Submitted via student portal"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
