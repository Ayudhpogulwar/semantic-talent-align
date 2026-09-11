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
  Building2
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
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(11, 15, 25, 0.88)',
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
                TalentAlign <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(6, 182, 212, 0.18)', color: 'var(--accent-cyan)', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 800 }}>AI PORTAL</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic Opportunity Alignment System</div>
            </div>
          </div>

          {/* Right Corner: Theme Toggle + Sign In & Register Buttons */}
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

            <Link to="/faculty" className="btn btn-secondary" style={{ gap: '6px', textDecoration: 'none', border: '1px solid rgba(99, 102, 241, 0.4)', color: 'var(--primary-light)' }}>
              <Building2 size={16} /> Faculty Portal
            </Link>
            <button className="btn btn-secondary" onClick={onOpenLogin} style={{ gap: '6px' }}>
              <LogIn size={16} /> Sign In
            </button>
            <button className="btn btn-primary" onClick={onOpenRegister} style={{ gap: '6px' }}>
              <UserPlus size={16} /> Student Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px 60px 24px',
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
          <BrainCircuit size={16} /> Institutional AI Student Career Guidance Framework
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: '1.2',
          maxWidth: '900px',
          marginBottom: '20px'
        }}>
          Empowering Students with <span className="gradient-text">Semantic AI Opportunity Alignment</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '750px',
          lineHeight: '1.6',
          marginBottom: '36px'
        }}>
          Upload your resume to extract skills using spaCy NLP, receive Sentence-BERT & CareerBERT personalized internship/NGO recommendations, and track your Placement Readiness Score in real-time.
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-primary" onClick={() => onOpenLogin('login')} style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Get Started <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenLogin('register')} style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Register Institutional Account
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px 24px', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Card 1: Indigo / Violet Theme */}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>spaCy Resume NLP Parsing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Auto-extract skills, education, and domain expertise directly from PDF/DOCX resumes for instant skill taxonomy matching.
            </p>
          </div>

          {/* Card 2: Cyan / Emerald Theme */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '3px solid #06b6d4',
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.06) 0%, var(--bg-card) 100%)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)'
            }}>
              <Sparkles size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Explainable AI Recommendations</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Powered by Sentence-BERT embeddings & JobFormer recommendation engine with clear human-readable match explanations.
            </p>
          </div>

          {/* Card 3: Rose / Amber Theme */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '3px solid #f43f5e',
            background: 'linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, var(--bg-card) 100%)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)',
              color: '#fb7185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              boxShadow: '0 4px 15px rgba(244, 63, 94, 0.2)'
            }}>
              <Award size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Placement Readiness Score</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Quantify your placement probability (0–100) with ResumeNet quality scoring, SkillRec gap reports, and actionable steps.
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
        TalentAlign AI Framework © 2026 • Semantic-Aware Intelligent Opportunity & Talent Alignment System • Institutional Student Portal
      </footer>

    </div>
  );
}
