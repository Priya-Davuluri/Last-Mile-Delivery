const { Order, AgentProfile } = require('../models');
const { assignAgentToOrder, autoAssignOrder } = require('../services/assignmentEngine');

/**
 * @desc    Manually assign an agent to an order (Admin only)
 * @route   POST /api/orders/:id/assign
 * @access  Private (Admin)
 */
const manualAssign = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentProfileId } = req.body;

    if (!agentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an agentProfileId for manual assignment.',
      });
    }

    const actor = `${req.user.role}:${req.user._id}`;
    const result = await assignAgentToOrder({
      orderId: id,
      agentProfileId,
      assignmentType: 'manual',
      actor,
    });

    return res.status(200).json({
      success: true,
      message: 'Agent assigned manually to order successfully.',
      order: result.order,
      agent: result.agent,
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign agent.',
    });
  }
};

/**
 * @desc    Trigger auto-assignment for an order
 * @route   POST /api/orders/:id/auto-assign
 * @access  Private (Admin / System)
 */
const triggerAutoAssign = async (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.user ? `${req.user.role}:${req.user._id}` : 'system';

    const result = await autoAssignOrder(id, actor);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Auto assign error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Auto-assignment execution failed.',
    });
  }
};

/**
 * @desc    Get all agents with match criteria for a specific order
 * @route   GET /api/orders/:id/eligible-agents
 * @access  Private (Admin)
 */
const getEligibleAgents = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('pickupZone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const agents = await AgentProfile.find()
      .populate('user', 'name email phone')
      .populate('assignedZones');

    const pickupZoneId = order.pickupZone._id.toString();

    // Map agents with match score and zone indicator
    const enrichedAgents = agents.map((agent) => {
      const servesPickupZone = agent.assignedZones.some(
        (z) => z._id.toString() === pickupZoneId
      );

      return {
        _id: agent._id,
        user: agent.user,
        availabilityStatus: agent.availabilityStatus,
        servesPickupZone,
        assignedZones: agent.assignedZones,
        currentLocation: agent.currentLocation,
        isCurrentlyAssigned: order.assignedAgent?.toString() === agent._id.toString(),
      };
    });

    return res.status(200).json({
      success: true,
      pickupZone: order.pickupZone,
      agents: enrichedAgents,
    });
  } catch (error) {
    console.error('Get eligible agents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve eligible agents.',
    });
  }
};

module.exports = {
  manualAssign,
  triggerAutoAssign,
  getEligibleAgents,
};
