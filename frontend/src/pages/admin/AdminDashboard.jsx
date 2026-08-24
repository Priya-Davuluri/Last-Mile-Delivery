import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { orderService } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Shield,
  Package,
  DollarSign,
  Layers,
  Truck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sliders,
  Users,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, ordersRes] = await Promise.all([
        adminService.getOverview(),
        orderService.getAllOrders().catch(() => ({ success: false, orders: [] })),
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.overview);
      }
      if (ordersRes.success && ordersRes.orders) {
        setRecentOrders(ordersRes.orders.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError(err.data?.message || err.message || 'Failed to load system metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statusBreakdown = overview?.ordersByStatus || {
    pending: 0,
    assigned: 0,
    'picked-up': 0,
    'in-transit': 0,
    'out-for-delivery': 0,
    delivered: 0,
    failed: 0,
  };

  return (
    <div className="main-content fade-in">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Operations Command
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>Admin Dashboard</h1>
          <p>Real-time logistics throughput, fleet status, and configuration management.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/create-order" className="btn btn-primary btn-sm flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 mb-6"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid-4 mb-6">
        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
            <Package size={26} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Orders Placed</div>
          <h2 style={{ fontSize: '2.25rem', marginTop: '0.2rem' }}>{overview?.totalOrders ?? 0}</h2>
          <Link to="/admin/orders" className="flex items-center gap-1 mt-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Manage Orders</span> <ArrowRight size={13} />
          </Link>
        </div>

        <div className="card">
          <div style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
            <DollarSign size={26} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>System Revenue</div>
          <h2 style={{ fontSize: '2.25rem', marginTop: '0.2rem', color: 'var(--success)' }}>
            {formatCurrency(overview?.totalRevenue ?? 0)}
          </h2>
          <Link to="/admin/rate-cards" className="flex items-center gap-1 mt-2" style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            <span>Rate Cards</span> <ArrowRight size={13} />
          </Link>
        </div>

        <div className="card">
          <div style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
            <Layers size={26} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configured Zones</div>
          <h2 style={{ fontSize: '2.25rem', marginTop: '0.2rem' }}>{overview?.activeZones ?? 0}</h2>
          <Link to="/admin/zones" className="flex items-center gap-1 mt-2" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            <span>Zones & Area Map</span> <ArrowRight size={13} />
          </Link>
        </div>

        <div className="card">
          <div style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <Truck size={26} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Field Fleet</div>
          <h2 style={{ fontSize: '2.25rem', marginTop: '0.2rem' }}>
            {overview?.availableAgents ?? 0}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {overview?.totalAgents ?? 0}</span>
          </h2>
          <Link to="/admin/agents" className="flex items-center gap-1 mt-2" style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600 }}>
            <span>Agent Roster</span> <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TASK 10 REQUIREMENT: SUMMARY COUNTS BY STATUS */}
      {/* ==================================================== */}
      <div className="card mb-6" style={{ padding: '1.75rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 style={{ margin: 0 }}>Delivery Pipeline Status Breakdown</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-time shipment distribution across active and completed milestones.
            </p>
          </div>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm flex items-center gap-1">
            <span>Filter All Orders</span> <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid-4" style={{ gap: '0.85rem' }}>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--status-pending)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>PENDING DISPATCH</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--status-pending)' }}>
              {statusBreakdown.pending || 0}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>AGENT ASSIGNED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary)' }}>
              {statusBreakdown.assigned || 0}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>IN TRANSIT / ACTIVE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent)' }}>
              {(statusBreakdown['picked-up'] || 0) + (statusBreakdown['in-transit'] || 0) + (statusBreakdown['out-for-delivery'] || 0)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--success)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DELIVERED COMPLETED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--success)' }}>
              {statusBreakdown.delivered || 0}
            </div>
          </div>
        </div>

        {statusBreakdown.failed > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.25rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>
              <AlertTriangle size={18} />
              <span>{statusBreakdown.failed} delivery attempt{statusBreakdown.failed > 1 ? 's' : ''} marked as failed</span>
            </div>
            <Link to="/admin/orders" className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem' }}>
              Review Failed Orders
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders Table with Click-Through */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3>Recent Orders Feed</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest incoming dispatches and transactions</p>
          </div>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm flex items-center gap-1">
            <span>View All ({overview?.totalOrders || 0})</span> <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Route (Pickup ➔ Drop)</th>
                <th>Billable Wt & Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}
                    >
                      #{order._id.substring(order._id.length - 6)}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(order.createdAt)}
                    </div>
                  </td>
                  <td>
                    <strong>{order.customer?.name || 'Customer'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.phone}</div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '260px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--primary)' }}>{order.pickupZone?.name || 'Pickup'}</span> ➔{' '}
                      <span style={{ color: 'var(--accent)' }}>{order.dropZone?.name || 'Drop'}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{formatCurrency(order.totalCharge)}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.billableWeight} kg ({order.paymentType})</div>
                  </td>
                  <td>
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td>
                    <Link to={`/admin/orders/${order._id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                      <span>Detail</span>
                      <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                    No recent orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards Grid */}
      <h3 style={{ marginBottom: '1rem' }}>Configuration & Management Subsystems</h3>
      <div className="grid-3">
        <Link to="/admin/zones" className="card" style={{ textDecoration: 'none' }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0 }}>Zone & Area Mapping</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>{overview?.activeZones || 0} active operational zones</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Configure locality matching and pincode boundaries for rate calculations.
          </p>
        </Link>

        <Link to="/admin/rate-cards" className="card" style={{ textDecoration: 'none' }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0 }}>Rate Cards & COD</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Dynamic volumetric formulas</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Set B2B/B2C rates, minimum billing floors, and cash-on-delivery surcharges.
          </p>
        </Link>

        <Link to="/admin/agents" className="card" style={{ textDecoration: 'none' }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0 }}>Delivery Fleet</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>{overview?.totalAgents || 0} registered field agents</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Provision agent credentials, assign zones, and toggle field readiness.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
