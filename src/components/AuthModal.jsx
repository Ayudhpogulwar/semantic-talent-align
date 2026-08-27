import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, Hash, AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react';

export default function AuthModal({ onLoginSuccess, onClose, defaultRegister = false }) {
  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const isValidDomain = (em) => {
      const e = em.toLowerCase();
      return e.endsWith('@ghrietn.raisoni.net') || e.endsWith('@college.edu') || e.endsWith('.edu') || e.endsWith('.ac.in');
    };

    try {
      if (isRegister) {
        if (!isValidDomain(email)) {
          throw new Error('Institutional email validation failed! Must be a valid college domain email (e.g. @ghrietn.raisoni.net).');
        }
        await onLoginSuccess({ type: 'register', data: { name, email, password, roll_no: rollNo } });
      } else {
        if (!isValidDomain(email)) {
          throw new Error('Please login using your verified institutional student email (e.g. @ghrietn.raisoni.net).');
        }
        await onLoginSuccess({ type: 'login', email, password });
      }
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || err?.detail || JSON.stringify(err));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)'
    }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="glass-panel glass-panel-glow animate-fade-in" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px',
        position: 'relative'
      }}>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        )}
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)'
          }}>
            <GraduationCap size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800 }}>
            TalentAlign AI Student Portal
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Semantic-Aware Intelligent Opportunity Alignment
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: !isRegister ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: isRegister ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {typeof error === 'object' ? (error.detail || error.message || JSON.stringify(error)) : String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Aditi Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: '34px' }}
                  />
                  <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Roll Number / Student ID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="CS21B045"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                    style={{ paddingLeft: '34px' }}
                  />
                  <Hash size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Institutional Email (@college.edu)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '34px' }}
              />
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '34px' }}
              />
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Verified Account' : 'Login to Dashboard'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          🔒 Restricted to verified institutional students with `@college.edu` domain.
        </div>
      </div>
    </div>
  );
}
