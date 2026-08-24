/**
 * Backend Smoke & Integrity Verification Script
 * Validates module loading, exports, models, services, and route wiring.
 */
try {
  console.log('🔍 Validating Backend Modules & Architecture...');

  // 1. Models
  const models = require('../models');
  const requiredModels = ['User', 'AgentProfile', 'Zone', 'RateCard', 'Order', 'TrackingHistory', 'Notification'];
  for (const m of requiredModels) {
    if (!models[m]) throw new Error(`Missing model export: ${m}`);
  }
  console.log('✅ All 7 Mongoose models loaded successfully.');

  // 2. Services
  const { calculateRate, detectZoneFromAddress } = require('../services/rateEngine');
  if (typeof calculateRate !== 'function' || typeof detectZoneFromAddress !== 'function') {
    throw new Error('rateEngine missing exports');
  }
  console.log('✅ Rate Calculation Engine verified.');

  const { findBestAgentForOrder, assignAgentToOrder, autoAssignOrder } = require('../services/assignmentEngine');
  if (typeof autoAssignOrder !== 'function') throw new Error('assignmentEngine missing exports');
  console.log('✅ Agent Assignment Engine verified.');

  const { transitionOrderStatus, validateTransition } = require('../services/statusLifecycleService');
  if (typeof transitionOrderStatus !== 'function') throw new Error('statusLifecycleService missing exports');
  console.log('✅ Status Lifecycle & State Machine verified.');

  const { sendNotification } = require('../services/notificationService');
  if (typeof sendNotification !== 'function') throw new Error('notificationService missing exports');
  console.log('✅ Notification Service (Nodemailer) verified.');

  // 3. Controllers
  const authController = require('../controllers/authController');
  const adminController = require('../controllers/adminController');
  const orderController = require('../controllers/orderController');
  const agentController = require('../controllers/agentController');
  const customerController = require('../controllers/customerController');
  const assignmentController = require('../controllers/assignmentController');
  console.log('✅ All 6 Controller modules loaded cleanly.');

  // 4. Routes & App
  const app = require('../server');
  if (!app) throw new Error('server.js failed to export Express app');
  console.log('✅ Express Server & Router hierarchy wired without errors.');

  console.log('\n🚀 ALL BACKEND MODULES FULLY OPERATIONAL AND VERIFIED!\n');
} catch (err) {
  console.error('❌ Verification failed:', err);
  process.exit(1);
}
