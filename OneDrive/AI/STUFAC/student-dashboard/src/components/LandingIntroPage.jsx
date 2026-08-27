import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  BrainCircuit, 
  Target, 
  Award, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  TrendingUp,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Building2,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';

export default function LandingIntroPage({ onOpenLogin, onOpenRegister }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('stufac_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stufac_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', color: 'var(--text-main)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* Top Introductory Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
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
                TalentAlign
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic Opportunity Alignment System</div>
            </div>
          </div>

          {/* Right Corner: Theme Toggle + Faculty & Student Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            </button>

            {/* Direct Link to User's Pre-developed Faculty Portal */}
            <Link 
              to="/faculty" 
              className="btn btn-secondary" 
              style={{ gap: '6px', textDecoration: 'none', border: '1px solid rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
            >
              <Building2 size={16} /> Faculty Portal
            </Link>

            <button className="btn btn-secondary" onClick={() => onOpenLogin('login')} style={{ gap: '6px' }}>
              <LogIn size={16} /> Student Sign In
            </button>
            
            <button className="btn btn-primary" onClick={() => onOpenRegister()} style={{ gap: '6px' }}>
              <UserPlus size={16} /> Student Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '64px 24px 40px 24px',
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
          marginBottom: '24px'
        }}>
          <BrainCircuit size={16} /> Institutional AI Student Career Guidance & Faculty Governance Framework
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: '1.2',
          maxWidth: '920px',
          marginBottom: '20px'
        }}>
          Empowering Students & Faculty with <span className="gradient-text">Semantic AI Opportunity Alignment</span>
        </h1>

        <p style={{
          fontSize: '1.12rem',
          color: 'var(--text-muted)',
          maxWidth: '780px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Upload your resume to automatically extract your top skills, receive AI-powered personalized internship recommendations, and track real-time faculty verifications & placement readiness.
        </p>

        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onOpenLogin('login')} 
            style={{ padding: '14px 28px', fontSize: '1rem', gap: '8px' }}
          >
            <GraduationCap size={18} /> Student Portal <ArrowRight size={18} />
          </button>
          
          <Link 
            to="/faculty" 
            className="btn btn-secondary" 
            style={{ 
              padding: '14px 28px', 
              fontSize: '1rem', 
              gap: '8px',
              textDecoration: 'none',
              border: '1px solid rgba(6, 182, 212, 0.4)', 
              background: 'rgba(6, 182, 212, 0.1)',
              color: 'var(--accent-cyan)'
            }}
          >
            <Building2 size={18} /> Access Faculty Portal
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 60px 24px', width: '100%' }}>
        
        {/* Section Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Comprehensive Platform Capabilities</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Integrated Student Career Dashboard & Faculty Moderation Engine
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Card 1: Student NLP */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '3px solid #6366f1',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, var(--bg-card) 100%)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
            }}>
              <BrainCircuit size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Smart Resume Skill Extraction</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Auto-extract skills, education, and domain expertise directly from PDF/DOCX resumes for instant skill matching.
            </p>
          </div>

          {/* Card 2: Faculty Verification */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '3px solid #10b981',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-card) 100%)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
            }}>
              <UserCheck size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Faculty Verification & Endorsements</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Faculty advisors review student profiles, verify roll numbers, approve company postings, and stamp authentic certificates.
            </p>
          </div>

          {/* Card 3: Skill Gap Reports */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '3px solid #06b6d4',
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.06) 0%, var(--bg-card) 100%)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.2) 100%)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)'
            }}>
              <FileSpreadsheet size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Institutional Skill Gap Reports</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Real-time departmental analytics on industry skill shortages, placement funnel conversion rates, and downloadable reports.
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
        TalentAlign AI Framework © 2026 • Semantic-Aware Intelligent Opportunity & Talent Alignment System • Institutional Student & Faculty Portals
      </footer>

    </div>
  );
}

