import React from 'react';
import { Package, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '2rem',
        marginTop: 'auto',
      }}
    >
      <div
        className="flex justify-between items-center"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="nav-brand-icon" style={{ width: '28px', height: '28px' }}>
            <Package size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Last-Mile Delivery Tracker</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Volumetric Weight Billing (L×B×H / 5000)</span>
          <span>•</span>
          <span>Immutable Audit Trail</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} /> Production Architecture
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
