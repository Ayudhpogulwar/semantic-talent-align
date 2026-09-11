/**
 * SAIOTAF - Faculty & Moderator Module
 * AddOrganizationForm
 *
 * Form component for registering new organizations (Companies / NGOs).
 */

import React, { useState } from "react";
import { organizationApi } from "../api/facultyApi";
import "./FacultyCommon.css";

const INITIAL_STATE = {
  name: "",
  org_type: "COMPANY",
  website: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  notes: "",
};

export default function AddOrganizationForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Organization name is required.";
    if (!form.contact_name.trim()) newErrors.contact_name = "Contact name is required.";
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
        website: form.website.trim() || undefined,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      await organizationApi.create(payload);
      setForm(INITIAL_STATE);
      if (onSuccess) onSuccess();
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
      setSubmitError(err.response?.data?.detail || "Could not add organization. Please check the fields below.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="faculty-card p-4 border-0" onSubmit={handleSubmit} noValidate>
      <h5 className="mb-4 fw-bold" style={{ color: "#0f172a" }}>Add New Organization</h5>

      {submitError && (
        <div className="alert alert-danger border-0 bg-danger-subtle text-danger py-3 px-4 rounded-3 mb-4" role="alert">
          {submitError}
        </div>
      )}

      <div className="row g-3">
        {/* Name & Type */}
        <div className="col-md-8">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>
            Organization Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.name ? "is-invalid" : ""}`}
            placeholder="e.g. Acme Corporation"
            value={form.name}
            onChange={handleChange("name")}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>
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

        {/* Website & Contact Name */}
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>Website URL</label>
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
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>
            Contact Person Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.contact_name ? "is-invalid" : ""}`}
            placeholder="e.g. Jane Doe"
            value={form.contact_name}
            onChange={handleChange("contact_name")}
          />
          {errors.contact_name && <div className="invalid-feedback">{errors.contact_name}</div>}
        </div>

        {/* Contact Email & Contact Phone */}
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>
            Contact Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className={`form-control faculty-search-input ${errors.contact_email ? "is-invalid" : ""}`}
            placeholder="contact@example.com"
            value={form.contact_email}
            onChange={handleChange("contact_email")}
          />
          {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>Contact Phone</label>
          <input
            type="tel"
            className="form-control faculty-search-input"
            placeholder="+1 555-0199"
            value={form.contact_phone}
            onChange={handleChange("contact_phone")}
          />
        </div>

        {/* Notes */}
        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "#334155" }}>Notes / Background</label>
          <textarea
            className="form-control faculty-search-input"
            rows={3}
            placeholder="Additional context or notes about this organization..."
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
            {submitting ? "Saving Organization…" : "Add Organization"}
          </button>
        </div>
      </div>
    </form>
  );
}
