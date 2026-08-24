const { Zone, RateCard, AgentProfile, User, Order } = require('../models');

// ==========================================
// 1. Zone Management
// ==========================================

/**
 * @desc    Get all zones
 * @route   GET /api/admin/zones
 * @access  Private (Admin)
 */
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: zones.length,
      zones,
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch zones.' });
  }
};

/**
 * @desc    Create a new zone with mapped areas/pincodes
 * @route   POST /api/admin/zones
 * @access  Private (Admin)
 */
const createZone = async (req, res) => {
  try {
    const { name, areasCovered, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Zone name is required.' });
    }

    const existingZone = await Zone.findOne({ name: name.trim() });
    if (existingZone) {
      return res.status(400).json({ success: false, message: 'A zone with this name already exists.' });
    }

    // Process areasCovered (array of trimmed strings)
    let processedAreas = [];
    if (Array.isArray(areasCovered)) {
      processedAreas = areasCovered.map((a) => String(a).trim()).filter(Boolean);
    } else if (typeof areasCovered === 'string') {
      processedAreas = areasCovered.split(',').map((a) => a.trim()).filter(Boolean);
    }

    const zone = await Zone.create({
      name: name.trim(),
      areasCovered: processedAreas,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Zone created successfully.',
      zone,
    });
  } catch (error) {
    console.error('Error creating zone:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create zone.' });
  }
};

/**
 * @desc    Update a zone
 * @route   PUT /api/admin/zones/:id
 * @access  Private (Admin)
 */
const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, areasCovered, isActive } = req.body;

    const zone = await Zone.findById(id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found.' });
    }

    if (name) zone.name = name.trim();
    if (isActive !== undefined) zone.isActive = isActive;

    if (areasCovered !== undefined) {
      if (Array.isArray(areasCovered)) {
        zone.areasCovered = areasCovered.map((a) => String(a).trim()).filter(Boolean);
      } else if (typeof areasCovered === 'string') {
        zone.areasCovered = areasCovered.split(',').map((a) => a.trim()).filter(Boolean);
      }
    }

    await zone.save();

    return res.status(200).json({
      success: true,
      message: 'Zone updated successfully.',
      zone,
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update zone.' });
  }
};

/**
 * @desc    Delete a zone
 * @route   DELETE /api/admin/zones/:id
 * @access  Private (Admin)
 */
const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await Zone.findByIdAndDelete(id);

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Zone deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete zone.' });
  }
};

// ==========================================
// 2. Rate Card Management
// ==========================================

/**
 * @desc    Get all rate cards
 * @route   GET /api/admin/rate-cards
 * @access  Private (Admin)
 */
const getRateCards = async (req, res) => {
  try {
    const rateCards = await RateCard.find().sort({ orderType: 1, rateType: 1 });
    return res.status(200).json({
      success: true,
      count: rateCards.length,
      rateCards,
    });
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch rate cards.' });
  }
};

/**
 * @desc    Create or update rate card
 * @route   POST /api/admin/rate-cards
 * @access  Private (Admin)
 */
const createOrUpdateRateCard = async (req, res) => {
  try {
    const { orderType, rateType, ratePerKg, minCharge, codSurcharge, isActive } = req.body;

    if (!orderType || !rateType || ratePerKg === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Order type (B2B/B2C), rate type (intra-zone/inter-zone), and ratePerKg are required.',
      });
    }

    let rateCard = await RateCard.findOne({ orderType, rateType });

    if (rateCard) {
      rateCard.ratePerKg = Number(ratePerKg);
      if (minCharge !== undefined) rateCard.minCharge = Number(minCharge);
      if (codSurcharge !== undefined) rateCard.codSurcharge = Number(codSurcharge);
      if (isActive !== undefined) rateCard.isActive = isActive;
      await rateCard.save();
    } else {
      rateCard = await RateCard.create({
        orderType,
        rateType,
        ratePerKg: Number(ratePerKg),
        minCharge: Number(minCharge || 0),
        codSurcharge: Number(codSurcharge || 0),
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Rate card saved successfully.',
      rateCard,
    });
  } catch (error) {
    console.error('Error saving rate card:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to save rate card.' });
  }
};

/**
 * @desc    Update a specific rate card by ID
 * @route   PUT /api/admin/rate-cards/:id
 * @access  Private (Admin)
 */
const updateRateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { ratePerKg, minCharge, codSurcharge, isActive } = req.body;

    const rateCard = await RateCard.findById(id);
    if (!rateCard) {
      return res.status(404).json({ success: false, message: 'Rate card not found.' });
    }

    if (ratePerKg !== undefined) rateCard.ratePerKg = Number(ratePerKg);
    if (minCharge !== undefined) rateCard.minCharge = Number(minCharge);
    if (codSurcharge !== undefined) rateCard.codSurcharge = Number(codSurcharge);
    if (isActive !== undefined) rateCard.isActive = isActive;

    await rateCard.save();

    return res.status(200).json({
      success: true,
      message: 'Rate card updated successfully.',
      rateCard,
    });
  } catch (error) {
    console.error('Error updating rate card:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update rate card.' });
  }
};

// ==========================================
// 3. Agent Management
// ==========================================

/**
 * @desc    Get all agents with user info and profiles
 * @route   GET /api/admin/agents
 * @access  Private (Admin)
 */
const getAgents = async (req, res) => {
  try {
    const agents = await AgentProfile.find()
      .populate('user', 'name email phone role createdAt')
      .populate('assignedZones', 'name areasCovered isActive')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch agents.' });
  }
};

/**
 * @desc    Update agent profile (assigned zones, availability, location)
 * @route   PUT /api/admin/agents/:id
 * @access  Private (Admin)
 */
const updateAgentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedZones, availabilityStatus, currentLocation, name, phone } = req.body;

    const agentProfile = await AgentProfile.findById(id);
    if (!agentProfile) {
      return res.status(404).json({ success: false, message: 'Agent profile not found.' });
    }

    if (assignedZones !== undefined) {
      agentProfile.assignedZones = assignedZones;
    }

    if (availabilityStatus) {
      agentProfile.availabilityStatus = availabilityStatus;
    }

    if (currentLocation) {
      agentProfile.currentLocation = currentLocation;
    }

    await agentProfile.save();

    // Optionally update user name or phone
    if (name || phone) {
      await User.findByIdAndUpdate(agentProfile.user, {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
      });
    }

    const updatedProfile = await AgentProfile.findById(id)
      .populate('user', 'name email phone role')
      .populate('assignedZones', 'name areasCovered');

    return res.status(200).json({
      success: true,
      message: 'Agent profile updated successfully.',
      agent: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating agent profile:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update agent profile.' });
  }
};

// ==========================================
// 4. Admin Overview & Metrics
// ==========================================

/**
 * @desc    Get admin high-level metrics & stats
 * @route   GET /api/admin/overview
 * @access  Private (Admin)
 */
const getAdminOverview = async (req, res) => {
  try {
    const [
      totalOrders,
      activeZones,
      totalAgents,
      availableAgents,
      rateCardsCount,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Zone.countDocuments({ isActive: true }),
      AgentProfile.countDocuments(),
      AgentProfile.countDocuments({ availabilityStatus: 'available' }),
      RateCard.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: { $ne: 'failed' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalCharge' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      overview: {
        totalOrders,
        activeZones,
        totalAgents,
        availableAgents,
        rateCardsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch overview metrics.' });
  }
};

/**
 * @desc    Get all registered customers for admin order creation
 * @route   GET /api/admin/customers
 * @access  Private (Admin)
 */
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone createdAt')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
};

module.exports = {
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
};
