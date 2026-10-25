import mongoose, { Schema, Document } from 'mongoose';

export type PositionType = 
  | 'ST' | 'LW' | 'RW'
  | 'CM' | 'CDM' | 'CAM' | 'LM' | 'RM'
  | 'CB' | 'RB' | 'LB'
  | 'GK';

export interface ICard extends Document {
  cardId: string;
  name: string;
  club: string;
  nationality: string;
  position: PositionType;
  rating: number;
  // Outfield stats (optional for pure GKs)
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  // Goalkeeper stats (optional for outfield players)
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  speed?: number;
  positioning?: number;
}

const CardSchema: Schema = new Schema(
  {
    cardId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    club: { type: String, required: true },
    nationality: { type: String, required: true },
    position: {
      type: String,
      required: true,
      enum: [
        'ST', 'LW', 'RW',
        'CM', 'CDM', 'CAM', 'LM', 'RM',
        'CB', 'RB', 'LB',
        'GK'
      ],
    },
    rating: { type: Number, required: true, min: 1, max: 99 },
    // Outfield
    pace: { type: Number, min: 1, max: 99 },
    shooting: { type: Number, min: 1, max: 99 },
    passing: { type: Number, min: 1, max: 99 },
    dribbling: { type: Number, min: 1, max: 99 },
    defending: { type: Number, min: 1, max: 99 },
    physical: { type: Number, min: 1, max: 99 },
    // Goalkeeper
    diving: { type: Number, min: 1, max: 99 },
    handling: { type: Number, min: 1, max: 99 },
    kicking: { type: Number, min: 1, max: 99 },
    reflexes: { type: Number, min: 1, max: 99 },
    speed: { type: Number, min: 1, max: 99 },
    positioning: { type: Number, min: 1, max: 99 },
  },
  { timestamps: true }
);

export const CardModel = mongoose.model<ICard>('Card', CardSchema);