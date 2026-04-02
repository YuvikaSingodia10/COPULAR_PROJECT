import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CandidateCard from '../components/CandidateCard';
import RevealModal from '../components/RevealModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function RankingDashboard({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealCandidate, setRevealCandidate] = useState(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealData, setRevealData] = useState({});

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

  const topScore = candidates.length > 0 ? candidates[0].score : 0;
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Candidate Rankings</span>
        </h1>
        <p className="page-subtitle">
          Bias-free rankings based on skills and experience matching
        </p>
      </div>

      {!loading && candidates.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-value">{candidates.length}</div>
              <div className="stat-label">Total Candidates</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-value">{topScore}</div>
              <div className="stat-label">Top Score</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-value">{avgScore}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
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
      ) : (
        <div>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isAdmin={user.role === 'admin'}
              onReveal={handleRevealClick}
              revealData={revealData[candidate.candidate_code]}
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
    </div>
  );
}

export default RankingDashboard;
