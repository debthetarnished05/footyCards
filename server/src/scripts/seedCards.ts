import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { CardModel } from '../models/Card.js';
// Import the newly created MASTER_DECK from your cards.ts file
import { MASTER_DECK } from '../data/./cards.js'; 

dotenv.config();

async function seedDatabase() {
  try {
    await connectDB();

    console.log('Clearing old card collection...');
    await CardModel.deleteMany({});

    const allCardsToInsert: any[] = [];

    // Iterate through the exact data we mapped in MASTER_DECK
    for (const [position, players] of Object.entries(MASTER_DECK)) {
      console.log(`Queueing ${players.length} authentic cards for [${position}]...`);
      
      // Because the MASTER_DECK already matches the exact schema structure,
      // we can push them directly into our insert array without mapping.
      allCardsToInsert.push(...players);
    }

    console.log(`\nPersisting ${allCardsToInsert.length} real FC cards to MongoDB...`);
    
    // Insert all authentic cards in one bulk operation
    await CardModel.insertMany(allCardsToInsert);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal seed error:', err);
    process.exit(1);
  }
}

seedDatabase();