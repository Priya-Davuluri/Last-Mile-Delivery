import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Layers,
  DollarSign,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { showEmailNotification, showToast } = useNotification();
  const [orders, setOrders] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Modal State for Failed Delivery Reason
  const [failedModalOrder, setFailedModalOrder] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer unavailable / unreachable');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmittingFailure, setIsSubmittingFailure] = useState(false);

  const fetchAgentOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/agent/orders');
      if (res.success) {
        setOrders(res.orders || []);
        setAgentProfile(res.agentProfile || null);
      }
    } catch (err) {
      console.error('Fetch agent orders error:', err);
      setError(err.data?.message || err.message || 'Failed to load assigned deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentOrders();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Toggle Availability Switch
  const handleToggleAvailability = async () => {
    setError('');
    try {
      const newStatus = agentProfile?.availabilityStatus === 'available' ? 'unavailable' : 'available';
      const res = await api.put('/agent/availability', { availabilityStatus: newStatus });
      if (res.success && res.agentProfile) {
        setAgentProfile(res.agentProfile);
        showNotification(`Fleet status updated to: ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update availability.');
    }
  };

  // Advance Order Status
  const handleUpdateStatus = async (orderId, targetStatus, customerEmail) => {
    setError('');
    try {
      const res = await api.put(`/agent/orders/${orderId}/status`, {
        status: targetStatus,
      });

      if (res.success) {
        showNotification(`Delivery status successfully advanced to "${targetStatus.toUpperCase()}".`);
        if (customerEmail) {
          showEmailNotification(customerEmail, targetStatus.toUpperCase());
        }
        fetchAgentOrders();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update delivery status.');
    }
  };

  // Open Failed Delivery Modal
  const handleOpenFailedModal = (order) => {
    setFailedModalOrder(order);
    setFailureReason('Customer unavailable / unreachable');
    setCustomNotes('');
  };

  // Submit Delivery Failure
  const handleSubmitFailure = async (e) => {
    e.preventDefault();
    if (!failedModalOrder) return;

    setError('');
    setIsSubmittingFailure(true);
    const finalReason = failureReason === 'Other' ? customNotes : `${failureReason}${customNotes ? ` - ${customNotes}` : ''}`;

    try {
      const res = await api.put(`/agent/orders/${failedModalOrder._id}/status`, {
        status: 'failed',
        reason: finalReason,
      });

      if (res.success) {
        showNotification('Delivery marked as failed. Customer has been notified to reschedule.');
        showEmailNotification(failedModalOrder.customer?.email, 'FAILED');
        setFailedModalOrder(null);
        fetchAgentOrders();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to record delivery failure.');
    } finally {
      setIsSubmittingFailure(false);
    }
  };

  const activeOrders = orders.filter((o) =>
    ['assigned', 'picked-up', 'in-transit', 'out-for-delivery'].includes(o.status)
  );

  const pastOrders = orders.filter((o) =>
    ['delivered', 'failed'].includes(o.status)
  );

  return (
    <div className="main-content fade-in">
      {/* Top Banner / Agent Header */}
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid var(--border-glass)' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)' }}>
                <Truck size={12} /> Delivery Field Portal
              </span>
            </div>
            <h2>{user?.name}</h2>
            <div className="flex items-center gap-4 mt-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span className="flex items-center gap-1"><Phone size={14} /> {user?.phone}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Layers size={14} /> Assigned Zones: {agentProfile?.assignedZones?.map((z) => z.name).join(', ') || 'General Coverage'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleAvailability}
              className={`btn ${agentProfile?.availabilityStatus === 'available' ? 'btn-success' : 'btn-secondary'} flex items-center gap-2`}
              title="Click to toggle your shift availability"
            >
              {agentProfile?.availabilityStatus === 'available' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              <span>Status: <strong>{agentProfile?.availabilityStatus?.toUpperCase() || 'AVAILABLE'}</strong></span>
            </button>

            <button onClick={fetchAgentOrders} className="btn btn-secondary btn-sm" title="Refresh assignments">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'} btn-sm flex items-center gap-2`}
          onClick={() => setActiveTab('active')}
        >
          <Clock size={16} /> Active Deliveries ({activeOrders.length})
        </button>
        <button
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'} btn-sm flex items-center gap-2`}
          onClick={() => setActiveTab('history')}
        >
          <CheckCircle size={16} /> Completed / Past Deliveries ({pastOrders.length})
        </button>
      </div>

      {/* ==================================================== */}
      {/* ACTIVE DELIVERIES LIST */}
      {/* ==================================================== */}
      {activeTab === 'active' && (
        <div className="flex flex-col gap-4">
          {activeOrders.map((order) => (
            <div key={order._id} className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '1.75rem' }}>
              <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/agent/orders/${order._id}`}
                    className="badge badge-assigned flex items-center gap-1"
                    title="View Full Delivery Details"
                  >
                    <span>ORDER #{order._id.substring(order._id.length - 6)}</span>
                    <ExternalLink size={11} />
                  </Link>
                  <span className={`badge badge-${order.status}`}>
                    {order.status}
                  </span>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}>
                    {order.orderType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment:</span>
                  <strong style={{ color: order.paymentType === 'COD' ? 'var(--warning)' : 'var(--success)' }}>
                    {order.paymentType} {order.paymentType === 'COD' ? `(Collect ₹${order.totalCharge})` : '(Paid)'}
                  </strong>
                </div>
              </div>

              {/* Addresses & Route Details */}
              <div className="grid-2 mb-4" style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    📍 PICKUP LOCATION ({order.pickupZone?.name || 'Pickup Zone'})
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{order.pickupAddress}</p>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.25rem' }}>
                    🎯 DROP LOCATION ({order.dropZone?.name || 'Drop Zone'})
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{order.dropAddress}</p>
                </div>
              </div>

              {/* Customer Contact & Package Info */}
              <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User size={16} style={{ color: 'var(--text-dim)' }} />
                    <span style={{ fontSize: '0.85rem' }}>Customer: <strong>{order.customer?.name}</strong></span>
                  </div>
                  {order.customer?.phone && (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Phone size={13} /> Call {order.customer.phone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Weight: <strong>{order.billableWeight} kg</strong></span>
                  <span>Dims: <strong>{order.dimensions?.length}×{order.dimensions?.breadth}×{order.dimensions?.height} cm</strong></span>
                </div>
              </div>

              {/* Lifecycle Advancement Action Bar */}
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Assigned at: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-center gap-3">
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'picked-up')}
                      className="btn btn-primary btn-sm flex items-center gap-2"
                    >
                      <Package size={16} /> Mark as Picked Up
                    </button>
                  )}

                  {order.status === 'picked-up' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenFailedModal(order)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Report Issue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order._id, 'in-transit', order.customer?.email)}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                      >
                        <Truck size={16} /> Start In Transit
                      </button>
                    </>
                  )}

                  {order.status === 'in-transit' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenFailedModal(order)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Report Issue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order._id, 'out-for-delivery', order.customer?.email)}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                      >
                        <MapPin size={16} /> Out for Delivery
                      </button>
                    </>
                  )}

                  {order.status === 'out-for-delivery' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenFailedModal(order)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Report Issue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order._id, 'delivered', order.customer?.email)}
                        className="btn btn-success btn-sm flex items-center gap-2"
                        style={{
                          background: 'var(--success)',
                          borderColor: 'var(--success)',
                          color: '#FFFFFF',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={16} /> Confirm Delivered
                      </button>
                    </>
                  )}
                  <Link
                    to={`/agent/orders/${order._id}`}
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                    title="View Full Delivery Details & Timeline"
                  >
                    <span>Details</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {activeOrders.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <Truck size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3>No Active Deliveries</h3>
              <p style={{ maxWidth: '450px', margin: '0.5rem auto' }}>
                You have no pending assignments right now. Ensure your status is set to <strong>AVAILABLE</strong> to receive incoming dispatches.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* PAST DELIVERIES HISTORY TAB */}
      {/* ==================================================== */}
      {activeTab === 'history' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Destination Address</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Result Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pastOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>#{order._id.substring(order._id.length - 6)}</strong>
                  </td>
                  <td>
                    <div style={{ maxWidth: '280px', fontSize: '0.85rem' }}>{order.dropAddress}</div>
                  </td>
                  <td>{order.customer?.name}</td>
                  <td>
                    <span>₹{order.totalCharge} ({order.paymentType})</span>
                  </td>
                  <td>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {pastOrders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                    No completed delivery history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MARK DELIVERY AS FAILED (WITH REASON CAPTURE) */}
      {/* ==================================================== */}
      {failedModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
              <ShieldAlert size={24} />
              <h3>Record Delivery Failure</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Marking order #{failedModalOrder._id.substring(failedModalOrder._id.length - 6)} as failed will notify the customer to choose a reschedule date.
            </p>

            <form onSubmit={handleSubmitFailure}>
              <div className="form-group">
                <label className="form-label">Primary Failure Reason</label>
                <select
                  className="form-select"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  required
                >
                  <option value="Customer unavailable / unreachable">Customer unavailable / unreachable</option>
                  <option value="Incorrect / incomplete drop address">Incorrect / incomplete drop address</option>
                  <option value="Customer refused package / COD payment">Customer refused package / COD payment</option>
                  <option value="Customer requested reschedule">Customer requested reschedule</option>
                  <option value="Premises closed / inaccessible">Premises closed / inaccessible</option>
                  <option value="Damaged outer packaging">Damaged outer packaging</option>
                  <option value="Other">Other Reason (Specify below)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Dispatch Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Attempted delivery at 2:30 PM, gate locked, no answer on phone."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setFailedModalOrder(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSubmittingFailure}
                >
                  {isSubmittingFailure ? 'Submitting Failure...' : 'Confirm Delivery Failure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
