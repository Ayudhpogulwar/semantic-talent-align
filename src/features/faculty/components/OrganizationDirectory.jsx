/**
 * SAIOTAF - Faculty & Moderator Module
 * OrganizationDirectory  (FR-FAC-08)
 * Verify / manage partnered companies and NGOs.
 */

import React, { useState, useEffect, useCallback } from "react";
import { organizationApi } from "../api/facultyApi";
import AddOrganizationForm from "./AddOrganizationForm";

const STATUS_BADGE = {
  PENDING: "bg-warning text-dark",
  VERIFIED: "bg-success text-white",
  REJECTED: "bg-danger text-white",
  SUSPENDED: "bg-dark text-white",
};

const defaultInitialOrgs = [];

const getStoredOrgs = () => {
  try {
    const stored = localStorage.getItem("stufac_organizations");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return defaultInitialOrgs;
};

export default function OrganizationDirectory() {
  const [orgs, setOrgs] = useState(getStoredOrgs);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localList = getStoredOrgs();
      const res = await organizationApi.list({ org_type: typeFilter || undefined });
      const apiData = res?.data?.results ?? res?.data ?? [];
      let merged = [...localList];
      if (Array.isArray(apiData)) {
        apiData.forEach((item) => {
          if (!merged.some((m) => String(m.id) === String(item.id) || m.name.toLowerCase() === item.name.toLowerCase())) {
            merged.unshift({
              id: item.id || `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
              name: item.name,
              org_type: item.org_type || "COMPANY",
              website: item.website || "",
              contact_name: item.contact_name || "",
              contact_email: item.contact_email || "",
              contact_phone: item.contact_phone || "",
              verification_status: (item.verification_status || "PENDING").toUpperCase(),
            });
          }
        });
      }
      setOrgs(merged);
      localStorage.setItem("stufac_organizations", JSON.stringify(merged));
    } catch (err) {
      console.warn("Using local organizations fallback:", err);
      setOrgs(getStoredOrgs());
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleVerify = async (id, action) => {
    setActioningId(id);
    const newStatus = action === "VERIFY" ? "VERIFIED" : action === "REJECT" ? "REJECTED" : "SUSPENDED";
    try {
      await organizationApi.verify(id, action);
    } catch (e) {
      console.log("Updated organization status locally");
    } finally {
      setActioningId(null);
    }

    setOrgs((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, verification_status: newStatus } : o));
      localStorage.setItem("stufac_organizations", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold">Organizations</h4>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select faculty-select-filter"
            style={{ width: 180 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="COMPANY">Company</option>
            <option value="NGO">NGO</option>
          </select>

          <button
            className={`btn btn-sm ${showAddForm ? "btn-secondary" : "btn-primary"} fw-semibold px-3`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "← Back to Directory" : "+ Add Organization"}
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div className="mb-4">
          <AddOrganizationForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchOrgs();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : (
        <>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="faculty-table-container">
            <table className="table table-hover faculty-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="fw-bold">Name</th>
                  <th className="fw-bold">Type</th>
                  <th className="fw-bold">Contact</th>
                  <th className="fw-bold">Status</th>
                  <th className="text-end fw-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">Loading…</td>
                  </tr>
                )}
                {!loading && orgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">No organizations found.</td>
                  </tr>
                )}
                {!loading &&
                  orgs.map((org) => (
                    <tr key={org.id}>
                      <td className="fw-semibold">
                        {org.name}
                        {org.website && (
                          <>
                            {" "}
                            <a href={org.website} target="_blank" rel="noreferrer" className="small text-primary">
                              ↗
                            </a>
                          </>
                        )}
                      </td>
                      <td><span className="badge badge-cyan">{org.org_type}</span></td>
                      <td className="text-muted small">{org.contact_email}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[org.verification_status] || 'badge-closed'}`}>
                          {org.verification_status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-action-custom btn-outline-success"
                            disabled={actioningId === org.id || org.verification_status === "VERIFIED"}
                            onClick={() => handleVerify(org.id, "VERIFY")}
                          >
                            Verify
                          </button>
                          <button
                            className="btn btn-action-custom btn-outline-danger"
                            disabled={actioningId === org.id || org.verification_status === "REJECTED"}
                            onClick={() => handleVerify(org.id, "REJECT")}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-action-custom btn-outline-secondary"
                            disabled={actioningId === org.id || org.verification_status === "SUSPENDED"}
                            onClick={() => handleVerify(org.id, "SUSPEND")}
                            title="Requires Department Admin or Super Admin"
                          >
                            Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
