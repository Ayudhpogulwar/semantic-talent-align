/**
 * SAIOTAF - Faculty & Moderator Module
 * FacultyForgotPasswordPage: Reset password request and submission for Faculty.
 * Integrated with TalentAlign design system.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function FacultyForgotPasswordPage() {
  const navigate = useNavigate();
  const [emailOrId, setEmailOrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate API call for password reset request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="glass-panel p-1" style={{ width: 420 }}>
        <div className="card-body p-4 text-center">
          
          {/* Logo Section */}
          <Link to="/" className="d-flex align-items-center justify-content-center gap-2 mb-2 text-decoration-none" title="Go to Main Landing Page">
            <GraduationCap size={28} className="text-primary" />
            <h3 className="mb-0 fw-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>TalentAlign</h3>
          </Link>
          
          <p className="text-secondary small mb-4">Faculty & Moderator Portal</p>

          {!submitted ? (
            <>
              <h5 className="text-start mb-2 text-white" style={{ fontFamily: "var(--font-heading)" }}>
                Reset Password
              </h5>
              <p className="text-secondary small text-start mb-4">
                Enter your Employee ID or institutional email address. We'll send you a password reset link.
              </p>

              {error && <div className="alert alert-danger py-2 text-start mb-3">{error}</div>}

              <form onSubmit={handleSubmit} className="text-start">
                <div className="mb-4">
                  <label className="form-label">Employee ID or Email</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP12345 or prof@university.edu"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center"
                  disabled={loading}
                >
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-3 text-center">
              <div className="mb-3 text-success">
                <CheckCircle2 size={48} className="mx-auto" />
              </div>
              <h5 className="text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Reset Link Sent
              </h5>
              <p className="text-secondary small mb-4">
                If an account exists for <strong className="text-light">{emailOrId}</strong>, you will receive password reset instructions shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn btn-outline-secondary btn-sm mb-2"
              >
                Try another ID / Email
              </button>
            </div>
          )}

          <div className="mt-4 text-center border-top border-secondary pt-3">
            <Link to="/faculty/login" className="text-primary text-decoration-none small d-inline-flex align-items-center gap-1">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
