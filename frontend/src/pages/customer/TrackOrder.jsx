import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import DeliveryStepper from '../../components/DeliveryStepper';
import OrderChargeBreakdown from '../../components/OrderChargeBreakdown';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Package,
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  DollarSign,
  User,
  Phone,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Zap,
  Check,
  XCircle,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'assigned', label: 'Agent Assigned' },
  { key: 'picked-up', label: 'Package Picked Up' },
  { key: 'in-transit', label: 'In Transit' },
  { key: 'out-for-delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showEmailNotification, showToast } = useNotification();

  const [searchInput, setSearchInput] = useState(orderId ? orderId.replace(/^#/, '') : '');
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [myRecentOrders, setMyRecentOrders] = useState([]);

  // Lifecycle Progression State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Failed Delivery Modal State
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedReason, setFailedReason] = useState('Customer unavailable at address');
  const [customFailureNote, setCustomFailureNote] = useState('');

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Fetch recent customer orders for quick tracking chips
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      api.get('/orders/my-orders')
        .then((res) => {
          if (res.success && res.orders) {
            setMyRecentOrders(res.orders.slice(0, 4));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  const fetchTrackingDetails = async (rawId) => {
    if (!rawId) return;
    const cleanId = rawId.trim().replace(/^#/, '');
    if (!cleanId) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/${cleanId}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setHistory(res.history || []);
      } else {
        setError(res.message || 'Order not found. Check the tracking code and try again.');
        setOrder(null);
      }
    } catch (err) {
      console.error('Fetch tracking error:', err);
      setError(err.data?.message || err.message || `Could not find order #${cleanId}. Please check the ID.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      const clean = orderId.trim().replace(/^#/, '');
      setSearchInput(clean);
      fetchTrackingDetails(clean);
    }
  }, [orderId]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchInput.trim().replace(/^#/, '');
    if (!clean) return;
    navigate(`/track/${clean}`, { replace: true });
    fetchTrackingDetails(clean);
  };

  const handleQuickTrack = (targetId) => {
    const clean = targetId.trim().replace(/^#/, '');
    setSearchInput(clean);
    navigate(`/track/${clean}`, { replace: true });
    fetchTrackingDetails(clean);
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Status Progression Action Handler
  const handleProgressStatus = async (nextStatus, reasonText = '') => {
    if (!order) return;
    setIsUpdatingStatus(true);
    setError('');
    try {
      let res;
      // If agent is logged in, use agent endpoint, otherwise use general status endpoint
      if (user?.role === 'agent') {
        res = await api.put(`/agent/orders/${order._id}/status`, {
          status: nextStatus,
          reason: nextStatus === 'failed' ? reasonText : undefined,
          notes: customFailureNote.trim() || undefined,
        });
      } else {
        res = await api.put(`/orders/${order._id}/status`, {
          status: nextStatus,
          reason: reasonText,
          notes: customFailureNote.trim() || undefined,
        });
      }

      if (res.success) {
        showNotification(`Delivery status successfully advanced to '${nextStatus.toUpperCase()}'!`);
        showEmailNotification(order.customer?.email, nextStatus.toUpperCase());
        setShowFailedModal(false);
        setCustomFailureNote('');
        fetchTrackingDetails(order._id);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update delivery status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Auto-Assign Trigger (when in pending state)
  const handleAutoAssign = async () => {
    if (!order) return;
    setIsUpdatingStatus(true);
    setError('');
    try {
      const res = await api.post(`/orders/${order._id}/auto-assign`);
      if (res.success) {
        showNotification(res.message || 'Agent auto-assigned successfully!');
        showEmailNotification(order.customer?.email, 'ASSIGNED');
        fetchTrackingDetails(order._id);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Auto-assignment failed. No agents available.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) {
      setError('Please select a valid reschedule date.');
      return;
    }

    setIsRescheduling(true);
    try {
      const res = await api.post(`/customer/orders/${order._id}/reschedule`, {
        rescheduledDate: rescheduleDate,
        notes: rescheduleNotes,
      });

      if (res.success) {
        showNotification(res.message || 'Delivery successfully rescheduled! System re-dispatched.');
        showEmailNotification(order.customer?.email, 'RESCHEDULED');
        setShowRescheduleModal(false);
        fetchTrackingDetails(order._id);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to reschedule order.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'failed') return -1;
    const idx = LIFECYCLE_STEPS.findIndex((s) => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  const currentStepIndex = order ? getStepIndex(order.status) : 0;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="main-content fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header & Search */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>Real-Time Package Tracking</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Enter your order ID (full 24-character ID or 6-character short code) to view milestone logs.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '600px', margin: '1.5rem auto 0' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.6rem', height: '48px', fontSize: '0.95rem' }}
                placeholder="Enter Order ID (e.g. c97810 or full ID)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.75rem', height: '48px' }} disabled={loading}>
              {loading ? 'Locating...' : 'Track'}
            </button>
          </div>
        </form>

        {/* Quick-Track Suggestions for Logged in Customer */}
        {myRecentOrders.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3" style={{ flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>My Recent Orders:</span>
            {myRecentOrders.map((rec) => {
              const shortId = rec._id.substring(rec._id.length - 6);
              return (
                <button
                  key={rec._id}
                  type="button"
                  onClick={() => handleQuickTrack(rec._id)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span>#{shortId}</span>
                  <StatusBadge status={rec.status} size="sm" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          className="flex items-center gap-2 mb-6"
          style={{
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 mb-6"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="flex flex-col gap-6">
          {/* Order Header Summary Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-assigned">ORDER TRACKING</span>
                  <StatusBadge status={order.status} size="md" />
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{order.orderType}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem' }}>
                  #{order._id.substring(order._id.length - 8)}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                    ({order._id})
                  </span>
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Placed on {formatDateTime(order.createdAt)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>FINAL CHARGE</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(order.totalCharge)}
                </div>
                <span className="badge" style={{ background: order.paymentType === 'COD' ? 'var(--warning-bg)' : 'var(--success-bg)', color: order.paymentType === 'COD' ? 'var(--warning)' : 'var(--success)' }}>
                  {order.paymentType} {order.paymentType === 'COD' ? `(Collect ₹${order.totalCharge})` : '(Prepaid)'}
                </span>
              </div>
            </div>

            {/* 6-Stage Milestone Stepper */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <DeliveryStepper
                status={order.status}
                onRescheduleClick={() => {
                  setRescheduleDate(minDateStr);
                  setShowRescheduleModal(true);
                }}
              />
            </div>

            {/* ==================================================== */}
            {/* ROLE-RESTRICTED LIFECYCLE ACTION BAR */}
            {/* ==================================================== */}
            {/* 1. ADMIN ACTIONS (Only visible to Admin) */}
            {user?.role === 'admin' && (
              <div
                style={{
                  marginTop: '1.75rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ADMIN DISPATCH CONSOLE
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      Current State: <strong style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{order.status}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={handleAutoAssign}
                        className="btn btn-primary flex items-center gap-2"
                        disabled={isUpdatingStatus}
                      >
                        <Zap size={16} />
                        <span>{isUpdatingStatus ? 'Dispatching...' : '⚡ Trigger Auto-Assign'}</span>
                      </button>
                    )}
                    <Link to={`/admin/orders/${order._id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                      <span>Open in Admin Hub</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AGENT ACTIONS (Only visible to assigned Delivery Agent) */}
            {user?.role === 'agent' && (
              <div
                style={{
                  marginTop: '1.75rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FIELD AGENT CONTROLS
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      Shipment Stage: <strong style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{order.status}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                    {/* State: Assigned -> Picked Up */}
                    {order.status === 'assigned' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus('picked-up')}
                          className="btn btn-primary flex items-center gap-2"
                          disabled={isUpdatingStatus}
                        >
                          <Package size={16} />
                          <span>{isUpdatingStatus ? 'Updating...' : '📦 Confirm Picked Up'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFailedModal(true)}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          disabled={isUpdatingStatus}
                        >
                          <XCircle size={14} /> Report Issue
                        </button>
                      </>
                    )}

                    {/* State: Picked Up -> In Transit */}
                    {order.status === 'picked-up' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus('in-transit')}
                          className="btn btn-primary flex items-center gap-2"
                          disabled={isUpdatingStatus}
                        >
                          <Truck size={16} />
                          <span>{isUpdatingStatus ? 'Updating...' : '🚚 Start Transit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFailedModal(true)}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          disabled={isUpdatingStatus}
                        >
                          <XCircle size={14} /> Report Issue
                        </button>
                      </>
                    )}

                    {/* State: In Transit -> Out for Delivery */}
                    {order.status === 'in-transit' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus('out-for-delivery')}
                          className="btn btn-primary flex items-center gap-2"
                          disabled={isUpdatingStatus}
                        >
                          <MapPin size={16} />
                          <span>{isUpdatingStatus ? 'Updating...' : '📍 Out for Delivery Today'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFailedModal(true)}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          disabled={isUpdatingStatus}
                        >
                          <XCircle size={14} /> Report Issue
                        </button>
                      </>
                    )}

                    {/* State: Out for Delivery -> Delivered or Failed */}
                    {order.status === 'out-for-delivery' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus('delivered')}
                          className="btn btn-success flex items-center gap-2"
                          disabled={isUpdatingStatus}
                          style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                          <Check size={16} />
                          <span>{isUpdatingStatus ? 'Completing...' : '✅ Mark Delivered'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFailedModal(true)}
                          className="btn btn-danger flex items-center gap-1"
                          disabled={isUpdatingStatus}
                        >
                          <XCircle size={15} />
                          <span>Report Failed</span>
                        </button>
                      </>
                    )}

                    {order.status === 'delivered' && (
                      <span className="badge badge-delivered" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        🎉 Shipment Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. CUSTOMER VIEW STATUS INFO */}
            {(!user || user.role === 'customer') && order.status === 'pending' && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              >
                <Clock size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Your order has been received. Our dispatch team is assigning the nearest delivery agent to pick up your package.</span>
              </div>
            )}
          </div>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* IMMUTABLE TRACKING TIMELINE AUDIT TRAIL */}
            <TrackingTimeline history={history} title="Shipment Tracking Timeline" />

            {/* SHIPMENT DETAILS & PRICE SNAPSHOT */}
            <div className="flex flex-col gap-4">
              {/* Route & Zones */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Route & Address</h3>

                <div className="flex flex-col gap-3">
                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      PICKUP ({order.pickupZone?.name || 'Pickup Zone'})
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {order.pickupAddress}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                      DROP-OFF ({order.dropZone?.name || 'Drop Zone'})
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {order.dropAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package & Pricing Snapshot */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Package & Billing Breakdown</h3>

                <div className="table-container mb-3">
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Actual Weight</td>
                        <td><strong>{order.actualWeight} kg</strong></td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Volumetric Weight <code>(L×B×H/5000)</code></td>
                        <td><strong>{order.volumetricWeight} kg</strong></td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Billable Weight Applied</td>
                        <td><strong style={{ color: 'var(--primary)' }}>{order.billableWeight} kg</strong></td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Rate Snapshot</td>
                        <td>{formatCurrency(order.rateApplied)} / kg</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>COD Surcharge Snapshot</td>
                        <td>{formatCurrency(order.codSurchargeApplied)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Total Paid / Due</td>
                        <td><strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{formatCurrency(order.totalCharge)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {order.assignedAgent?.user && (
                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>ASSIGNED AGENT</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{order.assignedAgent.user.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.assignedAgent.user.phone}</div>
                      </div>
                      <a href={`tel:${order.assignedAgent.user.phone}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                        <Phone size={13} /> Call
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REPORT FAILED DELIVERY */}
      {/* ==================================================== */}
      {showFailedModal && order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
              <XCircle size={24} />
              <h3>Report Delivery Issue / Failure</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Specify the reason for unsuccessful delivery attempt. This will update the tracking state and invite the customer to reschedule.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProgressStatus('failed', failedReason);
              }}
            >
              <div className="form-group">
                <label className="form-label">Failure Reason</label>
                <select
                  className="form-select"
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  required
                >
                  <option value="Customer unavailable at address">Customer unavailable at address</option>
                  <option value="Incorrect or incomplete address">Incorrect or incomplete address</option>
                  <option value="Customer refused delivery / COD amount not ready">Customer refused delivery / COD amount not ready</option>
                  <option value="Customer requested reschedule">Customer requested reschedule</option>
                  <option value="Security / Premises access denied">Security / Premises access denied</option>
                  <option value="Weather / Road closure delay">Weather / Road closure delay</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Dispatch Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Called customer 3 times, gate locked"
                  value={customFailureNote}
                  onChange={(e) => setCustomFailureNote(e.target.value)}
                />
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFailedModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? 'Recording...' : 'Confirm Delivery Failure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RESCHEDULE DELIVERY */}
      {/* ==================================================== */}
      {showRescheduleModal && order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--primary)' }}>
              <Calendar size={24} />
              <h3>Reschedule Delivery Attempt</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Choose a new delivery attempt date. The system will re-run agent dispatch to schedule your delivery.
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Preferred Date</label>
                <input
                  type="date"
                  min={minDateStr}
                  className="form-control"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Delivery Instructions (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Please deliver after 3:00 PM or leave with neighbor at Flat 101"
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRescheduling}
                >
                  {isRescheduling ? 'Scheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
