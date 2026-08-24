import React from 'react';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '../utils/formatters';
import { Clock, Shield, User, Truck, Cpu, AlertTriangle, RotateCcw } from 'lucide-react';

const TrackingTimeline = ({ history = [], title = 'Tracking Timeline (Audit Trail)' }) => {
  // Chronological sort: earliest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getActorBadge = (actorString) => {
    if (!actorString) {
      return (
        <span className="flex items-center gap-1" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
          <Cpu size={12} /> System
        </span>
      );
    }

    if (actorString.startsWith('admin')) {
      const adminId = actorString.split(':')[1] || '';
      return (
        <span
          className="flex items-center gap-1"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
          title={`Administrator Action (${actorString})`}
        >
          <Shield size={11} /> Admin {adminId ? `(${adminId.substring(adminId.length - 4)})` : ''}
        </span>
      );
    }

    if (actorString.startsWith('agent')) {
      const agentId = actorString.split(':')[1] || '';
      return (
        <span
          className="flex items-center gap-1"
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--primary)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
          title={`Field Delivery Agent (${actorString})`}
        >
          <Truck size={11} /> Agent {agentId ? `(${agentId.substring(agentId.length - 4)})` : ''}
        </span>
      );
    }

    if (actorString.startsWith('customer')) {
      return (
        <span
          className="flex items-center gap-1"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
          title={`Customer Action (${actorString})`}
        >
          <User size={11} /> Customer
        </span>
      );
    }

    return (
      <span
        className="flex items-center gap-1"
        style={{
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--accent)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '0.15rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
        }}
        title={`Automated Workflow (${actorString})`}
      >
        <Cpu size={11} /> {actorString}
      </span>
    );
  };

  const isOverrideEvent = (notes) => notes && notes.includes('[Admin Override]');
  const isFailedEvent = (status) => status === 'failed';
  const isRescheduleEvent = (notes) => notes && (notes.toLowerCase().includes('rescheduled') || notes.toLowerCase().includes('reschedule'));

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} />
          <span>{title}</span>
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {sortedHistory.length} Event{sortedHistory.length !== 1 ? 's' : ''} (Append-Only)
        </span>
      </div>

      <div className="timeline">
        {sortedHistory.map((entry, idx) => {
          const isLast = idx === sortedHistory.length - 1;
          const isOverride = isOverrideEvent(entry.notes);
          const isFailed = isFailedEvent(entry.status);
          const isRescheduled = isRescheduleEvent(entry.notes);

          return (
            <div key={idx} className="timeline-item">
              <div
                className={`timeline-node ${
                  isFailed
                    ? 'danger'
                    : isOverride
                    ? 'danger'
                    : entry.status === 'delivered'
                    ? 'success'
                    : isLast
                    ? 'active'
                    : ''
                }`}
              />

              <div className="flex justify-between items-center mb-1" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} size="sm" />
                  {isOverride && (
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: 'var(--danger)',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                      }}
                    >
                      OVERRIDE
                    </span>
                  )}
                  {isRescheduled && (
                    <span
                      style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#C084FC',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                      }}
                    >
                      RESCHEDULED
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>

              {/* Note / Rationale Box */}
              <div
                style={{
                  background: isOverride
                    ? 'rgba(239, 68, 68, 0.08)'
                    : isFailed
                    ? 'rgba(239, 68, 68, 0.06)'
                    : isRescheduled
                    ? 'rgba(168, 85, 247, 0.08)'
                    : 'var(--bg-input)',
                  border: isOverride
                    ? '1px solid rgba(239, 68, 68, 0.25)'
                    : isFailed
                    ? '1px solid rgba(239, 68, 68, 0.2)'
                    : '1px solid var(--border-subtle)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  margin: '0.4rem 0',
                  fontSize: '0.85rem',
                  color: isFailed ? '#FCA5A5' : 'var(--text-main)',
                }}
              >
                {entry.notes || `Status advanced to ${entry.status}`}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Logged Actor:</span>
                {getActorBadge(entry.actor)}
              </div>
            </div>
          );
        })}

        {sortedHistory.length === 0 && (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No status milestone events logged yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default TrackingTimeline;
