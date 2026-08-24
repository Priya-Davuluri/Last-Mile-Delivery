import React from 'react';
import {
  Package,
  UserCheck,
  Box,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';

export const LIFECYCLE_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'assigned', label: 'Agent Assigned', icon: UserCheck },
  { key: 'picked-up', label: 'Package Picked Up', icon: Box },
  { key: 'in-transit', label: 'In Transit', icon: Truck },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const DeliveryStepper = ({ status, onRescheduleClick, minRescheduleDate }) => {
  const isFailed = status === 'failed';
  const statusKeys = LIFECYCLE_STEPS.map((s) => s.key);
  const currentIndex = isFailed ? -1 : statusKeys.indexOf(status);
  const safeIndex = currentIndex !== -1 ? currentIndex : 0;

  // Calculate progress percentage across steps (0 to 100%)
  const progressPercent = (safeIndex / (LIFECYCLE_STEPS.length - 1)) * 100;

  if (isFailed) {
    return (
      <div
        style={{
          marginTop: '1rem',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
        }}
      >
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <h4 style={{ color: 'var(--danger)', margin: 0, fontSize: '1.1rem' }}>Delivery Attempt Unsuccessful</h4>
              <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Our field agent was unable to complete the delivery attempt. Please select a reschedule date.
              </p>
            </div>
          </div>

          {onRescheduleClick && (
            <button
              type="button"
              onClick={onRescheduleClick}
              className="btn btn-danger flex items-center gap-2"
            >
              <RotateCcw size={16} /> Reschedule Delivery
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stepper-container">
      {/* Background Track Line */}
      <div className="stepper-track-bg" />

      {/* Glowing Active Track Progress Line */}
      <div
        className="stepper-track-progress"
        style={{ width: `calc(${progressPercent}% * 0.88)` }}
      />

      <div className="stepper">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx < safeIndex;
          const isCurrent = idx === safeIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
            >
              <div className="stepper-circle">
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <StepIcon size={18} />
                )}
              </div>
              <div className="stepper-label">{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryStepper;
