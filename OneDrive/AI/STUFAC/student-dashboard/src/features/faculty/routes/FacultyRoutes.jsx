/**
 * SAIOTAF - Faculty & Moderator Module
 * Route table for the faculty feature area. Mounted by the app shell at
 * `/faculty/*` -- see integration note at the bottom of this file for how
 * this composes with the Student module's own route tree without collision.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import FacultyDashboardLayout from "../components/FacultyDashboardLayout";
import StudentVerificationTable from "../components/StudentVerificationTable";
import FacultyApplicationsTable from "../components/FacultyApplicationsTable";
import OrganizationDirectory from "../components/OrganizationDirectory";
import OpportunityManager from "../components/OpportunityManager";
import CertificateVerificationTable from "../components/CertificateVerificationTable";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ReportsPanel from "../components/ReportsPanel";
import FacultyLoginPage from "../components/FacultyLoginPage";
import FacultySignUpPage from "../components/FacultySignUpPage";
import RequireFacultyAuth from "../components/RequireFacultyAuth";

export default function FacultyRoutes() {
  return (
    <Routes>
      <Route path="login" element={<FacultyLoginPage />} />
      <Route path="signup" element={<FacultySignUpPage />} />

      <Route
        element={
          <RequireFacultyAuth>
            <FacultyDashboardLayout />
          </RequireFacultyAuth>
        }
      >
        <Route index element={<Navigate to="student-verifications" replace />} />
        <Route path="student-verifications" element={<StudentVerificationTable />} />
        <Route path="applications" element={<FacultyApplicationsTable />} />
        <Route path="organizations" element={<OrganizationDirectory />} />
        <Route path="opportunities" element={<OpportunityManager />} />
        <Route path="certificates" element={<CertificateVerificationTable />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="reports" element={<ReportsPanel />} />
      </Route>
    </Routes>
  );
}

// Integration note for the Student module owner:
// In the app root (e.g. src/App.jsx), mount both feature route trees as
// siblings so there is zero coupling between them:
//
//   <BrowserRouter>
//     <Routes>
//       <Route path="/faculty/*" element={<FacultyRoutes />} />
//       <Route path="/student/*" element={<StudentRoutes />} />  {/* teammate's module */}
//       <Route path="/" element={<Navigate to="/student" replace />} />
//     </Routes>
//   </BrowserRouter>
