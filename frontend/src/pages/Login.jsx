import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API}/auth/login`, { email, password });
        onLogin(res.data.token, res.data.role);
      } else {
        await axios.post(`${API}/auth/register`, { email, password, role });
        setSuccess('Account created successfully! You can now sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-icon">🛡️</div>
        <h2>HireBlind</h2>
        <p className="subtitle">Bias-free resume screening platform</p>

        <div className="tabs">
          <button
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="alert-custom alert-danger-custom mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="alert-custom alert-success-custom mb-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-dark" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-control form-control-dark"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label-dark" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control form-control-dark"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="mb-3">
              <label className="form-label-dark" htmlFor="login-role">Role</label>
              <select
                id="login-role"
                className="form-select form-select-dark"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary-custom w-100 mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
