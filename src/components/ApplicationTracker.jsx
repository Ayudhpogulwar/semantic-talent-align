import React, { useState } from 'react';
import { CheckCircle, Clock, FileText, AlertTriangle, ShieldCheck, Filter, ChevronRight, ExternalLink, Building } from 'lucide-react';

export default function ApplicationTracker({ applications }) {
  const [statusFilter, setStatusFilter] = useState('All');

  const statuses = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];

  const filteredApps = applications.filter(app => {
    if (statusFilter === 'All') return true;
    return app.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Shortlisted':
      case 'Interview':
        return <span className="badge badge-emerald"><CheckCircle size={12} /> {status}</span>;
      case 'Under Review':
        return <span className="badge badge-amber"><Clock size={12} /> Under Review</span>;
      case 'Applied':
        return <span className="badge badge-cyan"><FileText size={12} /> Applied</span>;
      case 'Selected':
        return <span className="badge badge-primary" style={{ background: 'var(--accent-purple)', color: '#fff' }}>🎉 Selected</span>;
      default:
        return <span className="badge badge-primary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle color="#f59e0b" /> End-to-End Application Tracker
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Track application pipeline progress sourced directly from Backend Application Management service.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-dim)" />
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Applications Pipeline List / Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {filteredApps.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No submitted applications found for filter "{statusFilter}".
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApps.map((app, index) => (
              <div key={app.id || app.application_id || index} style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>ID: {app.application_id}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Role:</span>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>{app.opportunity_title}</h3>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Organization:</span>
                        <Building size={14} color="var(--accent-cyan)" /> {app.organization}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div>Applied On: <strong>{app.applied_date}</strong></div>
                    <div style={{ marginTop: '2px', color: 'var(--text-dim)' }}>Last Updated: {new Date(app.last_updated).toLocaleString()}</div>
                  </div>
                </div>

                {/* Simulated Pipeline Visualizer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--input-bg)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  margin: '4px 0'
                }}>
                  {['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'].map((step, idx) => {
                    const stepOrder = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];
                    const currentIdx = stepOrder.indexOf(app.status);
                    const isCompleted = idx <= currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isCompleted ? 'var(--primary)' : 'var(--border-color)',
                            color: isCompleted ? '#fff' : 'var(--text-muted)',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isCompleted ? '2px solid var(--primary-light)' : 'none'
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: isCompleted ? 'var(--text-main)' : 'var(--text-dim)', fontWeight: isCompleted ? 700 : 400 }}>
                            {step}
                          </span>
                        </div>
                        {idx < 4 && (
                          <div style={{ flex: 1, height: '2px', background: idx < currentIdx ? 'var(--primary)' : 'var(--border-color)', margin: '0 8px' }}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(99, 102, 241, 0.06)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--primary-light)'
                }}>
                  💬 <strong>Status Update Note:</strong> {app.notes}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
