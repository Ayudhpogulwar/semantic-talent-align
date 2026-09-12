/**
 * SAIOTAF - Faculty & Moderator Module
 * OrganizationDirectory / OrganizationsTable (FR-FAC-08)
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

const defaultInitialOrgs = [
  {
    id: "ORG-1001",
    name: "Tata Consultancy Services (TCS)",
    org_type: "COMPANY",
    location: "Mumbai / Nagpur, Maharashtra",
    description: "TCS is a global leader in IT services, consulting, and business solutions, partnering with the world's largest businesses in their transformation journeys.",
    website: "https://tcs.com",
    contact_name: "Rajesh Kumar",
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
  const [selectedOrgDetails, setSelectedOrgDetails] = useState(null); // Company details modal state

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localList = getStoredOrgs();
      const res = await organizationApi.list({ org_type: typeFilter || undefined });
      const apiData = res?.data?.results ?? res?.data ?? [];
      let merged = [...localList];
      if (Array.isArray(apiData) && apiData.length > 0) {
        apiData.forEach((item) => {
          if (!merged.some((m) => String(m.id) === String(item.id) || m.name.toLowerCase() === item.name.toLowerCase())) {
            merged.unshift({
              id: item.id || `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
              name: item.name,
              org_type: item.org_type || "COMPANY",
              location: item.location || "Nagpur, Maharashtra",
              description: item.description || "Partnered institution providing technical training, internships, and placement opportunities.",
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

  const filteredOrgs = orgs.filter((org) => {
    if (typeFilter && org.org_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-bold text-white">Organizations</h4>

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
                {!loading && filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">No organizations found.</td>
                  </tr>
                )}
                {!loading &&
                  filteredOrgs.map((org) => (
                    <tr key={org.id}>
                      <td className="fw-semibold text-white">
                        {org.name}
                        {org.website && (
                          <>
                            {" "}
                            <a href={org.website} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none ms-1">
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
                            className="btn btn-action-custom btn-outline-info"
                            onClick={() => setSelectedOrgDetails(org)}
                            title="View Full Company Details"
                          >
                            View Details
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
              <div className="modal-header">
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
                <div className="mb-4 p-3 faculty-modal-panel">
                  <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                    <div>
                      <h4 className="fw-bold modal-value mb-1">{selectedOrgDetails.name}</h4>
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
                      <span className="modal-label">Official Website: </span>
                      <a href={selectedOrgDetails.website} target="_blank" rel="noreferrer" className="text-primary text-decoration-none fw-semibold">
                        {selectedOrgDetails.website} ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Company Description */}
                <div className="mb-4 p-3 faculty-modal-panel">
                  <h6 className="modal-label fw-bold mb-2 pb-1 border-bottom">Full Company Description & Overview</h6>
                  <p className="modal-value leading-relaxed mb-0" style={{ whiteSpace: "pre-line", fontSize: "0.95rem" }}>
                    {selectedOrgDetails.description || selectedOrgDetails.about || "No detailed description available."}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="p-3 faculty-modal-panel">
                  <h6 className="modal-label fw-bold mb-3 pb-1 border-bottom">Contact Information</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <span className="modal-label d-block mb-1">Contact Person</span>
                      <span className="fw-semibold modal-value">{selectedOrgDetails.contact_name || "N/A"}</span>
                    </div>
                    <div className="col-md-4">
                      <span className="modal-label d-block mb-1">Contact Email</span>
                      <span className="fw-semibold text-info">{selectedOrgDetails.contact_email || "N/A"}</span>
                    </div>
                    <div className="col-md-4">
                      <span className="modal-label d-block mb-1">Phone Number</span>
                      <span className="fw-semibold modal-value">{selectedOrgDetails.contact_phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setSelectedOrgDetails(null)}
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
