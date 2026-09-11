import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, Hash, AlertCircle, ArrowRight, X, CheckCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export default function AuthModal({ onLoginSuccess, onClose, defaultRegister = false }) {
  const [authMode, setAuthMode] = useState(defaultRegister ? 'register' : 'login'); // 'login' | 'register' | 'forgot'
  
  // Student fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const isValidDomain = (em) => {
      const e = em.toLowerCase();
      return e.endsWith('@ghrietn.raisoni.net') || e.endsWith('@college.edu') || e.endsWith('.edu') || e.endsWith('.ac.in');
    };

    try {
      if (authMode === 'forgot') {
        if (!isValidDomain(email)) {
          throw new Error('Reset restricted to institutional email.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match!');
        }
        if (newPassword.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }

        const res = await apiService.resetPassword(email, newPassword);
        setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMsg(null);
          setPassword('');
        }, 2000);
      } else if (authMode === 'register') {
        if (!isValidDomain(email)) {
          throw new Error('Institutional email validation failed! Must end with @ghrietn.raisoni.net or valid institutional domain.');
        }
        await onLoginSuccess({ type: 'register', data: { name, email, password, roll_no: rollNo } });
      } else {
        if (!isValidDomain(email)) {
          throw new Error('Please login using your verified institutional student email.');
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
        maxWidth: '440px',
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
        
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 800 }}>
            {authMode === 'register' ? 'Student Registration' : authMode === 'forgot' ? 'Reset Password' : 'Student Sign In'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Semantic-Aware Opportunity Alignment System
          </p>
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

        {successMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'register' && (
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
              Institutional Email (@ghrietn.raisoni.net)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="student@ghrietn.raisoni.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '34px' }}
              />
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>
          </div>

          {authMode === 'forgot' ? (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '34px' }}
                  />
                  <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '34px' }}
                  />
                  <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setError(null); setSuccessMsg(null); }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              background: 'var(--primary)'
            }}
          >
            {loading ? 'Processing...' : authMode === 'register' ? 'Create Verified Account' : authMode === 'forgot' ? 'Reset Password' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Bottom Switch Links */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {authMode === 'forgot' ? (
            <div>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Back to Sign In
              </button>
            </div>
          ) : authMode === 'register' ? (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          ) : (
            <div>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


