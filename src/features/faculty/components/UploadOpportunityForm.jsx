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

export default function UploadOpportunityForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [organizations, setOrganizations] = useState(getStoredOrgs);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  React.useEffect(() => {
    async function loadOrgs() {
      const localList = getStoredOrgs();
      try {
        const { data } = await organizationApi.list();
        const apiData = data.results ?? data ?? [];
        let merged = [...localList];
        if (Array.isArray(apiData)) {
          apiData.forEach((item) => {
            if (!merged.some((m) => String(m.id) === String(item.id) || m.name.toLowerCase() === item.name.toLowerCase())) {
              merged.push({
                id: item.id || `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
                name: item.name,
                org_type: item.org_type || "COMPANY",
                verification_status: item.verification_status || "VERIFIED"
              });
            }
          });
        }
        setOrganizations(merged);
      } catch (err) {
        setOrganizations(localList);
      }
    }
    loadOrgs();
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

      const selectedOrg = organizations.find((o) => String(o.id) === String(form.organization));
      const orgName = selectedOrg ? selectedOrg.name : "Partner Organization";

      const newOp = {
        id: `OPP-${Date.now().toString().slice(-4)}`,
        title: payload.title,
        organization_name: orgName,
        opportunity_type: payload.opportunity_type,
        work_mode: payload.work_mode,
        application_deadline: payload.application_deadline,
        status: "PENDING_APPROVAL",
        created_at: new Date().toISOString()
      };

      try {
        const res = await opportunityApi.create(payload);
        if (res?.data?.id) newOp.id = res.data.id;
      } catch (apiErr) {
        console.warn("Created opportunity locally:", apiErr);
      }

      try {
        const stored = localStorage.getItem("stufac_opportunities");
        let list = stored ? JSON.parse(stored) : [];
        list.unshift(newOp);
        localStorage.setItem("stufac_opportunities", JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }

      setSubmitSuccess(true);
      setForm(INITIAL_STATE);
      onSuccess?.(newOp);
    } catch (err) {
      const apiErrors = err.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
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
    <form className="upload-opportunity-form faculty-card p-4 border-0" onSubmit={handleSubmit} noValidate>
      <h4 className="mb-3 fw-bold" style={{ color: "var(--text-main)" }}>Post New Opportunity</h4>

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
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Organization <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select faculty-select-filter ${errors.organization ? "is-invalid" : ""}`}
            value={form.organization}
            onChange={handleChange("organization")}
          >
            <option value="" style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>Select organization…</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id} style={{ background: "var(--input-bg)", color: "var(--text-main)" }}>
                {org.name} ({org.org_type})
              </option>
            ))}
          </select>
          {errors.organization && <div className="invalid-feedback">{errors.organization}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Opportunity Type <span className="text-danger">*</span>
          </label>
          <select
            className="form-select faculty-select-filter"
            value={form.opportunity_type}
            onChange={handleChange("opportunity_type")}
          >
            <option value="INTERNSHIP">Internship</option>
            <option value="JOB">Job</option>
            <option value="NGO">NGO</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.title ? "is-invalid" : ""}`}
            value={form.title}
            onChange={handleChange("title")}
            placeholder="e.g. Backend Engineering Intern"
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Role Description <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control faculty-search-input ${errors.description ? "is-invalid" : ""}`}
            rows={4}
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Describe responsibilities, expectations, and team context…"
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Required Skills <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control faculty-search-input ${errors.required_skills ? "is-invalid" : ""}`}
            value={form.required_skills}
            onChange={handleChange("required_skills")}
            placeholder="Comma-separated, e.g. Python, Django, REST APIs"
          />
          <div className="form-text mt-1" style={{ color: "var(--text-muted)" }}>
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
            <label className="form-check-label fw-semibold" htmlFor="isUnpaid" style={{ color: "var(--text-main)" }}>
              Unpaid
            </label>
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Compensation (INR/month)</label>
          <input
            type="number"
            min="0"
            className={`form-control faculty-search-input ${errors.compensation_amount ? "is-invalid" : ""}`}
            value={form.compensation_amount}
            onChange={handleChange("compensation_amount")}
            disabled={form.is_unpaid}
          />
          {errors.compensation_amount && (
            <div className="invalid-feedback">{errors.compensation_amount}</div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Work Mode</label>
          <select className="form-select faculty-select-filter" value={form.work_mode} onChange={handleChange("work_mode")}>
            <option value="REMOTE">Remote</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Duration (weeks)</label>
          <input
            type="number"
            min="1"
            className="form-control faculty-search-input"
            value={form.duration_weeks}
            onChange={handleChange("duration_weeks")}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>Location</label>
          <input
            type="text"
            className="form-control faculty-search-input"
            value={form.location}
            onChange={handleChange("location")}
            placeholder="City, or 'Remote'"
          />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Application Deadline <span className="text-danger">*</span>
          </label>
          <input
            type="datetime-local"
            className={`form-control faculty-search-input ${errors.application_deadline ? "is-invalid" : ""}`}
            value={form.application_deadline}
            onChange={handleChange("application_deadline")}
          />
          {errors.application_deadline && (
            <div className="invalid-feedback">{errors.application_deadline}</div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold" style={{ color: "var(--text-muted)" }}>
            Positions Available <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="1"
            className={`form-control faculty-search-input ${errors.positions_available ? "is-invalid" : ""}`}
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
          className="btn btn-outline-secondary px-4 py-2 fw-semibold"
          style={{ borderRadius: "8px" }}
          onClick={() => setForm(INITIAL_STATE)}
          disabled={submitting}
        >
          Reset
        </button>
        <button
          type="submit"
          className="btn btn-primary px-4 py-2 fw-bold"
          style={{ backgroundColor: "#2563eb", borderColor: "#2563eb", borderRadius: "8px" }}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit for Approval"}
        </button>
      </div>
    </form>
  );
}
