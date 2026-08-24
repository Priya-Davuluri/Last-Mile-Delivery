import React from 'react';
import { ORDER_STATUS_LABELS } from '../utils/constants';
import { Clock, UserCheck, Package, Truck, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_ICONS = {
  pending: Clock,
  assigned: UserCheck,
  'picked-up': Package,
  'in-transit': Truck,
  'out-for-delivery': MapPin,
  delivered: CheckCircle,
  failed: AlertTriangle,
};

const StatusBadge = ({ status, showIcon = true, size = 'normal' }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'pending';
  const IconComponent = STATUS_ICONS[normalizedStatus] || Clock;
  const label = ORDER_STATUS_LABELS[normalizedStatus] || normalizedStatus;

  return (
    <span
      className={`badge badge-${normalizedStatus}`}
      style={{
        padding: size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.4rem 0.85rem' : '0.25rem 0.65rem',
        fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '0.85rem' : '0.75rem',
      }}
    >
      {showIcon && <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
