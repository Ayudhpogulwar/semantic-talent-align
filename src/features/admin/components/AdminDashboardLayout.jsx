import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Users, ArrowRightLeft, LogOut, GraduationCap, Building2, Sun, Moon } from "lucide-react";
import "../../faculty/components/FacultyCommon.css";

export default function AdminDashboardLayout() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const handleStorageChange = () => {
      const current = localStorage.getItem("theme") || "dark";
      setTheme(current);
      document.documentElement.setAttribute("data-theme", current);
      document.body.setAttribute("data-theme", current);
    };

    window.addEventListener("themeChange", handleStorageChange);
    return () => window.removeEventListener("themeChange", handleStorageChange);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: nextTheme }));
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("saiotaf_admin_token");
    localStorage.removeItem("saiotaf_user_role");
    navigate("/admin/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-main)", transition: "background-color 0.3s ease, color 0.3s ease" }}>
      {/* Top Navbar */}
      <header
        className="py-3 px-4 sticky-top d-flex justify-content-between align-items-center"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.12)"
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={28} className="text-primary" />
            <h4 className="mb-0 fw-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>
              TalentAlign <span className="text-primary fs-6">SUPER ADMIN</span>
            </h4>
          </div>
          <span className="badge px-3 py-1.5 small fw-bold" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.35)", borderRadius: "20px" }}>
            TIER 3 ACCESS
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-circle"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              width: 38,
              height: 38
            }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          <NavLink to="/faculty" className="btn btn-outline-info btn-sm text-decoration-none fw-medium">
            <Building2 size={14} className="me-1" /> Faculty Portal ↗
          </NavLink>
          <NavLink to="/student" className="btn btn-outline-success btn-sm text-decoration-none fw-medium">
            <GraduationCap size={14} className="me-1" /> Student Portal ↗
          </NavLink>
          <button onClick={handleAdminLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 fw-medium">
            <LogOut size={14} /> Exit Admin
          </button>
        </div>
      </header>

      <div className="container-fluid py-4 px-4">
        <div className="row g-4">
          {/* Sidebar Navigation */}
          <div className="col-md-3 col-lg-2">
            <div
              className="p-3 rounded-3 border sticky-top shadow-sm"
              style={{
                top: "90px",
                background: "var(--bg-card)",
                borderColor: "var(--border-color)"
              }}
            >
              <div className="small fw-bold text-uppercase mb-3 px-2" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Navigation
              </div>
              <nav className="nav nav-pills flex-column gap-2">
                <NavLink
                  to="/admin/overview"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2.5 rounded-3 fw-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover-bg-subtle"
                    }`
                  }
                  style={({ isActive }) => (!isActive ? { color: "var(--text-muted)" } : {})}
                >
                  <LayoutDashboard size={18} /> System Overview
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2.5 rounded-3 fw-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover-bg-subtle"
                    }`
                  }
                  style={({ isActive }) => (!isActive ? { color: "var(--text-muted)" } : {})}
                >
                  <Users size={18} /> User Management
                </NavLink>

                <NavLink
                  to="/admin/overrides"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2.5 rounded-3 fw-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover-bg-subtle"
                    }`
                  }
                  style={({ isActive }) => (!isActive ? { color: "var(--text-muted)" } : {})}
                >
                  <ArrowRightLeft size={18} /> Override Controls
                </NavLink>
              </nav>

              <div className="mt-4 pt-3 border-top px-2" style={{ borderColor: "var(--border-color)" }}>
                <span className="small d-block mb-1" style={{ color: "var(--text-muted)" }}>Active Account:</span>
                <span className="small fw-bold d-block" style={{ color: "var(--text-main)" }}>Super Admin Console</span>
                <span className="text-info small fw-medium">admin@raisoni.net</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-md-9 col-lg-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
