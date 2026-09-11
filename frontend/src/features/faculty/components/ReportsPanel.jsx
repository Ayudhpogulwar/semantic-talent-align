/**
 * SAIOTAF - Faculty & Moderator Module
 * ReportsPanel  (FR-FAC-07)
 * Triggers backend report generation and downloads the resulting file.
 */

import React, { useState } from "react";
import { reportApi } from "../api/facultyApi";

export default function ReportsPanel() {
  const [format, setFormat] = useState("pdf");
  const [department, setDepartment] = useState("");
  const [term, setTerm] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await reportApi.export(format, department || undefined, term || undefined);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `placement_report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Report generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <h4 className="mb-3">Generate Report</h4>

      <div className="card shadow-sm">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Format</label>
              <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="pdf">PDF (Accreditation)</option>
                <option value="xlsx">Excel</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Department (optional)</label>
              <input
                type="text"
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Term (optional)</label>
              <input
                type="text"
                className="form-control"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. Fall 2026"
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={handleExport} disabled={generating}>
                {generating ? "Generating…" : "Export"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
