/**
 * SAIOTAF - Faculty & Moderator Module
 * Centralized API service layer.
 *
 * Kept as a thin axios wrapper so components never call axios directly --
 * this is the single seam to swap base URLs, add retry logic, or mock for
 * tests without touching component code.
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- JWT attach + refresh-on-401 interceptor -------------------------------

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("saiotaf_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("saiotaf_refresh_token");
  if (!refreshToken) throw new Error("No refresh token available");

  const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh: refreshToken,
  });
  localStorage.setItem("saiotaf_access_token", data.access);
  if (data.refresh) {
    localStorage.setItem("saiotaf_refresh_token", data.refresh);
  }
  return data.access;
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        localStorage.removeItem("saiotaf_access_token");
        localStorage.removeItem("saiotaf_refresh_token");
        window.location.href = "/faculty/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Auth ---------------------------------------------------------------

export const authApi = {
  login: (employeeId, password) =>
    client.post("/faculty/auth/login/", { employee_id: employeeId, password }),
  verifyMfa: (mfaToken, otpCode) =>
    client.post("/faculty/auth/mfa/verify/", { mfa_token: mfaToken, otp_code: otpCode }),
  signup: (payload) =>
    client.post("/faculty/auth/signup/", payload),
};

// --- Student Verification -------------------------------------------------

export const studentVerificationApi = {
  list: (params) => client.get("/faculty/student-verifications/", { params }),
  review: (id, action, reason = "") =>
    client.post(`/faculty/student-verifications/${id}/review/`, { action, reason }),
};

// --- Organizations ----------------------------------------------------------

export const organizationApi = {
  list: (params) => client.get("/faculty/organizations/", { params }),
  create: (payload) => client.post("/faculty/organizations/", payload),
  update: (id, payload) => client.patch(`/faculty/organizations/${id}/`, payload),
  verify: (id, action, notes = "") =>
    client.post(`/faculty/organizations/${id}/verify/`, { action, notes }),
};

// --- Opportunities ----------------------------------------------------------

export const opportunityApi = {
  list: (params) => client.get("/faculty/opportunities/", { params }),
  get: (id) => client.get(`/faculty/opportunities/${id}/`),
  create: (payload) => client.post("/faculty/opportunities/", payload),
  update: (id, payload) => client.patch(`/faculty/opportunities/${id}/`, payload),
  remove: (id) => client.delete(`/faculty/opportunities/${id}/`),
  approval: (id, action, rejectionReason = "") =>
    client.post(`/faculty/opportunities/${id}/approval/`, {
      action,
      rejection_reason: rejectionReason,
    }),
  bulkImport: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post("/faculty/opportunities/bulk-import/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
};

// --- Certificates -----------------------------------------------------------

export const certificateApi = {
  list: (params) => client.get("/faculty/certificates/", { params }),
  review: (id, action, rejectionReason = "") =>
    client.post(`/faculty/certificates/${id}/review/`, {
      action,
      rejection_reason: rejectionReason,
    }),
};

// --- Reports & Analytics -----------------------------------------------------

export const reportApi = {
  funnel: () => client.get("/faculty/reports/funnel/"),
  skillGaps: () => client.get("/faculty/reports/skill-gaps/"),
  export: (format, department, term) =>
    client.get("/faculty/reports/export/", {
      params: { format, department, term },
      responseType: "blob",
    }),
};

export default client;
