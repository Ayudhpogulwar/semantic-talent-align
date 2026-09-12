/**
 * SAIOTAF - Super Admin Module
 * AdminUserManagement.jsx (Feature 2: Universal User Management - Students & Faculty)
 */

import React, { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/adminApi";
import { Search, UserX, Key, Trash2, CheckCircle2, UserCheck, Shield, AlertTriangle } from "lucide-react";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers({
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        search: search || undefined,
      });
      setUsers(data);
    } catch (err) {
      setError("Failed to load system user directory.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dynamic Action 1: Suspend / Toggle Account
  const handleSuspendToggle = async (user) => {
    const isCurrentlySuspended = user.status === "Suspended";
    const newAction = isCurrentlySuspended ? "activate" : "suspend";
    const newStatus = isCurrentlySuspended ? "Active" : "Suspended";

    setActioningId(user.id);
    try {
      await adminApi.performUserAction(user.id, newAction);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      showToast(`Account for ${user.name} has been ${newStatus.toLowerCase()}.`);
    } catch (err) {
      setError("Failed to update user status.");
    } finally {
      setActioningId(null);
    }
  };

  // Dynamic Action 2: Reset Password
  const handleResetPassword = async (user) => {
    setActioningId(user.id);
    try {
      await adminApi.performUserAction(user.id, "reset_password");
      showToast(`Password reset link dispatched to ${user.email}.`);
    } catch (err) {
      setError("Failed to reset password.");
    } finally {
      setActioningId(null);
    }
  };

  // Dynamic Action 3: Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    setActioningId(user.id);
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`User ${user.name} permanently deleted.`);
    } catch (err) {
      setError("Failed to delete user.");
    } finally {
      setActioningId(null);
    }
  };

  // Filter visible records
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role.toUpperCase() !== roleFilter.toUpperCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = (u.name || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      const idMatch = (u.user_id || String(u.id)).toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !idMatch) return false;
    }
    return true;
  });

  return (
    <div className="admin-user-management animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3 shadow border-success" role="alert">
          <span className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} className="text-success" /> {toastMessage}
          </span>
          <button className="btn-close ms-3" onClick={() => setToastMessage(null)} />
        </div>
      )}

      {/* Header Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: "var(--text-main)" }}>Universal User Directory</h4>
          <p className="small mb-0" style={{ color: "var(--text-muted)" }}>Manage both Student & Faculty user accounts</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="position-relative">
            <input
              type="search"
              className="form-control faculty-search-input ps-4"
              placeholder="Search name, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240, fontSize: "0.85rem" }}
            />
            <Search size={14} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
          </div>

          {/* Role Toggle Tabs */}
          <div className="btn-group btn-group-sm" role="group" aria-label="Role Filter">
            <button
              type="button"
              className={`btn ${roleFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setRoleFilter("ALL")}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              className={`btn ${roleFilter === "STUDENT" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setRoleFilter("STUDENT")}
            >
              Students
            </button>
            <button
              type="button"
              className={`btn ${roleFilter === "FACULTY" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setRoleFilter("FACULTY")}
            >
              Faculty
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {/* Data Table */}
      <div className="faculty-table-container">
        <table className="table table-hover align-middle faculty-table mb-0" style={{ minWidth: "950px" }}>
          <thead>
            <tr>
              <th className="text-start ps-3 text-nowrap">User ID</th>
              <th className="text-start text-nowrap">Name</th>
              <th className="text-start text-nowrap">Email / Domain</th>
              <th className="text-center text-nowrap">Role</th>
              <th className="text-center text-nowrap">Department</th>
              <th className="text-center text-nowrap">Account Status</th>
              <th className="text-center pe-3 text-nowrap" style={{ minWidth: "280px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm me-2 text-primary" role="status" />
                  Loading user records…
                </td>
              </tr>
            )}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No matching user accounts found.
                </td>
              </tr>
            )}

            {!loading &&
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="text-start ps-3 text-nowrap">
                    <code className="px-2 py-1 rounded text-info border" style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", fontSize: "0.8rem" }}>
                      {u.user_id || `USR-${u.id}`}
                    </code>
                  </td>
                  <td className="text-start fw-semibold text-nowrap" style={{ color: "var(--text-main)" }}>
                    {u.name}
                  </td>
                  <td className="text-start small text-nowrap" style={{ color: "var(--text-muted)" }}>
                    {u.email}
                  </td>
                  <td className="text-center text-nowrap">
                    <span className={`badge ${u.role === "Faculty" ? "bg-info text-dark" : "bg-primary"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-center text-nowrap small" style={{ color: "var(--text-muted)" }}>
                    {u.department || "N/A"}
                  </td>
                  <td className="text-center text-nowrap">
                    <span className={`badge ${u.status === "Active" ? "bg-success bg-opacity-15 text-success border border-success" : "bg-danger bg-opacity-15 text-danger border border-danger"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="text-center pe-3 text-nowrap">
                    <div className="d-inline-flex gap-2">
                      {/* Action 1: Suspend / Activate Account */}
                      <button
                        className={`btn btn-sm ${u.status === "Suspended" ? "btn-outline-success" : "btn-outline-warning"} d-inline-flex align-items-center gap-1`}
                        style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        disabled={actioningId === u.id}
                        onClick={() => handleSuspendToggle(u)}
                        title={u.status === "Suspended" ? "Activate Account" : "Suspend Account"}
                      >
                        {u.status === "Suspended" ? <UserCheck size={13} /> : <UserX size={13} />}
                        {u.status === "Suspended" ? "Activate" : "Suspend"}
                      </button>

                      {/* Action 2: Reset Password */}
                      <button
                        className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        disabled={actioningId === u.id}
                        onClick={() => handleResetPassword(u)}
                        title="Reset Password"
                      >
                        <Key size={13} /> Reset Pass
                      </button>

                      {/* Action 3: Delete User */}
                      <button
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        disabled={actioningId === u.id}
                        onClick={() => handleDeleteUser(u)}
                        title="Permanently Delete User"
                      >
                        <Trash2 size={13} /> Delete
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
