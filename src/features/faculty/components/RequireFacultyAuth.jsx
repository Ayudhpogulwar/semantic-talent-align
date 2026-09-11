/**
 * SAIOTAF - Faculty & Moderator Module
 * Route guard: redirects to /faculty/login if no valid JWT is present.
 * (Server-side permission classes remain the real enforcement boundary --
 * this exists purely for UX, per NFR-Security guidance against relying on
 * frontend checks alone.)
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireFacultyAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const storedUserStr = localStorage.getItem("saiotaf_user");
  let userRole = null;
  if (storedUserStr) {
    try {
      const parsedUser = JSON.parse(storedUserStr);
      userRole = parsedUser?.role;
    } catch (e) {
      console.error("Error parsing saiotaf_user", e);
    }
  }

  // Fallback: check JWT token payload role directly
  if (!userRole) {
    const token = localStorage.getItem("saiotaf_access_token");
    if (token) {
      try {
        const payload = JSON.parse(window.atob(token.split(".")[1]));
        userRole = payload?.role;
      } catch (e) {}
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/faculty/login" replace state={{ from: location }} />;
  }

  // Strictly deny access to students attempting to access Faculty portal
  if (userRole === "Student") {
    return <Navigate to="/student" replace />;
  }

  return children;
}
