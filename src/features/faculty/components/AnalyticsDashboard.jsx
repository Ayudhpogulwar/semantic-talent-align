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
  PieChart, Pie, Cell,
} from "recharts";
import { reportApi } from "../api/facultyApi";

export default function AnalyticsDashboard() {
  const [funnelData, setFunnelData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [funnelStages, setFunnelStages] = useState([]);
  const [totalFunnel, setTotalFunnel] = useState(0);
  const [funnelView, setFunnelView] = useState("pie"); // default to circular pie view
  const [skillGapData, setSkillGapData] = useState([]);
  const [rawFunnel, setRawFunnel] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const handleTheme = () => setTheme(localStorage.getItem("theme") || "dark");
    window.addEventListener("themeChange", handleTheme);
    window.addEventListener("storage", handleTheme);
    return () => {
      window.removeEventListener("themeChange", handleTheme);
      window.removeEventListener("storage", handleTheme);
    };
  }, []);

  const isDark = theme !== "light";
  const axisColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)";
  const labelColor = isDark ? "#f8fafc" : "#0f172a";

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
        const total = f.total ?? ((f.applied ?? 0) + (f.under_review ?? 0) + (f.shortlisted ?? 0) + (f.interview ?? 0) + (f.offered ?? 0));
        setTotalFunnel(total);

        const rawTotal = f.total ?? total;
        const rawApplied = f.new_applied ?? 0;
        const rawReview = f.under_review ?? 0;
        const rawShortlisted = f.shortlisted ?? 0;
        const rawInterview = f.interview ?? 0;
        const rawOffered = f.offered ?? 0;
        const rawRejected = f.rejected ?? 0;

        const allStages = [
          { name: "Applied (New)", value: rawApplied, raw: rawApplied, fill: "#3b82f6" },
          { name: "Under Review", value: rawReview, raw: rawReview, fill: "#06b6d4" },
          { name: "Shortlisted", value: rawShortlisted, raw: rawShortlisted, fill: "#f59e0b" },
          { name: "Interview", value: rawInterview, raw: rawInterview, fill: "#8b5cf6" },
          { name: "Offered / Placed", value: rawOffered, raw: rawOffered, fill: "#10b981" },
        ];
        if (rawRejected > 0) {
          allStages.push({ name: "Rejected", value: rawRejected, raw: rawRejected, fill: "#ef4444" });
        }
        setFunnelStages(allStages);

        const activePieSlices = allStages.filter(s => s.value > 0);
        setPieData(
          activePieSlices.length > 0
            ? activePieSlices
            : [{ name: "No Applications", value: 1, fill: isDark ? "#334155" : "#cbd5e1", isDummy: true }]
        );

        setFunnelData([
          { name: `Total Submitted (${rawTotal})`, value: Math.max(rawTotal, 1), raw: rawTotal, fill: "#2f6fed" },
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
            <div className="fs-3 fw-bold mt-1">{rawFunnel.total ?? rawFunnel.applied ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white p-3 rounded-3">
            <div className="small text-white-50 uppercase fw-bold">Under Review</div>
            <div className="fs-3 fw-bold mt-1">{rawFunnel.under_review ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff" }}>
            <div className="small uppercase fw-bold" style={{ opacity: 0.9 }}>Shortlisted / Interview</div>
            <div className="fs-3 fw-bold mt-1 text-white">{(rawFunnel.shortlisted ?? 0) + (rawFunnel.interview ?? 0)}</div>
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
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="card-title fw-bold mb-1" style={{ color: "var(--text-main)" }}>
                    Application Funnel Conversion
                  </h6>
                  <p className="text-muted small mb-0">
                    Live student progression through application evaluation stages.
                  </p>
                </div>
                <div className="btn-group btn-group-sm" role="group" aria-label="Chart format toggle">
                  <button
                    type="button"
                    className={`btn ${funnelView === "pie" ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                    onClick={() => setFunnelView("pie")}
                    title="Circular Pie Chart View"
                  >
                    🥧 Circular (Pie)
                  </button>
                  <button
                    type="button"
                    className={`btn ${funnelView === "funnel" ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                    onClick={() => setFunnelView("funnel")}
                    title="Funnel Chart View"
                  >
                    📊 Funnel
                  </button>
                </div>
              </div>

              {funnelView === "pie" ? (
                <ResponsiveContainer width="100%" height={290}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#121a2b" : "#ffffff",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                        color: isDark ? "#f8fafc" : "#0f172a",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
                      }}
                      itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                      formatter={(value, name, props) => {
                        if (props?.payload?.isDummy) return ["0", "Applications"];
                        const pct = totalFunnel > 0 ? ((value / totalFunnel) * 100).toFixed(1) : "0";
                        return [`${value} candidates (${pct}%)`, name];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ color: axisColor, fontSize: "12px" }}
                      formatter={(value) => (
                        <span style={{ color: isDark ? "#e2e8f0" : "#334155", marginRight: "8px" }}>
                          {value}
                        </span>
                      )}
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={92}
                      paddingAngle={pieData.length > 1 ? 3 : 0}
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive
                      label={({ name, percent, isDummy }) =>
                        isDummy || percent < 0.05 ? "" : `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke={isDark ? "#121a2b" : "#ffffff"}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={290}>
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#121a2b" : "#ffffff",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                        color: isDark ? "#f8fafc" : "#0f172a",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                      }}
                      itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                      formatter={(value, name, props) => [props.payload.raw, "Applications"]}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" dataKey="name" fill={labelColor} stroke="none" fontWeight={600} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}

              {/* Stage breakdown indicator pills */}
              <div
                className="d-flex flex-wrap justify-content-between gap-1 pt-2 mt-1 border-top"
                style={{ borderColor: gridColor }}
              >
                {funnelStages.map((stage) => (
                  <div key={stage.name} className="text-center px-1">
                    <div className="small fw-semibold" style={{ color: stage.fill, fontSize: "11px" }}>
                      ● {stage.name}
                    </div>
                    <div className="fw-bold" style={{ color: "var(--text-main)", fontSize: "13px" }}>
                      {stage.value}
                    </div>
                  </div>
                ))}
              </div>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" allowDecimals={false} stroke={axisColor} tick={{ fill: axisColor }} />
                  <YAxis type="category" dataKey="skill" width={110} stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#121a2b" : "#ffffff",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                      color: isDark ? "#f8fafc" : "#0f172a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                    }}
                    itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                  />
                  <Legend wrapperStyle={{ color: axisColor }} />
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
