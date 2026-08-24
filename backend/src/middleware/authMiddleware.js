const jwt = require('jsonwebtoken');
const { User, AgentProfile } = require('../models');

/**
 * Protect routes: verifies JWT token and attaches user object to request
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_replace_in_production_9988776655';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;

    // If the authenticated user is an agent, attach agent profile
    if (user.role === 'agent') {
      const agentProfile = await AgentProfile.findOne({ user: user._id }).populate('assignedZones');
      req.agentProfile = agentProfile;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

/**
 * Restrict access to specific roles
 * @param  {...string} roles - e.g. 'admin', 'agent', 'customer'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
