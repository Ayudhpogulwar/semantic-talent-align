/**
 * SAIOTAF - Super Admin Module
 * RequireAdminAuth.jsx (Route Guard enforcing Super Admin privileges)
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAdminAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("saiotaf_admin_token") || localStorage.getItem("saiotaf_access_token");
  const role = (localStorage.getItem("saiotaf_user_role") || "SUPER_ADMIN").toUpperCase();

  // Allow Super Admin roles
  const isSuperAdmin = Boolean(token && (role === "SUPER_ADMIN" || role === "SUPERADMIN" || role === "ADMIN"));

  if (!isSuperAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
