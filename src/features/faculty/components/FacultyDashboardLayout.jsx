/**
 * SAIOTAF - Faculty & Moderator Module
 * FacultyDashboardLayout
 *
 * Top-level shell: sidebar navigation + top bar + <Outlet /> content area.
 * Integrated with the TalentAlign shared design system and dynamic theme toggle.
 */

import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  UserCheck, 
  FileCheck,
  Building2, 
  Briefcase, 
  Award, 
  BarChart3, 
  FileText, 
  Menu, 
  LogOut, 
  Sun, 
  Moon, 
  GraduationCap 
} from "lucide-react";
import "./FacultyDashboardLayout.css";

const NAV_ITEMS = [
  { to: "/faculty/student-verifications", label: "Student Verification", icon: UserCheck },
  { to: "/faculty/applications", label: "Applications Review", icon: FileCheck },
  { to: "/faculty/organizations", label: "Organizations", icon: Building2 },
  { to: "/faculty/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/faculty/certificates", label: "Certificates", icon: Award },
  { to: "/faculty/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/faculty/reports", label: "Reports", icon: FileText },
];

function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-secondary d-flex align-items-center justify-content-center"
      style={{ padding: '8px 12px', borderRadius: '10px', minWidth: '40px', minHeight: '40px' }}
      title="Toggle Light / Dark Mode"
    >
      {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
    </button>
  );
}

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function FacultyDashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("Faculty");

  useEffect(() => {
    const storedUserStr = localStorage.getItem("saiotaf_user");
    if (storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        let name = u.first_name || u.username || "Faculty";
        name = name.split(" ")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        setUserName(`${name} Sir`);
        return;
      } catch (e) { /* fallback to token */ }
    }

    const token = localStorage.getItem("saiotaf_access_token");
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        let name = decoded.first_name || decoded.username || "Faculty";
        name = name.split(" ")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        setUserName(`${name} Sir`);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="faculty-shell d-flex">
      {/* Sidebar */}
      <aside className={`faculty-sidebar ${sidebarOpen ? "" : "faculty-sidebar--collapsed"}`}>
        <Link to="/" className="faculty-sidebar__brand d-flex align-items-center gap-2 px-3 py-3 text-decoration-none" title="Go to Main Landing Page">
          <GraduationCap size={24} className="text-primary" />
          <span className="fw-bold text-white fs-5">TalentAlign</span>
          <span className="badge bg-primary ms-1" style={{ fontSize: "0.65rem" }}>Faculty</span>
        </Link>

        <nav className="nav flex-column px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link faculty-nav-link d-flex align-items-center gap-2 ${
                  isActive ? "faculty-nav-link--active" : ""
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="faculty-main flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <header className="faculty-topbar d-flex align-items-center justify-content-between px-4 py-2">
          <button
            className="btn btn-secondary d-flex align-items-center justify-content-center"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
            style={{ padding: '8px 12px', minWidth: '40px', minHeight: '40px' }}
          >
            <Menu size={18} />
          </button>

          <div className="d-flex align-items-center gap-3">
            <ThemeToggle />
            <div className="faculty-user-badge d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                style={{ width: 28, height: 28, background: "linear-gradient(135deg, var(--primary) 0%, var(--faculty-accent) 100%)", fontSize: "0.8rem" }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="small fw-semibold text-capitalize" style={{ letterSpacing: "0.01em" }}>
                {userName}
              </span>
            </div>
            <button className="btn btn-outline-danger d-flex align-items-center gap-1.5" onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '10px' }}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        <main className="faculty-content flex-grow-1 p-4">
          {/* Child route components (StudentVerificationTable, etc.) render here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
