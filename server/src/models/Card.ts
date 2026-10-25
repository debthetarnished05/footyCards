import mongoose from 'mongoose';

export type PositionType = 'ST' | 'LW' | 'RW' | 'CM' | 'CDM' | 'CAM' | 'LM' | 'RM' | 'CB' | 'RB' | 'LB' | 'GK';

const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  club: { type: String, required: true },
  nationality: { type: String, required: true },
  position: { type: String, required: true },
  rating: { type: Number, required: true },
  
  // ---> Add these 3 new fields <---
  image: { type: String, required: true },
  clubLogo: { type: String, required: true },
  countryFlag: { type: String, required: true },

  // Outfield
  pace: { type: Number },
  shooting: { type: Number },
  passing: { type: Number },
  dribbling: { type: Number },
  defending: { type: Number },
  physical: { type: Number },
  
  // Goalkeeper
  diving: { type: Number },
  handling: { type: Number },
  kicking: { type: Number },
  reflexes: { type: Number },
  speed: { type: Number },
  positioning: { type: Number }
}, { 
  timestamps: true 
});

export const CardModel = mongoose.models.Card || mongoose.model('Card', cardSchema);