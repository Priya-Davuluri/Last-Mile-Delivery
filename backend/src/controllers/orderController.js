const mongoose = require('mongoose');
const { Order, TrackingHistory, Zone, User, AgentProfile } = require('../models');
const { calculateRate } = require('../services/rateEngine');
const { transitionOrderStatus } = require('../services/statusLifecycleService');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    Preview rate calculation before placing order
 * @route   POST /api/orders/calculate-rate
 * @access  Public / Authenticated
 */
const calculateRatePreview = async (req, res) => {
  try {
    const {
      pickupAddress,
      dropAddress,
      pickupZoneId,
      dropZoneId,
      dimensions,
      actualWeight,
      orderType,
      paymentType,
    } = req.body;

    const calculation = await calculateRate({
      pickupAddress,
      dropAddress,
      pickupZoneId,
      dropZoneId,
      dimensions,
      actualWeight,
      orderType,
      paymentType,
    });

    return res.status(200).json({
      success: true,
      calculation,
    });
  } catch (error) {
    console.error('Rate calculation preview error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate delivery rate.',
    });
  }
};

/**
 * @desc    Create a new delivery order with verified rate snapshots
 * @route   POST /api/orders
 * @access  Private (Customer or Admin)
 */
const createOrder = async (req, res) => {
  try {
    const {
      pickupAddress,
      dropAddress,
      pickupZoneId,
      dropZoneId,
      dimensions,
      actualWeight,
      orderType,
      paymentType,
      customerId, // optional if placed by admin on behalf of customer
    } = req.body;

    // 1. Calculate rate and verify zones & weights
    const calculation = await calculateRate({
      pickupAddress,
      dropAddress,
      pickupZoneId,
      dropZoneId,
      dimensions,
      actualWeight,
      orderType,
      paymentType,
    });

    // 2. Determine customer reference
    let targetCustomerId = req.user._id;
    let createdByAdmin = false;

    if (req.user.role === 'admin') {
      if (customerId) {
        const customUser = await User.findById(customerId);
        if (customUser) {
          targetCustomerId = customUser._id;
          createdByAdmin = true;
        }
      } else {
        createdByAdmin = true;
      }
    }

    // 3. Persist Order with immutable snapshots as specified in README
    const newOrder = await Order.create({
      customer: targetCustomerId,
      createdByAdmin,
      pickupAddress: pickupAddress.trim(),
      pickupZone: calculation.pickupZone.id,
      dropAddress: dropAddress.trim(),
      dropZone: calculation.dropZone.id,
      dimensions: calculation.dimensions,
      actualWeight: calculation.actualWeight,
      volumetricWeight: calculation.volumetricWeight,
      billableWeight: calculation.billableWeight,
      orderType: calculation.orderType,
      paymentType: calculation.paymentType,
      rateApplied: calculation.rateApplied,
      codSurchargeApplied: calculation.codSurchargeApplied,
      totalCharge: calculation.totalCharge,
      assignedAgent: null,
      assignmentType: null,
      status: 'pending',
    });

    // 4. Create initial entry in immutable TrackingHistory
    await TrackingHistory.create({
      order: newOrder._id,
      status: 'pending',
      actor: `${req.user.role}:${req.user._id}`,
      notes: `Order created (${calculation.orderType} ${calculation.rateType}, billable weight ${calculation.billableWeight} kg)`,
      timestamp: new Date(),
    });

    // 5. Populate and return
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'name areasCovered')
      .populate('dropZone', 'name areasCovered');

    // Trigger email notification
    if (populatedOrder.customer) {
      sendNotification({
        order: populatedOrder,
        customer: populatedOrder.customer,
        type: 'order-created',
        status: 'pending',
      }).catch((err) => console.error('Notification error:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Delivery order created successfully.',
      order: populatedOrder,
      calculation,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order.',
    });
  }
};

/**
 * @desc    Get order details with full tracking history (Supports full ID, short ID, or # prefix)
 * @route   GET /api/orders/:id
 * @access  Public / Authenticated
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const cleanId = id.trim().replace(/^#/, '');

    let order = null;

    // 1. Try finding by exact ObjectId
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      order = await Order.findById(cleanId)
        .populate('customer', 'name email phone')
        .populate('pickupZone', 'name areasCovered')
        .populate('dropZone', 'name areasCovered')
        .populate({
          path: 'assignedAgent',
          populate: { path: 'user', select: 'name email phone' },
        });
    }

    // 2. If not found or short suffix provided, search by suffix match
    if (!order) {
      order = await Order.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: `${cleanId}$`,
            options: 'i',
          },
        },
      })
        .populate('customer', 'name email phone')
        .populate('pickupZone', 'name areasCovered')
        .populate('dropZone', 'name areasCovered')
        .populate({
          path: 'assignedAgent',
          populate: { path: 'user', select: 'name email phone' },
        });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${cleanId} not found. Please verify the tracking code and try again.`,
      });
    }

    // Fetch immutable tracking history sorted chronologically
    const history = await TrackingHistory.find({ order: order._id }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      order,
      history,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
};

/**
 * @desc    Get logged in customer's order history
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('pickupZone', 'name')
      .populate('dropZone', 'name')
      .populate({
        path: 'assignedAgent',
        populate: { path: 'user', select: 'name phone' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders.' });
  }
};

/**
 * @desc    Get all orders with filtering (Admin view)
 * @route   GET /api/orders
 * @access  Private (Admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, zoneId, agentId, orderType } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (zoneId && zoneId !== 'all') {
      filter.$or = [{ pickupZone: zoneId }, { dropZone: zoneId }];
    }

    if (agentId && agentId !== 'all') {
      filter.assignedAgent = agentId;
    }

    if (orderType && orderType !== 'all') {
      filter.orderType = orderType;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'name')
      .populate('dropZone', 'name')
      .populate({
        path: 'assignedAgent',
        populate: { path: 'user', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

/**
 * @desc    Admin manually overrides order status
 * @route   PUT /api/orders/:id/override-status
 * @access  Private (Admin)
 */
const overrideOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Target status is required for override.' });
    }

    const actor = `admin:${req.user._id}`;
    const result = await transitionOrderStatus({
      orderId: id,
      nextStatus: status,
      actor,
      notes,
      isOverride: true,
    });

    return res.status(200).json({
      success: true,
      message: `Order status manually overridden to '${status}' by admin.`,
      order: result.order,
      historyEntry: result.historyEntry,
    });
  } catch (error) {
    console.error('Admin override status error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to override order status.',
    });
  }
};

/**
 * @desc    Advance delivery order lifecycle status
 * @route   PUT /api/orders/:id/status
 * @access  Authenticated / Public Tracking Action
 */
const progressOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Next status is required.' });
    }

    const userRole = req.user?.role || 'agent';
    const userId = req.user?._id || 'field';
    const actor = `${userRole}:${userId}`;
    const transitionNotes = reason || notes || `Status advanced to ${status} via tracking console.`;

    const result = await transitionOrderStatus({
      orderId: id,
      nextStatus: status,
      actor,
      notes: transitionNotes,
      isOverride: userRole === 'admin',
    });

    return res.status(200).json({
      success: true,
      message: `Delivery status successfully updated to '${status.toUpperCase()}'.`,
      order: result.order,
      historyEntry: result.historyEntry,
    });
  } catch (error) {
    console.error('Progress order status error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update order status.',
    });
  }
};

module.exports = {
  calculateRatePreview,
  createOrder,
  getOrderById,
  getCustomerOrders,
  getAllOrders,
  overrideOrderStatus,
  progressOrderStatus,
};
