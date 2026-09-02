/**
 * SAIOTAF - Faculty & Moderator Module
 * AnalyticsDashboard  (FR-FAC-06)
 *
 * Dynamic Placement Analytics connected to real database project metrics.
 */

import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, FunnelChart, Funnel, LabelList,
} from "recharts";
import { reportApi } from "../api/facultyApi";

export default function AnalyticsDashboard() {
  const [funnelData, setFunnelData] = useState([]);
  const [skillGapData, setSkillGapData] = useState([]);
  const [rawFunnel, setRawFunnel] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [funnelRes, skillsRes] = await Promise.all([
          reportApi.funnel(),
          reportApi.skillGaps(),
        ]);

        const f = funnelRes.data || {};
        setRawFunnel(f);
        
        // Dynamic funnel mapping with live database values
        const rawApplied = f.applied ?? 0;
        const rawReview = f.under_review ?? 0;
        const rawShortlisted = f.shortlisted ?? 0;
        const rawInterview = f.interview ?? 0;
        const rawOffered = f.offered ?? 0;

        setFunnelData([
          { name: `Applied (${rawApplied})`, value: Math.max(rawApplied, 1), raw: rawApplied, fill: "#2f6fed" },
          { name: `Under Review (${rawReview})`, value: Math.max(rawReview, 0.8), raw: rawReview, fill: "#4f8cf7" },
          { name: `Shortlisted (${rawShortlisted})`, value: Math.max(rawShortlisted, 0.6), raw: rawShortlisted, fill: "#7bb0fb" },
          { name: `Interview (${rawInterview})`, value: Math.max(rawInterview, 0.4), raw: rawInterview, fill: "#a7cbfd" },
          { name: `Offered (${rawOffered})`, value: Math.max(rawOffered, 0.2), raw: rawOffered, fill: "#22a06b" },
        ]);

        const s = skillsRes.data || {};
        const skillsList = s.skills || [];
        const gapCounts = s.gap_counts || [];
        
        setSkillGapData(
          skillsList.map((skill, i) => ({
            skill,
            gapCount: gapCounts[i] ?? 0,
          }))
        );
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-muted py-4">Loading analytics from project database…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Placement Analytics</h4>
          <p className="text-muted small mb-0">Dynamic real-time analytics aggregated from active student applications & opportunities database.</p>
        </div>
      </div>

      {/* Summary KPI metric cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white p-3 rounded-3">
            <div className="small text-white-50 uppercase fw-bold">Total Applications</div>
            <div className="fs-3 fw-bold mt-1">{rawFunnel.applied ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white p-3 rounded-3">
            <div className="small text-white-50 uppercase fw-bold">Under Review</div>
            <div className="fs-3 fw-bold mt-1">{rawFunnel.under_review ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-dark p-3 rounded-3">
            <div className="small text-dark-50 uppercase fw-bold">Shortlisted / Interview</div>
            <div className="fs-3 fw-bold mt-1">{(rawFunnel.shortlisted ?? 0) + (rawFunnel.interview ?? 0)}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white p-3 rounded-3">
            <div className="small text-white-50 uppercase fw-bold">Offered / Placed</div>
            <div className="fs-3 fw-bold mt-1">{rawFunnel.offered ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Application Funnel Conversion */}
        <div className="col-lg-6">
          <div className="faculty-card h-100 border-0">
            <div className="card-body p-0">
              <h6 className="card-title fw-bold" style={{ color: "var(--text-main)" }}>Application Funnel Conversion</h6>
              <p className="text-muted small">Live student progression through application evaluation stages.</p>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip formatter={(value, name, props) => [props.payload.raw, "Applications"]} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" dataKey="name" fill="var(--text-muted)" stroke="none" fontWeight={600} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cohort-Wide Skill Gap Heatmap */}
        <div className="col-lg-6">
          <div className="faculty-card h-100 border-0">
            <div className="card-body p-0">
              <h6 className="card-title fw-bold" style={{ color: "var(--text-main)" }}>Cohort-Wide Skill Gap Heatmap (Bar View)</h6>
              <p className="text-muted small">Required skills across active opportunities vs student cohort coverage.</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillGapData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--text-muted)" />
                  <YAxis type="category" dataKey="skill" width={110} stroke="var(--text-muted)" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gapCount" name="Students Missing Skill" fill="#e0533d" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {skillGapData.length === 0 && (
                <p className="text-muted small mt-2 mb-0">
                  No skill gap data yet — populated once opportunities are posted to the database.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
