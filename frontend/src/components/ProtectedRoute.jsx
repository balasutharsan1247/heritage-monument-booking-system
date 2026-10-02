import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui/Spinner';

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader message="Verifying security credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallbackPath = user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'staff'
      ? '/staff/queue'
      : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};