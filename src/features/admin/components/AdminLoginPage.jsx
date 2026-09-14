/**
 * SAIOTAF - Super Admin Module
 * AdminLoginPage.jsx (Super Admin Authentication & Provisioning Portal)
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Key, User, ArrowLeft, AlertCircle, CheckCircle2, UserPlus, LogIn, Copy, Check } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Registration Success Modal state
  const [registeredKey, setRegisteredKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggleMode = (signUpState) => {
    setIsSignUp(signUpState);
    setError("");
    setRegisteredKey(null);
  };

  const handleCopyKey = () => {
    if (registeredKey) {
      navigator.clipboard.writeText(registeredKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedSecretKey = secretKey.trim();

    if (isSignUp && !trimmedName) {
      setError("Full Name is required for admin registration.");
      return;
    }

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email Address and Password are required.");
      return;
    }

    if (!isSignUp && !trimmedSecretKey) {
      setError("Secret Access Key is required to sign in.");
      return;
    }

    if (trimmedSecretKey && trimmedSecretKey.length !== 8) {
      setError("Secret Access Key must be exactly 8 characters.");
      return;
    }

    setLoading(true);

    const endpoint = isSignUp 
      ? "http://127.0.0.1:8000/api/admin/auth/signup/" 
      : "http://127.0.0.1:8000/api/admin/auth/login/";

    const payload = isSignUp
      ? { full_name: trimmedName, email: trimmedEmail, password: trimmedPassword, secret_key: trimmedSecretKey || "SAI88202" }
      : { email: trimmedEmail, password: trimmedPassword, secret_key: trimmedSecretKey };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (isSignUp) {
        const assignedKey = data.secret_key || trimmedSecretKey || "SAI88202";
        setRegisteredKey(assignedKey);
        setSecretKey(assignedKey);
        return;
      }

      localStorage.setItem("saiotaf_admin_token", data.token || "admin_jwt_super_access_token_2026");
      localStorage.setItem("saiotaf_user_role", "SUPER_ADMIN");
      localStorage.setItem("saiotaf_admin_email", trimmedEmail);

      navigate("/admin/overview");

    } catch (err) {
      console.error("Admin Authentication Error:", err.message);
      setError(err.message || "Unauthorized: Invalid Secret Access Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSignIn = () => {
    setIsSignUp(false);
    setRegisteredKey(null);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-4 px-3" style={{ background: "var(--bg-dark)", color: "var(--text-main)" }}>
      <div 
        className="glass-panel p-3.5 p-sm-4 shadow-lg text-center" 
        style={{ 
          maxWidth: 380, 
          width: "100%", 
          borderRadius: "16px", 
          background: "var(--bg-card)", 
          border: "1px solid var(--border-color)" 
        }}
      >
        <div className="mb-3">
          <div
            className="p-2.5 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{
              width: 56,
              height: 56,
              background: isSignUp ? "rgba(59, 130, 246, 0.15)" : "rgba(244, 63, 94, 0.15)",
              border: isSignUp ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid rgba(244, 63, 94, 0.35)",
              boxShadow: isSignUp ? "0 0 16px rgba(59, 130, 246, 0.2)" : "0 0 16px rgba(244, 63, 94, 0.2)",
              transition: "all 0.3s ease"
            }}
          >
            {isSignUp ? <UserPlus size={28} color="#3b82f6" /> : <ShieldCheck size={28} color="#f43f5e" />}
          </div>
          <h4 className="fw-bold mb-1 fs-5" style={{ color: "var(--text-main)" }}>{isSignUp ? "Super Admin Register" : "Super Admin Portal"}</h4>
          <p className="small mb-0" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>SAIOTAF Framework • Tier 3 Administrative Oversight</p>
        </div>

        {registeredKey ? (
          <div className="text-start py-2">
            <div className="alert alert-success p-2.5 mb-3 rounded-3" style={{ fontSize: "0.82rem" }}>
              <div className="d-flex align-items-center gap-2 font-semibold mb-1 text-success">
                <CheckCircle2 size={16} /> <span>Admin Account Provisioned!</span>
              </div>
              <p className="mb-0 text-secondary" style={{ fontSize: "0.75rem" }}>
                Your account is active. Below is your assigned <strong>Secret Access Key</strong>.
              </p>
            </div>

            <div className="p-3 mb-3 rounded-3 text-center" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
              <small className="text-muted d-block mb-1" style={{ fontSize: "0.7rem" }}>YOUR SECRET ACCESS KEY</small>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="fs-5 font-monospace text-warning fw-bold tracking-wider">{registeredKey}</span>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-warning p-1 ms-1 d-inline-flex align-items-center gap-1"
                  onClick={handleCopyKey}
                  style={{ fontSize: "0.7rem" }}
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <p className="text-danger small mb-3 text-center" style={{ fontSize: "0.72rem" }}>
              ⚠️ Keep this key safe. You must enter this key every time you sign in.
            </p>

            <button
              type="button"
              className="btn btn-danger w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={handleProceedToSignIn}
              style={{ fontSize: "0.85rem" }}
            >
              <LogIn size={16} /> Continue to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="d-flex p-1 mb-3 rounded-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)" }}>
              <button
                type="button"
                className={`btn btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1.5 py-1.5 ${!isSignUp ? 'btn-danger shadow' : 'text-secondary border-0'}`}
                style={{ borderRadius: "6px", fontSize: "0.8rem", transition: "all 0.2s" }}
                onClick={() => toggleMode(false)}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1.5 py-1.5 ${isSignUp ? 'btn-primary shadow' : 'text-secondary border-0'}`}
                style={{ borderRadius: "6px", fontSize: "0.8rem", transition: "all 0.2s" }}
                onClick={() => toggleMode(true)}
              >
                <UserPlus size={14} /> Register
              </button>
            </div>

            {error && (
              <div className="alert alert-danger py-1.5 px-2.5 text-start mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
                <AlertCircle size={15} className="flex-shrink-0" /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuth} className="text-start">
              {isSignUp && (
                <div className="mb-2.5">
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Admin Full Name</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control faculty-search-input ps-4"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      style={{ fontSize: "0.85rem", height: "38px" }}
                    />
                    <User size={15} className="position-absolute text-muted" style={{ left: 10, top: 11 }} />
                  </div>
                </div>
              )}

              <div className="mb-2.5">
                <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Admin Email Address</label>
                <div className="position-relative">
                  <input
                    type="email"
                    className="form-control faculty-search-input ps-4"
                    placeholder="e.g. admin@raisoni.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: "0.85rem", height: "38px" }}
                  />
                  <Mail size={15} className="position-absolute text-muted" style={{ left: 10, top: 11 }} />
                </div>
              </div>

              <div className="mb-2.5">
                <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Password</label>
                <div className="position-relative">
                  <input
                    type="password"
                    className="form-control faculty-search-input ps-4"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontSize: "0.85rem", height: "38px" }}
                  />
                  <Lock size={15} className="position-absolute text-muted" style={{ left: 10, top: 11 }} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold mb-1 d-flex align-items-center justify-content-between" style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  <span>Secret Access Key</span>
                  <span className="badge px-2 py-0.5 fw-bold rounded-pill" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.35)", fontSize: "0.65rem" }}>8 Chars Required</span>
                </label>
                <div className="position-relative">
                  <input
                    type="password"
                    className="form-control faculty-search-input ps-4"
                    placeholder={isSignUp ? "Set 8-char Secret Key (or default: SAI88202)" : "Enter your 8-character Secret Key"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    maxLength={8}
                    required={!isSignUp}
                    style={{ fontSize: "0.85rem", height: "38px" }}
                  />
                  <Key size={15} className="position-absolute text-danger" style={{ left: 10, top: 11 }} />
                </div>
                <small className="mt-1 d-block" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {isSignUp 
                    ? "Assign your custom 8-char Secret Key or leave blank to assign default key." 
                    : "Enter the secret key assigned during admin registration."}
                </small>
              </div>

              <button
                type="submit"
                className={`btn ${isSignUp ? 'btn-primary' : 'btn-danger'} w-100 py-2 fw-bold mb-2.5`}
                disabled={loading}
                style={{ fontSize: "0.85rem" }}
              >
                {loading
                  ? (isSignUp ? "Creating Super Admin…" : "Authenticating Admin…")
                  : (isSignUp ? "Register Super Admin Account" : "Access Super Admin Console")}
              </button>
            </form>

            <div className="border-top pt-2.5 mt-2 d-flex flex-column align-items-center gap-1.5" style={{ borderColor: "var(--border-color)" }}>
              <button
                type="button"
                className="btn btn-link text-decoration-none p-0 text-info"
                onClick={() => toggleMode(!isSignUp)}
                style={{ fontSize: "0.78rem" }}
              >
                {isSignUp ? "Already registered? Sign In" : "Need to register a new admin? Register"}
              </button>

              <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-1" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                <ArrowLeft size={13} /> Return to Main Application
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
