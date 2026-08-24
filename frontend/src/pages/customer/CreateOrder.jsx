import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import OrderChargeBreakdown from '../../components/OrderChargeBreakdown';
import {
  Package,
  Calculator,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building,
  User,
  Scale,
  Box,
  Truck,
  Shield,
} from 'lucide-react';

const CreateOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Step state: 1 = Fill Form, 2 = Review Charge Breakdown, 3 = Confirmed
  const [step, setStep] = useState(1);

  // Customers list for Admin variant
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    pickupAddress: 'Flat 102, Connaught Place, New Delhi 110001',
    dropAddress: 'Tower 4, Cyber Hub, Saket, New Delhi 110017',
    length: '30',
    breadth: '20',
    height: '15',
    actualWeight: '2.5',
    orderType: 'B2C',
    paymentType: 'Prepaid',
  });

  // Calculation & UI States
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  // If admin, fetch registered customers for the selector
  useEffect(() => {
    if (isAdmin) {
      adminService
        .getCustomers()
        .then((res) => {
          if (res.success && res.customers) {
            setCustomers(res.customers);
            if (res.customers.length > 0) {
              setSelectedCustomerId(res.customers[0]._id);
            }
          }
        })
        .catch((err) => console.error('Failed to load customers:', err));
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Step 1: Calculate Rate Preview via Backend API
  const handleCalculateRate = async (e) => {
    if (e) e.preventDefault();
    const { pickupAddress, dropAddress, length, breadth, height, actualWeight, orderType, paymentType } = formData;

    if (!pickupAddress.trim() || !dropAddress.trim()) {
      setError('Please provide both pickup and delivery addresses.');
      return;
    }

    if (!length || !breadth || !height || !actualWeight || parseFloat(actualWeight) <= 0) {
      setError('Please provide valid package dimensions and actual scale weight.');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      const res = await orderService.calculateRate({
        pickupAddress: pickupAddress.trim(),
        dropAddress: dropAddress.trim(),
        dimensions: {
          length: parseFloat(length),
          breadth: parseFloat(breadth),
          height: parseFloat(height),
        },
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType,
      });

      if (res.success && res.calculation) {
        setCalculation(res.calculation);
        setStep(2); // Advance to Step 2: Review Charge Preview
      }
    } catch (err) {
      setError(
        err.data?.message ||
          err.message ||
          'Could not calculate delivery charges. Ensure addresses match covered zones.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  // Step 2: Confirm and Place Order
  const handleConfirmOrder = async () => {
    if (!calculation) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        pickupAddress: formData.pickupAddress.trim(),
        dropAddress: formData.dropAddress.trim(),
        dimensions: {
          length: parseFloat(formData.length),
          breadth: parseFloat(formData.breadth),
          height: parseFloat(formData.height),
        },
        actualWeight: parseFloat(formData.actualWeight),
        orderType: formData.orderType,
        paymentType: formData.paymentType,
      };

      if (isAdmin && selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      }

      const res = await orderService.createOrder(payload);

      if (res.success && res.order) {
        setSuccessOrder(res.order);
        setStep(3); // Advance to Step 3: Success Confirmation
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset demo scenarios
  const handleApplyPreset = (pAddress, dAddress, l, b, h, wt, type, payment) => {
    setFormData({
      pickupAddress: pAddress,
      dropAddress: dAddress,
      length: String(l),
      breadth: String(b),
      height: String(h),
      actualWeight: String(wt),
      orderType: type,
      paymentType: payment,
    });
    setError('');
  };

  // ====================================================
  // STEP 3: SUCCESS CONFIRMATION
  // ====================================================
  if (step === 3 && successOrder) {
    const detailUrl = isAdmin
      ? `/admin/orders/${successOrder._id}`
      : `/customer/orders/${successOrder._id}`;

    return (
      <div className="main-content fade-in" style={{ maxWidth: '650px', margin: '3rem auto' }}>
        <div className="glass-panel" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle size={36} />
          </div>
          <h2>Shipment Created Successfully!</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Your delivery order has been recorded with immutable rate snapshots and entered into the dispatch pipeline.
          </p>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TRACKING ID</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{successOrder._id}</strong>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TOTAL CHARGE</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>₹{successOrder.totalCharge}</strong>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>BILLABLE WEIGHT</span>
              <span>
                {successOrder.billableWeight} kg ({successOrder.orderType})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>PAYMENT METHOD</span>
              <span className="badge badge-assigned">{successOrder.paymentType}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
            <Link to={detailUrl} className="btn btn-primary">
              View Order Tracking Timeline <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setSuccessOrder(null);
                setCalculation(null);
              }}
              className="btn btn-secondary"
            >
              Create Another Shipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {isAdmin ? (
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Admin Booking
            </span>
          ) : (
            <span className="badge badge-assigned">
              <Calculator size={12} /> Rate Engine v1
            </span>
          )}
          <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>
            Step {step} of 2: {step === 1 ? 'Shipment Details' : 'Charge Confirmation'}
          </span>
        </div>

        <h1 style={{ marginTop: '0.25rem' }}>
          {isAdmin ? 'Create Order on Customer Behalf' : 'Create Delivery Shipment'}
        </h1>
        <p>
          Dynamic volumetric weight billing, automatic zone detection, and transparent price snapshots.
        </p>
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

      {/* ==================================================== */}
      {/* STEP 1: FILL SPECIFICATIONS FORM */}
      {/* ==================================================== */}
      {step === 1 && (
        <div>
          {/* Quick Presets */}
          <div className="flex items-center gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Demo Presets:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleApplyPreset(
                  'Flat 102, Connaught Place, New Delhi 110001',
                  'Market Area, Connaught Place, Central Delhi 110001',
                  20,
                  15,
                  10,
                  1.2,
                  'B2C',
                  'Prepaid'
                )
              }
            >
              Intra-Zone B2C (Prepaid)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleApplyPreset(
                  'Connaught Place, Central CBD, 110001',
                  'Hauz Khas, South Delhi 110016',
                  40,
                  30,
                  25,
                  3.5,
                  'B2B',
                  'COD'
                )
              }
            >
              Inter-Zone B2B (COD + Volumetric)
            </button>
          </div>

          <div className="card">
            <form onSubmit={handleCalculateRate}>
              {/* Admin Customer Selector */}
              {isAdmin && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Select Customer Account (Admin Placement)
                  </label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email}) - {c.phone}
                      </option>
                    ))}
                    {customers.length === 0 && (
                      <option value="">No registered customers found</option>
                    )}
                  </select>
                </div>
              )}

              {/* Section 1: Addresses */}
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>1. Pickup & Delivery Locations</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="pickup-address">Pickup Address (Locality / Pincode)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                  <textarea
                    id="pickup-address"
                    name="pickupAddress"
                    className="form-textarea"
                    style={{ paddingLeft: '2.5rem', minHeight: '65px' }}
                    placeholder="e.g. Flat 102, Connaught Place, New Delhi 110001"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="drop-address">Drop Address (Locality / Pincode)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--accent)' }} />
                  <textarea
                    id="drop-address"
                    name="dropAddress"
                    className="form-textarea"
                    style={{ paddingLeft: '2.5rem', minHeight: '65px' }}
                    placeholder="e.g. Tower 4, Cyber Hub, Saket, New Delhi 110017"
                    value={formData.dropAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Package Specs */}
              <h3 style={{ marginTop: '1.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                2. Dimensions & Weight
              </h3>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="length"
                    className="form-control"
                    value={formData.length}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Breadth (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="breadth"
                    className="form-control"
                    value={formData.breadth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="height"
                    className="form-control"
                    value={formData.height}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Actual Scale Weight (kg)</label>
                <div style={{ position: 'relative' }}>
                  <Scale size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="number"
                    step="0.05"
                    name="actualWeight"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.actualWeight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Section 3: Order & Payment Type */}
              <h3 style={{ marginTop: '1.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                3. Order & Payment Type
              </h3>

              <div className="grid-2 mb-6">
                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select name="orderType" className="form-select" value={formData.orderType} onChange={handleChange}>
                    <option value="B2C">B2C (Consumer Retail)</option>
                    <option value="B2B">B2B (Enterprise Bulk)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select name="paymentType" className="form-select" value={formData.paymentType} onChange={handleChange}>
                    <option value="Prepaid">Prepaid (Zero Surcharge)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculating Rates with Engine...' : 'Calculate & Preview Charges'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 2: CHARGE PREVIEW & CONFIRMATION SCREEN */}
      {/* ==================================================== */}
      {step === 2 && calculation && (
        <div className="fade-in">
          <div className="card mb-6" style={{ padding: '2rem' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2>Review Rate Breakdown & Confirm</h2>
                <p style={{ marginTop: '0.2rem' }}>
                  Please review the computed charges below. Clicking "Confirm & Place Order" will lock in this snapshot.
                </p>
              </div>
            </div>

            {/* Render Shared OrderChargeBreakdown Component */}
            <OrderChargeBreakdown calculation={calculation} showTitle={false} />

            <div className="grid-2 mt-6" style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FROM:</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>{formData.pickupAddress}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TO:</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>{formData.dropAddress}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Back to Edit Details
              </button>

              <button
                type="button"
                className="btn btn-primary btn-lg flex items-center gap-2"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
              >
                <CheckCircle size={18} />
                <span>{isSubmitting ? 'Confirming & Creating...' : 'Confirm & Place Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
