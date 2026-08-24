const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  createAgentAccount,
  googleAuth,
  googleAuthRedirect,
  googleAuthCallback,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only route: create delivery agent
router.post('/create-agent', protect, authorize('admin'), createAgentAccount);

module.exports = router;
