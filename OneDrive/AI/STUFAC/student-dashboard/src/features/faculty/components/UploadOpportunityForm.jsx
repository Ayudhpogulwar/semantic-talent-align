/**
 * SAIOTAF - Faculty & Moderator Module
 * UploadOpportunityForm  (FR-FAC-04)
 *
 * Structured, client-validated form for posting Internship/NGO
 * opportunities. Client-side validation mirrors (but does not replace)
 * the server-side OpportunitySerializer validation -- server is the
 * source of truth; this is purely UX.
 */

import React, { useState } from "react";
import { opportunityApi, organizationApi } from "../api/facultyApi";

const INITIAL_STATE = {
  organization: "",
  title: "",
  opportunity_type: "INTERNSHIP",
  description: "",
  required_skills: "", // comma-separated in the UI, converted to array on submit
  is_unpaid: false,
  compensation_amount: "",
  work_mode: "REMOTE",
  location: "",
  duration_weeks: "",
  application_deadline: "",
  positions_available: 1,
};

function validate(form) {
  const errors = {};

  if (!form.organization) errors.organization = "Organization is required.";
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.description.trim() || form.description.trim().length < 30) {
    errors.description = "Description must be at least 30 characters.";
  }
  if (!form.required_skills.trim()) {
    errors.required_skills = "At least one required skill must be listed.";
  }
  if (!form.is_unpaid && !form.compensation_amount) {
    errors.compensation_amount = "Required unless marked unpaid.";
  }
  if (form.compensation_amount && Number(form.compensation_amount) < 0) {
    errors.compensation_amount = "Compensation cannot be negative.";
  }
  if (!form.application_deadline) {
    errors.application_deadline = "Application deadline is required.";
  } else if (new Date(form.application_deadline) <= new Date()) {
    errors.application_deadline = "Deadline must be in the future.";
  }
  if (!form.positions_available || Number(form.positions_available) < 1) {
    errors.positions_available = "At least 1 position must be available.";
  }

  return errors;
}

export default function UploadOpportunityForm({ onSuccess, initialOrganization = "" }) {
  const [form, setForm] = useState({
    ...INITIAL_STATE,
    organization: initialOrganization || "",
  });
  const [errors, setErrors] = useState({});
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  React.useEffect(() => {
    organizationApi
      .list({ verification_status: "VERIFIED" })
      .then(({ data }) => setOrganizations(data.results ?? data))
      .catch(() => setOrganizations([]));
  }, []);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setSubmitError(null);

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        organization: form.organization,
        title: form.title.trim(),
        opportunity_type: form.opportunity_type,
        description: form.description.trim(),
        required_skills: form.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_unpaid: form.is_unpaid,
        compensation_amount: form.is_unpaid ? null : Number(form.compensation_amount),
        work_mode: form.work_mode,
        location: form.location.trim() || null,
        duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
        application_deadline: new Date(form.application_deadline).toISOString(),
        positions_available: Number(form.positions_available),
      };

      const { data } = await opportunityApi.create(payload);
      setSubmitSuccess(true);
      setForm(INITIAL_STATE);
      onSuccess?.(data);
    } catch (err) {
      const apiErrors = err.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        // Map server-side field errors back onto the form
        const mapped = {};
        Object.entries(apiErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
        });
        setErrors((prev) => ({ ...prev, ...mapped }));
      }
      setSubmitError("Could not create opportunity. Please review the highlighted fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="upload-opportunity-form glass-panel p-4" onSubmit={handleSubmit} noValidate>
      <h4 className="mb-3">Post New Opportunity</h4>

      {submitSuccess && (
        <div className="alert alert-success" role="status">
          Opportunity submitted for approval.
        </div>
      )}
      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">
            Organization <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errors.organization ? "is-invalid" : ""}`}
            value={form.organization}
            onChange={handleChange("organization")}
          >
            <option value="">Select organization…</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.org_type})
              </option>
            ))}
          </select>
          {errors.organization && <div className="invalid-feedback">{errors.organization}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">
            Opportunity Type <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={form.opportunity_type}
            onChange={handleChange("opportunity_type")}
          >
            <option value="INTERNSHIP">Internship</option>
            <option value="NGO">NGO</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.title ? "is-invalid" : ""}`}
            value={form.title}
            onChange={handleChange("title")}
            placeholder="e.g. Backend Engineering Intern"
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="col-12">
          <label className="form-label">
            Role Description <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control ${errors.description ? "is-invalid" : ""}`}
            rows={4}
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Describe responsibilities, expectations, and team context…"
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div className="col-12">
          <label className="form-label">
            Required Skills <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.required_skills ? "is-invalid" : ""}`}
            value={form.required_skills}
            onChange={handleChange("required_skills")}
            placeholder="Comma-separated, e.g. Python, Django, REST APIs"
          />
          <div className="form-text">
            Feeds the Semantic AI engine's skill-matching pipeline — be specific.
          </div>
          {errors.required_skills && <div className="invalid-feedback">{errors.required_skills}</div>}
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="isUnpaid"
              checked={form.is_unpaid}
              onChange={handleChange("is_unpaid")}
            />
            <label className="form-check-label" htmlFor="isUnpaid">
              Unpaid
            </label>
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label">Compensation (INR/month)</label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors.compensation_amount ? "is-invalid" : ""}`}
            value={form.compensation_amount}
            onChange={handleChange("compensation_amount")}
            disabled={form.is_unpaid}
          />
          {errors.compensation_amount && (
            <div className="invalid-feedback">{errors.compensation_amount}</div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label">Work Mode</label>
          <select className="form-select" value={form.work_mode} onChange={handleChange("work_mode")}>
            <option value="REMOTE">Remote</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Duration (weeks)</label>
          <input
            type="number"
            min="1"
            className="form-control"
            value={form.duration_weeks}
            onChange={handleChange("duration_weeks")}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-control"
            value={form.location}
            onChange={handleChange("location")}
            placeholder="City, or 'Remote'"
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">
            Application Deadline <span className="text-danger">*</span>
          </label>
          <input
            type="datetime-local"
            className={`form-control ${errors.application_deadline ? "is-invalid" : ""}`}
            value={form.application_deadline}
            onChange={handleChange("application_deadline")}
          />
          {errors.application_deadline && (
            <div className="invalid-feedback">{errors.application_deadline}</div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label">
            Positions Available <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="1"
            className={`form-control ${errors.positions_available ? "is-invalid" : ""}`}
            value={form.positions_available}
            onChange={handleChange("positions_available")}
          />
          {errors.positions_available && (
            <div className="invalid-feedback">{errors.positions_available}</div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setForm(INITIAL_STATE)}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit for Approval"}
        </button>
      </div>
    </form>
  );
}
