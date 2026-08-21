import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Student Components
import HeaderNavbar from './components/HeaderNavbar';
import DashboardOverview from './components/DashboardOverview';
import ProfileModule from './components/ProfileModule';
import ResumeSkillsModule from './components/ResumeSkillsModule';
import OpportunitiesModule from './components/OpportunitiesModule';
import ApplicationTracker from './components/ApplicationTracker';
import AIRecommendations from './components/AIRecommendations';
import ReadinessScoreCard from './components/ReadinessScoreCard';
import LandingIntroPage from './components/LandingIntroPage';
import AuthModal from './components/AuthModal';
import { apiService } from './services/api';

// User's Pre-developed Faculty Module Components & Provider
import FacultyRoutes from './features/faculty/routes/FacultyRoutes';
import { FacultyAuthProvider } from './features/faculty/hooks/useAuth';

function StudentDashboardApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("stufac_token"));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('home');

  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadDashboardData = async () => {
    try {
      const [p, r, s, o, a, rec, read, notif] = await Promise.all([
        apiService.getProfile(),
        apiService.getResume(),
        apiService.getSkills(),
        apiService.getOpportunities(),
        apiService.getApplications(),
        apiService.getAIRecommendations(),
        apiService.getReadinessScore(),
        apiService.getNotifications()
      ]);

      setProfile(p || {});
      setResume(r || {});
      setSkills(Array.isArray(s) ? s : []);
      setOpportunities(Array.isArray(o) ? o : []);
      setApplications(Array.isArray(a) ? a : []);
      setRecommendations(Array.isArray(rec) ? rec : []);
      setReadiness(read || {});
      setNotifications(Array.isArray(notif) ? notif : []);
    } catch (e) {
      console.error("Error loading student state:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleOpenAuth = (mode = 'login') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLoginSuccess = async (credentials) => {
    if (credentials.type === 'register') {
      await apiService.register(credentials.data);
    } else {
      await apiService.login(credentials.email, credentials.password);
    }
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("stufac_token");
    setIsAuthenticated(false);
    setShowAuthModal(false);
  };

  const handleUpdateProfile = (fields) => {
    const updated = apiService.updateProfile(fields);
    setProfile(updated);
    refreshRecsAndReadiness();
  };

  const handleUploadResume = async (file) => {
    const res = await apiService.uploadResumeFile(file);
    setResume(res);
    setSkills(apiService.getSkills());
    refreshRecsAndReadiness();
  };

  const handleAddSkill = (skillName, category) => {
    const updatedSkills = apiService.addSkill(skillName, category);
    setSkills(updatedSkills);
    refreshRecsAndReadiness();
  };

  const handleRemoveSkill = (skillId) => {
    const updatedSkills = apiService.removeSkill(skillId);
    setSkills(updatedSkills);
    refreshRecsAndReadiness();
  };

  const handleApplyToOpportunity = async (oppId) => {
    try {
      const opp = opportunities.find(o => String(o.id) === String(oppId) || String(o.opportunity_id) === String(oppId));
      await apiService.applyToOpportunity(oppId, opp);
      const apps = await apiService.getApplications();
      setApplications(Array.isArray(apps) ? apps : []);
      const notifs = await apiService.getNotifications();
      setNotifications(Array.isArray(notifs) ? notifs : []);
      refreshRecsAndReadiness();
    } catch (err) {
      console.error("Apply error:", err);
    }
  };

  const handleMarkNotifRead = (id) => {
    const updated = apiService.markNotificationRead(id);
    setNotifications(updated);
  };

  const refreshRecsAndReadiness = async () => {
    try {
      const recs = await apiService.getAIRecommendations();
      setRecommendations(Array.isArray(recs) ? recs : []);
      const read = await apiService.getReadinessScore();
      if (read && typeof read === 'object') setReadiness(read);
    } catch (e) {
      console.error("Refresh recs error:", e);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LandingIntroPage 
          onOpenLogin={() => handleOpenAuth('login')} 
          onOpenRegister={() => handleOpenAuth('register')} 
        />
        {showAuthModal && (
          <AuthModal 
            defaultRegister={initialAuthMode === 'register'} 
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess} 
          />
        )}
      </>
    );
  }

  if (!profile || !readiness) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '100px', fontSize: '1.2rem' }}>
        Loading Student Dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={profile}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotifRead={handleMarkNotifRead}
      />

      <main style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        flex: 1
      }}>
        {activeTab === 'home' && (
          <DashboardOverview
            profile={profile}
            resume={resume}
            readiness={readiness}
            applications={applications}
            recommendations={recommendations}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileModule
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeSkillsModule
            resume={resume}
            skills={skills}
            onUploadResume={handleUploadResume}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesModule
            opportunities={opportunities}
            applications={applications}
            onApply={handleApplyToOpportunity}
          />
        )}

        {activeTab === 'tracker' && (
          <ApplicationTracker
            applications={applications}
          />
        )}

        {activeTab === 'recommendations' && (
          <AIRecommendations
            recommendations={recommendations}
            onApply={handleApplyToOpportunity}
          />
        )}

        {activeTab === 'readiness' && (
          <ReadinessScoreCard
            readiness={readiness}
          />
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '20px 24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        background: 'var(--bg-card)'
      }}>
        TalentAlign AI Framework © 2026 • Semantic-Aware Intelligent Opportunity & Talent Alignment System • Institutional Student Portal
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FacultyAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StudentDashboardApp />} />
          <Route path="/student/*" element={<StudentDashboardApp />} />
          <Route path="/faculty/*" element={<FacultyRoutes />} />
        </Routes>
      </BrowserRouter>
    </FacultyAuthProvider>
  );
}
