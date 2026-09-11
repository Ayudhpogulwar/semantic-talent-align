/**
 * SAIOTAF - Super Admin Module
 * AdminDashboardLayout.jsx (Main Layout Shell for Super Admin Console)
 */

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Users, ArrowRightLeft, LogOut, GraduationCap, Building2 } from "lucide-react";
import "../../faculty/components/FacultyCommon.css";

export default function AdminDashboardLayout() {
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    localStorage.removeItem("saiotaf_admin_token");
    localStorage.removeItem("saiotaf_user_role");
    navigate("/admin/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark, #0b0f19)", color: "#ffffff" }}>
      {/* Top Navbar */}
      <header className="border-bottom border-secondary py-3 px-4 bg-dark sticky-top d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={28} className="text-primary" />
            <h4 className="mb-0 fw-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              TalentAlign <span className="text-primary fs-6">SUPER ADMIN</span>
            </h4>
          </div>
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-2 py-1 small">
            TIER 3 ACCESS
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <NavLink to="/faculty" className="btn btn-outline-info btn-sm text-decoration-none">
            <Building2 size={14} className="me-1" /> Faculty Portal ↗
          </NavLink>
          <NavLink to="/student" className="btn btn-outline-success btn-sm text-decoration-none">
            <GraduationCap size={14} className="me-1" /> Student Portal ↗
          </NavLink>
          <button onClick={handleAdminLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
            <LogOut size={14} /> Exit Admin
          </button>
        </div>
      </header>

      <div className="container-fluid py-4 px-4">
        <div className="row g-4">
          {/* Sidebar Navigation */}
          <div className="col-md-3 col-lg-2">
            <div className="p-3 rounded-3 border border-secondary bg-dark sticky-top" style={{ top: "90px" }}>
              <div className="text-secondary small fw-bold text-uppercase mb-3 px-2">Navigation</div>
              <nav className="nav nav-pills flex-column gap-2">
                <NavLink
                  to="/admin/overview"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded fw-medium ${
                      isActive ? "active bg-primary text-white" : "text-secondary hover-text-white"
                    }`
                  }
                >
                  <LayoutDashboard size={18} /> System Overview
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded fw-medium ${
                      isActive ? "active bg-primary text-white" : "text-secondary hover-text-white"
                    }`
                  }
                >
                  <Users size={18} /> User Management
                </NavLink>

                <NavLink
                  to="/admin/overrides"
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded fw-medium ${
                      isActive ? "active bg-primary text-white" : "text-secondary hover-text-white"
                    }`
                  }
                >
                  <ArrowRightLeft size={18} /> Override Controls
                </NavLink>
              </nav>

              <div className="mt-4 pt-3 border-top border-secondary px-2">
                <span className="text-secondary small d-block mb-1">Active Account:</span>
                <span className="text-white small fw-bold d-block">Super Admin Console</span>
                <span className="text-info small">admin@raisoni.net</span>
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
