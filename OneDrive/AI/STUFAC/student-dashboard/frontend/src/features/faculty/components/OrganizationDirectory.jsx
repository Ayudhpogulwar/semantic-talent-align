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

export default function OrganizationDirectory() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await organizationApi.list({ org_type: typeFilter || undefined });
      setOrgs(data.results ?? data);
    } catch {
      setError("Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleVerify = async (id, action) => {
    setActioningId(id);
    try {
      await organizationApi.verify(id, action);
      await fetchOrgs();
    } catch {
      setError("Action failed.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          <h4 className="mb-0 text-dark fw-bold">Organizations</h4>
          <button
            className={`btn btn-sm ${showAddForm ? "btn-secondary" : "btn-primary"} fw-semibold px-3`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "← Back to Directory" : "+ Add Organization"}
          </button>
        </div>

        <select
          className="form-select form-select-sm"
          style={{ width: 180 }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="COMPANY">Company</option>
          <option value="NGO">NGO</option>
        </select>
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

          <div className="table-responsive shadow-sm rounded border">
            <table className="table table-hover bg-white align-middle mb-0">
              <thead className="table-light">
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
                      <td><span className="badge bg-light text-dark border">{org.org_type}</span></td>
                      <td className="text-muted small">{org.contact_email}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[org.verification_status] || 'bg-secondary'}`}>
                          {org.verification_status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-success"
                            disabled={actioningId === org.id || org.verification_status === "VERIFIED"}
                            onClick={() => handleVerify(org.id, "VERIFY")}
                          >
                            Verify
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            disabled={actioningId === org.id || org.verification_status === "REJECTED"}
                            onClick={() => handleVerify(org.id, "REJECT")}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-outline-dark"
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
