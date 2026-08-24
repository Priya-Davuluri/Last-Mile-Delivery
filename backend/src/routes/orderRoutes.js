const express = require('express');
const router = express.Router();

const {
  calculateRatePreview,
  createOrder,
  getOrderById,
  getCustomerOrders,
  getAllOrders,
  overrideOrderStatus,
  progressOrderStatus,
} = require('../controllers/orderController');
const {
  manualAssign,
  triggerAutoAssign,
  getEligibleAgents,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public preview calculation
router.post('/calculate-rate', calculateRatePreview);

// Order details lookup (tracking / details)
router.get('/:id', getOrderById);

// Progress order status (Agent, Admin, or Tracking action)
router.put('/:id/status', protect, progressOrderStatus);

// Protected routes
router.post('/', protect, authorize('customer', 'admin'), createOrder);
router.get('/customer/my-orders', protect, authorize('customer'), getCustomerOrders);
router.get('/', protect, authorize('admin'), getAllOrders);

// Assignment & Override routes (Admin)
router.post('/:id/assign', protect, authorize('admin'), manualAssign);
router.post('/:id/auto-assign', protect, authorize('admin'), triggerAutoAssign);
router.get('/:id/eligible-agents', protect, authorize('admin'), getEligibleAgents);
router.put('/:id/override-status', protect, authorize('admin'), overrideOrderStatus);

module.exports = router;
