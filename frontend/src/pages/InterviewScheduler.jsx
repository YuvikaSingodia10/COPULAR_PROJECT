import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function InterviewScheduler({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      const [candidatesRes, interviewsRes] = await Promise.all([
        axios.get(`${API}/candidates/rank`, { headers }),
        axios.get(`${API}/interviews`, { headers }),
      ]);

      // Only show shortlisted/accepted candidates for scheduling
      const eligible = candidatesRes.data.filter(
        c => c.status === 'shortlisted' || c.status === 'accepted'
      );
      setCandidates(eligible);
      setInterviews(interviewsRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setScheduling(true);

    try {
      await axios.post(`${API}/interviews`, {
        candidate_code: selectedCandidate,
        interview_date: interviewDate,
        interview_time: interviewTime,
        notes: notes || undefined,
      }, { headers });

      setSuccess(`Interview scheduled for ${selectedCandidate}`);
      setSelectedCandidate('');
      setInterviewDate('');
      setInterviewTime('');
      setNotes('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule interview.');
    } finally {
      setScheduling(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API}/interviews/${id}`, { status: newStatus }, { headers });
      setSuccess(`Interview ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update interview.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'scheduled': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' };
      case 'confirmed': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
      case 'completed': return { bg: 'rgba(108, 60, 224, 0.1)', color: '#8b5cf6', border: 'rgba(108, 60, 224, 0.2)' };
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'rgba(239, 68, 68, 0.2)' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'var(--border-color)' };
    }
  };

  const activeInterviews = interviews.filter(i => i.status !== 'cancelled');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Blind Interview Scheduler</span>
        </h1>
        <p className="page-subtitle">
          Schedule interviews using anonymous candidate codes — identity hidden until confirmation
        </p>
      </div>

      {error && (
        <div className="alert-custom alert-danger-custom mb-3">{error}</div>
      )}
      {success && (
        <div className="alert-custom alert-success-custom mb-3" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          ✅ {success}
        </div>
      )}

      <div className="row g-4">
        {/* Schedule Form */}
        <div className="col-lg-5">
          <div className="glass-card">
            <h5 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
              📅 Schedule Interview
            </h5>

            {candidates.length === 0 && !loading ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">⭐</div>
                <h5>No Eligible Candidates</h5>
                <p>Shortlist or accept candidates from the Rankings page first.</p>
              </div>
            ) : (
              <form onSubmit={handleSchedule}>
                <div className="mb-3">
                  <label className="form-label-dark" htmlFor="interview-candidate">
                    Candidate (Anonymous)
                  </label>
                  <select
                    id="interview-candidate"
                    className="form-select form-select-dark"
                    value={selectedCandidate}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    required
                  >
                    <option value="">Select a candidate...</option>
                    {candidates.map((c) => (
                      <option key={c.candidate_code} value={c.candidate_code}>
                        {c.candidate_code} — Score: {c.score} | Confidence: {parseFloat(c.confidence_score || 0).toFixed(0)}%
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Only shortlisted/accepted candidates shown
                  </small>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label-dark" htmlFor="interview-date">Date</label>
                    <input
                      id="interview-date"
                      type="date"
                      className="form-control form-control-dark"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      min={today}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label-dark" htmlFor="interview-time">Time</label>
                    <input
                      id="interview-time"
                      type="time"
                      className="form-control form-control-dark"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label-dark" htmlFor="interview-notes">Notes (optional)</label>
                  <textarea
                    id="interview-notes"
                    className="form-control form-control-dark"
                    rows="2"
                    placeholder="e.g. Technical round, Panel interview..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-custom w-100"
                  disabled={scheduling}
                >
                  {scheduling ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" />
                      Scheduling...
                    </span>
                  ) : (
                    '📅 Schedule Interview'
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="glass-card mt-3">
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              🛡️ Blind Scheduling Rules
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: '🕵️', text: 'Candidates shown by code only — no names' },
                { icon: '📊', text: 'Scheduling based on score & confidence' },
                { icon: '👁️', text: 'Identity revealed only at confirmation' },
                { icon: '📋', text: 'All actions logged in audit trail' },
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 0',
                  borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.9rem', color: 'var(--text-secondary)',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interview List */}
        <div className="col-lg-7">
          <div className="glass-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                📋 Scheduled Interviews ({activeInterviews.length})
              </h5>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '2rem' }}>
                <div className="spinner-custom" />
                <span className="loading-text">Loading interviews...</span>
              </div>
            ) : activeInterviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">📅</div>
                <h5>No Interviews Scheduled</h5>
                <p>Use the form to schedule your first blind interview.</p>
              </div>
            ) : (
              <div className="interview-list">
                {activeInterviews.map((interview) => {
                  const statusStyle = getStatusStyle(interview.status);
                  return (
                    <div key={interview.id} className="interview-card">
                      <div className="interview-header">
                        <div className="d-flex align-items-center gap-3">
                          <div className="interview-date-badge">
                            <div className="interview-day">
                              {new Date(interview.interview_date).getDate()}
                            </div>
                            <div className="interview-month">
                              {new Date(interview.interview_date).toLocaleDateString('en', { month: 'short' })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                              {interview.candidate_code}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {interview.interview_time} ·
                              Score: {interview.score || 'N/A'} ·
                              Confidence: {parseFloat(interview.confidence_score || 0).toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                          background: statusStyle.bg, color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                        }}>
                          {getStatusIcon(interview.status)} {interview.status}
                        </span>
                      </div>

                      {interview.notes && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px', fontStyle: 'italic' }}>
                          📝 {interview.notes}
                        </div>
                      )}

                      <div className="interview-actions">
                        {interview.status === 'scheduled' && (
                          <button
                            className="action-btn accept"
                            onClick={() => handleUpdateStatus(interview.id, 'confirmed')}
                          >
                            ✅ Confirm
                          </button>
                        )}
                        {interview.status === 'confirmed' && (
                          <button
                            className="action-btn accept"
                            onClick={() => handleUpdateStatus(interview.id, 'completed')}
                          >
                            🎉 Complete
                          </button>
                        )}
                        {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                          <button
                            className="action-btn reject"
                            onClick={() => handleUpdateStatus(interview.id, 'cancelled')}
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduler;
