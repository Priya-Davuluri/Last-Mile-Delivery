const { Order, TrackingHistory, AgentProfile, Notification } = require('../models');
const { sendNotification } = require('./notificationService');

/**
 * Standard delivery state machine transitions
 */
const STANDARD_TRANSITIONS = {
  pending: ['assigned'],
  assigned: ['picked-up'],
  'picked-up': ['in-transit', 'failed'],
  'in-transit': ['out-for-delivery', 'failed'],
  'out-for-delivery': ['delivered', 'failed'],
  delivered: [],
  failed: ['pending'],
};

/**
 * Validates whether a status transition is permitted
 *
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @param {boolean} isOverride - If true, bypass standard checks for admin override
 * @returns {{ isValid: boolean, reason?: string }}
 */
const validateTransition = (currentStatus, nextStatus, isOverride = false) => {
  if (isOverride) {
    const allStatuses = ['pending', 'assigned', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'failed'];
    if (!allStatuses.includes(nextStatus)) {
      return { isValid: false, reason: `Status '${nextStatus}' is not a recognized system status.` };
    }
    return { isValid: true };
  }

  const allowedNext = STANDARD_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    return {
      isValid: false,
      reason: `Invalid transition from '${currentStatus}' to '${nextStatus}'. Allowed next steps: ${allowedNext.join(', ') || 'None (terminal)'}`,
    };
  }

  return { isValid: true };
};

/**
 * Executes a status transition on an order, updates agent availability,
 * and appends an immutable entry to TrackingHistory.
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.nextStatus
 * @param {string} params.actor - e.g. "admin:<id>", "agent:<id>", "system"
 * @param {string} params.notes - transition explanation or failure reason
 * @param {boolean} params.isOverride - true if initiated as an administrative override
 * @returns {Promise<{ order: Object, historyEntry: Object }>}
 */
const transitionOrderStatus = async ({ orderId, nextStatus, actor, notes = '', isOverride = false }) => {
  const order = await Order.findById(orderId).populate('customer pickupZone dropZone');
  if (!order) {
    throw new Error('Order not found.');
  }

  // 1. Validate status transition
  const validation = validateTransition(order.status, nextStatus, isOverride);
  if (!validation.isValid) {
    throw new Error(validation.reason);
  }

  const previousStatus = order.status;

  // 2. Update order status
  order.status = nextStatus;
  await order.save();

  // 3. Manage Agent Availability on terminal statuses
  if (order.assignedAgent && (nextStatus === 'delivered' || nextStatus === 'failed')) {
    await AgentProfile.findByIdAndUpdate(order.assignedAgent, {
      availabilityStatus: 'available',
    });
  }

  // 4. Construct audit notes
  const formattedNotes = isOverride
    ? `[Admin Override] Status changed from '${previousStatus}' to '${nextStatus}'. Justification: ${notes || 'Administrative adjustment'}`
    : notes || `Status advanced from '${previousStatus}' to '${nextStatus}'`;

  // 5. Append to immutable TrackingHistory (append-only)
  const historyEntry = await TrackingHistory.create({
    order: order._id,
    status: nextStatus,
    actor,
    notes: formattedNotes,
    timestamp: new Date(),
  });

  // 6. Send Email Notification to Customer
  if (order.customer) {
    sendNotification({
      order,
      customer: order.customer,
      type: nextStatus === 'failed' ? 'failed-delivery' : 'status-update',
      status: nextStatus,
      notes: formattedNotes,
    }).catch((err) => console.error('Notification dispatch error:', err.message));
  }

  const populatedOrder = await Order.findById(order._id)
    .populate('customer', 'name email phone')
    .populate('pickupZone', 'name')
    .populate('dropZone', 'name')
    .populate({
      path: 'assignedAgent',
      populate: { path: 'user', select: 'name email phone' },
    });

  return {
    order: populatedOrder,
    historyEntry,
  };
};

module.exports = {
  STANDARD_TRANSITIONS,
  validateTransition,
  transitionOrderStatus,
};
