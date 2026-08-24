import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import DeliveryStepper from '../../components/DeliveryStepper';
import OrderChargeBreakdown from '../../components/OrderChargeBreakdown';
import { formatCurrency, formatDimensions, formatDateTime, formatDateOnly } from '../../utils/formatters';
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Truck,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Check,
  Mail,
} from 'lucide-react';

const CustomerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reschedule Form State (Only for 'failed' status)
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
        setHistory(res.history || []);
      } else {
        setError('Shipment order not found.');
      }
    } catch (err) {
      console.error('Error fetching customer order:', err);
      setError(err.data?.message || err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Set default minimum reschedule date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Handle Reschedule Delivery Submission
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) {
      setError('Please choose a preferred delivery date.');
      return;
    }

    setIsRescheduling(true);
    setError('');
    try {
      const res = await orderService.rescheduleOrder(orderId, {
        rescheduledDate: rescheduleDate,
        notes: rescheduleNotes.trim(),
      });

      if (res.success) {
        showNotification(
          `Delivery successfully rescheduled for ${formatDateOnly(rescheduleDate)}! A new agent is being dispatched.`
        );
        setShowRescheduleForm(false);
        setRescheduleNotes('');
        fetchOrderDetails();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to reschedule delivery.');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading shipment details...</p>
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
            We could not locate this shipment under your account.
          </p>
          <Link to="/customer/orders" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const milestones = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'assigned', label: 'Agent Assigned' },
    { key: 'picked-up', label: 'Picked Up' },
    { key: 'in-transit', label: 'In Transit' },
    { key: 'out-for-delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const statusOrder = ['pending', 'assigned', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isFailed = order.status === 'failed';

  return (
    <div className="main-content fade-in">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/customer/orders" className="flex items-center gap-1" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <ArrowLeft size={14} /> Back to My Orders
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
              title="Email updates dispatched to customer email on every status transition"
            >
              <Mail size={13} />
              <span>Email Updates Active</span>
            </span>
          </div>
        </div>

        <button onClick={fetchOrderDetails} className="btn btn-secondary btn-sm flex items-center gap-1" disabled={loading}>
          <RefreshCw size={14} /> Refresh Status
        </button>
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

      {/* ==================================================== */}
      {/* 6-STAGE MILESTONE PROGRESS STEPPER */}
      {/* ==================================================== */}
      <div className="card mb-6" style={{ padding: '1.75rem' }}>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            DELIVERY PROGRESS
          </span>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            Placed on {formatDateTime(order.createdAt)}
          </span>
        </div>

        <DeliveryStepper
          status={order.status}
          onRescheduleClick={() => setShowRescheduleForm(true)}
        />
      </div>

      {/* ==================================================== */}
      {/* TASK 7 REQUIREMENT: RESCHEDULE FORM (FAILED ONLY) */}
      {/* ==================================================== */}
      {isFailed && (
        <div
          className="card mb-6"
          style={{
            border: '2px solid var(--danger)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
            padding: '2rem',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Reschedule Your Delivery</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Select a convenient future date to initiate a fresh delivery attempt with agent auto-assignment.
              </p>
            </div>
          </div>

          <form onSubmit={handleRescheduleSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Preferred Delivery Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input
                    type="date"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Special Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Leave with security guard, call before arrival"
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="submit"
                className="btn btn-danger btn-lg flex items-center gap-2"
                disabled={isRescheduling}
              >
                <RotateCcw size={18} />
                <span>{isRescheduling ? 'Scheduling New Attempt...' : 'Confirm Reschedule Date'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main 2-Column Content */}
      <div className="grid-2" style={{ alignItems: 'start', gap: '1.75rem' }}>
        {/* Left Column: Route, Package, and Payment Info */}
        <div className="flex flex-col gap-6">
          {/* Route Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Delivery Route</h3>

            <div className="flex flex-col gap-3">
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> PICKUP ORIGIN ({order.pickupZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>{order.pickupAddress}</p>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-1 mb-1" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <MapPin size={14} /> DROP DESTINATION ({order.dropZone?.name || 'Zone'})
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>{order.dropAddress}</p>
              </div>
            </div>

            {order.rescheduledDate && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent)',
                }}
              >
                <Calendar size={16} />
                <span>Rescheduled for delivery on <strong>{formatDateOnly(order.rescheduledDate)}</strong></span>
              </div>
            )}
          </div>

          {/* Package & Pricing Snapshot */}
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

        {/* Right Column: Immutable Tracking Timeline */}
        <div>
          <TrackingTimeline history={history} />
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;
