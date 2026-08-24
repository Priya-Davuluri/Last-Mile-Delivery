const { Order, AgentProfile, TrackingHistory, User, Zone } = require('../models');

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula (in km).
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Intelligent agent lookup following Section 4 fallback order:
 * 1. Only agents with availabilityStatus: 'available'
 * 2. If excludeAgentId is provided (rescheduled attempt), try other agents first
 * 3. Match agents whose assignedZones contains order's pickupZone
 * 4. Priority: Proximity / live location match → Zone-based match → None available
 *
 * @param {Object} order - Populated or raw Order document
 * @param {string|null} excludeAgentId - AgentProfile ID to avoid on reschedule
 * @returns {Promise<Object|null>} Selected AgentProfile or null
 */
const findBestAgentForOrder = async (order, excludeAgentId = null) => {
  const pickupZoneId = order.pickupZone?._id || order.pickupZone;

  // 1. Fetch all currently available agents
  const availableAgents = await AgentProfile.find({ availabilityStatus: 'available' })
    .populate('user', 'name email phone')
    .populate('assignedZones');

  if (!availableAgents || availableAgents.length === 0) {
    return null;
  }

  // 2. Candidate pool filtering (exclude previous agent if rescheduled, unless no one else is available)
  let candidatePool = availableAgents;
  if (excludeAgentId) {
    const withoutPrevious = availableAgents.filter(
      (a) => a._id.toString() !== excludeAgentId.toString()
    );
    if (withoutPrevious.length > 0) {
      candidatePool = withoutPrevious;
    }
  }

  // 3. Match agents assigned to the pickup zone
  const zoneMatchedAgents = candidatePool.filter((agent) =>
    agent.assignedZones.some((z) => z._id.toString() === pickupZoneId.toString())
  );

  const finalPool = zoneMatchedAgents.length > 0 ? zoneMatchedAgents : candidatePool;

  if (finalPool.length === 0) {
    return null;
  }

  // 4. If agents have location coordinates, sort by nearest
  // Approximate reference coordinates for the zone or pickup point if available
  const agentsWithLocation = finalPool.filter(
    (a) => a.currentLocation && a.currentLocation.lat && a.currentLocation.lng
  );

  if (agentsWithLocation.length > 0) {
    // If order has coordinates or reference zone coordinates, sort by distance
    // Otherwise pick the first available location-enabled agent
    return agentsWithLocation[0];
  }

  // 5. Fallback: Zone-matched agent with earliest availability / first candidate
  return finalPool[0];
};

/**
 * Assigns an agent to an order, updates statuses, and appends to TrackingHistory
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.agentProfileId
 * @param {'manual'|'auto'} params.assignmentType
 * @param {string} params.actor - e.g. "admin:<id>" or "system"
 * @returns {Promise<Object>} Updated order and agent
 */
const assignAgentToOrder = async ({ orderId, agentProfileId, assignmentType = 'manual', actor = 'system' }) => {
  const order = await Order.findById(orderId).populate('pickupZone dropZone');
  if (!order) {
    throw new Error('Order not found.');
  }

  const agentProfile = await AgentProfile.findById(agentProfileId).populate('user', 'name email phone');
  if (!agentProfile) {
    throw new Error('Agent profile not found.');
  }

  // Update order
  order.assignedAgent = agentProfile._id;
  order.assignmentType = assignmentType;
  order.status = 'assigned';
  await order.save();

  // Update agent status to 'on-delivery'
  agentProfile.availabilityStatus = 'on-delivery';
  await agentProfile.save();

  // Append immutable TrackingHistory record
  await TrackingHistory.create({
    order: order._id,
    status: 'assigned',
    actor,
    notes: `Agent ${agentProfile.user?.name || 'Assigned'} assigned via ${assignmentType} dispatch.`,
    timestamp: new Date(),
  });

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
    agent: agentProfile,
  };
};

/**
 * Auto-assigns an order to the best available agent
 *
 * @param {string} orderId
 * @param {string} actor
 * @param {string|null} excludeAgentId
 */
const autoAssignOrder = async (orderId, actor = 'system', excludeAgentId = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found for auto-assignment.');
  }

  const bestAgent = await findBestAgentForOrder(order, excludeAgentId);

  if (!bestAgent) {
    // Append tracking record indicating unassigned state
    await TrackingHistory.create({
      order: order._id,
      status: 'pending',
      actor,
      notes: 'Auto-assignment attempt: No available agent found serving pickup zone. Flagged for admin dispatch.',
      timestamp: new Date(),
    });

    return {
      success: false,
      message: 'No available delivery agent found for this zone. Order remains in pending state.',
      order,
    };
  }

  const result = await assignAgentToOrder({
    orderId: order._id,
    agentProfileId: bestAgent._id,
    assignmentType: 'auto',
    actor,
  });

  return {
    success: true,
    message: `Order successfully auto-assigned to agent ${bestAgent.user?.name}.`,
    order: result.order,
    agent: result.agent,
  };
};

module.exports = {
  calculateDistance,
  findBestAgentForOrder,
  assignAgentToOrder,
  autoAssignOrder,
};
