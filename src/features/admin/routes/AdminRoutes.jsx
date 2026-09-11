/**
 * SAIOTAF - Super Admin Module
 * AdminRoutes.jsx (Super Admin Route Tree)
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboardLayout from "../components/AdminDashboardLayout";
import AdminOverview from "../components/AdminOverview";
import AdminUserManagement from "../components/AdminUserManagement";
import AdminOverrides from "../components/AdminOverrides";
import AdminLoginPage from "../components/AdminLoginPage";
import RequireAdminAuth from "../components/RequireAdminAuth";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />

      <Route
        element={
          <RequireAdminAuth>
            <AdminDashboardLayout />
          </RequireAdminAuth>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="overrides" element={<AdminOverrides />} />
      </Route>
    </Routes>
  );
}
