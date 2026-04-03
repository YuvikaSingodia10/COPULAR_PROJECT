import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UploadResume from './pages/UploadResume';
import RankingDashboard from './pages/RankingDashboard';
import AuditLog from './pages/AuditLog';

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (role) {
      case 'admin': return '/admin';
      case 'recruiter': return '/upload';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Register />} />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/upload" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <UploadResume />
        </ProtectedRoute>
      } />

      <Route path="/ranking" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <RankingDashboard />
        </ProtectedRoute>
      } />

      <Route path="/audit" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuditLog />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
