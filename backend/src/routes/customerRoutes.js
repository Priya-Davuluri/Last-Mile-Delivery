const express = require('express');
const router = express.Router();
const { rescheduleOrder } = require('../controllers/customerController');
const { getCustomerOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-orders', authorize('customer'), getCustomerOrders);
router.post('/orders/:id/reschedule', authorize('customer', 'admin'), rescheduleOrder);

module.exports = router;
