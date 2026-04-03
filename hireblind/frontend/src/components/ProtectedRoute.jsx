import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the appropriate dashboard based on role
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'recruiter':
        return <Navigate to="/upload" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
