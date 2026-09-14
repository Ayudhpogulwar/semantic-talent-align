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
      navigate("/faculty/student-verifications");
    }
  }, [isAuthenticated, navigate]);

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    const val = usernameOrEmail.trim();

    // If an email address is entered (contains '@'), validate that it ends with @raisoni.net
    if (val.includes("@")) {
      const emailRegex = /@raisoni\.net$/i;
      if (!emailRegex.test(val)) {
        setValidationError("Faculty access requires a valid @raisoni.net institutional email address.");
        return;
      }
    }

    try {
      const result = await login(val, password);
      if (!result.mfaRequired) navigate("/faculty/student-verifications");
    } catch {
      /* error is surfaced via useAuth().error */
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyMfa(otpCode);
      navigate("/faculty/student-verifications");
    } catch {
      /* error is surfaced via useAuth().error */
    }
  };

  const fillQuickLogin = (demoValue, pass) => {
    setUsernameOrEmail(demoValue);
    setPassword(pass);
    setValidationError("");
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: 'var(--bg-dark, #0b0f19)' }}>
      <div className="glass-panel p-1" style={{ width: 420, borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div className="card-body p-4 text-center">
          
          {/* Logo Section */}
          <Link to="/" className="d-flex align-items-center justify-content-center gap-2 mb-2 text-decoration-none" title="Go to Main Landing Page">
            <GraduationCap size={28} className="text-primary" />
            <h3 className="mb-0 fw-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>TalentAlign</h3>
            <span className="badge bg-primary ms-1 px-2 py-1" style={{ fontSize: "0.7rem", verticalAlign: "middle" }}>AI PORTAL</span>
          </Link>
          
          <p className="text-muted small mb-4">Semantic Opportunity Alignment System • Faculty Portal</p>
          <h5 className="text-start mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>Faculty Sign In</h5>

          {error && <div className="alert alert-danger py-2 text-start mb-3" style={{ fontSize: '0.85rem' }}>{error}</div>}

          {!mfaPending ? (
            <form onSubmit={handleCredentialsSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label text-muted small">Username or Institutional Email</label>
                <input
                  type="text"
                  className={`form-control ${validationError ? "is-invalid" : ""}`}
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    if (validationError) setValidationError("");
                  }}
                  placeholder="e.g. omi, FAC101 or name@raisoni.net"
                  required
                />
                {validationError && (
                  <div className="text-danger small mt-1" style={{ fontSize: '0.825rem', fontWeight: 500 }}>
                    {validationError}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Quick Fill Buttons */}
              <div className="mb-3">
                <div className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Quick Demo Fill:</div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" onClick={() => fillQuickLogin('omi', 'password123')} className="btn btn-outline-primary btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>omi</button>
                  <button type="button" onClick={() => fillQuickLogin('FAC101', 'password123')} className="btn btn-outline-secondary btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>FAC101</button>
                  <button type="button" onClick={() => fillQuickLogin('demo@raisoni.net', 'password123')} className="btn btn-outline-secondary btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>demo@raisoni.net</button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center" disabled={loading} style={{ padding: '10px', fontWeight: 600 }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="text-start">
              <p className="text-muted small">Enter the 6-digit code from your authenticator app.</p>
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

          <div className="mt-3 text-center border-top border-secondary pt-3">
            <p className="text-muted small mb-1">
              Don't have a faculty account? <Link to="/faculty/signup" className="text-primary text-decoration-none fw-semibold">Sign Up</Link>
            </p>
            <p className="text-muted small mb-1">
              <Link to="/faculty/forgot-password" className="text-primary text-decoration-none fw-semibold">Forgot Password?</Link>
            </p>
            <p className="text-muted small mb-0">
              <Link to="/" className="text-muted text-decoration-none">← Return to Main Portal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
