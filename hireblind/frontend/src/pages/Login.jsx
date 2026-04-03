import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        email,
        password
      });

      const { token, role, name, workspace_code } = response.data;
      login(token, role, name, workspace_code);

      // Redirect based on role
      if (role === 'admin') navigate('/admin');
      else if (role === 'recruiter') navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3" style={{ width: '56px', height: '56px', fontSize: '1.8rem' }}>
            <i className="bi bi-shield-check"></i>
          </div>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to continue to HireBlind</p>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium text-secondary small">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-medium text-secondary small">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary-custom" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Sign In
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <p className="text-muted small mb-0">
            Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
