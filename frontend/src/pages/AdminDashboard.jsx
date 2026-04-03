import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminDashboard() {
  const { token, userName, workspaceCode } = useAuth();
  const [formData, setFormData] = useState({ title: '', min_experience: '' });
  const [skillsArray, setSkillsArray] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const COMMON_SKILLS = [
    'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'PostgreSQL', 
    'TypeScript', 'JavaScript', 'AWS', 'Docker', 'Kubernetes', 'C++', 
    'Go', 'Express', 'Pandas', 'Machine Learning', 'Leadership', 'Git', 'Agile'
  ];
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/job/all`, config);
      setJobs(response.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/audit/stats`, config);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (skill) => {
    if (skill.trim() && !skillsArray.includes(skill.trim())) {
      setSkillsArray([...skillsArray, skill.trim()]);
    }
    setSkillInput('');
    setShowSuggestions(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsArray(skillsArray.filter(s => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (skillsArray.length === 0) {
      setMessage('Error: Please add at least one required skill.');
      return;
    }
    setSubmitting(true);
    setMessage('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { ...formData, skills: skillsArray.join(', ') };
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/job`, payload, config);
      setMessage('New job requisition created successfully!');
      setFormData({ title: '', min_experience: '' });
      setSkillsArray([]);
      setSkillInput('');
      await fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || 'Failed to update job'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-wrapper">
      <div className="page-header">
        <h1>Welcome, {userName}</h1>
        <p>Manage the active job description and platform settings.</p>
      </div>

      {/* Workspace Info Banner */}
      {workspaceCode && (
        <div className="card-custom mb-4" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)', border: 'none' }}>
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between p-3">
            <div className="text-white d-flex align-items-center gap-3">
              <i className="bi bi-link-45deg" style={{ fontSize: '1.5rem' }}></i>
              <div>
                <span className="fw-bold">Linked Workspace:</span>
                <span className="ms-2 px-3 py-1 rounded-2" style={{ background: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: '700', fontSize: '1.1rem' }}>
                  {workspaceCode}
                </span>
              </div>
            </div>
            <span className="text-white-50 small mt-2 mt-md-0">
              <i className="bi bi-info-circle me-1"></i>You are viewing data scoped to this workspace only.
            </span>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card-custom h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Create New Job Requisition</h4>
              </div>

              {message && (
                <div className={`alert ${message.startsWith('Error') ? 'alert-danger' : 'alert-success'} py-2`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Job Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Senior Frontend Developer"
                  />
                </div>

                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">
                    Required Skills <span className="text-muted fw-normal fs-sm">(Add tags to build the profile)</span>
                  </label>
                  
                  <div className="d-flex flex-wrap gap-2 mb-2 p-2 border rounded bg-white min-vh-25" style={{ minHeight: '50px' }}>
                    {skillsArray.map((skill, idx) => (
                      <span key={idx} className="badge bg-success-subtle text-success-emphasis border border-success-subtle d-flex align-items-center gap-1 fs-6 px-3 py-2 rounded-pill">
                        {skill}
                        <i 
                          className="bi bi-x-circle-fill ms-1" 
                          style={{ cursor: 'pointer', opacity: 0.7 }}
                          onClick={() => handleRemoveSkill(skill)}
                        ></i>
                      </span>
                    ))}
                    <div className="position-relative flex-grow-1" style={{ minWidth: '150px' }}>
                      <input
                        type="text"
                        className="form-control border-0 shadow-none p-0 my-1"
                        style={{ outline: 'none' }}
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onKeyDown={handleSkillKeyDown}
                        placeholder={skillsArray.length === 0 ? "Type a skill and press Enter..." : "Add another skill..."}
                      />
                      {showSuggestions && skillInput.length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-sm z-3 mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {COMMON_SKILLS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skillsArray.includes(s)).map((suggestion, idx) => (
                            <div 
                              key={idx} 
                              className="p-2 border-bottom cursor-pointer text-dark text-nowrap user-select-none"
                              style={{ cursor: 'pointer' }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddSkill(suggestion);
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {suggestion}
                            </div>
                          ))}
                          <div
                            className="p-2 text-primary fst-italic text-nowrap user-select-none"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddSkill(skillInput);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-plus-circle me-1"></i>Add "{skillInput}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-text small">Press Enter or click "Add" to insert a new skill box. Ensure they match your expectations precisely.</div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Minimum Experience (Years)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="min_experience"
                      value={formData.min_experience}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                  ) : (
                    <><i className="bi bi-save me-2"></i>Create New Job</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card-custom bg-primary text-white h-100" style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #1557b0 100%)' }}>
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: '0.9' }}>
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h3 className="fw-bold mb-3">Admin Privileges</h3>
                <p className="opacity-75 mb-4" style={{ lineHeight: '1.7' }}>
                  As an administrator, you have the ability to reveal candidate identities, override AI rankings, and update application statuses. All actions are securely logged in the audit trail.
                </p>
              </div>

              <div className="d-grid gap-2">
                <a href="/ranking" className="btn btn-light fw-bold text-primary">
                  <i className="bi bi-bar-chart-fill me-2"></i>Go to Rankings
                </a>
                <a href="/audit" className="btn btn-outline-light">
                  <i className="bi bi-journal-text me-2"></i>View Audit Log
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="row mt-4">
          <div className="col-12">
            <h3 className="fw-bold mb-3">System Analytics & Fairness Shield</h3>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-number text-primary">{stats.totalUploads}</div>
              <div className="stat-label">Total Resumes Parsed</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-number text-success">{stats.totalPIIRemoved}</div>
              <div className="stat-label">PII Vectors Shielded</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-number text-warning">{stats.totalReveals}</div>
              <div className="stat-label">Identities Revealed</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-number text-info">{stats.totalEmails}</div>
              <div className="stat-label">Blind Emails Sent</div>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-12">
          <h3 className="fw-bold mb-3">Active Job Requisitions</h3>
          <div className="row">
            {jobs.map(j => (
              <div key={j.id} className="col-md-4 mb-3">
                <div className="card-custom h-100">
                  <div className="card-body">
                    <h5 className="fw-bold">{j.title}</h5>
                    <p className="text-muted small">Min Exp: {j.min_experience} yrs</p>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {j.skills.split(',').map((s, idx) => (
                        <span key={idx} className="badge bg-secondary">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
