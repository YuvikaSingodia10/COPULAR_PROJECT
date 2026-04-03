import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UploadResume from './pages/UploadResume';
import RankingDashboard from './pages/RankingDashboard';
import AuditLog from './pages/AuditLog';
import CompliancePanel from './pages/CompliancePanel';
import InterviewScheduler from './pages/InterviewScheduler';

function AppNavbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        <span className="navbar-brand">
          🛡️ HireBlind
        </span>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user.role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  Job Setup
                </NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to="/upload">
                Upload
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/ranking">
                Rankings
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/interviews">
                Interviews
              </NavLink>
            </li>
            {user.role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/compliance">
                    Compliance
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/audit">
                    Audit Log
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <span className={`badge-role ${user.role === 'admin' ? 'badge-admin' : 'badge-recruiter'}`}>
              {user.role}
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/ranking" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('hireblind_token');
    const role = localStorage.getItem('hireblind_role');
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('hireblind_token', token);
    localStorage.setItem('hireblind_role', role);
    setUser({ token, role });
  };

  const handleLogout = () => {
    localStorage.removeItem('hireblind_token');
    localStorage.removeItem('hireblind_role');
    setUser(null);
  };

  return (
    <Router>
      <div className="app-bg" />
      {user && <AppNavbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to={user.role === 'admin' ? '/admin' : '/upload'} replace /> :
            <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminDashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute user={user}>
              <UploadResume user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <ProtectedRoute user={user}>
              <RankingDashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute user={user}>
              <InterviewScheduler user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compliance"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <CompliancePanel user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AuditLog user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
