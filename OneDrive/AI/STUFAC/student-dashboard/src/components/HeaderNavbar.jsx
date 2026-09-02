import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Bell, 
  User, 
  FileText, 
  Briefcase, 
  Award, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';

export default function HeaderNavbar({ activeTab, setActiveTab, user, onLogout, notifications, onMarkNotifRead }) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('stufac_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stufac_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const primaryNavItems = [
    { id: 'home', label: 'Overview', icon: Layers },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'tracker', label: 'Applications', icon: CheckCircle },
    { id: 'recommendations', label: 'AI Matches', icon: Sparkles, badge: 'AI' }
  ];

  const careerToolsItems = [
    { id: 'profile', label: 'Student Profile', icon: User, desc: 'Manage contact & academic info' },
    { id: 'resume', label: 'Resume & Skills', icon: FileText, desc: 'spaCy NLP parsing & skill tags' },
    { id: 'readiness', label: 'Readiness Score', icon: Award, desc: 'Placement probability & metrics' }
  ];

  const isCareerToolActive = careerToolsItems.some(t => t.id === activeTab);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(11, 15, 25, 0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)'
          }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              TalentAlign <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(6, 182, 212, 0.18)', color: 'var(--accent-cyan)', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 800 }}>AI PORTAL</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Semantic Opportunity Alignment</div>
          </div>
        </div>

        {/* De-congested Central Pill Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px',
          borderRadius: '30px',
          background: theme === 'light' ? 'rgba(226, 232, 240, 0.6)' : 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-color)'
        }} className="desktop-nav">
          
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                <Icon size={15} color={isActive ? '#fff' : 'var(--text-dim)'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.62rem',
                    background: isActive ? '#fff' : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                    color: isActive ? 'var(--primary-dark)' : '#fff',
                    padding: '1px 5px',
                    borderRadius: '6px',
                    fontWeight: 800
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Career Tools Dropdown Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                border: 'none',
                background: isCareerToolActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isCareerToolActive ? 'var(--primary-light)' : 'var(--text-muted)',
                fontWeight: isCareerToolActive ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <span>Career Tools</span>
              <ChevronDown size={14} style={{ transform: showToolsMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showToolsMenu && (
              <div className="glass-panel animate-fade-in" style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                width: '240px',
                padding: '10px',
                zIndex: 200,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                background: 'var(--bg-card)'
              }}>
                {careerToolsItems.map(tool => {
                  const ToolIcon = tool.icon;
                  const isSelected = activeTab === tool.id;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => { setActiveTab(tool.id); setShowToolsMenu(false); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: isSelected ? 'var(--primary-light)' : 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'background 0.15s'
                      }}
                    >
                      <ToolIcon size={16} color={isSelected ? 'var(--primary-light)' : 'var(--text-dim)'} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tool.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{tool.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </nav>

        {/* User Utilities: Theme Toggle, Notifications, User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Light / Dark Mode Switcher Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                cursor: 'pointer',
                position: 'relative'
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px var(--accent-rose)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="glass-panel animate-fade-in" style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                padding: '16px',
                zIndex: 200,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unreadCount} unread</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '16px' }}>No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => onMarkNotifRead(n.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                          border: n.read ? '1px solid transparent' : '1px solid rgba(99, 102, 241, 0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: n.read ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>{n.message}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--primary-light)', marginTop: '4px', textAlign: 'right' }}>{n.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div 
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.85rem'
            }}>
              {user.name ? user.name[0] : 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ShieldCheck size={10} /> Verified
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
