const { Order, AgentProfile, User, Zone } = require('../models');
const mongoose = require('mongoose');
require('dotenv').config();

async function resetOrdersForLiveTesting() {
  console.log('Resetting Orders to Initial States for User Live Testing...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery');

  // Direct native collection reset
  await mongoose.connection.collection('trackinghistories').deleteMany({});
  await mongoose.connection.collection('orders').deleteMany({});

  const customer = await User.findOne({ role: 'customer' });
  const admin = await User.findOne({ role: 'admin' });
  const zones = await Zone.find();
  const agentProfile = await AgentProfile.findOne().populate('user');

  if (agentProfile) {
    agentProfile.availabilityStatus = 'available';
    await agentProfile.save();
  }

  // 1. Order in 'pending' state (Ready for Admin Auto-Assignment)
  const pendingOrder = await Order.create({
    customer: customer._id,
    pickupAddress: 'Block 4, Connaught Place, Central Delhi',
    pickupZone: zones[0]._id,
    dropAddress: 'Hauz Khas Market, South Delhi',
    dropZone: zones[1] ? zones[1]._id : zones[0]._id,
    dimensions: { length: 25, breadth: 20, height: 15 },
    actualWeight: 3.5,
    volumetricWeight: 1.5,
    billableWeight: 3.5,
    orderType: 'B2C',
    paymentType: 'Prepaid',
    rateApplied: 50,
    codSurchargeApplied: 0,
    totalCharge: 175,
    status: 'pending',
  });

  const { TrackingHistory } = require('../models');

  await TrackingHistory.create({
    order: pendingOrder._id,
    status: 'pending',
    actor: `customer:${customer._id}`,
    notes: 'Order placed by customer. Awaiting agent assignment.',
    timestamp: new Date(),
  });

  // 2. Order in 'assigned' state (Ready for Agent to click "Confirm Picked Up")
  const assignedOrder = await Order.create({
    customer: customer._id,
    pickupAddress: 'Shop 12, Janpath, Central Delhi',
    pickupZone: zones[0]._id,
    dropAddress: 'Saket City Mall, South Delhi',
    dropZone: zones[1] ? zones[1]._id : zones[0]._id,
    dimensions: { length: 30, breadth: 25, height: 20 },
    actualWeight: 5.0,
    volumetricWeight: 3.0,
    billableWeight: 5.0,
    orderType: 'B2C',
    paymentType: 'COD',
    rateApplied: 50,
    codSurchargeApplied: 50,
    totalCharge: 300,
    assignedAgent: agentProfile ? agentProfile._id : null,
    assignmentType: 'auto',
    status: 'assigned',
  });

  await TrackingHistory.create({
    order: assignedOrder._id,
    status: 'pending',
    actor: `customer:${customer._id}`,
    notes: 'Order placed by customer.',
    timestamp: new Date(Date.now() - 3600000),
  });

  await TrackingHistory.create({
    order: assignedOrder._id,
    status: 'assigned',
    actor: `admin:${admin ? admin._id : 'system'}`,
    notes: `Agent ${agentProfile ? agentProfile.user?.name : 'Rahul Sharma'} assigned via automated dispatch.`,
    timestamp: new Date(),
  });

  console.log('✅ Created Fresh Pending Order ID:', pendingOrder._id.toString(), `(#${pendingOrder._id.toString().slice(-6)})`);
  console.log('✅ Created Fresh Assigned Order ID:', assignedOrder._id.toString(), `(#${assignedOrder._id.toString().slice(-6)})`);

  await mongoose.disconnect();
  console.log('🎉 Database reset cleanly. Orders are now ready for manual button clicks!');
}

resetOrdersForLiveTesting().catch((err) => {
  console.error('Reset error:', err);
  process.exit(1);
});
