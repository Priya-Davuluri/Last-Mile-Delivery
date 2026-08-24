import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Enforces authentication and hard-redirects unauthorized roles
 * to their respective role dashboard.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Verifying session credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch -> hard redirect to user's assigned role dashboard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleDashboardMap = {
      admin: '/admin/dashboard',
      agent: '/agent/dashboard',
      customer: '/customer/dashboard',
    };

    const targetDashboard = roleDashboardMap[user.role] || '/login';
    return <Navigate to={targetDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
