/**
 * SAIOTAF - Faculty & Moderator Module
 * AddOrganizationForm
 *
 * Form component for registering and updating organizations (Companies / NGOs).
 * Supports mandatory Contact Role (HR / Recruiter, etc.) and updating existing organizations.
 */

import React, { useState } from "react";
import { organizationApi } from "../api/facultyApi";
import "./FacultyCommon.css";

const PRESET_ROLES = [
  "HR / Human Resources",
  "HR Manager",
  "Talent Acquisition Lead",
  "Campus Recruitment Lead",
  "Technical Hiring Manager",
  "Talent Partner / Recruiter",
  "Director / Founder / CEO",
  "Other"
];

export default function AddOrganizationForm({ onSuccess, onCancel, initialData = null }) {
  const isEdit = Boolean(initialData && initialData.id);

  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    org_type: initialData?.org_type || "COMPANY",
    location: initialData?.location || "Nagpur, Maharashtra",
    website: initialData?.website || "",
    contact_name: initialData?.contact_name || "",
    contact_role: initialData?.contact_role || "HR / Human Resources",
    contact_email: initialData?.contact_email || "",
    contact_phone: initialData?.contact_phone || "",
    description: initialData?.description || "",
    notes: initialData?.notes || "",
  }));

  const [isCustomRole, setIsCustomRole] = useState(() => {
    if (!initialData?.contact_role) return false;
    return !PRESET_ROLES.includes(initialData.contact_role);
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRoleSelect = (e) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsCustomRole(true);
      setForm((prev) => ({ ...prev, contact_role: "" }));
    } else {
      setIsCustomRole(false);
      setForm((prev) => ({ ...prev, contact_role: val }));
    }
    if (errors.contact_role) {
      setErrors((prev) => ({ ...prev, contact_role: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Organization name is required.";
    if (!form.contact_name.trim()) newErrors.contact_name = "Contact person's name is required.";
    if (!form.contact_role.trim()) {
      newErrors.contact_role = "Contact person's role (e.g. HR, Talent Acquisition) is required.";
    }
    if (!form.contact_email.trim()) {
      newErrors.contact_email = "Contact email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      newErrors.contact_email = "Please enter a valid email address.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        org_type: form.org_type,
        location: form.location.trim() || "Nagpur, Maharashtra",
        website: form.website.trim() || undefined,
        contact_name: form.contact_name.trim(),
        contact_role: form.contact_role.trim() || "HR / Recruiter",
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || undefined,
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit) {
        // --- Update Existing Organization ---
        const targetId = initialData.id;
        try {
          await organizationApi.update(targetId, payload);
        } catch (apiErr) {
          console.warn("Updated organization locally:", apiErr);
        }

        const updatedOrg = {
          ...initialData,
          ...payload,
          id: targetId,
          website: payload.website || "",
          contact_phone: payload.contact_phone || "",
          description: payload.description || "",
        };

        // Update localStorage
        try {
          const stored = localStorage.getItem("stufac_organizations");
          if (stored) {
            const list = JSON.parse(stored);
            const nextList = list.map((item) =>
              String(item.id) === String(targetId) ? { ...item, ...updatedOrg } : item
            );
            localStorage.setItem("stufac_organizations", JSON.stringify(nextList));
          }
        } catch (e) {
          console.error("Local storage error:", e);
        }

        if (onSuccess) onSuccess(updatedOrg);
      } else {
        // --- Create New Organization ---
        const newOrg = {
          id: `ORG-${Date.now().toString().slice(-4)}`,
          name: payload.name,
          org_type: payload.org_type,
          location: payload.location,
          website: payload.website || "",
          contact_name: payload.contact_name,
          contact_role: payload.contact_role,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone || "",
          verification_status: "VERIFIED",
          description: payload.description || "Partnered institution providing technical training, internships, and placement opportunities.",
          notes: payload.notes || ""
        };

        try {
          const res = await organizationApi.create(payload);
          if (res?.data?.id) newOrg.id = res.data.id;
        } catch (apiErr) {
          console.warn("Created organization locally:", apiErr);
        }

        try {
          const stored = localStorage.getItem("stufac_organizations");
          let list = stored ? JSON.parse(stored) : [];
          list.unshift(newOrg);
          localStorage.setItem("stufac_organizations", JSON.stringify(list));
        } catch (e) {
          console.error(e);
        }

        if (onSuccess) onSuccess(newOrg);
      }
    } catch (err) {
      if (err.response?.data) {
        const serverErrors = err.response.data;
        if (typeof serverErrors === "object") {
          const fieldErrors = {};
          Object.keys(serverErrors).forEach((key) => {
            fieldErrors[key] = Array.isArray(serverErrors[key])
              ? serverErrors[key].join(" ")
              : serverErrors[key];
          });
          setErrors(fieldErrors);
        }
      }
      setSubmitError(err.response?.data?.detail || `Could not ${isEdit ? "update" : "add"} organization. Please check the fields.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="faculty-card p-4 border-0" onSubmit={handleSubmit} noValidate>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1 fw-bold" style={{ color: "var(--text-main)" }}>
            {isEdit ? "Update Organization Information" : "Add New Organization"}
          </h5>
          <p className="text-muted small mb-0">
            {isEdit
              ? `Editing profile and contact credentials for ${initialData.name}`
              : "Register a partner company or NGO with official contact & HR details."}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {submitError && (
        <div className="alert alert-danger border-0 bg-danger-subtle text-danger py-3 px-4 rounded-3 mb-4" role="alert">
          {submitError}
        </div>
      )}

      <div className="row g-3">
        {/* Name & Type */}
        <div className="col-md-8">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Organization Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.name ? "is-invalid" : ""}`}
            placeholder="e.g. Acme Corporation or Google India"
            value={form.name}
            onChange={handleChange("name")}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Type <span className="text-danger">*</span>
          </label>
          <select
            className="form-select faculty-select-filter"
            value={form.org_type}
            onChange={handleChange("org_type")}
          >
            <option value="COMPANY">Company</option>
            <option value="NGO">NGO</option>
          </select>
        </div>

        {/* Website & Location */}
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Website URL</label>
          <input
            type="url"
            className={`form-control faculty-search-input ${errors.website ? "is-invalid" : ""}`}
            placeholder="https://example.com"
            value={form.website}
            onChange={handleChange("website")}
          />
          {errors.website && <div className="invalid-feedback">{errors.website}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Location / City</label>
          <input
            type="text"
            className="form-control faculty-search-input"
            placeholder="e.g. Mumbai / Nagpur, Maharashtra"
            value={form.location}
            onChange={handleChange("location")}
          />
        </div>

        {/* Section Header for Contact Person & HR details */}
        <div className="col-12 mt-4 pt-2 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary px-2 py-1" style={{ fontSize: "0.75rem" }}>CONTACT CREDENTIALS</span>
            <h6 className="mb-0 fw-bold" style={{ color: "var(--text-main)" }}>Contact Person &amp; Role Details</h6>
          </div>
          <p className="text-muted small mb-3">Specify the company representative or HR coordinator for campus drives.</p>
        </div>

        {/* Contact Name & Role */}
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Contact Person Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.contact_name ? "is-invalid" : ""}`}
            placeholder="e.g. Rajesh Kumar"
            value={form.contact_name}
            onChange={handleChange("contact_name")}
          />
          {errors.contact_name && <div className="invalid-feedback">{errors.contact_name}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Role / Designation (e.g. HR) <span className="text-danger">*</span>
          </label>
          
          <div className="d-flex gap-2">
            <select
              className="form-select faculty-select-filter"
              value={isCustomRole ? "Other" : (PRESET_ROLES.includes(form.contact_role) ? form.contact_role : "Other")}
              onChange={handleRoleSelect}
              style={{ minWidth: isCustomRole ? "160px" : "100%" }}
            >
              {PRESET_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {isCustomRole && (
              <input
                type="text"
                className={`form-control faculty-search-input ${errors.contact_role ? "is-invalid" : ""}`}
                placeholder="Specify Role (e.g. Chief HR Officer)"
                value={form.contact_role}
                onChange={handleChange("contact_role")}
                autoFocus
              />
            )}
          </div>
          {errors.contact_role && (
            <div className="text-danger small mt-1" style={{ fontSize: "0.85rem" }}>
              {errors.contact_role}
            </div>
          )}
        </div>

        {/* Contact Email & Phone */}
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Contact Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className={`form-control faculty-search-input ${errors.contact_email ? "is-invalid" : ""}`}
            placeholder="hr.recruitment@company.com"
            value={form.contact_email}
            onChange={handleChange("contact_email")}
          />
          {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Contact Phone</label>
          <input
            type="tel"
            className="form-control faculty-search-input"
            placeholder="+91 98765 43210"
            value={form.contact_phone}
            onChange={handleChange("contact_phone")}
          />
        </div>

        {/* Description */}
        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Company Description / Overview</label>
          <textarea
            className="form-control faculty-search-input"
            rows={3}
            placeholder="Brief overview of company business lines, core tech stack, or student hiring tracks..."
            value={form.description}
            onChange={handleChange("description")}
          />
        </div>

        {/* Notes */}
        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Additional Notes / Internal Remarks</label>
          <textarea
            className="form-control faculty-search-input"
            rows={2}
            placeholder="Internal coordination notes (e.g. MoUs signed, eligible departments, etc.)..."
            value={form.notes}
            onChange={handleChange("notes")}
          />
        </div>

        {/* Form Actions */}
        <div className="col-12 d-flex gap-3 justify-content-end mt-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 fw-semibold"
              style={{ borderRadius: "8px" }}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary px-4 py-2 fw-bold"
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb", borderRadius: "8px" }}
            disabled={submitting}
          >
            {submitting ? (isEdit ? "Updating Organization…" : "Saving Organization…") : (isEdit ? "Update Organization" : "Add Organization")}
          </button>
        </div>
      </div>
    </form>
  );
}
