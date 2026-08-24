const express = require('express');
const router = express.Router();

const {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getRateCards,
  createOrUpdateRateCard,
  updateRateCard,
  getAgents,
  updateAgentProfile,
  getAdminOverview,
  getCustomers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication & admin role
router.use(protect);
router.use(authorize('admin'));

// Overview & Customers
router.get('/overview', getAdminOverview);
router.get('/customers', getCustomers);

// Zone Management Routes
router.get('/zones', getZones);
router.post('/zones', createZone);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);

// Rate Card Management Routes
router.get('/rate-cards', getRateCards);
router.post('/rate-cards', createOrUpdateRateCard);
router.put('/rate-cards/:id', updateRateCard);

// Agent Management Routes
router.get('/agents', getAgents);
router.put('/agents/:id', updateAgentProfile);

module.exports = router;
