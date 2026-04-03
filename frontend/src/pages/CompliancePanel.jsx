import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CompliancePanel({ user }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, []);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API}/audit/compliance-report`, { headers });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load compliance report.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hireblind_compliance_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner-custom" />
          <span className="loading-text">Generating compliance report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-custom alert-danger-custom">{error}</div>
      </div>
    );
  }

  const r = report;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">EU AI Act Compliance</span>
        </h1>
        <p className="page-subtitle">
          Transparency report for bias-free screening — Articles 13, 14 & 22
        </p>
      </div>

      {/* System Classification Card */}
      <div className="glass-card mb-4 compliance-hero">
        <div className="row align-items-center">
          <div className="col-md-8">
            <div className="compliance-badge-row">
              <span className="compliance-badge high-risk">HIGH-RISK AI SYSTEM</span>
              <span className="compliance-badge annex">ANNEX III</span>
              <span className="compliance-badge compliant">✓ COMPLIANT</span>
            </div>
            <h4 style={{ fontWeight: 800, margin: '1rem 0 0.5rem' }}>
              {r.system_info.system_name}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 0 }}>
              {r.system_info.pii_protection}. {r.system_info.human_in_the_loop}.
            </p>
          </div>
          <div className="col-md-4 text-end">
            <button className="btn btn-primary-custom" onClick={downloadReport}>
              📥 Download Report
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
              Generated: {new Date(r.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Articles */}
      <div className="row g-3 mb-4">
        {r.system_info.compliance_articles.map((article, i) => (
          <div key={i} className="col-md-4">
            <div className="stat-card" style={{ textAlign: 'left', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {i === 0 ? '🔍' : i === 1 ? '👤' : '🛡️'}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                {article}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {i === 0 && 'Confidence scores & explainability tags provided for every decision'}
                {i === 1 && 'All accept/reject/shortlist decisions require human action'}
                {i === 2 && 'No automated hiring decisions — AI ranks, humans decide'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{r.total_audit_events}</div>
            <div className="stat-label">Total Audit Events</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{r.pii_removal_summary.total_fields_removed}</div>
            <div className="stat-label">PII Fields Removed</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{r.overrides.total}</div>
            <div className="stat-label">Manual Overrides</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-value">{r.identity_reveals.total}</div>
            <div className="stat-label">Identity Reveals</div>
          </div>
        </div>
      </div>

      {/* Scoring Methodology */}
      {r.scoring_criteria && (
        <div className="glass-card mb-4">
          <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
            📊 Scoring Methodology
          </h5>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="method-item">
                <div className="method-label">Job Title</div>
                <div className="method-value">{r.scoring_criteria.job_title}</div>
              </div>
              <div className="method-item">
                <div className="method-label">Required Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {r.scoring_criteria.required_skills.split(',').map((s, i) => (
                    <span key={i} className="explanation-tag matched" style={{ margin: 0 }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="method-item">
                <div className="method-label">Minimum Experience</div>
                <div className="method-value">{r.scoring_criteria.minimum_experience}</div>
              </div>
              <div className="method-item">
                <div className="method-label">Role Keywords</div>
                <div className="method-value">{r.scoring_criteria.role_keywords}</div>
              </div>
            </div>
          </div>

          <h6 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '1rem' }}>
            Scoring Formula
          </h6>
          <div className="scoring-formula">
            {Object.entries(r.scoring_criteria.scoring_methodology).map(([key, value]) => (
              <div key={key} className="formula-row">
                <span className="formula-key">{key.replace(/_/g, ' ')}</span>
                <span className="formula-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking Results with Confidence */}
      <div className="glass-card mb-4">
        <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
          🏆 Ranking Results & Confidence Scores
        </h5>
        <div className="audit-table-wrapper" style={{ border: 'none' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Score</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {r.ranking_results.map((c) => (
                <tr key={c.candidate_code}>
                  <td>
                    <span style={{ fontWeight: 700 }}>#{c.rank}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.candidate_code}</td>
                  <td>
                    <span className="explanation-tag matched" style={{ margin: 0 }}>
                      {c.score} pts
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: c.confidence_score >= 75 ? '#10b981'
                        : c.confidence_score >= 50 ? '#f59e0b'
                        : '#ef4444'
                    }}>
                      {parseFloat(c.confidence_score).toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge-sm ${c.status}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(c.processed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overrides Section */}
      {r.overrides.total > 0 && (
        <div className="glass-card mb-4">
          <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
            🚩 Manual Overrides ({r.overrides.total})
          </h5>
          <div className="alert-custom alert-warning-custom mb-3">
            <strong>⚠️ Bias Review Required:</strong> {r.overrides.total} manual override(s) detected.
            Review patterns for potential discrimination signals.
          </div>
          {r.overrides.records.map((o, i) => (
            <div key={i} className="override-record">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>{o.candidate_code}</strong>
                  <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                  Rank #{o.original_rank} → #{o.new_rank}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(o.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                "{o.justification}"
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                By: {o.performed_by}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PII Removal Summary */}
      <div className="glass-card mb-4">
        <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
          🔒 PII Removal Summary
        </h5>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {r.pii_removal_summary.total_candidates_processed} candidates processed,{' '}
          {r.pii_removal_summary.total_fields_removed} PII fields removed
        </p>
        {Object.entries(r.pii_removal_summary.by_candidate).map(([code, fields]) => (
          <div key={code} className="pii-candidate-row">
            <div className="pii-candidate-code">{code}</div>
            <div className="pii-fields">
              {fields.map((f, i) => (
                <span key={i} className="pii-field-tag">
                  🔒 {f.field}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompliancePanel;
