const express = require('express');
const router = express.Router();
const {
  getAgentOrders,
  updateOrderStatus,
  toggleAvailability,
  updateLocation,
} = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Restrict all routes in this module to logged in delivery agents
router.use(protect);
router.use(authorize('agent'));

router.get('/orders', getAgentOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/availability', toggleAvailability);
router.put('/location', updateLocation);

module.exports = router;
