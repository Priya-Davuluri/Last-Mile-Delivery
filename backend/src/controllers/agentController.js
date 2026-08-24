const { Order, AgentProfile, TrackingHistory, Notification } = require('../models');
const { sendNotification } = require('../services/notificationService');

/**
 * Valid status progression for delivery agents
 */
const VALID_AGENT_TRANSITIONS = {
  assigned: ['picked-up'],
  'picked-up': ['in-transit', 'failed'],
  'in-transit': ['out-for-delivery', 'failed'],
  'out-for-delivery': ['delivered', 'failed'],
};

/**
 * @desc    Get all orders assigned to logged in delivery agent
 * @route   GET /api/agent/orders
 * @access  Private (Agent)
 */
const getAgentOrders = async (req, res) => {
  try {
    const agentProfile = req.agentProfile;
    if (!agentProfile) {
      return res.status(404).json({ success: false, message: 'Agent profile not found for this account.' });
    }

    const orders = await Order.find({ assignedAgent: agentProfile._id })
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'name areasCovered')
      .populate('dropZone', 'name areasCovered')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      agentProfile,
    });
  } catch (error) {
    console.error('Get agent orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve agent orders.' });
  }
};

/**
 * @desc    Update order status in delivery lifecycle
 * @route   PUT /api/agent/orders/:id/status
 * @access  Private (Agent)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;
    const agentProfile = req.agentProfile;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Target delivery status is required.' });
    }

    const order = await Order.findById(id).populate('customer', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const assignedId = order.assignedAgent?._id?.toString() || order.assignedAgent?.toString();
    const currentAgentId = agentProfile?._id?.toString();

    // Verify assignment unless user is admin
    if (req.user?.role !== 'admin' && assignedId && currentAgentId && assignedId !== currentAgentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this delivery order.',
      });
    }

    if (status === 'failed' && !reason && !notes) {
      return res.status(400).json({
        success: false,
        message: 'A specific reason is mandatory when marking a delivery as failed.',
      });
    }

    const { transitionOrderStatus } = require('../services/statusLifecycleService');

    const result = await transitionOrderStatus({
      orderId: order._id,
      nextStatus: status,
      actor: `agent:${req.user._id}`,
      notes: reason || notes || `Status updated to ${status} by delivery agent.`,
      isOverride: false,
    });

    return res.status(200).json({
      success: true,
      message: `Delivery status successfully updated to '${status.toUpperCase()}'.`,
      order: result.order,
      historyEntry: result.historyEntry,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to update order status.' });
  }
};

/**
 * @desc    Agent toggles availability status (available / unavailable)
 * @route   PUT /api/agent/availability
 * @access  Private (Agent)
 */
const toggleAvailability = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;
    const agentProfile = req.agentProfile;

    if (!['available', 'unavailable'].includes(availabilityStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'available' or 'unavailable'.",
      });
    }

    agentProfile.availabilityStatus = availabilityStatus;
    await agentProfile.save();

    return res.status(200).json({
      success: true,
      message: `Availability status updated to '${availabilityStatus}'.`,
      availabilityStatus: agentProfile.availabilityStatus,
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update availability status.' });
  }
};

/**
 * @desc    Update agent live location coordinates
 * @route   PUT /api/agent/location
 * @access  Private (Agent)
 */
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const agentProfile = req.agentProfile;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude coordinates are required.' });
    }

    agentProfile.currentLocation = { lat: Number(lat), lng: Number(lng) };
    await agentProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Location coordinates updated successfully.',
      currentLocation: agentProfile.currentLocation,
    });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update location coordinates.' });
  }
};

module.exports = {
  getAgentOrders,
  updateOrderStatus,
  toggleAvailability,
  updateLocation,
};
