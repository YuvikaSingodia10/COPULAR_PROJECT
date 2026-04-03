import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function AuditLog() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/audit`, config);
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load audit logs. Admin privileges may be required.');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'PII_REMOVED': return <span className="badge bg-secondary">PII Removed</span>;
      case 'IDENTITY_REVEALED': return <span className="badge bg-danger">Identity Revealed</span>;
      case 'RANK_OVERRIDDEN': return <span className="badge bg-warning text-dark">Rank Overridden</span>;
      case 'RESUME_UPLOADED': return <span className="badge bg-info text-dark">Upload</span>;
      case 'JOB_CREATED': return <span className="badge bg-success">Job Created</span>;
      case 'APPLICATION_SUBMITTED': return <span className="badge bg-primary">Application</span>;
      case 'INTERVIEW_SCHEDULED': return <span className="badge bg-success-subtle text-success">Interview</span>;
      default: return <span className="badge bg-light text-dark border">{action}</span>;
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  if (loading) return <LoadingSpinner message="Loading audit trail securely..." />;

  return (
    <div className="dashboard-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4 page-header">
        <div>
          <h1>Platform Audit Log</h1>
          <p className="mb-0">Immutable record of all critical actions on the HireBlind platform.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogs}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger py-3">{error}</div>
      ) : (
        <div className="card-custom">
          <div className="table-responsive">
            <table className="table table-custom mb-0 table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>Timestamp</th>
                  <th style={{ width: '180px' }}>Action</th>
                  <th style={{ width: '150px' }}>Candidate</th>
                  <th style={{ width: '200px' }}>Performed By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">No audit logs found.</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-muted small">{formatDate(log.timestamp)}</td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        {log.candidate_code ? (
                          <span className="fw-medium text-dark">{log.candidate_code}</span>
                        ) : (
                          <span className="text-muted fst-italic small">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '24px', height: '24px' }}>
                            <i className="bi bi-person text-secondary small"></i>
                          </div>
                          <div>
                            <div className="fw-medium" style={{ fontSize: '0.9rem' }}>{log.performed_by}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{log.performer_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="small text-secondary">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLog;
