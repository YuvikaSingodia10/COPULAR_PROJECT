import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recruiter',
    workspace_code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Only send workspace_code for admin registration
      if (formData.role === 'admin') {
        payload.workspace_code = formData.workspace_code;
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, payload);

      const { token, role, name, workspace_code } = response.data;
      login(token, role, name, workspace_code);

      if (role === 'admin') navigate('/admin');
      else if (role === 'recruiter') navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3" style={{ width: '56px', height: '56px', fontSize: '1.8rem' }}>
            <i className="bi bi-person-plus"></i>
          </div>
          <h2>Create Account</h2>
          <p className="subtitle">Join HireBlind today</p>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium text-secondary small">Full Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium text-secondary small">Email Address</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="name@example.com"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium text-secondary small">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="6"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium text-secondary small">Role</label>
            <select
              className="form-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Administrator</option>
            </select>
            <div className="form-text small mt-1">
              {formData.role === 'recruiter'
                ? 'A unique workspace code will be generated for you to share with your admin.'
                : 'You will need a workspace code from your recruiter to link accounts.'}
            </div>
          </div>

          {formData.role === 'admin' && (
            <div className="mb-4 fade-in">
              <label className="form-label fw-medium text-secondary small">
                <i className="bi bi-key-fill me-1 text-warning"></i>Workspace Code
              </label>
              <input
                type="text"
                className="form-control text-uppercase"
                name="workspace_code"
                value={formData.workspace_code}
                onChange={handleChange}
                required
                placeholder="e.g. WS-7K3M"
                style={{ letterSpacing: '2px', fontWeight: '600' }}
              />
              <div className="form-text small mt-1 text-warning-emphasis">
                <i className="bi bi-info-circle me-1"></i>
                Get this code from your recruiter. It links you to their candidate pool.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary-custom" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Sign Up
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <p className="text-muted small mb-0">
            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
