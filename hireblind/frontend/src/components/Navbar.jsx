import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, role, userName, workspaceCode, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Theme logic
  const [theme, setTheme] = useState(localStorage.getItem('hireblind-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hireblind-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const renderNavLinks = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin')}`} to="/admin">
                <i className="bi bi-gear me-1"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/ranking')}`} to="/ranking">
                <i className="bi bi-bar-chart me-1"></i>Rankings
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/audit')}`} to="/audit">
                <i className="bi bi-journal-text me-1"></i>Audit Log
              </Link>
            </li>
          </>
        );
      case 'recruiter':
        return (
          <>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/upload')}`} to="/upload">
                <i className="bi bi-cloud-upload me-1"></i>Upload
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/ranking')}`} to="/ranking">
                <i className="bi bi-bar-chart me-1"></i>Rankings
              </Link>
            </li>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-hireblind" id="main-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <span className="brand-icon"><i className="bi bi-shield-check"></i></span>
          HireBlind
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-label="Toggle navigation"
          style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
        >
          <i className="bi bi-list" style={{ fontSize: '1.5rem', color: '#fff' }}></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            {renderNavLinks()}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {workspaceCode && (
              <span
                className="d-none d-md-inline-flex align-items-center gap-1 px-2 py-1 rounded-2"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
                title="Workspace Code"
              >
                <i className="bi bi-key-fill" style={{ fontSize: '0.7rem' }}></i>
                {workspaceCode}
              </span>
            )}
            <button className="btn-theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill text-warning"></i>}
            </button>
            <span className="text-white fw-medium d-none d-md-inline" style={{ fontSize: '0.9rem' }}>
              {userName}
            </span>
            <span className="role-badge">{role}</span>
            <button className="btn btn-logout" onClick={handleLogout} id="logout-btn">
              <i className="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
