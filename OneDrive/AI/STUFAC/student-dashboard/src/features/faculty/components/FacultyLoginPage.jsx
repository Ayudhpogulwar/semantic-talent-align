/**
 * SAIOTAF - Faculty & Moderator Module
 * FacultyLoginPage: two-step form (credentials -> optional MFA code).
 * Integrated with TalentAlign design system.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GraduationCap } from "lucide-react";

export default function FacultyLoginPage() {
  const { login, verifyMfa, mfaPending, error, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/faculty");
    }
  }, [isAuthenticated, navigate]);

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(employeeId, password);
      if (!result.mfaRequired) navigate("/faculty");
    } catch {
      /* error is surfaced via useAuth().error */
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyMfa(otpCode);
      navigate("/faculty");
    } catch {
      /* error is surfaced via useAuth().error */
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="glass-panel p-1" style={{ width: 400 }}>
        <div className="card-body p-4 text-center">
          
          {/* Logo Section */}
          <Link to="/" className="d-flex align-items-center justify-content-center gap-2 mb-2 text-decoration-none" title="Go to Main Landing Page">
            <GraduationCap size={28} className="text-primary" />
            <h3 className="mb-0 fw-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>TalentAlign</h3>
          </Link>
          
          <p className="text-secondary small mb-4">Semantic Opportunity Alignment System</p>
          <h5 className="text-start mb-3 text-white" style={{ fontFamily: "var(--font-heading)" }}>Sign In</h5>

          {error && <div className="alert alert-danger py-2 text-start mb-3">{error}</div>}

          {!mfaPending ? (
            <form onSubmit={handleCredentialsSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label">Employee ID or Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0">Password</label>
                  <Link to="/faculty/forgot-password" className="text-primary small text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
              <div className="text-center small">
                <span className="text-secondary">Don't have an account? </span>
                <Link to="/faculty/signup" className="text-primary fw-medium text-decoration-none">Sign Up</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="text-start">
              <p className="text-secondary small">Enter the 6-digit code from your authenticator app.</p>
              <div className="mb-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="form-control text-center fs-4"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
            </form>
          )}

          <div className="mt-4 text-center border-top border-secondary pt-3">
            <p className="text-secondary small mb-1">
              Don't have a faculty account? <Link to="/faculty/signup" className="text-primary text-decoration-none">Sign Up</Link>
            </p>
            <p className="text-secondary small mb-0">
              <Link to="/" className="text-secondary text-decoration-none">← Return to Main Portal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
