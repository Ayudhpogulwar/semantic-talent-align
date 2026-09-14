/**
 * SAIOTAF - Super Admin Module
 * AdminSignUpPage.jsx (Super Admin Registration)
 * Fields: Full Name, Gmail (email), Password, Secret Key
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Key, User, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function AdminSignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAdminSignUp = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedSecretKey = secretKey.trim();

    if (!trimmedName) {
      setError("Full Name is required.");
      return;
    }

    if (!trimmedEmail.endsWith("@raisoni.net")) {
      setError("Admin registration requires a valid @raisoni.net institutional email address.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (trimmedSecretKey.length !== 8) {
      setError("Secret Access Key must be exactly 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          secret_key: trimmedSecretKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Registration failed. Please verify your Secret Key.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/admin/login"), 2500);
    } catch (err) {
      console.error("Admin Registration Error:", err.message);
      setError(err.message || "Registration failed. Invalid Secret Key or email already registered.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: "var(--bg-dark)", color: "var(--text-main)" }}>
        <div className="glass-panel p-4 shadow-lg text-center" style={{ maxWidth: 440, width: "100%", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="mb-3" style={{ color: "#10b981" }}>
            <CheckCircle2 size={56} className="mx-auto" />
          </div>
          <h4 className="fw-bold mb-2" style={{ color: "var(--text-main)" }}>Admin Account Created!</h4>
          <p className="small mb-0" style={{ color: "var(--text-muted)" }}>
            Your admin account has been successfully registered. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5" style={{ background: "var(--bg-dark)", color: "var(--text-main)" }}>
      <div className="glass-panel p-4 shadow-lg" style={{ maxWidth: 480, width: "100%", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{
              width: 68, height: 68,
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              boxShadow: "0 0 20px rgba(244, 63, 94, 0.2)"
            }}
          >
            <ShieldCheck size={34} color="#f43f5e" />
          </div>
          <h3 className="fw-bold mb-1" style={{ color: "var(--text-main)" }}>Create Admin Account</h3>
          <p className="small mb-0" style={{ color: "var(--text-muted)" }}>SAIOTAF Framework • Admin Registration</p>
        </div>

        {/* Key requirement notice */}
        <div className="mb-3 p-2 rounded" style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", fontSize: "0.8rem", color: "#fb7185" }}>
          <Key size={13} className="me-1" />
          A valid 8-character Secret Access Key is required to create an admin account.
        </div>

        {error && (
          <div className="alert alert-danger py-2 text-start mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <AlertCircle size={16} className="flex-shrink-0" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminSignUp} className="text-start">
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>Full Name</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control faculty-search-input ps-4"
                placeholder="e.g. Rohit Kulkarni"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <User size={16} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
            </div>
          </div>

          {/* Gmail / Institutional Email */}
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>
              Institutional Email <span style={{ color: "#fb7185" }}>(@raisoni.net)</span>
            </label>
            <div className="position-relative">
              <input
                type="email"
                className="form-control faculty-search-input ps-4"
                placeholder="e.g. admin@raisoni.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control faculty-search-input ps-4 pe-5"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>Confirm Password</label>
            <div className="position-relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control faculty-search-input ps-4 pe-5"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Lock size={16} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="mb-4">
            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between" style={{ color: "var(--text-muted)" }}>
              <span>Secret Access Key</span>
              <span className="badge px-2 py-1 fw-bold rounded-pill" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.35)", fontSize: "0.7rem" }}>8 Chars Required</span>
            </label>
            <div className="position-relative">
              <input
                type="password"
                className="form-control faculty-search-input ps-4"
                placeholder="Enter 8-character Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                maxLength={8}
                required
              />
              <Key size={16} className="position-absolute text-danger" style={{ left: 10, top: 12 }} />
            </div>
            <small className="mt-1 d-block" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Required for admin registration security. Default key: <code className="text-warning px-1 rounded fw-bold" style={{ background: "var(--input-bg)" }}>SAI88202</code>
            </small>
          </div>

          <button type="submit" className="btn btn-danger w-100 py-2 fw-bold mb-3" disabled={loading}>
            {loading ? "Creating Account…" : "Register Admin Account"}
          </button>
        </form>

        <div className="text-center border-top pt-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
          <p className="small mb-1" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/admin/login" className="text-danger fw-semibold text-decoration-none">Sign In</Link>
          </p>
          <Link to="/" className="small text-decoration-none d-inline-flex align-items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={14} /> Return to Main Application
          </Link>
        </div>
      </div>
    </div>
  );
}
