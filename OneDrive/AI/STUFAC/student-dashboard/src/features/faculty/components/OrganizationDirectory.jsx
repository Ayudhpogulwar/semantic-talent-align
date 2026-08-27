/**
 * SAIOTAF - Faculty & Moderator Module
 * OrganizationDirectory  (FR-FAC-08)
 * Verify / manage partnered companies and NGOs + Add New Organization + Post Opportunity.
 */

import React, { useState, useEffect, useCallback } from "react";
import { organizationApi } from "../api/facultyApi";
import UploadOpportunityForm from "./UploadOpportunityForm";

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
  const [selectedOrgForOpp, setSelectedOrgForOpp] = useState(null);

  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: "",
    org_type: "COMPANY",
    website: "",
    contact_name: "",
    contact_email: "",
    contact_phone: ""
  });
  const [addingOrg, setAddingOrg] = useState(false);

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

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgForm.name.trim() || !newOrgForm.contact_email.trim()) {
      alert("Please provide organization name and contact email.");
      return;
    }
    setAddingOrg(true);
    try {
      await organizationApi.create(newOrgForm);
      setShowAddOrgModal(false);
      setNewOrgForm({
        name: "",
        org_type: "COMPANY",
        website: "",
        contact_name: "",
        contact_email: "",
        contact_phone: ""
      });
      await fetchOrgs();
      alert("Organization successfully registered!");
    } catch (err) {
      setError("Failed to create organization.");
    } finally {
      setAddingOrg(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Organizations</h4>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="COMPANY">Company</option>
            <option value="NGO">NGO</option>
          </select>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setShowAddOrgModal((prev) => !prev)}
          >
            {showAddOrgModal ? "Close Form" : "+ Add Organization"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showAddOrgModal && (
        <form className="glass-panel p-4 mb-4" onSubmit={handleCreateOrg}>
          <h5 className="mb-3 text-primary">Add New Partner Organization</h5>
          <div className="row g-3 text-start">
            <div className="col-md-6">
              <label className="form-label fw-medium">Organization Name <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Google India"
                value={newOrgForm.name} 
                onChange={(e) => setNewOrgForm({...newOrgForm, name: e.target.value})} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Organization Type</label>
              <select 
                className="form-select" 
                value={newOrgForm.org_type} 
                onChange={(e) => setNewOrgForm({...newOrgForm, org_type: e.target.value})}
              >
                <option value="COMPANY">Company / Corporate</option>
                <option value="NGO">NGO / Non-Profit</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Official Website</label>
              <input 
                type="url" 
                className="form-control" 
                placeholder="https://company.example.com"
                value={newOrgForm.website} 
                onChange={(e) => setNewOrgForm({...newOrgForm, website: e.target.value})} 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Contact Person Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Rahul Sharma"
                value={newOrgForm.contact_name} 
                onChange={(e) => setNewOrgForm({...newOrgForm, contact_name: e.target.value})} 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Contact Email <span className="text-danger">*</span></label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="recruiter@company.example.com"
                value={newOrgForm.contact_email} 
                onChange={(e) => setNewOrgForm({...newOrgForm, contact_email: e.target.value})} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Contact Phone</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="+91 98765 43210"
                value={newOrgForm.contact_phone} 
                onChange={(e) => setNewOrgForm({...newOrgForm, contact_phone: e.target.value})} 
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddOrgModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={addingOrg}>
              {addingOrg ? "Saving..." : "Register Organization"}
            </button>
          </div>
        </form>
      )}

      {selectedOrgForOpp && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0 text-primary">Posting Opportunity for {selectedOrgForOpp.name}</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedOrgForOpp(null)}>
              ✕ Close Form
            </button>
          </div>
          <UploadOpportunityForm
            initialOrganization={selectedOrgForOpp.id}
            onSuccess={() => {
              setSelectedOrgForOpp(null);
              alert(`Opportunity successfully posted for ${selectedOrgForOpp.name}!`);
            }}
          />
        </div>
      )}

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
                        className="btn btn-outline-primary"
                        onClick={() => setSelectedOrgForOpp(org)}
                        title="Add new opportunity for this organization"
                      >
                        + Opportunity
                      </button>
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
