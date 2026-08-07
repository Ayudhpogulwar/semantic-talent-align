/**
 * SAIOTAF - Faculty & Moderator Module
 * OrganizationDirectory  (FR-FAC-08)
 * Verify / manage partnered companies and NGOs.
 */

import React, { useState, useEffect, useCallback } from "react";
import { organizationApi } from "../api/facultyApi";

const STATUS_BADGE = {
  PENDING: "bg-warning text-dark",
  VERIFIED: "bg-success",
  REJECTED: "bg-danger",
  SUSPENDED: "bg-dark",
};

export default function OrganizationDirectory() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

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
        <h4 className="mb-0">Organizations</h4>
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

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover bg-white align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Contact</th>
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
            {!loading && orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">No organizations found.</td>
              </tr>
            )}
            {!loading &&
              orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    {org.name}
                    {org.website && (
                      <>
                        {" "}
                        <a href={org.website} target="_blank" rel="noreferrer" className="small">
                          ↗
                        </a>
                      </>
                    )}
                  </td>
                  <td>{org.org_type}</td>
                  <td className="text-muted small">{org.contact_email}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[org.verification_status]}`}>
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
    </div>
  );
}
