const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { User, AgentProfile, Zone, RateCard } = require('../models');

dotenv.config({ path: path.join(__dirname, '../../.env') });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/last_mile_delivery';
    console.log(`Connecting to MongoDB at ${mongoURI}...`);
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding.');

    // Clear existing collections
    await User.deleteMany({});
    await AgentProfile.deleteMany({});
    await Zone.deleteMany({});
    await RateCard.deleteMany({});

    console.log('Cleared existing User, AgentProfile, Zone, and RateCard records.');

    // 1. Seed Zones
    const zonesData = [
      {
        name: 'Zone A - Central Business District',
        areasCovered: ['110001', '110002', '110003', 'Connaught Place', 'Central', 'CBD', 'Downtown'],
        isActive: true,
      },
      {
        name: 'Zone B - North & Suburbs',
        areasCovered: ['110007', '110009', '110054', 'Civil Lines', 'Rohini', 'North Delhi', 'Suburbs'],
        isActive: true,
      },
      {
        name: 'Zone C - South & Tech Corridor',
        areasCovered: ['110016', '110017', '110020', 'Hauz Khas', 'Saket', 'Okhla', 'Cyber Hub', 'Tech Corridor'],
        isActive: true,
      },
    ];

    const createdZones = await Zone.insertMany(zonesData);
    console.log(`✅ Seeded ${createdZones.length} Zones`);

    // 2. Seed RateCards (B2B/B2C, intra/inter-zone)
    const rateCardsData = [
      {
        orderType: 'B2C',
        rateType: 'intra-zone',
        ratePerKg: 40,
        minCharge: 80,
        codSurcharge: 30,
        isActive: true,
      },
      {
        orderType: 'B2C',
        rateType: 'inter-zone',
        ratePerKg: 70,
        minCharge: 120,
        codSurcharge: 40,
        isActive: true,
      },
      {
        orderType: 'B2B',
        rateType: 'intra-zone',
        ratePerKg: 25,
        minCharge: 150,
        codSurcharge: 50,
        isActive: true,
      },
      {
        orderType: 'B2B',
        rateType: 'inter-zone',
        ratePerKg: 45,
        minCharge: 250,
        codSurcharge: 75,
        isActive: true,
      },
    ];

    const createdRateCards = await RateCard.insertMany(rateCardsData);
    console.log(`✅ Seeded ${createdRateCards.length} RateCards`);

    // 3. Seed Users
    // Admin
    const adminPasswordHash = await User.hashPassword('admin123');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@lastmile.com',
      phone: '+1 800-555-0100',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    // Agents
    const agentPasswordHash = await User.hashPassword('agent123');
    const agentUser1 = await User.create({
      name: 'Rahul Sharma',
      email: 'agent.rahul@lastmile.com',
      phone: '+1 800-555-0201',
      passwordHash: agentPasswordHash,
      role: 'agent',
    });

    const agentUser2 = await User.create({
      name: 'Priya Singh',
      email: 'agent.priya@lastmile.com',
      phone: '+1 800-555-0202',
      passwordHash: agentPasswordHash,
      role: 'agent',
    });

    // Create Agent Profiles
    await AgentProfile.create({
      user: agentUser1._id,
      assignedZones: [createdZones[0]._id, createdZones[1]._id],
      currentLocation: { lat: 28.6139, lng: 77.2090 }, // Delhi Central
      availabilityStatus: 'available',
    });

    await AgentProfile.create({
      user: agentUser2._id,
      assignedZones: [createdZones[1]._id, createdZones[2]._id],
      currentLocation: { lat: 28.5355, lng: 77.2182 }, // Delhi South
      availabilityStatus: 'available',
    });

    // Customers
    const customerPasswordHash = await User.hashPassword('customer123');
    await User.create({
      name: 'Acme Enterprises (B2B)',
      email: 'customer@acme.com',
      phone: '+1 800-555-0301',
      passwordHash: customerPasswordHash,
      role: 'customer',
    });

    await User.create({
      name: 'Sarah Connor (B2C)',
      email: 'customer.b2c@gmail.com',
      phone: '+1 800-555-0302',
      passwordHash: customerPasswordHash,
      role: 'customer',
    });

    console.log('✅ Seeded Users & Agent Profiles successfully.');
    console.log('----------------------------------------------------');
    console.log('Default Credentials:');
    console.log('Admin:    admin@lastmile.com / admin123');
    console.log('Agent 1:  agent.rahul@lastmile.com / agent123');
    console.log('Agent 2:  agent.priya@lastmile.com / agent123');
    console.log('Customer: customer@acme.com / customer123');
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
