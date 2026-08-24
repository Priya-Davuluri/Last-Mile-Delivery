import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';
import {
  DollarSign,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  CreditCard,
  Building,
  User,
  Sliders,
} from 'lucide-react';

const AdminRateCards = () => {
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [rateTypeFilter, setRateTypeFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    _id: null,
    orderType: 'B2C',
    rateType: 'intra-zone',
    ratePerKg: '40',
    minCharge: '80',
    codSurcharge: '30',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRateCards = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getRateCards();
      if (res.success) {
        setRateCards(res.rateCards || []);
      }
    } catch (err) {
      console.error('Error fetching rate cards:', err);
      setError(err.data?.message || err.message || 'Failed to load rate cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCards();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenModal = (card = null) => {
    if (card) {
      setFormData({
        _id: card._id,
        orderType: card.orderType,
        rateType: card.rateType,
        ratePerKg: String(card.ratePerKg),
        minCharge: String(card.minCharge || 0),
        codSurcharge: String(card.codSurcharge || 0),
        isActive: card.isActive !== undefined ? card.isActive : true,
      });
    } else {
      setFormData({
        _id: null,
        orderType: 'B2C',
        rateType: 'intra-zone',
        ratePerKg: '40',
        minCharge: '80',
        codSurcharge: '30',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSaveRateCard = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      orderType: formData.orderType,
      rateType: formData.rateType,
      ratePerKg: Number(formData.ratePerKg),
      minCharge: Number(formData.minCharge),
      codSurcharge: Number(formData.codSurcharge),
      isActive: formData.isActive,
    };

    try {
      if (formData._id) {
        const res = await adminService.updateRateCard(formData._id, payload);
        if (res.success) {
          showNotification(`Rate card for ${payload.orderType} (${payload.rateType}) updated!`);
          setShowModal(false);
          fetchRateCards();
        }
      } else {
        const res = await adminService.saveRateCard(payload);
        if (res.success) {
          showNotification(`Rate card saved successfully!`);
          setShowModal(false);
          fetchRateCards();
        }
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to save rate card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRateCards = rateCards.filter((card) => {
    const matchesOrder = orderTypeFilter === 'all' || card.orderType === orderTypeFilter;
    const matchesRate = rateTypeFilter === 'all' || card.rateType === rateTypeFilter;
    return matchesOrder && matchesRate;
  });

  return (
    <div className="main-content fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Rate Architecture
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>Rate Cards & COD Surcharges</h1>
          <p>Configure dynamic per-kg pricing, minimum charge floors, and cash-on-delivery surcharges.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchRateCards} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Configure Rate Card</span>
          </button>
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

      {/* Filter Toolbar */}
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              style={{ height: '40px', fontSize: '0.85rem' }}
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
            >
              <option value="all">All Order Types (B2C & B2B)</option>
              <option value="B2C">B2C Only</option>
              <option value="B2B">B2B Only</option>
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              style={{ height: '40px', fontSize: '0.85rem' }}
              value={rateTypeFilter}
              onChange={(e) => setRateTypeFilter(e.target.value)}
            >
              <option value="all">All Rate Types</option>
              <option value="intra-zone">Intra-Zone Only</option>
              <option value="inter-zone">Inter-Zone Only</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredRateCards.length} rate cards
          </div>
        </div>
      </div>

      {/* Rate Cards Grid */}
      <div className="grid-2 mb-6">
        {filteredRateCards.map((rc) => (
          <div key={rc._id} className="card" style={{ position: 'relative' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="badge"
                  style={{
                    background: rc.orderType === 'B2B' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: rc.orderType === 'B2B' ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  {rc.orderType}
                </span>
                <span
                  className="badge"
                  style={{
                    background: rc.rateType === 'intra-zone' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: rc.rateType === 'intra-zone' ? 'var(--success)' : 'var(--warning)',
                  }}
                >
                  {rc.rateType}
                </span>
              </div>

              <button
                onClick={() => handleOpenModal(rc)}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Edit2 size={14} /> Edit Rates
              </button>
            </div>

            <div
              className="grid-3"
              style={{
                background: 'var(--bg-input)',
                padding: '1.25rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>RATE PER KG</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {formatCurrency(rc.ratePerKg)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MIN FLOOR</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {formatCurrency(rc.minCharge)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>COD SURCHARGE</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning)' }}>
                  +{formatCurrency(rc.codSurcharge)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <div className="flex items-center gap-1" style={{ color: rc.isActive ? 'var(--success)' : 'var(--text-dim)' }}>
                {rc.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>{rc.isActive ? 'Active in Rate Engine' : 'Inactive'}</span>
              </div>
              <span style={{ color: 'var(--text-dim)' }}>
                Updated {new Date(rc.updatedAt || rc.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* COD Surcharge Explanation Banner */}
      <div className="card" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} style={{ color: 'var(--warning)' }} />
          <span>COD Surcharge Configuration Rules</span>
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          When a customer or admin selects <strong>Payment Type: Cash on Delivery (COD)</strong> at checkout, the engine automatically retrieves the configured surcharge from the matching rate card and appends it to the base weight charge. Prepaid orders are charged with ₹0 surcharge.
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          💡 Any adjustments made here take effect immediately for all new incoming shipments without server redeploys.
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT RATE CARD */}
      {/* ==================================================== */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sliders size={22} style={{ color: 'var(--primary)' }} />
              <h3>{formData._id ? 'Edit Rate Card' : 'Create Rate Card'}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Configure base per-kg rate, minimum billing floor, and COD surcharge.
            </p>

            <form onSubmit={handleSaveRateCard}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select
                    className="form-select"
                    value={formData.orderType}
                    disabled={!!formData._id}
                    onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                  >
                    <option value="B2C">B2C (Consumer)</option>
                    <option value="B2B">B2B (Enterprise)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rate Type</label>
                  <select
                    className="form-select"
                    value={formData.rateType}
                    disabled={!!formData._id}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                  >
                    <option value="intra-zone">Intra-Zone (Same Zone)</option>
                    <option value="inter-zone">Inter-Zone (Cross Zone)</option>
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Rate / Kg (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-control"
                    value={formData.ratePerKg}
                    onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Floor (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-control"
                    value={formData.minCharge}
                    onChange={(e) => setFormData({ ...formData, minCharge: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">COD Surcharge (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-control"
                    value={formData.codSurcharge}
                    onChange={(e) => setFormData({ ...formData, codSurcharge: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="rateActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="rateActiveToggle" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Rate card is active for checkout calculations
                </label>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRateCards;
