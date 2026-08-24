const { Order } = require('../models');
const mongoose = require('mongoose');
require('dotenv').config();

async function testTrackOrder() {
  console.log('Testing Order Tracking Lookup with Short IDs and # Prefix...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery');

  // Find any existing order or create a test order
  let order = await Order.findOne();
  if (!order) {
    const user = await mongoose.model('User').findOne();
    const zone = await mongoose.model('Zone').findOne();
    order = await Order.create({
      customer: user._id,
      pickupAddress: 'Test Pickup Address',
      pickupZone: zone._id,
      dropAddress: 'Test Drop Address',
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

  const fullId = order._id.toString();
  const shortId = fullId.substring(fullId.length - 6);
  const hashShortId = `#${shortId}`;

  console.log('Full Order ID:', fullId);
  console.log('Short Order ID:', shortId);
  console.log('Hash Order ID:', hashShortId);

  // Test 1: Full ID query
  const test1 = await Order.findById(fullId);
  if (!test1) throw new Error('Failed test 1: Full ID');
  console.log('✅ Test 1 Passed: Full 24-char ObjectId found.');

  // Test 2: Suffix query
  const cleanShort = hashShortId.replace(/^#/, '');
  const test2 = await Order.findOne({
    $expr: {
      $regexMatch: {
        input: { $toString: '$_id' },
        regex: `${cleanShort}$`,
        options: 'i',
      },
    },
  });
  if (!test2) throw new Error('Failed test 2: Short Suffix query');
  console.log('✅ Test 2 Passed: Short 6-char ID suffix (#c97810 format) matched order:', test2._id.toString());

  await mongoose.disconnect();
  console.log('🎉 All Tracking Lookup tests passed cleanly!');
}

testTrackOrder().catch((err) => {
  console.error('Track order test failed:', err);
  process.exit(1);
});
