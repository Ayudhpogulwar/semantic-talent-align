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
import ErrorBoundary from './components/ErrorBoundary';
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
  // Resume starts as null — only set from server data or after user uploads
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
      // Only accept real resume data — must have a real filename or ID from server
      const activeResume = (r && (r.filename || r.resume_id)) ? r : null;
      setResume(activeResume);
      if (activeResume) {
        try {
          localStorage.setItem('stufac_resume', JSON.stringify(activeResume));
        } catch (_) {}
      } else {
        localStorage.removeItem('stufac_resume');
      }

      let activeSkills = Array.isArray(s) && s.length > 0 ? s : [];
      if (activeSkills.length === 0 && activeResume?.parsed_data?.skills?.length > 0) {
        activeSkills = activeResume.parsed_data.skills.map((skill, idx) => ({
          skill_id: `parsed_${idx}`,
          skill_name: typeof skill === 'string' ? skill : skill.skill_name,
          category: 'Extracted Skill',
          source: 'parsed'
        }));
      }
      setSkills(activeSkills);
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
    localStorage.removeItem("stufac_resume");
    setIsAuthenticated(false);
    setResume(null);
    setProfile(null);
    setShowAuthModal(false);
  };

  const handleUpdateProfile = async (fields) => {
    try {
      const updated = await apiService.updateProfile(fields);
      setProfile(prev => ({ ...prev, ...updated }));
      await refreshRecsAndReadiness();
    } catch (err) {
      console.error("Update profile error:", err);
    }
  };

  const handleUploadResume = async (file, fileUrl = null) => {
    try {
      const res = await apiService.uploadResumeFile(file);
      const persistentUrl = res.file_url || (file instanceof File ? URL.createObjectURL(file) : fileUrl);
      const fullResume = {
        ...res,
        filename: file?.name || res.filename || "resume.pdf",
        file_url: persistentUrl,
        file_size: file?.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : (res.file_size || "0.2 MB")
      };
      setResume(fullResume);
      try {
        localStorage.setItem('stufac_resume', JSON.stringify(fullResume));
      } catch (e) {}

      const updatedSkills = await apiService.getSkills();
      let nextSkills = Array.isArray(updatedSkills) && updatedSkills.length > 0 ? updatedSkills : [];
      if (nextSkills.length === 0 && res.parsed_data?.skills?.length > 0) {
        nextSkills = res.parsed_data.skills.map((skill, idx) => ({
          skill_id: `parsed_${idx}`,
          skill_name: typeof skill === 'string' ? skill : skill.skill_name,
          category: 'Extracted Skill',
          source: 'parsed'
        }));
      }
      setSkills(nextSkills);
      await refreshRecsAndReadiness();
    } catch (err) {
      console.error("Upload resume error:", err);
    }
  };

  const handleDeleteResume = async () => {
    try {
      await apiService.deleteResume();
    } catch (_) {}
    // Clear locally
    setResume(null);
    setSkills([]);
    try { localStorage.removeItem('stufac_resume'); } catch (_) {}
    await refreshRecsAndReadiness();
  };


  const handleAddSkill = async (skillName, category) => {
    try {
      const updatedSkills = await apiService.addSkill(skillName, category);
      setSkills(Array.isArray(updatedSkills) ? updatedSkills : []);
      await refreshRecsAndReadiness();
    } catch (err) {
      console.error("Add skill error:", err);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      const updatedSkills = await apiService.removeSkill(skillId);
      setSkills(Array.isArray(updatedSkills) ? updatedSkills : []);
      await refreshRecsAndReadiness();
    } catch (err) {
      console.error("Remove skill error:", err);
    }
  };

  const handleApplyToOpportunity = async (oppId) => {
    try {
      const opp = opportunities.find(o => String(o.id) === String(oppId) || String(o.opportunity_id) === String(oppId));
      const res = await apiService.applyToOpportunity(oppId, opp);
      if (res) {
        setApplications(prev => {
          const list = Array.isArray(prev) ? prev : [];
          if (list.some(a => String(a.opportunity_id) === String(oppId))) return list;
          return [res, ...list];
        });
      }
      const apps = await apiService.getApplications();
      if (Array.isArray(apps) && apps.length > 0) {
        setApplications(apps);
      }
      const notifs = await apiService.getNotifications();
      setNotifications(Array.isArray(notifs) ? notifs : []);
      refreshRecsAndReadiness();
      return res;
    } catch (err) {
      console.error("Apply error:", err);
      throw err;
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      const updated = await apiService.markNotificationRead(id);
      setNotifications(Array.isArray(updated) ? updated : []);
    } catch (e) {
      console.error("Mark notif read error:", e);
    }
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

  if (!profile) {
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
        <ErrorBoundary key={activeTab} onNavigateHome={() => setActiveTab('home')}>
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
              resume={resume}
              onUpdateProfile={handleUpdateProfile}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeSkillsModule
              resume={resume || {}}
              skills={skills}
              onUploadResume={handleUploadResume}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onDeleteResume={handleDeleteResume}
            />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesModule
              opportunities={opportunities}
              applications={applications}
              onApply={handleApplyToOpportunity}
              resume={resume}
              skills={skills}
              recommendations={recommendations}
              setActiveTab={setActiveTab}
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
              resume={resume}
              opportunities={opportunities}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'readiness' && (
            <ReadinessScoreCard
              readiness={readiness}
            />
          )}
        </ErrorBoundary>
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

// Super Admin Module Components
import AdminRoutes from './features/admin/routes/AdminRoutes';
import AdminLogin from './components/AdminLogin';
import StudentForgotPasswordPage from './features/student/components/StudentForgotPasswordPage';

export default function App() {
  return (
    <FacultyAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StudentDashboardApp />} />
          <Route path="/student/*" element={<StudentDashboardApp />} />
          <Route path="/forgot-password" element={<StudentForgotPasswordPage />} />
          <Route path="/faculty/*" element={<FacultyRoutes />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </BrowserRouter>
    </FacultyAuthProvider>
  );
}
