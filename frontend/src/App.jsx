import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';
import CreateOrder from './pages/customer/CreateOrder';
import TrackOrder from './pages/customer/TrackOrder';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentOrderDetail from './pages/agent/AgentOrderDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminZones from './pages/admin/AdminZones';
import AdminRateCards from './pages/admin/AdminRateCards';
import AdminAgents from './pages/admin/AdminAgents';

import { Package, ArrowRight, Calculator, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="main-content fade-in">
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem 2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            color: '#60A5FA',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <Package size={16} /> Production Logistics Management Platform
        </div>
        <h1
          style={{
            fontSize: '3.2rem',
            marginBottom: '1.25rem',
            background: 'linear-gradient(to right, #60A5FA, #C084FC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '850px',
            margin: '0 auto 1.25rem',
          }}
        >
          Intelligent Last-Mile Delivery & Dynamic Rate Engine
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '680px', margin: '0 auto 2.5rem', color: 'var(--text-muted)' }}>
          Zone-aware pricing with volumetric weight calculation, automated nearest-agent assignment, and immutable append-only tracking history.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/track" className="btn btn-primary btn-lg">
            Track a Package <ArrowRight size={18} />
          </Link>
          {isAuthenticated ? (
            <Link to={`/${user?.role || 'customer'}/dashboard`} className="btn btn-secondary btn-lg">
              Go to {user?.role ? user.role.toUpperCase() : 'User'} Portal
            </Link>
          ) : (
            <Link to="/login" className="btn btn-secondary btn-lg">
              Access Portal
            </Link>
          )}
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: '3rem' }}>
        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <Calculator size={32} />
          </div>
          <h3>Configurable Rate Engine</h3>
          <p>
            Zero hardcoded prices. Complete dynamic volumetric weight formulas <code>(L×B×H ÷ 5000)</code> with intra/inter-zone B2B/B2C rate cards & COD surcharges.
          </p>
        </div>
        <div className="card">
          <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
            <MapPin size={32} />
          </div>
          <h3>Zone-Aware Auto Assignment</h3>
          <p>Automated proximity dispatch mapping pickup zones to active agents with fallback to coverage matrices.</p>
        </div>
        <div className="card">
          <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
            <Clock size={32} />
          </div>
          <h3>Immutable Audit Trail</h3>
          <p>Append-only tracking history storing status transitions, timestamps, and actors with customer email updates on every milestone.</p>
        </div>
      </div>
    </div>
  );
}

// Redirect helper based on role
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track/:orderId" element={<TrackOrder />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Customer Routes */}
            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/orders/:orderId" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerOrderDetail /></ProtectedRoute>} />
            <Route path="/customer/create-order" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CreateOrder /></ProtectedRoute>} />

            {/* Delivery Agent Routes */}
            <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
            <Route path="/agent/orders/:orderId" element={<ProtectedRoute allowedRoles={['agent']}><AgentOrderDetail /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/orders/:orderId" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrderDetail /></ProtectedRoute>} />
            <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={['admin']}><AdminZones /></ProtectedRoute>} />
            <Route path="/admin/rate-cards" element={<ProtectedRoute allowedRoles={['admin']}><AdminRateCards /></ProtectedRoute>} />
            <Route path="/admin/agents" element={<ProtectedRoute allowedRoles={['admin']}><AdminAgents /></ProtectedRoute>} />
            <Route path="/admin/create-order" element={<ProtectedRoute allowedRoles={['admin']}><CreateOrder /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
