const { Order, AgentProfile, User, Zone } = require('../models');
const { autoAssignOrder } = require('../services/assignmentEngine');
const mongoose = require('mongoose');
require('dotenv').config();

async function testAutoAssignment() {
  console.log('Testing Admin-Triggered Auto-Assignment Engine...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery');

  // Find or create an unassigned order
  let order = await Order.findOne({ status: 'pending' }).populate('pickupZone');
  if (!order) {
    const customer = await User.findOne({ role: 'customer' });
    const zone = await Zone.findOne();
    order = await Order.create({
      customer: customer._id,
      pickupAddress: 'Test Warehouse, Zone A',
      pickupZone: zone._id,
      dropAddress: 'Test Destination, Zone B',
      dropZone: zone._id,
      dimensions: { length: 20, breadth: 15, height: 10 },
      actualWeight: 2,
      volumetricWeight: 0.6,
      billableWeight: 2,
      orderType: 'B2C',
      paymentType: 'Prepaid',
      rateApplied: 50,
      codSurchargeApplied: 0,
      totalCharge: 100,
      status: 'pending',
    });
  }

  // Ensure at least one agent is 'available'
  const agentProfile = await AgentProfile.findOne();
  if (agentProfile) {
    agentProfile.availabilityStatus = 'available';
    await agentProfile.save();
  }

  console.log(`Triggering auto-assignment for order #${order._id.toString().substring(order._id.toString().length - 6)} (Pickup Zone: ${order.pickupZone?.name || 'Default'})...`);

  const adminUser = await User.findOne({ role: 'admin' });
  const actor = `admin:${adminUser ? adminUser._id : 'manual'}`;

  const result = await autoAssignOrder(order._id, actor);

  console.log('Result Success:', result.success);
  console.log('Message:', result.message);
  if (result.order?.assignedAgent) {
    console.log('✅ Order Assigned To Agent:', result.order.assignedAgent.user?.name || result.order.assignedAgent._id);
    console.log('✅ Order Assignment Type:', result.order.assignmentType);
    console.log('✅ Order Status Advanced To:', result.order.status);
  }

  await mongoose.disconnect();
  console.log('🎉 Auto-assignment test finished successfully!');
}

testAutoAssignment().catch((err) => {
  console.error('Auto-assignment test failed:', err);
  process.exit(1);
});
