const { User, AgentProfile, Zone } = require('../models');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, and password.',
      });
    }

    // Agents cannot self-register as per Section 6 Task 3
    if (role === 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Delivery agent accounts cannot self-register. They must be created by an administrator.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists.',
      });
    }

    // Allow first registered user to optionally be admin for initial bootstrapping, otherwise customer
    let assignedRole = 'customer';
    if (role === 'admin') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        assignedRole = 'admin';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot be registered publicly.',
        });
      }
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: assignedRole,
    });

    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    // Build response payload
    const responsePayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    // If user is agent, fetch agent profile details
    if (user.role === 'agent') {
      const agentProfile = await AgentProfile.findOne({ user: user._id }).populate('assignedZones', 'name areasCovered');
      responsePayload.agentProfile = agentProfile || null;
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: responsePayload,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const responsePayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    if (user.role === 'agent') {
      const agentProfile = await AgentProfile.findOne({ user: user._id }).populate('assignedZones', 'name areasCovered');
      responsePayload.agentProfile = agentProfile || null;
    }

    return res.status(200).json({
      success: true,
      user: responsePayload,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile.',
    });
  }
};

/**
 * @desc    Admin creates a delivery agent account and profile
 * @route   POST /api/auth/create-agent
 * @access  Private (Admin only)
 */
const createAgentAccount = async (req, res) => {
  try {
    const { name, email, phone, password, assignedZones, currentLocation } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and initial password are required.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists.',
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user with agent role
    const newAgentUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: 'agent',
    });

    // Create corresponding AgentProfile
    const agentProfile = await AgentProfile.create({
      user: newAgentUser._id,
      assignedZones: Array.isArray(assignedZones) ? assignedZones : [],
      currentLocation: currentLocation || { lat: null, lng: null },
      availabilityStatus: 'available',
    });

    const populatedProfile = await AgentProfile.findById(agentProfile._id)
      .populate('user', 'name email phone role')
      .populate('assignedZones', 'name areasCovered');

    return res.status(201).json({
      success: true,
      message: 'Delivery agent account and profile created successfully.',
      agent: populatedProfile,
    });
  } catch (error) {
    console.error('Create agent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating agent account.',
    });
  }
};

/**
 * @desc    Authenticate with Google OAuth ID Token (Customers Only)
 * @route   POST /api/auth/google
 * @access  Public
 */
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const idToken = req.body.credential || req.body.token || req.body.idToken;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token (credential) is required.',
      });
    }

    let payload = null;

    // 1. Verify Google ID token using google-auth-library
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Direct decode fallback if GOOGLE_CLIENT_ID not yet set in .env
        const base64Url = idToken.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            Buffer.from(base64, 'base64')
              .toString('latin1')
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          payload = JSON.parse(jsonPayload);
        }
      }
    } catch (verifyErr) {
      console.error('Google token verification error:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google ID token.',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve email from Google token payload.',
      });
    }

    const { email, name, sub: googleId, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find or Create User by email
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // New Google sign-up: role is strictly 'customer'
      user = await User.create({
        name: name || 'Google Customer',
        email: normalizedEmail,
        googleId,
        avatar: picture || null,
        role: 'customer',
      });
    } else {
      // Existing user: associate googleId and avatar if not yet set
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    // 3. Issue same JWT format as standard login
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Google login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || picture || null,
      },
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication.',
    });
  }
};

/**
 * @desc    Redirect to Google OAuth 2.0 Consent Screen
 * @route   GET /api/auth/google
 * @access  Public
 */
const googleAuthRedirect = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

  if (!clientId) {
    // If no client ID configured yet, redirect back to frontend with instructions
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('Google Client ID not configured in backend .env')}`);
  }

  const scope = encodeURIComponent('openid email profile');
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return res.redirect(googleOAuthUrl);
};

/**
 * @desc    Google OAuth 2.0 Callback Handler
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleAuthCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google authentication was cancelled or failed.')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Failed to exchange Google OAuth code.')}`);
    }

    // Fetch user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();

    if (!profile.email) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Could not retrieve email from Google.')}`);
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await User.hashPassword(randomPassword);

      user = await User.create({
        name: profile.name || 'Google User',
        email: normalizedEmail,
        phone: '',
        googleId: profile.sub,
        avatar: profile.picture || null,
        passwordHash,
        role: 'customer',
      });
    } else {
      if (!user.googleId) {
        user.googleId = profile.sub;
        if (profile.picture) user.avatar = profile.picture;
        await user.save();
      }
    }

    const token = generateToken(user);

    // Redirect to frontend with JWT token in URL query parameter
    return res.redirect(
      `${clientUrl}/login?google_token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}`
    );
  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google authentication error occurred.')}`);
  }
};

module.exports = {
  register,
  login,
  getMe,
  createAgentAccount,
  googleAuth,
  googleAuthRedirect,
  googleAuthCallback,
};
