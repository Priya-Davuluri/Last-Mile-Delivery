export const ORDER_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked-up',
  IN_TRANSIT: 'in-transit',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

export const ORDER_STATUS_LABELS = {
  pending: 'Order Placed',
  assigned: 'Agent Assigned',
  'picked-up': 'Picked Up',
  'in-transit': 'In Transit',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Delivery Failed',
};

export const ORDER_TYPES = ['B2C', 'B2B'];
export const PAYMENT_TYPES = ['Prepaid', 'COD'];

export const ROLES = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  ADMIN: 'admin',
};
