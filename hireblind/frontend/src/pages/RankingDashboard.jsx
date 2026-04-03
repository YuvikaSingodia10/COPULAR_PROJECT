import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CandidateCard from '../components/CandidateCard';
import RevealModal from '../components/RevealModal';
import LoadingSpinner from '../components/LoadingSpinner';

function RankingDashboard() {
  const { token, role } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reveal Modal State
  const [showReveal, setShowReveal] = useState(false);
  const [revealTarget, setRevealTarget] = useState(null);
  const [revealedData, setRevealedData] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('all');

  useEffect(() => {
    fetchJobs();
    fetchRankings('all');
    // eslint-disable-next-line
  }, []);

  const fetchJobs = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/job/all`, config);
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  const fetchRankings = async (jobId) => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/rank?job_id=${jobId}`, config);
      setCandidates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load rankings. Please ensure you have appropriate permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealClick = (code) => {
    setRevealTarget(code);
    setRevealedData(null);
    setShowReveal(true);
  };

  const handleConfirmReveal = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/${revealTarget}/reveal`, {}, config);
      setRevealedData(response.data);
      // Wait for user to dismiss modal, then refresh (though real data isn't shown in list anyway)
    } catch (err) {
      if (err.response?.status === 404) {
        setRevealedData(err.response.data.fallback);
      } else {
        alert(err.response?.data?.error || 'Failed to reveal identity');
        setShowReveal(false);
      }
    }
  };

  const handleCloseReveal = () => {
    setShowReveal(false);
    setRevealTarget(null);
    setRevealedData(null);
  };

  const handleOverrideRank = async (candidate) => {
    const reason = prompt(`Provide a reason for overriding rank for candidate ${candidate.candidate_code}:`);
    if (!reason) return; // Action cancelled
    
    const newRank = prompt(`Enter new rank number for ${candidate.candidate_code} (current: ${candidate.rank}):`);
    if (!newRank || isNaN(newRank)) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/${candidate.candidate_code}/override`, {
        new_rank: newRank,
        reason
      }, config);
      fetchRankings(selectedJobId); // Refresh list to get new order
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to override rank');
    }
  };

  const handleSchedule = async (candidateCode, scheduleData) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/${candidateCode}/schedule`, scheduleData, config);
      fetchRankings(selectedJobId); // Refresh to show scheduled status
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule interview');
    }
  };

  const handleStatusChange = async (candidateCode, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/${candidateCode}/status`, { status }, config);
      alert(`Status updated to ${status}`);
    } catch (err) {
      // It might fail if no application record exists (bulk uploaded resumes don't have application records yet unless linked)
      // For simple demo, we won't crash hard
      alert(err.response?.data?.error || 'Failed to update status. Candidate may not have a formal application record.');
    }
  };

  const handleCallInitiated = async (candidateCode) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/candidates/${candidateCode}/log-call`, {}, config);
      // Let user know call was logged
    } catch (err) {
      console.error('Failed to log call', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-wrapper">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 page-header">
        <div>
          <h1>Candidate Rankings</h1>
          <p className="mb-0">Bias-free evaluation based entirely on skills and experience matching.</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">
          <select 
            className="form-select w-auto me-2"
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              fetchRankings(e.target.value);
            }}
          >
            <option value="all">All Jobs</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <button className="btn btn-outline-secondary" onClick={() => fetchRankings(selectedJobId)}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          {role === 'recruiter' && (
            <a href="/upload" className="btn btn-primary">
              <i className="bi bi-cloud-arrow-up me-1"></i>Upload More
            </a>
          )}
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger py-3">{error}</div>
      ) : candidates.length === 0 ? (
        <div className="card-custom">
          <div className="card-body text-center py-5">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}><i className="bi bi-inbox"></i></div>
            <h4>No Candidates Yet</h4>
            <p className="text-muted">Wait for job seekers to apply or upload resumes manually.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="bi bi-list-ol me-2 text-primary"></i>
              Ranked Pool <span className="badge bg-secondary ms-2">{candidates.length}</span>
            </h5>
            
            <div className="d-flex flex-column gap-3">
              {candidates.map(candidate => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isAdmin={role === 'admin'}
                  onReveal={handleRevealClick}
                  onOverride={handleOverrideRank}
                  onSchedule={handleSchedule}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
          
          <div className="col-lg-4 d-none d-lg-block">
            <div className="card-custom position-sticky" style={{ top: '20px' }}>
              <div className="card-body">
                <h5 className="fw-bold mb-3">Scoring Metrics</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Required Skill Match</span>
                    <span className="fw-bold">High</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Experience Requirement</span>
                    <span className="fw-bold">Med</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Bonus Keywords</span>
                    <span className="fw-bold">Low</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '35%' }}></div>
                  </div>
                </div>
                
                <hr />
                
                <h6 className="fw-bold text-muted text-uppercase small">Points System</h6>
                <ul className="small text-muted ps-3 mb-0">
                  <li><strong>+2 pts</strong> per matching required skill</li>
                  <li><strong>+3 pts</strong> if minimum experience met</li>
                  <li><strong>+1 pt</strong> per relevant bonus keyword</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'admin' && (
        <RevealModal
          show={showReveal}
          onClose={handleCloseReveal}
          onConfirm={handleConfirmReveal}
          candidateCode={revealTarget}
          revealedData={revealedData}
          onCallInitiated={handleCallInitiated}
        />
      )}
    </div>
  );
}

export default RankingDashboard;
