const { Order, TrackingHistory, Notification } = require('../models');
const { autoAssignOrder } = require('../services/assignmentEngine');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    Reschedule a failed delivery order
 * @route   POST /api/customer/orders/:id/reschedule
 * @access  Private (Customer or Admin)
 */
const rescheduleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rescheduledDate, notes } = req.body;

    if (!rescheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a valid date to reschedule delivery.',
      });
    }

    const order = await Order.findById(id).populate('customer');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ownership authorization check
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reschedule this order.' });
    }

    // Validate order is in 'failed' status
    if (order.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: `Only failed orders can be rescheduled. Current order status is '${order.status}'.`,
      });
    }

    const previousAgentId = order.assignedAgent;
    const parsedDate = new Date(rescheduledDate);

    // Update order
    order.rescheduledDate = parsedDate;
    order.status = 'pending';
    order.assignedAgent = null;
    order.assignmentType = null;
    await order.save();

    const actor = `${req.user.role}:${req.user._id}`;
    const rescheduleNote = `Delivery rescheduled for ${parsedDate.toLocaleDateString()}${notes ? `. Notes: ${notes}` : ''}`;

    // Append to immutable TrackingHistory
    await TrackingHistory.create({
      order: order._id,
      status: 'pending',
      actor,
      notes: rescheduleNote,
      timestamp: new Date(),
    });

    // Send Email Notification to Customer
    if (order.customer) {
      sendNotification({
        order,
        customer: order.customer,
        type: 'status-update',
        status: 'rescheduled',
        notes: rescheduleNote,
      }).catch((err) => console.error('Notification dispatch error:', err.message));
    }

    // Re-run auto-assignment logic, avoiding the previously failed agent if other candidates exist
    let assignmentResult = null;
    try {
      assignmentResult = await autoAssignOrder(order._id, 'system', previousAgentId);
    } catch (assignErr) {
      console.warn('Auto-assignment during reschedule could not find agent immediately:', assignErr.message);
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'name')
      .populate('dropZone', 'name')
      .populate({
        path: 'assignedAgent',
        populate: { path: 'user', select: 'name email phone' },
      });

    const history = await TrackingHistory.find({ order: order._id }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      message: assignmentResult?.success
        ? `Order successfully rescheduled and auto-assigned to ${updatedOrder.assignedAgent?.user?.name || 'an agent'}!`
        : 'Order successfully rescheduled. Agent will be assigned shortly.',
      order: updatedOrder,
      history,
    });
  } catch (error) {
    console.error('Reschedule order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reschedule delivery.',
    });
  }
};

module.exports = {
  rescheduleOrder,
};
