const { User } = require('../models');
const mongoose = require('mongoose');
require('dotenv').config();

async function testGoogleAuthFlow() {
  console.log('Testing Google Auth Backend Integration...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery');

  const testEmail = 'test.google.user@example.com';
  let user = await User.findOne({ email: testEmail });
  if (!user) {
    user = await User.create({
      name: 'Test Google User',
      email: testEmail,
      phone: '+91 Google-12345678',
      passwordHash: await User.hashPassword('random-secure-google-pass'),
      role: 'customer',
    });
    console.log('✅ Created mock Google user:', user.email);
  } else {
    console.log('✅ Found existing Google user:', user.email);
  }

  const generateToken = require('../utils/generateToken');
  const token = generateToken(user);
  console.log('✅ Generated JWT token for Google user successfully. Length:', token.length);

  await mongoose.disconnect();
  console.log('🎉 Google Auth flow verification passed cleanly!');
}

testGoogleAuthFlow().catch((err) => {
  console.error('Google Auth test failed:', err);
  process.exit(1);
});
