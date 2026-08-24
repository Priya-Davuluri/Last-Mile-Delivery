import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { MapPin, Box, Scale, DollarSign, ShieldCheck } from 'lucide-react';

const OrderChargeBreakdown = ({ calculation, showTitle = true }) => {
  if (!calculation) return null;

  return (
    <div className="card" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)' }}>
      {showTitle && (
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} style={{ color: 'var(--primary)' }} />
          <span>Charge Breakdown Snapshot</span>
        </h3>
      )}

      {/* Zone Routing */}
      <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PICKUP ZONE</span>
          <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
            {calculation.pickupZone?.name || calculation.pickupZone}
          </strong>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DROP ZONE</span>
          <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
            {calculation.dropZone?.name || calculation.dropZone}
          </strong>
        </div>
        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TRIP CLASSIFICATION</span>
          <span className={`badge ${calculation.rateType === 'intra-zone' ? 'badge-delivered' : 'badge-in-transit'}`}>
            {calculation.rateType?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Weight & Dimension Comparison */}
      <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
        <div className="flex justify-between items-center mb-2" style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Actual Scale Weight:</span>
          <span>{calculation.actualWeight} kg</span>
        </div>
        <div className="flex justify-between items-center mb-2" style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Volumetric Weight <code>(L×B×H / 5000)</code>:</span>
          <span>{calculation.volumetricWeight} kg</span>
        </div>
        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-subtle)', fontWeight: 600 }}>
          <span>Billable Weight Applied:</span>
          <strong style={{ color: 'var(--text-main)' }}>{calculation.billableWeight} kg</strong>
        </div>
      </div>

      {/* Pricing Splits */}
      <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <div className="flex justify-between items-center mb-2" style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Base Rate ({calculation.orderType}) @ {formatCurrency(calculation.rateApplied || calculation.rateCard?.ratePerKg)}/kg:
          </span>
          <span>{formatCurrency(calculation.baseCharge)}</span>
        </div>

        {calculation.minChargeApplied && (
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            * Applied minimum charge floor of {formatCurrency(calculation.rateCard?.minCharge)}
          </div>
        )}

        <div className="flex justify-between items-center mb-2" style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            COD Surcharge ({calculation.paymentType}):
          </span>
          <span style={{ color: calculation.codSurchargeApplied > 0 ? 'var(--warning)' : 'inherit' }}>
            +{formatCurrency(calculation.codSurchargeApplied)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-3 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <strong style={{ fontSize: '1.05rem' }}>Total Final Charge:</strong>
          <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
            {formatCurrency(calculation.totalCharge)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default OrderChargeBreakdown;
