/**
 * SAIOTAF - Super Admin Module
 * AdminLoginPage.jsx (Super Admin Sign In)
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Key, ArrowLeft, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedSecretKey = secretKey.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedSecretKey) {
      setError("Unauthorized: All fields (Email, Password, and Secret Access Key) are required.");
      return;
    }

    if (trimmedSecretKey.length !== 8) {
      setError("Unauthorized: Secret Access Key must be exactly 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          secret_key: trimmedSecretKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unauthorized: Invalid Secret Access Key.");
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

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: "var(--bg-dark)", color: "var(--text-main)" }}>
      <div className="glass-panel p-4 shadow-lg" style={{ maxWidth: 440, width: "100%", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="text-center mb-4">
          <div
            className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{
              width: 68,
              height: 68,
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              boxShadow: "0 0 20px rgba(244, 63, 94, 0.2)"
            }}
          >
            <ShieldCheck size={34} color="#f43f5e" />
          </div>
          <h3 className="fw-bold mb-1" style={{ color: "var(--text-main)" }}>Super Admin Portal</h3>
          <p className="small mb-0" style={{ color: "var(--text-muted)" }}>SAIOTAF Framework • Tier 3 Administrative Oversight</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 text-start mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <AlertCircle size={16} className="flex-shrink-0" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="text-start">
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>Admin Email Address</label>
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

          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "var(--text-muted)" }}>Password</label>
            <div className="position-relative">
              <input
                type="password"
                className="form-control faculty-search-input ps-4"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className="position-absolute text-muted" style={{ left: 10, top: 12 }} />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold d-flex align-items-center justify-content-between" style={{ color: "var(--text-muted)" }}>
              <span>Secret Access Key</span>
              <span className="badge px-2.5 py-1 fw-bold rounded-pill" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.35)", fontSize: "0.7rem" }}>8 Chars Required</span>
            </label>
            <div className="position-relative">
              <input
                type="password"
                className="form-control faculty-search-input ps-4"
                placeholder="Enter 8-character Secret Key (e.g. SAI88202)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                maxLength={8}
                required
              />
              <Key size={16} className="position-absolute text-danger" style={{ left: 10, top: 12 }} />
            </div>
            <small className="mt-1 d-block" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              High-level security check • Default key: <code className="text-warning border px-1.5 py-0.5 rounded fw-bold" style={{ background: "var(--input-bg)", borderColor: "var(--border-color)" }}>SAI88202</code>
            </small>
          </div>

          <button type="submit" className="btn btn-danger w-100 py-2 fw-bold mb-3" disabled={loading}>
            {loading ? "Authenticating Admin…" : "Access Super Admin Console"}
          </button>
        </form>

        <div className="text-center border-top pt-3 mt-3" style={{ borderColor: "var(--border-color)" }}>
          <p className="small mb-2" style={{ color: "var(--text-muted)" }}>
            Don't have an admin account?{" "}
            <Link to="/admin/signup" className="text-danger fw-semibold text-decoration-none">Sign Up</Link>
          </p>
          <p className="small mb-2" style={{ color: "var(--text-muted)" }}>
            <Link to="/admin/forgot-password" className="text-danger fw-semibold text-decoration-none">Forgot Password?</Link>
          </p>
          <Link to="/" className="small text-decoration-none d-inline-flex align-items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={14} /> Return to Main Application
          </Link>
        </div>
      </div>
    </div>
  );
}
