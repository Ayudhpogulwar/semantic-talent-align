/**
 * SAIOTAF - Faculty & Moderator Module
 * FacultyDashboardLayout
 *
 * Top-level shell: sidebar navigation + top bar + <Outlet /> content area.
 * Integrated with the TalentAlign shared design system and dynamic theme toggle.
 */

import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  UserCheck, 
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
    const token = localStorage.getItem("saiotaf_access_token");
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        if (decoded.first_name) {
          setUserName(decoded.first_name);
        } else if (decoded.username) {
          setUserName(decoded.username);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/faculty/login");
  };

  return (
    <div className="faculty-shell d-flex">
      {/* Sidebar */}
      <aside className={`faculty-sidebar ${sidebarOpen ? "" : "faculty-sidebar--collapsed"}`}>
        <div className="faculty-sidebar__brand d-flex align-items-center gap-2 px-3 py-3">
          <GraduationCap size={24} className="text-primary" />
          <span className="fw-bold text-white fs-5">TalentAlign</span>
          <span className="badge bg-primary ms-1" style={{ fontSize: "0.65rem" }}>Faculty</span>
        </div>

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
            <span className="text-muted small">Signed in as {userName}</span>
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
