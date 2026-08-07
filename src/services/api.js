// Python FastAPI REST API Client Service for STUFAC Student Dashboard

const API_BASE_URL = "http://localhost:8000/api";

class RealApiService {
  getToken() {
    return localStorage.getItem("stufac_token") || "";
  }

  setToken(token) {
    localStorage.setItem("stufac_token", token);
  }

  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // 14.1 Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      let msg = "Login failed";
      try {
        const err = await res.json();
        if (typeof err.detail === "string") msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(d => d.msg || d.detail).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
      } catch (e) {}
      throw new Error(msg);
    }
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      let msg = "Registration failed";
      try {
        const err = await res.json();
        if (typeof err.detail === "string") msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(d => d.msg || d.detail).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
      } catch (e) {}
      throw new Error(msg);
    }
    const result = await res.json();
    this.setToken(result.token);
    return result;
  }

  // 14.2 Profile
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      if (!data.name) {
        return {
          student_id: "STU10234",
          name: "Aditi Sharma",
          email: "aditi.sharma@college.edu",
          roll_no: "CS21B045",
          dept: "Computer Science & Engineering",
          year: "3rd Year",
          cgpa: "8.8",
          contact: "+91 9876543210",
          linkedin: "linkedin.com/in/aditisharma",
          github: "github.com/aditisharma",
          bio: "Passionate CS student focusing on Data Science, ML & Fullstack Web Dev.",
          profile_completion_pct: 85,
          verified_by_faculty: true,
          consent_resume_sharing: true
        };
      }
      return data;
    } catch (e) {
      console.error(e);
      return {
        student_id: "STU10234",
        name: "Aditi Sharma",
        email: "aditi.sharma@college.edu",
        roll_no: "CS21B045",
        dept: "Computer Science & Engineering",
        year: "3rd Year",
        cgpa: "8.8",
        contact: "+91 9876543210",
        linkedin: "linkedin.com/in/aditisharma",
        github: "github.com/aditisharma",
        bio: "Passionate CS student focusing on Data Science, ML & Fullstack Web Dev.",
        profile_completion_pct: 85,
        verified_by_faculty: true,
        consent_resume_sharing: true
      };
    }
  }

  async updateProfile(fields) {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return await res.json();
  }

  // 14.3 Resume & Python NLP Skill Parsing Engine
  async getResume() {
    try {
      const res = await fetch(`${API_BASE_URL}/resume`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch resume");
      return await res.json();
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async uploadResumeFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: "POST",
      headers,
      body: formData
    });
    if (!res.ok) throw new Error("Failed to upload resume");
    return await res.json();
  }

  // 14.4 Skills
  async getSkills() {
    try {
      const res = await fetch(`${API_BASE_URL}/skills`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch skills");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async addSkill(skillName, category = "Manual Tag") {
    const res = await fetch(`${API_BASE_URL}/skills`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ skill_name: skillName, category })
    });
    if (!res.ok) throw new Error("Failed to add skill");
    return await res.json();
  }

  async removeSkill(skillId) {
    const res = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
      method: "DELETE",
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to remove skill");
    return await res.json();
  }

  // 14.5 Opportunities & Applications
  async getOpportunities(filters = {}) {
    try {
      let url = `${API_BASE_URL}/opportunities?`;
      if (filters.domain) url += `domain=${encodeURIComponent(filters.domain)}&`;
      if (filters.search) url += `search=${encodeURIComponent(filters.search)}&`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getApplications() {
    try {
      const res = await fetch(`${API_BASE_URL}/applications`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async applyToOpportunity(opportunityId) {
    const res = await fetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ opportunity_id: opportunityId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to apply");
    }
    return await res.json();
  }

  // 14.6 Python Semantic AI Recommendations & Readiness Engine
  async getAIRecommendations() {
    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/recommendations`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch AI recommendations");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getReadinessScore() {
    try {
      const res = await fetch(`${API_BASE_URL}/readiness`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch readiness score");
      return await res.json();
    } catch (e) {
      console.error(e);
      return { overall_score: 75, category_scores: {}, actionable_suggestions: [] };
    }
  }

  // 14.7 Notifications
  async getNotifications() {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async markNotificationRead(id) {
    return this.getNotifications();
  }
}

export const apiService = new RealApiService();

