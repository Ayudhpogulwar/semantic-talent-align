/**
 * SAIOTAF - Faculty & Moderator Module
 * OrganizationDirectory / OrganizationsTable (FR-FAC-08)
 * Verify, manage, view, and update partnered companies and NGOs.
 */

import React, { useState, useEffect, useCallback } from "react";
import { organizationApi } from "../api/facultyApi";
import AddOrganizationForm from "./AddOrganizationForm";

const STATUS_BADGE = {
  PENDING: "badge-pill-custom badge-pending",
  VERIFIED: "badge-pill-custom badge-verified",
  REJECTED: "badge-pill-custom badge-rejected",
  SUSPENDED: "badge-pill-custom badge-suspended",
};

const defaultInitialOrgs = [
  {
    id: "ORG-1001",
    name: "Tata Consultancy Services (TCS)",
    org_type: "COMPANY",
    location: "Mumbai / Nagpur, Maharashtra",
    description: "TCS is a global leader in IT services, consulting, and business solutions, partnering with the world's largest businesses in their transformation journeys.",
    website: "https://tcs.com",
    contact_name: "Rajesh Kumar",
    contact_role: "Head of Campus Talent Acquisition (HR)",
    contact_email: "campus.hiring@tcs.com",
    contact_phone: "+91 22 6778 9999",
    verification_status: "VERIFIED",
  },
  {
    id: "ORG-1002",
    name: "Infosys Ltd",
    org_type: "COMPANY",
    location: "Bengaluru / Pune, India",
    description: "Infosys is a digital services and consulting firm enabling clients across 56 countries to navigate their digital transformation with AI and cloud services.",
    website: "https://infosys.com",
    contact_name: "Sneha Nair",
    contact_role: "Lead HR & Campus Recruiter",
    contact_email: "recruitment@infosys.com",
    contact_phone: "+91 80 2852 0261",
    verification_status: "VERIFIED",
  },
  {
    id: "ORG-1003",
    name: "Tech Mahindra Foundation",
    org_type: "NGO",
    location: "New Delhi / Pune, India",
    description: "CSR arm of Tech Mahindra Ltd, focusing on empowerment through education, vocational skill training, and disability assistance programs.",
    website: "https://techmahindrafoundation.org",
    contact_name: "Amit Sharma",
    contact_role: "HR & Community Partnerships Lead",
    contact_email: "contact@techmahindrafoundation.org",
    contact_phone: "+91 120 4567 890",
    verification_status: "PENDING",
  },
  {
    id: "ORG-1004",
    name: "Persistent Systems",
    org_type: "COMPANY",
    location: "Nagpur / Pune, Maharashtra",
    description: "Persistent Systems builds software that drives customers' business with digital engineering, enterprise modernization, and data intelligence.",
    website: "https://persistent.com",
    contact_name: "Vikram Joshi",
    contact_role: "Senior HR Manager - University Relations",
    contact_email: "careers@persistent.com",
    contact_phone: "+91 712 224 8888",
    verification_status: "VERIFIED",
  }
];

const getStoredOrgs = () => {
  try {
    const stored = localStorage.getItem("stufac_organizations");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
  const [editingOrg, setEditingOrg] = useState(null); // Organization currently being updated
  const [selectedOrgDetails, setSelectedOrgDetails] = useState(null); // Organization details modal state

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localList = getStoredOrgs();
      const res = await organizationApi.list();
      const apiData = res?.data?.results ?? res?.data ?? [];
      let merged = [...localList];
      if (Array.isArray(apiData) && apiData.length > 0) {
        apiData.forEach((item) => {
          const existingIdx = merged.findIndex(
            (m) => String(m.id) === String(item.id) || m.name.toLowerCase() === item.name.toLowerCase()
          );

          const mappedItem = {
            id: item.id || `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
            name: item.name,
            org_type: item.org_type || "COMPANY",
            location: item.location || "Nagpur, Maharashtra",
            description: item.description || "Partnered institution providing technical training, internships, and placement opportunities.",
            website: item.website || "",
            contact_name: item.contact_name || "",
            contact_role: item.contact_role || "HR / Recruiter",
            contact_email: item.contact_email || "",
            contact_phone: item.contact_phone || "",
            verification_status: (item.verification_status || "PENDING").toUpperCase(),
          };

          if (existingIdx !== -1) {
            // CRITICAL: if this org was locally edited, do NOT overwrite with (possibly stale) API data.
            // The user's edit is authoritative until the page reloads or they explicitly refresh.
            if (merged[existingIdx]._locallyEdited) return;
            merged[existingIdx] = { ...merged[existingIdx], ...mappedItem };
          } else {
            merged.unshift(mappedItem);
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
  }, []); // No typeFilter dependency — filtering is client-side only

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

    if (selectedOrgDetails && selectedOrgDetails.id === id) {
      setSelectedOrgDetails((prev) => ({ ...prev, verification_status: newStatus }));
    }
  };

  const handleEditClick = (org) => {
    setSelectedOrgDetails(null);
    setShowAddForm(false);
    setEditingOrg(org);
  };

  const handleUpdateSuccess = (updatedOrg) => {
    setEditingOrg(null);
    // Mark as locally edited so fetchOrgs never overwrites this with stale API data
    const protectedOrg = { ...updatedOrg, _locallyEdited: true };
    setOrgs((prev) => {
      const nextList = prev.map((o) =>
        String(o.id) === String(updatedOrg.id) ? protectedOrg : o
      );
      localStorage.setItem("stufac_organizations", JSON.stringify(nextList));
      return nextList;
    });
  };

  const filteredOrgs = orgs.filter((org) => {
    if (typeFilter && org.org_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Organizations &amp; Corporate Partners</h4>
          <p className="text-muted small mb-0">Manage accredited companies, NGOs, and their designated HR coordinators.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select faculty-select-filter"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="COMPANY">Company</option>
            <option value="NGO">NGO</option>
          </select>

          {!editingOrg && (
            <button
              className={`btn btn-sm ${showAddForm ? "btn-secondary" : "btn-primary"} fw-semibold px-3`}
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingOrg(null);
              }}
            >
              {showAddForm ? "← Back to Directory" : "+ Add Organization"}
            </button>
          )}

          {editingOrg && (
            <button
              className="btn btn-sm btn-secondary fw-semibold px-3"
              onClick={() => setEditingOrg(null)}
            >
              ← Back to Directory
            </button>
          )}
        </div>
      </div>

      {/* Editing Mode */}
      {editingOrg && (
        <div className="mb-4">
          <AddOrganizationForm
            initialData={editingOrg}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditingOrg(null)}
          />
        </div>
      )}

      {/* Adding Mode */}
      {!editingOrg && showAddForm && (
        <div className="mb-4">
          <AddOrganizationForm
            onSuccess={(newOrg) => {
              setShowAddForm(false);
              // Immediately prepend the new org so it shows without waiting for API
              setOrgs((prev) => {
                const exists = prev.some((o) => String(o.id) === String(newOrg.id));
                const nextList = exists ? prev : [newOrg, ...prev];
                localStorage.setItem("stufac_organizations", JSON.stringify(nextList));
                return nextList;
              });
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Directory Table */}
      {!editingOrg && !showAddForm && (
        <>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="faculty-table-container">
            <table className="table table-hover faculty-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="fw-bold ps-3">Organization</th>
                  <th className="fw-bold">Type</th>
                  <th className="fw-bold">Contact Person &amp; Role</th>
                  <th className="fw-bold">Contact Details</th>
                  <th className="fw-bold text-center">Status</th>
                  <th className="text-end fw-bold pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">Loading organizations…</td>
                  </tr>
                )}
                {!loading && filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">No organizations found.</td>
                  </tr>
                )}
                {!loading &&
                  filteredOrgs.map((org) => (
                    <tr key={org.id}>
                      <td className="fw-semibold ps-3" style={{ color: "var(--text-main)" }}>
                        <div className="d-flex align-items-center gap-1">
                          <span>{org.name}</span>
                          {org.website && (
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noreferrer"
                              className="small text-primary text-decoration-none ms-1"
                              title={`Visit official website: ${org.website}`}
                            >
                              ↗
                            </a>
                          )}
                        </div>
                        <div className="text-muted small" style={{ fontSize: "0.785rem" }}>
                          {org.location || "Nagpur, Maharashtra"}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{org.org_type}</span>
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ color: "var(--text-main)" }}>
                          {org.contact_name || "N/A"}
                        </div>
                        <div>
                          <span
                            className="badge px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "var(--primary-light)",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            <i className="bi bi-briefcase me-1"></i>
                            {org.contact_role || "HR / Recruiter"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-info small fw-medium">{org.contact_email}</div>
                        {org.contact_phone && (
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                            {org.contact_phone}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${STATUS_BADGE[org.verification_status] || 'badge-closed'}`}>
                          {org.verification_status}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-action-custom btn-outline-info"
                            onClick={() => setSelectedOrgDetails(org)}
                            title="View Full Company & HR Details"
                          >
                            View Details
                          </button>
                          <button
                            className="btn btn-action-custom btn-outline-warning"
                            onClick={() => handleEditClick(org)}
                            title="Edit / Update Organization Information"
                          >
                            Edit
                          </button>
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

      {/* Organization Details Modal */}
      {selectedOrgDetails && (
        <div
          className="modal d-block faculty-modal-backdrop"
          tabIndex={-1}
          role="dialog"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content faculty-modal-content">
              <div className="modal-header border-bottom" style={{ borderColor: "var(--border-color)" }}>
                <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-building"></i> Company / Organization Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedOrgDetails(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body py-4">
                {/* Basic Header Banner */}
                <div className="mb-4 p-3 rounded faculty-modal-panel">
                  <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                    <div>
                      <h4 className="fw-bold mb-1" style={{ color: "var(--text-main)" }}>{selectedOrgDetails.name}</h4>
                      <div className="text-info small fw-semibold">
                        <i className="bi bi-geo-alt-fill me-1"></i> Location: {selectedOrgDetails.location || "Nagpur, Maharashtra, India"}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <span className="badge bg-info fs-6">{selectedOrgDetails.org_type}</span>
                      <span className={`badge fs-6 ${STATUS_BADGE[selectedOrgDetails.verification_status] || 'badge-closed'}`}>
                        {selectedOrgDetails.verification_status}
                      </span>
                    </div>
                  </div>

                  {selectedOrgDetails.website && (
                    <div className="mb-2">
                      <span className="small text-muted">Official Website: </span>
                      <a href={selectedOrgDetails.website} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                        {selectedOrgDetails.website} ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Company Description */}
                <div className="mb-4 p-3 rounded faculty-modal-panel">
                  <h6 className="text-uppercase fw-bold mb-2 small" style={{ color: "var(--primary-light, #818cf8)" }}>
                    Full Company Description &amp; Overview
                  </h6>
                  <p className="leading-relaxed mb-0" style={{ color: "var(--text-main)", whiteSpace: "pre-line", fontSize: "0.95rem" }}>
                    {selectedOrgDetails.description || selectedOrgDetails.about || "No detailed description available."}
                  </p>
                </div>

                {/* Contact Information with Highlighted HR Role */}
                <div className="p-3 rounded faculty-modal-panel">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 border-secondary border-opacity-25">
                    <h6 className="text-uppercase fw-bold mb-0 small" style={{ color: "var(--primary-light, #818cf8)" }}>
                      Designated Contact Person &amp; HR Representative
                    </h6>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1">
                      <i className="bi bi-shield-check me-1"></i> Official Representative
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-3 col-sm-6">
                      <span className="small d-block text-muted mb-1">Contact Person</span>
                      <span className="fw-bold fs-6" style={{ color: "var(--text-main)" }}>
                        {selectedOrgDetails.contact_name || "N/A"}
                      </span>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="small d-block text-muted mb-1">Role / Designation</span>
                      <span
                        className="badge px-2.5 py-1.5 rounded-pill fs-7"
                        style={{
                          background: "rgba(59, 130, 246, 0.2)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59, 130, 246, 0.35)",
                          fontWeight: 700
                        }}
                      >
                        <i className="bi bi-person-badge-fill me-1"></i>
                        {selectedOrgDetails.contact_role || "HR / Recruiter"}
                      </span>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="small d-block text-muted mb-1">Contact Email</span>
                      <span className="fw-semibold text-info small text-break">
                        {selectedOrgDetails.contact_email || "N/A"}
                      </span>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="small d-block text-muted mb-1">Phone Number</span>
                      <span className="fw-semibold" style={{ color: "var(--text-main)" }}>
                        {selectedOrgDetails.contact_phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top d-flex justify-content-between" style={{ borderColor: "var(--border-color)" }}>
                <button
                  className="btn btn-outline-warning px-3 d-flex align-items-center gap-1.5"
                  onClick={() => handleEditClick(selectedOrgDetails)}
                >
                  <i className="bi bi-pencil-square"></i> Edit Organization Info
                </button>

                <button className="btn btn-secondary px-4" onClick={() => setSelectedOrgDetails(null)}>
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
