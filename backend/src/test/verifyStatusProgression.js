const { Order, TrackingHistory } = require('../models');
const { transitionOrderStatus } = require('../services/statusLifecycleService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testLifecycleProgression() {
  console.log('Testing Full Step-by-Step Delivery Progression...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery');

  let order = await Order.findOne({ status: 'assigned' });
  if (!order) {
    order = await Order.findOne();
    order.status = 'assigned';
    await order.save();
  }

  console.log(`Initial Status for Order #${order._id.toString().substring(order._id.toString().length - 6)}: ${order.status}`);

  // 1. Picked Up
  const step1 = await transitionOrderStatus({
    orderId: order._id,
    nextStatus: 'picked-up',
    actor: 'agent:demo_agent',
    notes: 'Package picked up from seller facility.',
  });
  console.log('✅ Step 1 (Picked Up): Order status is now:', step1.order.status);

  // 2. In Transit
  const step2 = await transitionOrderStatus({
    orderId: order._id,
    nextStatus: 'in-transit',
    actor: 'agent:demo_agent',
    notes: 'Package in transit across delivery corridor.',
  });
  console.log('✅ Step 2 (In Transit): Order status is now:', step2.order.status);

  // 3. Out for Delivery
  const step3 = await transitionOrderStatus({
    orderId: order._id,
    nextStatus: 'out-for-delivery',
    actor: 'agent:demo_agent',
    notes: 'Package is out for delivery with agent.',
  });
  console.log('✅ Step 3 (Out for Delivery): Order status is now:', step3.order.status);

  // 4. Delivered
  const step4 = await transitionOrderStatus({
    orderId: order._id,
    nextStatus: 'delivered',
    actor: 'agent:demo_agent',
    notes: 'Package delivered to recipient successfully.',
  });
  console.log('✅ Step 4 (Delivered): Order status is now:', step4.order.status);

  await mongoose.disconnect();
  console.log('🎉 Full delivery lifecycle progression verified successfully!');
}

testLifecycleProgression().catch((err) => {
  console.error('Lifecycle test failed:', err);
  process.exit(1);
});
