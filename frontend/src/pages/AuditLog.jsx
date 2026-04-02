import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AuditLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/audit`, { headers });
      setLogs(res.data);
    } catch (err) {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('UPLOAD')) return 'upload';
    if (action.includes('PII')) return 'pii';
    if (action.includes('RANKING')) return 'ranking';
    if (action.includes('REVEAL')) return 'reveal';
    return 'upload';
  };

  const getActionIcon = (action) => {
    if (action.includes('UPLOAD')) return '📤';
    if (action.includes('PII')) return '🔒';
    if (action.includes('RANKING')) return '📊';
    if (action.includes('REVEAL')) return '👁️';
    return '📋';
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter((log) => {
        if (filter === 'upload') return log.action.includes('UPLOAD');
        if (filter === 'pii') return log.action.includes('PII');
        if (filter === 'ranking') return log.action.includes('RANKING');
        if (filter === 'reveal') return log.action.includes('REVEAL');
        return true;
      });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Audit Log</span>
        </h1>
        <p className="page-subtitle">
          Complete activity trail for compliance and transparency
        </p>
      </div>

      {!loading && logs.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{logs.length}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">
                {logs.filter((l) => l.action.includes('UPLOAD')).length}
              </div>
              <div className="stat-label">Uploads</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">
                {logs.filter((l) => l.action.includes('PII')).length}
              </div>
              <div className="stat-label">PII Removals</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">
                {logs.filter((l) => l.action.includes('REVEAL')).length}
              </div>
              <div className="stat-label">Reveals</div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {['all', 'upload', 'pii', 'ranking', 'reveal'].map((f) => (
          <button
            key={f}
            className={`btn-outline-custom ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={filter === f ? {
              borderColor: 'var(--primary)',
              color: 'var(--primary-light)',
              background: 'rgba(108, 60, 224, 0.1)',
            } : {}}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert-custom alert-danger-custom mb-3">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner-custom" />
          <span className="loading-text">Loading audit logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h5>No Audit Logs</h5>
            <p>Activities will appear here as they happen.</p>
          </div>
        </div>
      ) : (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Candidate</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={`action-badge ${getActionBadge(log.action)}`}>
                      {getActionIcon(log.action)} {log.action}
                    </span>
                  </td>
                  <td>
                    {log.candidate_code ? (
                      <span style={{ fontWeight: 600 }}>{log.candidate_code}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {log.performed_by_email || `User #${log.performed_by}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuditLog;
