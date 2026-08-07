/**
 * SAIOTAF - Faculty & Moderator Module
 * FacultySignUpPage: user registration form.
 * Integrated with TalentAlign design system.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GraduationCap } from "lucide-react";

export default function FacultySignUpPage() {
  const { signup, error, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    employee_id: "",
    department: "",
    role: "MODERATOR",
  });

  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      // Exclude confirmPassword when sending to backend
      const { confirmPassword, ...payload } = formData;
      await signup(payload);
      navigate("/faculty");
    } catch (err) {
      // Error handled by useAuth context error
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div className="glass-panel p-1" style={{ width: 500 }}>
        <div className="card-body p-4">
          
          {/* Logo Section */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <GraduationCap size={28} className="text-primary" />
            <h3 className="mb-0 fw-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>TalentAlign</h3>
            <span className="badge bg-primary ms-1 px-2 py-1" style={{ fontSize: "0.7rem", verticalAlign: "middle" }}>AI PORTAL</span>
          </div>

          <p className="text-secondary text-center small mb-4">Semantic Opportunity Alignment System</p>
          <h5 className="mb-3 text-white" style={{ fontFamily: "var(--font-heading)" }}>Faculty Registration</h5>

          {(localError || error) && (
            <div className="alert alert-danger py-2 mb-3">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  name="employee_id"
                  className="form-control"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Portal Role</label>
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="MODERATOR">Moderator</option>
                  <option value="PLACEMENT_OFFICER">Placement Officer</option>
                  <option value="DEPARTMENT_ADMIN">Department Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center" disabled={loading}>
              {loading ? "Registering…" : "Register Account"}
            </button>

            <div className="text-center small">
              <span className="text-secondary">Already have an account? </span>
              <Link to="/faculty/login" className="text-primary fw-medium text-decoration-none">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
