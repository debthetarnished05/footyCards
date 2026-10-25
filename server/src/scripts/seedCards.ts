import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CardModel } from '../models/Card.js';
import { MASTER_DECK } from '../data/cards.js';

dotenv.config();

const seedCards = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found.');

    await mongoose.connect(mongoUri);
    console.log('Connected to DB for seeding...');

    // 1. Clear out existing collection
    await CardModel.deleteMany({});
    console.log('Cleared existing cards collection.');

    // 2. Insert master deck data
    await CardModel.insertMany(MASTER_DECK);
    console.log(`Successfully seeded ${MASTER_DECK.length} cards!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedCards();