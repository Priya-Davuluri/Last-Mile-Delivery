const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing userId and role
 * @param {string} userId - The user's MongoDB ObjectId
 * @param {string} role - The user's role ('customer', 'agent', 'admin')
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_replace_in_production_9988776655';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    secret,
    {
      expiresIn: expiresIn,
    }
  );
};

module.exports = generateToken;
