import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import OrderChargeBreakdown from '../../components/OrderChargeBreakdown';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  ArrowLeft,
  Truck,
  Zap,
  UserCheck,
  MapPin,
  Clock,
  Shield,
  CreditCard,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
} from 'lucide-react';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { showToast, showEmailNotification } = useNotification();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [eligibleAgents, setEligibleAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual Assignment State
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Status Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('delivered');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRes, agentsRes] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.getEligibleAgents(orderId).catch(() => ({ success: false, agents: [] })),
      ]);

      if (orderRes.success && orderRes.order) {
        setOrder(orderRes.order);
        setHistory(orderRes.history || []);
        setOverrideStatus(orderRes.order.status);
      } else {
        setError('Order not found.');
      }

      if (agentsRes.success && agentsRes.agents) {
        setEligibleAgents(agentsRes.agents);
        if (agentsRes.agents.length > 0) {
          setSelectedAgentId(agentsRes.agents[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err.data?.message || err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 1. Trigger Auto-Assignment
  const handleAutoAssign = async () => {
    setIsAssigning(true);
    setError('');
    try {
      const res = await orderService.autoAssign(orderId);
      if (res.success) {
        showNotification(
          `Auto-assigned successfully to ${res.assignedAgent?.user?.name || 'delivery agent'}!`
        );
        showEmailNotification(order?.customer?.email, 'ASSIGNED');
        fetchOrderDetails();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Auto-assignment failed. No available agents found.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 2. Trigger Manual Assignment
  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setIsAssigning(true);
    setError('');
    try {
      const res = await orderService.manualAssign(orderId, selectedAgentId);
      if (res.success) {
        showNotification('Agent assigned successfully via manual dispatch!');
        showEmailNotification(order?.customer?.email, 'ASSIGNED');
        fetchOrderDetails();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Manual assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 3. Admin Status Override
  const handleConfirmOverride = async (e) => {
    e.preventDefault();
    if (!overrideNotes.trim()) {
      setError('Administrative justification is mandatory for status override.');
      return;
    }

    setIsOverriding(true);
    setError('');
    try {
      const res = await orderService.overrideStatus(orderId, {
        status: overrideStatus,
        notes: overrideNotes.trim(),
      });
      if (res.success) {
        showNotification(`Order status overridden to '${overrideStatus}'!`);
        showEmailNotification(order?.customer?.email, overrideStatus.toUpperCase());
        setShowOverrideModal(false);
        setOverrideNotes('');
        fetchOrderDetails();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Status override failed.');
    } finally {
      setIsOverriding(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading order #{orderId}...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h2>Order Not Found</h2>
          <p style={{ margin: '0.5rem 0 1.5rem', color: 'var(--text-muted)' }}>
            The requested order ID does not exist or has been removed.
          </p>
          <Link to="/admin/orders" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      {/* Breadcrumbs & Navigation */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/orders" className="flex items-center gap-1" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <ArrowLeft size={14} /> Back to All Orders
            </Link>
          </div>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Order #{order._id.substring(order._id.length - 8)}</h1>
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
              title="Automated customer email notifications enabled for status updates & failures"
            >
              <Mail size={13} />
              <span>Email Alerts Active</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrderDetails} className="btn btn-secondary btn-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowOverrideModal(true)}
            className="btn btn-danger btn-sm flex items-center gap-1"
          >
            <Shield size={14} /> Override Status
          </button>
        </div>
      </div>

      {/* Success Notification */}
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

      {/* Error Alert */}
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
        {/* Left Column: Assignment Panel & Details */}
        <div className="flex flex-col gap-6">
          {/* ==================================================== */}
          {/* TASK 5 REQUIREMENT: AGENT ASSIGNMENT PANEL */}
          {/* ==================================================== */}
          <div className="card" style={{ border: '1px solid var(--border-glass)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--primary)' }} />
                <span>Agent Dispatch & Assignment</span>
              </h3>

              {order.assignedAgent ? (
                <span
                  className="badge"
                  style={{
                    background: order.assignmentType === 'auto' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    color: order.assignmentType === 'auto' ? 'var(--primary)' : 'var(--accent)',
                    textTransform: 'uppercase',
                  }}
                >
                  {order.assignmentType === 'auto' ? '⚡ Auto Assigned' : '👤 Manual Assigned'}
                </span>
              ) : (
                <span className="badge badge-failed" style={{ fontSize: '0.75rem' }}>
                  Unassigned
                </span>
              )}
            </div>

            {/* Currently Assigned Agent Card */}
            {order.assignedAgent?.user ? (
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENTLY ASSIGNED AGENT
                    </div>
                    <h4 style={{ fontSize: '1.1rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>
                      {order.assignedAgent.user.name}
                    </h4>

                    <div className="flex items-center gap-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Mail size={13} /> {order.assignedAgent.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={13} /> {order.assignedAgent.user.phone}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge badge-${
                      order.assignedAgent.availabilityStatus === 'available' ? 'delivered' : 'in-transit'
                    }`}
                  >
                    {order.assignedAgent.availabilityStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px dashed rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                  This order is currently unassigned and awaiting agent dispatch.
                </p>
              </div>
            )}

            {/* Assignment Action Controls */}
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              {/* Auto-Assignment Dispatch Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <Zap size={18} />
                      <span>Automated Dispatch Engine</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Automatically selects the nearest available agent serving pickup zone "<strong>{order.pickupZone?.name || 'Pickup Zone'}</strong>" using proximity & zone matching.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    className="btn btn-primary flex items-center gap-2"
                    disabled={isAssigning}
                    style={{
                      boxShadow: '0 0 15px var(--primary-glow)',
                      fontWeight: 600,
                    }}
                  >
                    <Zap size={16} />
                    <span>{isAssigning ? 'Finding Nearest Agent...' : '⚡ Auto-Assign Nearest Agent'}</span>
                  </button>
                </div>
              </div>

              {/* Manual Selection Form */}
              <form onSubmit={handleManualAssign}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Or Manually Select from Available Field Fleet:
                </label>

                <div className="flex gap-2 mb-3">
                  <select
                    className="form-select"
                    style={{ fontSize: '0.85rem' }}
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                  >
                    {eligibleAgents.map((ag) => (
                      <option key={ag._id} value={ag._id}>
                        {ag.user?.name} ({ag.availabilityStatus}) {ag.servesPickupZone ? '★ [Zone Match]' : '[Other Zone]'}
                      </option>
                    ))}
                    {eligibleAgents.length === 0 && (
                      <option value="">No agents found in fleet</option>
                    )}
                  </select>

                  <button
                    type="submit"
                    className="btn btn-secondary flex items-center gap-1"
                    disabled={!selectedAgentId || isAssigning}
                  >
                    <UserCheck size={14} />
                    <span>Assign</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ★ Indicates agent is configured to service pickup zone "{order.pickupZone?.name || 'Pickup'}".
                </div>
              </form>
            </div>
          </div>

          {/* Customer & Route Details */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Customer & Destination Info</h3>

            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>CUSTOMER PROFILE</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.2rem' }}>
                {order.customer?.name || 'Customer'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {order.customer?.email} • {order.customer?.phone}
              </div>
            </div>

            <div className="grid-2">
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> PICKUP LOCATION ({order.pickupZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>{order.pickupAddress}</p>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> DROP DESTINATION ({order.dropZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>{order.dropAddress}</p>
              </div>
            </div>
          </div>

          {/* Charge Breakdown Snapshot */}
          <OrderChargeBreakdown
            calculation={{
              pickupZone: order.pickupZone,
              dropZone: order.dropZone,
              rateType: order.pickupZone?._id === order.dropZone?._id ? 'intra-zone' : 'inter-zone',
              actualWeight: order.actualWeight,
              volumetricWeight: order.volumetricWeight,
              billableWeight: order.billableWeight,
              orderType: order.orderType,
              paymentType: order.paymentType,
              rateApplied: order.rateApplied,
              baseCharge: (order.billableWeight || 1) * (order.rateApplied || 40),
              codSurchargeApplied: order.codSurchargeApplied,
              totalCharge: order.totalCharge,
            }}
          />
        </div>

        {/* Right Column: Tracking Timeline */}
        <div>
          <TrackingTimeline history={history} />
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: ADMIN STATUS OVERRIDE */}
      {/* ==================================================== */}
      {showOverrideModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
              <Shield size={24} />
              <h3>Admin Status Override</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Force status override for order #{order._id.substring(order._id.length - 8)}. This event will be permanently written to the immutable tracking history.
            </p>

            <form onSubmit={handleConfirmOverride}>
              <div className="form-group">
                <label className="form-label">New Target Status</label>
                <select
                  className="form-select"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  required
                >
                  <option value="pending">pending (Reset to Queue)</option>
                  <option value="assigned">assigned</option>
                  <option value="picked-up">picked-up</option>
                  <option value="in-transit">in-transit</option>
                  <option value="out-for-delivery">out-for-delivery</option>
                  <option value="delivered">delivered (Force Complete)</option>
                  <option value="failed">failed (Mark Failed)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Administrative Reason / Justification</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Customer confirmed delivery via support line, or manual agent reassignment"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#FCA5A5',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <Shield size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Confirmation Notice:</strong> This action permanently writes an immutable <code>[Admin Override]</code> record with actor <code>admin:{user?.id || user?._id}</code> to Tracking History.
                </span>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isOverriding}>
                  {isOverriding ? 'Applying...' : 'Confirm Status Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
