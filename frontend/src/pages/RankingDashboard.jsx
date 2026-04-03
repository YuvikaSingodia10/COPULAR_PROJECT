import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CandidateCard from '../components/CandidateCard';
import RevealModal from '../components/RevealModal';
import OverrideModal from '../components/OverrideModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function RankingDashboard({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revealCandidate, setRevealCandidate] = useState(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [overrideCandidate, setOverrideCandidate] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [revealData, setRevealData] = useState({});
  const [actionFeedback, setActionFeedback] = useState('');

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/candidates/rank`, { headers });
      setCandidates(res.data);
    } catch (err) {
      setError('Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealClick = (candidate) => {
    setRevealCandidate(candidate);
    setShowRevealModal(true);
  };

  const handleRevealConfirm = async () => {
    if (!revealCandidate) return;
    try {
      const res = await axios.post(
        `${API}/candidates/${revealCandidate.candidate_code}/reveal`,
        {},
        { headers }
      );
      setRevealData((prev) => ({
        ...prev,
        [revealCandidate.candidate_code]: res.data,
      }));
      setShowRevealModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reveal identity.');
      setShowRevealModal(false);
    }
  };

  const handleStatusChange = async (candidateCode, newStatus) => {
    try {
      await axios.patch(
        `${API}/candidates/${candidateCode}/status`,
        { status: newStatus },
        { headers }
      );
      setActionFeedback(`${candidateCode} marked as ${newStatus}`);
      setTimeout(() => setActionFeedback(''), 3000);
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleOverrideClick = (candidate) => {
    setOverrideCandidate(candidate);
    setShowOverrideModal(true);
  };

  const handleOverrideConfirm = async (overrideData) => {
    try {
      await axios.post(
        `${API}/candidates/${overrideData.candidate_code}/override`,
        overrideData,
        { headers }
      );
      setShowOverrideModal(false);
      setActionFeedback(`Override recorded for ${overrideData.candidate_code}`);
      setTimeout(() => setActionFeedback(''), 3000);
      fetchCandidates();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to submit override.');
    }
  };

  const filteredCandidates = statusFilter === 'all'
    ? candidates
    : candidates.filter(c => (c.status || 'pending') === statusFilter);

  const topScore = candidates.length > 0 ? candidates[0].score : 0;
  const avgConfidence = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + parseFloat(c.confidence_score || 0), 0) / candidates.length)
    : 0;
  const shortlisted = candidates.filter(c => c.status === 'shortlisted' || c.status === 'accepted').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Candidate Rankings</span>
        </h1>
        <p className="page-subtitle">
          Bias-free rankings with AI confidence scores — human decision required
        </p>
      </div>

      {actionFeedback && (
        <div className="alert-custom alert-success-custom mb-3" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          ✅ {actionFeedback}
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{candidates.length}</div>
              <div className="stat-label">Total Candidates</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{topScore}</div>
              <div className="stat-label">Top Score</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{avgConfidence}%</div>
              <div className="stat-label">Avg Confidence</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-value">{shortlisted}</div>
              <div className="stat-label">Shortlisted</div>
            </div>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      {!loading && candidates.length > 0 && (
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {['all', 'pending', 'shortlisted', 'accepted', 'rejected'].map((f) => (
            <button
              key={f}
              className={`btn-outline-custom ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
              style={statusFilter === f ? {
                borderColor: 'var(--primary)',
                color: 'var(--primary-light)',
                background: 'rgba(108, 60, 224, 0.1)',
              } : {}}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span style={{ marginLeft: '6px', opacity: 0.6, fontSize: '0.75rem' }}>
                  ({candidates.filter(c => (c.status || 'pending') === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <div className="alert-custom alert-danger-custom mb-3">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner-custom" />
          <span className="loading-text">Loading candidates...</span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h5>No Candidates Yet</h5>
            <p>Upload resumes to see the ranking dashboard.</p>
          </div>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h5>No candidates with status "{statusFilter}"</h5>
            <p>Try a different filter.</p>
          </div>
        </div>
      ) : (
        <div>
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isAdmin={user.role === 'admin'}
              onReveal={handleRevealClick}
              revealData={revealData[candidate.candidate_code]}
              onStatusChange={handleStatusChange}
              onOverride={handleOverrideClick}
            />
          ))}
        </div>
      )}

      <RevealModal
        show={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        onConfirm={handleRevealConfirm}
        candidate={revealCandidate}
      />

      <OverrideModal
        show={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={handleOverrideConfirm}
        candidate={overrideCandidate}
      />
    </div>
  );
}

export default RankingDashboard;
