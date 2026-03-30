require('dotenv').config();
const mongoose = require('mongoose');
const Envelope = require('./models/Envelope');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';

const envelopes = [
  { size: '4x9', materialType: 'Cloth', gsm: 100, price: 2.5, quantity: 0 },
  { size: '4x9', materialType: 'Maplitho', gsm: 80, price: 1.2, quantity: 0 },
  { size: '10x12', materialType: 'Buff', gsm: 120, price: 4.5, quantity: 0 },
  { size: '10x12', materialType: 'Kraft', gsm: 140, price: 5.0, quantity: 0 },
  { size: '12x15', materialType: 'Vibothi', gsm: 60, price: 0.8, quantity: 0 },
  { size: '5x11', materialType: 'Cloth', gsm: 100, price: 3.0, quantity: 0 },
  { size: '9x4', materialType: 'Maplitho', gsm: 70, price: 1.0, quantity: 0 },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB for seeding...');

    // Clear existing envelopes
    await Envelope.deleteMany({});
    console.log('Cleared existing envelopes');

    // Insert new envelopes
    const createdEnvelopes = await Envelope.insertMany(envelopes);
    console.log(`Seeded ${createdEnvelopes.length} envelopes`);

    mongoose.connection.close();
    console.log('Database seeded successfully and connection closed');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
