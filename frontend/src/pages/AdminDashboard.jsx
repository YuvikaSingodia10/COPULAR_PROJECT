import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminDashboard({ user }) {
  const [skills, setSkills] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentJob, setCurrentJob] = useState(null);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    fetchCurrentJob();
    // eslint-disable-next-line
  }, []);

  const fetchCurrentJob = async () => {
    try {
      const res = await axios.get(`${API}/job`, { headers });
      setCurrentJob(res.data);
    } catch (err) {
      // No job yet — that's fine
      setCurrentJob(null);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API}/job`, {
        skills,
        min_experience: parseInt(minExperience, 10),
      }, { headers });

      setSuccess('Job description saved successfully!');
      setSkills('');
      setMinExperience('');
      fetchCurrentJob();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job description.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Job Description</span>
        </h1>
        <p className="page-subtitle">Define the requirements for resume screening</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="glass-card">
            <h5 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
              📋 Set Active Job Description
            </h5>

            {error && <div className="alert-custom alert-danger-custom mb-3">{error}</div>}
            {success && <div className="alert-custom alert-success-custom mb-3">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label-dark" htmlFor="admin-skills">
                  Required Skills
                </label>
                <input
                  id="admin-skills"
                  type="text"
                  className="form-control form-control-dark"
                  placeholder="e.g. Java, Python, SQL, React, Docker"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Comma-separated list of skills
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label-dark" htmlFor="admin-experience">
                  Minimum Experience (years)
                </label>
                <input
                  id="admin-experience"
                  type="number"
                  className="form-control form-control-dark"
                  placeholder="e.g. 3"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom"
                disabled={loading}
              >
                {loading ? (
                  <span className="d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    Saving...
                  </span>
                ) : (
                  '💾 Save Job Description'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="glass-card">
            <h5 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
              🎯 Current Active Job
            </h5>

            {fetchLoading ? (
              <div className="loading-container" style={{ padding: '2rem' }}>
                <div className="spinner-custom" />
                <span className="loading-text">Loading...</span>
              </div>
            ) : currentJob ? (
              <div>
                <div className="mb-3">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Required Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentJob.skills.split(',').map((skill, i) => (
                      <span key={i} className="explanation-tag matched" style={{ borderColor: 'rgba(108, 60, 224, 0.3)', background: 'rgba(108, 60, 224, 0.1)', color: 'var(--primary-light)' }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Minimum Experience
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {currentJob.min_experience}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>years</span>
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Created: {new Date(currentJob.created_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">📋</div>
                <h5>No Job Description</h5>
                <p>Create one using the form on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
