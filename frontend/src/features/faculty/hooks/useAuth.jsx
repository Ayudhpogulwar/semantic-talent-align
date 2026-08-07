/**
 * SAIOTAF - Faculty & Moderator Module
 * useAuth hook: encapsulates JWT storage + login/MFA/logout flow so
 * components stay declarative and testable in isolation.
 */

import { useState, useCallback, createContext, useContext } from "react";
import { authApi } from "../api/facultyApi";

const AuthContext = createContext(null);

export function FacultyAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("saiotaf_access_token")
  );
  const [mfaPending, setMfaPending] = useState(null); // holds mfa_token when awaiting OTP
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (employeeId, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(employeeId, password);
      if (data.mfa_required) {
        setMfaPending(data.mfa_token);
        return { mfaRequired: true };
      }
      localStorage.setItem("saiotaf_access_token", data.access);
      localStorage.setItem("saiotaf_refresh_token", data.refresh);
      setIsAuthenticated(true);
      return { mfaRequired: false };
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(
    async (otpCode) => {
      if (!mfaPending) throw new Error("No MFA session in progress.");
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApi.verifyMfa(mfaPending, otpCode);
        localStorage.setItem("saiotaf_access_token", data.access);
        localStorage.setItem("saiotaf_refresh_token", data.refresh);
        setIsAuthenticated(true);
        setMfaPending(null);
      } catch (err) {
        setError(err.response?.data?.detail || "Invalid MFA code.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mfaPending]
  );

  const signup = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.signup(payload);
      localStorage.setItem("saiotaf_access_token", data.access);
      localStorage.setItem("saiotaf_refresh_token", data.refresh);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || "Sign up failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("saiotaf_access_token");
    localStorage.removeItem("saiotaf_refresh_token");
    setIsAuthenticated(false);
    setMfaPending(null);
  }, []);

  const value = { isAuthenticated, mfaPending, error, loading, login, verifyMfa, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within a FacultyAuthProvider");
  return ctx;
}
