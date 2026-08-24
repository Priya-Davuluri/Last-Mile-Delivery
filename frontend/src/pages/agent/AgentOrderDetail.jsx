import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { agentService } from '../../services/agentService';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import { formatCurrency, formatDimensions, formatDateTime } from '../../utils/formatters';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Box,
  Scale,
  Navigation,
  Check,
} from 'lucide-react';

const AgentOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { showToast, showEmailNotification } = useNotification();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Status Action State
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedReason, setFailedReason] = useState('Customer unavailable at address');
  const [customNotes, setCustomNotes] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
        setHistory(res.history || []);
      } else {
        setError('Delivery order not found.');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.data?.message || err.message || 'Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Status progression action
  const handleUpdateStatus = async (nextStatus, reasonText = '') => {
    setIsUpdating(true);
    setError('');
    try {
      const res = await agentService.updateStatus(orderId, {
        status: nextStatus,
        reason: nextStatus === 'failed' ? reasonText : undefined,
        notes: customNotes.trim() || undefined,
      });

      if (res.success) {
        showNotification(`Delivery status updated to '${nextStatus.toUpperCase()}'!`);
        showEmailNotification(order?.customer?.email, nextStatus.toUpperCase());
        setShowFailedModal(false);
        setCustomNotes('');
        fetchOrder();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmFailed = (e) => {
    e.preventDefault();
    if (!failedReason) {
      setError('Please select a specific reason for the failed delivery.');
      return;
    }
    const combinedReason = customNotes.trim() ? `${failedReason} - ${customNotes.trim()}` : failedReason;
    handleUpdateStatus('failed', combinedReason);
  };

  if (loading) {
    return (
      <div className="main-content flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h2>Delivery Order Not Found</h2>
          <p style={{ margin: '0.5rem 0 1.5rem', color: 'var(--text-muted)' }}>
            This delivery does not exist or may have been unassigned.
          </p>
          <Link to="/agent/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Field Deliveries
          </Link>
        </div>
      </div>
    );
  }

  const isTerminal = order.status === 'delivered' || order.status === 'failed';

  return (
    <div className="main-content fade-in">
      {/* Header & Breadcrumb */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/agent/dashboard" className="flex items-center gap-1" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <ArrowLeft size={14} /> Back to Active Deliveries
            </Link>
          </div>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Shipment #{order._id.substring(order._id.length - 8)}</h1>
            <StatusBadge status={order.status} size="lg" />
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
              }}
              title="Customer is automatically emailed when you update status"
            >
              <Mail size={13} />
              <span>Email Auto-Notified</span>
            </span>
          </div>
        </div>

        <button onClick={fetchOrder} className="btn btn-secondary btn-sm flex items-center gap-1" disabled={loading}>
          <RefreshCw size={14} /> Refresh Details
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          className="flex items-center gap-2 mb-6"
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

      {/* Main 2-Column Grid */}
      <div className="grid-2" style={{ alignItems: 'start', gap: '1.75rem' }}>
        {/* Left Column: Delivery Actions & Package Details */}
        <div className="flex flex-col gap-6">
          {/* ==================================================== */}
          {/* TASK 6 REQUIREMENT: STATUS UPDATE CONTROLS */}
          {/* ==================================================== */}
          <div className="card" style={{ border: '1px solid var(--border-glass)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={20} style={{ color: 'var(--primary)' }} />
              <span>Delivery Status Actions</span>
            </h3>

            {isTerminal ? (
              <div
                style={{
                  background: order.status === 'delivered' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${order.status === 'delivered' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: order.status === 'delivered' ? 'var(--success)' : 'var(--danger)' }}>
                  {order.status === 'delivered' ? '✓ Delivery Completed Successfully' : '✕ Delivery Marked as Failed'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {order.status === 'delivered'
                    ? 'Package handed over and payment settled.'
                    : 'Customer notified to reschedule for a new delivery attempt.'}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Current milestone: <strong>{order.status.toUpperCase()}</strong>. Advance to the next delivery phase as you progress.
                </p>

                <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus('picked-up')}
                      className="btn btn-primary flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <Package size={18} />
                      <span>{isUpdating ? 'Updating...' : 'Confirm Picked Up'}</span>
                    </button>
                  )}

                  {order.status === 'picked-up' && (
                    <button
                      onClick={() => handleUpdateStatus('in-transit')}
                      className="btn btn-primary flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <Truck size={18} />
                      <span>{isUpdating ? 'Updating...' : 'Start Transit'}</span>
                    </button>
                  )}

                  {order.status === 'in-transit' && (
                    <button
                      onClick={() => handleUpdateStatus('out-for-delivery')}
                      className="btn btn-primary flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <MapPin size={18} />
                      <span>{isUpdating ? 'Updating...' : 'Out for Delivery Today'}</span>
                    </button>
                  )}

                  {order.status === 'out-for-delivery' && (
                    <button
                      onClick={() => handleUpdateStatus('delivered')}
                      className="btn btn-success flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <CheckCircle size={18} />
                      <span>{isUpdating ? 'Updating...' : 'Mark Successfully Delivered'}</span>
                    </button>
                  )}

                  {/* Report issue action */}
                  {order.status !== 'assigned' && (
                    <button
                      type="button"
                      onClick={() => setShowFailedModal(true)}
                      className="btn btn-secondary flex items-center gap-2"
                      disabled={isUpdating}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <AlertTriangle size={16} />
                      <span>Report Delivery Issue</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Contact & Call Action */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Recipient & Contact Details</h3>

            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>RECIPIENT NAME</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {order.customer?.name || 'Customer'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {order.customer?.email}
                  </div>
                </div>

                <a
                  href={`tel:${order.customer?.phone}`}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                  style={{ color: 'var(--primary)' }}
                >
                  <Phone size={14} /> Call Recipient
                </a>
              </div>
            </div>

            {/* Pickup & Drop Details */}
            <div className="flex flex-col gap-3">
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> PICKUP ORIGIN ({order.pickupZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>{order.pickupAddress}</p>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> DROP DESTINATION ({order.dropZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>{order.dropAddress}</p>
              </div>
            </div>
          </div>

          {/* Package Info & Collection Due */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Package & Billing Details</h3>

            <div className="grid-3 mb-4">
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SCALE WEIGHT</div>
                <strong style={{ fontSize: '1.1rem' }}>{order.actualWeight} kg</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>BILLABLE WT</div>
                <strong style={{ fontSize: '1.1rem' }}>{order.billableWeight} kg</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>DIMENSIONS</div>
                <strong style={{ fontSize: '0.9rem' }}>{formatDimensions(order.dimensions)}</strong>
              </div>
            </div>

            {/* Collection Amount Callout */}
            <div
              style={{
                background: order.paymentType === 'COD' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${order.paymentType === 'COD' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAYMENT MODE</div>
                  <strong style={{ fontSize: '1rem', color: order.paymentType === 'COD' ? 'var(--warning)' : 'var(--success)' }}>
                    {order.paymentType}
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {order.paymentType === 'COD' ? 'AMOUNT TO COLLECT AT DOORSTEP' : 'PAID ONLINE'}
                  </div>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
                    {formatCurrency(order.totalCharge)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Tracking Timeline */}
        <div>
          <TrackingTimeline history={history} />
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: FAILED DELIVERY REASON */}
      {/* ==================================================== */}
      {showFailedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
              <h3>Record Failed Delivery Attempt</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              A mandatory specific reason is required. The customer will be automatically notified via email with a prompt to reschedule.
            </p>

            <form onSubmit={handleConfirmFailed}>
              <div className="form-group">
                <label className="form-label">Primary Failure Reason</label>
                <select
                  className="form-select"
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  required
                >
                  <option value="Customer unavailable at address">Customer unavailable at address</option>
                  <option value="Premises / Door Locked">Premises / Door Locked</option>
                  <option value="Incorrect delivery address or contact number">Incorrect delivery address or contact number</option>
                  <option value="Customer refused package / COD payment issue">Customer refused package / COD payment issue</option>
                  <option value="Customer requested reschedule for another date">Customer requested reschedule for another date</option>
                  <option value="Security / entry restriction at location">Security / entry restriction at location</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Field Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Called customer 3 times, neighbor confirmed customer is out of town"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFailedModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isUpdating}>
                  {isUpdating ? 'Submitting...' : 'Confirm Delivery Failure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentOrderDetail;
