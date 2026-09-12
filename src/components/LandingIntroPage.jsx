import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  BrainCircuit, 
  Award, 
  ShieldCheck, 
  GraduationCap, 
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Shield,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export default function LandingIntroPage({ onOpenLogin, onOpenRegister }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const handleStorage = () => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.body.setAttribute('data-theme', currentTheme);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('themeChange', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('themeChange', handleStorage);
    };
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: nextTheme }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', color: 'var(--text-main)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* Top Introductory Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                TalentAlign <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(6, 182, 212, 0.18)', color: 'var(--accent-cyan)', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 800 }}>AI PORTAL</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic Opportunity Alignment System</div>
            </div>
          </div>

          {/* Right Corner: Theme Toggle + 3 Portal Entry Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            </button>

            {/* Portal 1: Student Login */}
            <button className="btn btn-primary btn-sm" onClick={onOpenLogin} style={{ gap: '6px', fontWeight: 600 }}>
              <LogIn size={15} /> Student Portal
            </button>

            {/* Portal 2: Faculty Login */}
            <Link to="/faculty/login" style={{ gap: '6px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center' }}>
              <ShieldCheck size={15} /> Faculty Portal
            </Link>

            {/* Portal 3: Admin Login */}
            <Link to="/login/admin" style={{ gap: '6px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
              <Shield size={15} /> Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px 40px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--primary-light)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          <BrainCircuit size={16} /> Institutional AI Student & Faculty Framework
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          lineHeight: '1.2',
          maxWidth: '900px',
          marginBottom: '16px',
          color: 'var(--text-main)'
        }}>
          Empowering Academia with <span className="gradient-text">Semantic AI Opportunity Alignment</span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '750px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Multi-tier institutional platform connecting Students, Faculty Officers, and Super Administrators for skill extraction, opportunity verification, and placement analytics.
        </p>

        {/* 3 DISTINCT PORTAL CARDS SELECTION GRID */}
        <div className="container px-0 my-3">
          <div className="row row-cols-1 row-cols-md-3 g-4 text-start">
            
            {/* 1. Student Portal Card */}
            <div className="col">
              <div
                className="p-4 rounded-3 border h-100 d-flex flex-column justify-content-between shadow-sm"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                  transition: "all 0.3s ease"
                }}
              >
                <div>
                  <div className="p-3 rounded bg-primary bg-opacity-15 text-primary d-inline-flex mb-3">
                    <GraduationCap size={28} />
                  </div>
                  <h4 className="fw-bold mb-2" style={{ color: "var(--text-main)" }}>Student Portal</h4>
                  <p className="small mb-4" style={{ color: "var(--text-muted)" }}>
                    Upload resumes, receive AI match recommendations, track skills gaps, and view real-time placement readiness scores.
                  </p>
                </div>
                <div>
                  <button className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2" onClick={() => onOpenLogin('login')}>
                    Sign In as Student <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Faculty Portal Card */}
            <div className="col">
              <div
                className="p-4 rounded-3 border h-100 d-flex flex-column justify-content-between shadow-sm"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                  transition: "all 0.3s ease"
                }}
              >
                <div>
                  <div className="p-3 rounded bg-info bg-opacity-15 text-info d-inline-flex mb-3">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="fw-bold mb-2" style={{ color: "var(--text-main)" }}>Faculty Portal</h4>
                  <p className="small mb-4" style={{ color: "var(--text-muted)" }}>
                    Verify student registrations, review certificates, approve corporate opportunities, and generate accreditation reports.
                  </p>
                </div>
                <div>
                  <Link to="/faculty/login" className="btn btn-outline-info w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 text-decoration-none">
                    Sign In as Faculty <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Super Admin Portal Card */}
            <div className="col">
              <div
                className="p-4 rounded-3 border border-danger h-100 d-flex flex-column justify-content-between shadow-sm"
                style={{
                  background: "linear-gradient(180deg, rgba(220, 38, 38, 0.08) 0%, var(--bg-card) 100%)",
                  boxShadow: "0 10px 30px rgba(220, 38, 38, 0.12)",
                  transition: "all 0.3s ease"
                }}
              >
                <div>
                  <div className="p-3 rounded bg-danger bg-opacity-15 text-danger d-inline-flex mb-3">
                    <Shield size={28} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="fw-bold mb-0" style={{ color: "var(--text-main)" }}>Super Admin</h4>
                    <span className="badge bg-danger text-white">TIER 3</span>
                  </div>
                  <p className="small mb-4" style={{ color: "var(--text-muted)" }}>
                    Platform command center. Cross-tier user management, system-wide overrides, live telemetry metrics, and RBAC controls.
                  </p>
                </div>
                <div>
                  <Link to="/login/admin" className="btn btn-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-decoration-none">
                    Sign In as Admin <Shield size={16} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 60px 24px', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          
          <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid #6366f1' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <BrainCircuit size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>spaCy Resume NLP</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: 0 }}>
              Auto-extract skills, education, and domain expertise directly from resumes for instant skill taxonomy matching.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid #06b6d4' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>AI Match Recommendations</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: 0 }}>
              Powered by Sentence-BERT embeddings & JobFormer recommendation engine with clear human-readable match explanations.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid #f43f5e' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Placement Readiness Score</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: 0 }}>
              Quantify your placement probability with ResumeNet scoring, SkillRec gap reports, and actionable steps.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.82rem',
        background: 'var(--bg-card)'
      }}>
        TalentAlign AI Framework © 2026 • Semantic-Aware Intelligent Opportunity & Talent Alignment System • Institutional Student, Faculty & Admin Portals
      </footer>

    </div>
  );
}
