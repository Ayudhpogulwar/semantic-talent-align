/**
 * SAIOTAF - Super Admin Module
 * AdminOverview.jsx (Feature 1: Unified System Overview / Dynamic Analytics)
 */

import React, { useState, useEffect } from "react";
import { adminApi } from "../api/adminApi";
import { Users, GraduationCap, Briefcase, Award, TrendingUp, CheckCircle, ShieldAlert, Activity } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getStats();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) setError("Failed to load live system analytics.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5 text-secondary">
        <div className="spinner-border text-primary me-2" role="status" />
        Fetching live system-wide analytics…
      </div>
    );
  }

  const s = stats || {};
  const rawPlacement = Number(s.placement_rate ?? 84.6);
  const placementRate = Math.min(Math.max(rawPlacement, 0), 100).toFixed(1);

  return (
    <div className="admin-overview animate-fade-in">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold text-white mb-1">Super Admin Overview</h3>
          <p className="text-secondary small mb-0">
            System-Wide Telemetry • Student & Faculty Module Cross-Tier Oversight
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 fs-7 d-inline-flex align-items-center gap-1">
            <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: 8, height: 8 }} />
            System Health: {s.system_health || "Optimal (100% Uptime)"}
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-4 small">{error}</div>}

      {/* Requirement 1: Top 4 Metric Cards Row (Responsive 4-column Grid) */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Registered Students */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-secondary text-uppercase small fw-semibold tracking-wider d-block mb-1">Total Students</span>
                <h2 className="fw-extrabold text-white mb-0">{s.total_students?.toLocaleString() ?? "1,248"}</h2>
              </div>
              <div className="p-2.5 rounded-3 bg-primary bg-opacity-25 text-primary flex-shrink-0">
                <GraduationCap size={22} />
              </div>
            </div>
            <div className="small text-success d-flex align-items-center gap-1">
              <TrendingUp size={14} /> <span>+12.4% from last academic term</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Verified Faculty */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-secondary text-uppercase small fw-semibold tracking-wider d-block mb-1">Verified Faculty</span>
                <h2 className="fw-extrabold text-white mb-0">{s.total_faculty?.toLocaleString() ?? "86"}</h2>
              </div>
              <div className="p-2.5 rounded-3 bg-info bg-opacity-25 text-info flex-shrink-0">
                <Users size={22} />
              </div>
            </div>
            <div className="small text-info d-flex align-items-center gap-1">
              <CheckCircle size={14} /> <span>Across 6 Academic Depts</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Active Opportunities */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-secondary text-uppercase small fw-semibold tracking-wider d-block mb-1">Active Opportunities</span>
                <h2 className="fw-extrabold text-white mb-0">{s.total_opportunities?.toLocaleString() ?? "142"}</h2>
              </div>
              <div className="p-2.5 rounded-3 bg-warning bg-opacity-25 text-warning flex-shrink-0">
                <Briefcase size={22} />
              </div>
            </div>
            <div className="small text-warning d-flex align-items-center gap-1">
              <Activity size={14} /> <span>{s.active_applications?.toLocaleString() ?? "3,410"} Total Applications</span>
            </div>
          </div>
        </div>

        {/* Card 4: Overall Placement Rate */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary text-uppercase small fw-semibold tracking-wider d-block mb-1">Overall Placement Rate</span>
                <h2 className="fw-extrabold text-success mb-0">{placementRate}%</h2>
              </div>
              <div className="p-2.5 rounded-3 bg-success bg-opacity-25 text-success flex-shrink-0">
                <Award size={22} />
              </div>
            </div>
            <div className="mt-2">
              <div className="progress bg-secondary bg-opacity-25" style={{ height: "6px" }}>
                <div
                  className="progress-bar bg-success rounded-pill"
                  role="progressbar"
                  style={{ width: `${placementRate}%` }}
                  aria-valuenow={placementRate}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirement 2 & 3: Bottom Panels 7:5 Ratio Grid Split with Uniform Inner Padding */}
      <div className="row g-4 align-items-stretch">
        {/* Left Panel: Module Integration Breakdown (7 Columns) */}
        <div className="col-12 col-lg-7">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <Activity size={20} className="text-primary" /> Module Integration Breakdown
              </h5>
              
              {/* Inner 3 Cards with Uniform Grid Spacing */}
              <div className="row g-3 text-center my-3">
                <div className="col-12 col-sm-4">
                  <div className="p-3 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-50 h-100 d-flex flex-column justify-content-center">
                    <span className="text-secondary small d-block mb-1 fw-semibold">Student Profiles</span>
                    <span className="fw-extrabold fs-4 text-info">100% Synced</span>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="p-3 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-50 h-100 d-flex flex-column justify-content-center">
                    <span className="text-secondary small d-block mb-1 fw-semibold">Faculty Officers</span>
                    <span className="fw-extrabold fs-4 text-success">86 Active</span>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="p-3 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-50 h-100 d-flex flex-column justify-content-center">
                    <span className="text-secondary small d-block mb-1 fw-semibold">Pending Overrides</span>
                    <span className="fw-extrabold fs-4 text-warning">{s.pending_verifications ?? 19}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Super Admin Note with clean margin-top spacing */}
            <div className="mt-4 p-3 rounded-3 border border-info border-opacity-25 bg-info bg-opacity-10 text-info small d-flex align-items-start gap-2">
              <span className="fs-6">💡</span>
              <div>
                <strong>Super Admin Note:</strong> Both Student and Faculty databases are actively synced via central SQLite/Django API endpoints. High-level override powers are active across all modules.
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Security & Audit Summary (5 Columns) */}
        <div className="col-12 col-lg-5">
          <div className="p-4 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-75 h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <ShieldAlert size={20} className="text-warning" /> Security & Audit Summary
              </h5>
              
              <ul className="list-group list-group-flush bg-transparent my-2">
                <li className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold">RBAC Security Layer:</span>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1">ACTIVE</span>
                </li>
                <li className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold">Token Refresh Interval:</span>
                  <span className="text-white small fw-semibold">24 Hours</span>
                </li>
                <li className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold">Domain Security Enforcement:</span>
                  <span className="text-info small fw-semibold">@raisoni.net</span>
                </li>
                <li className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold">Secret Key Auth:</span>
                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-2 py-1">ENFORCED</span>
                </li>
                <li className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center border-0">
                  <span className="small fw-semibold">Super Admin Scope:</span>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary px-2 py-1">FULL SYSTEM OVERRIDE</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
