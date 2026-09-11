/**
 * SAIOTAF - Faculty & Moderator Module
 * AnalyticsDashboard  (FR-FAC-06)
 *
 * Charting: Recharts (composable, React-idiomatic, no imperative canvas
 * lifecycle management -- pairs cleanly with React's render cycle).
 *
 * Data contract expected from the backend (see faculty_app/views.py ->
 * ReportViewSet):
 *   GET /faculty/reports/funnel/     -> { applied, under_review, shortlisted,
 *                                          interview, offered, rejected }
 *   GET /faculty/reports/skill-gaps/ -> { skills: string[], gap_counts: number[] }
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [funnelRes, skillsRes] = await Promise.all([
          reportApi.funnel(),
          reportApi.skillGaps(),
        ]);

        const f = funnelRes.data;
        setFunnelData([
          { name: "Applied", value: f.applied, fill: "#2f6fed" },
          { name: "Under Review", value: f.under_review, fill: "#4f8cf7" },
          { name: "Shortlisted", value: f.shortlisted, fill: "#7bb0fb" },
          { name: "Interview", value: f.interview, fill: "#a7cbfd" },
          { name: "Offered", value: f.offered, fill: "#22a06b" },
        ]);

        const s = skillsRes.data;
        setSkillGapData(
          (s.skills || []).map((skill, i) => ({
            skill,
            gapCount: s.gap_counts?.[i] ?? 0,
          }))
        );
      } catch {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-muted py-4">Loading analytics…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h4 className="mb-4">Placement Analytics</h4>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Application Funnel Conversion</h6>
              <ResponsiveContainer width="100%" height={280}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" dataKey="name" fill="#333" stroke="none" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Cohort-Wide Skill Gap Heatmap (Bar View)</h6>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={skillGapData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="skill" width={110} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gapCount" name="Students Missing Skill" fill="#e0533d" />
                </BarChart>
              </ResponsiveContainer>
              {skillGapData.length === 0 && (
                <p className="text-muted small mt-2 mb-0">
                  No skill gap data yet — populated once the AI engine's SkillRec
                  module has processed enough student profiles.
                </p>
              )}
            </div>
          </div>
        </div>

        {/*
          Placement Rate by Branch and Opportunity Fill Rate follow the same
          pattern (fetch -> map into Recharts-friendly array -> <BarChart>).
          Omitted here to avoid duplicating the same chart pattern twice;
          wire identically once /reports/placement-by-branch/ and
          /reports/fill-rate/ endpoints are added to ReportViewSet.
        */}
      </div>
    </div>
  );
}
