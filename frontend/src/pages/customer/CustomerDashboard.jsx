import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Package,
  PlusCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle,
  Truck,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Calendar,
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getCustomerOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setError(err.data?.message || err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders by search term and status
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order._id.toLowerCase().includes(q) ||
      order.pickupAddress?.toLowerCase().includes(q) ||
      order.dropAddress?.toLowerCase().includes(q) ||
      order.status?.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = ['pending', 'assigned', 'picked-up', 'in-transit', 'out-for-delivery'].includes(order.status);
    } else if (statusFilter === 'delivered') {
      matchesStatus = order.status === 'delivered';
    } else if (statusFilter === 'failed') {
      matchesStatus = order.status === 'failed';
    }

    return matchesSearch && matchesStatus;
  });

  const failedOrders = orders.filter((o) => o.status === 'failed');

  return (
    <div className="main-content fade-in">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
              Customer Portal
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>Welcome, {user?.name}</h1>
          <p>Track delivery shipments in real-time, view order histories, and manage reschedules.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/customer/create-order" className="btn btn-primary btn-sm flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Create New Order</span>
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 mb-4"
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

      {/* Action Required: Failed Deliveries Banner */}
      {failedOrders.length > 0 && (
        <div
          className="card mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--danger)',
            padding: '1.5rem',
          }}
        >
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--danger)' }}>
                  Action Required: {failedOrders.length} Delivery Attempt{failedOrders.length > 1 ? 's' : ''} Unsuccessful
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Please select a reschedule date so we can arrange your next delivery attempt.
                </p>
              </div>
            </div>

            <Link to={`/customer/orders/${failedOrders[0]._id}`} className="btn btn-danger btn-sm flex items-center gap-1">
              <RotateCcw size={14} /> Reschedule Order #{failedOrders[0]._id.substring(failedOrders[0]._id.length - 6)}
            </Link>
          </div>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div className="grid-3 mb-6">
        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
            <Package size={24} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Shipments</div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.2rem' }}>{orders.length}</h2>
        </div>
        <div className="card">
          <div style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <Truck size={24} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>In Transit / Active</div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.2rem', color: 'var(--warning)' }}>
            {orders.filter((o) => ['assigned', 'picked-up', 'in-transit', 'out-for-delivery'].includes(o.status)).length}
          </h2>
        </div>
        <div className="card">
          <div style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Delivered Successfully</div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.2rem', color: 'var(--success)' }}>
            {orders.filter((o) => o.status === 'delivered').length}
          </h2>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3>My Orders & Shipments</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Complete chronological ledger of all delivery orders.
            </p>
          </div>

          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              className="form-select"
              style={{ width: '150px', height: '38px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="active">Active Only</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed / Reschedule</option>
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.2rem', paddingRight: '1rem', height: '38px', fontSize: '0.85rem' }}
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Route (Pickup → Drop)</th>
                  <th>Weight & Specs</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link
                        to={`/customer/orders/${order._id}`}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}
                        title="View Full Shipment Detail"
                      >
                        #{order._id.substring(order._id.length - 6)}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '320px' }}>
                        <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>[Pickup]</span> {order.pickupAddress}
                        </div>
                        <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>[Drop]</span> {order.dropAddress}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{order.billableWeight} kg</strong> ({order.orderType})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Vol: {order.volumetricWeight} kg | {order.paymentType}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>
                        {formatCurrency(order.totalCharge)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Rate: {formatCurrency(order.rateApplied)}/kg
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td>
                      <Link to={`/customer/orders/${order._id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                        <span>Details</span>
                        <ExternalLink size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Package size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>No Shipments Found</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
              You have no orders matching the selected filter criteria.
            </p>
            <Link to="/customer/create-order" className="btn btn-primary">
              Book Delivery Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
