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
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
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
    pace: { type: Number, required: true, min: 1, max: 99 },
    shooting: { type: Number, required: true, min: 1, max: 99 },
    passing: { type: Number, required: true, min: 1, max: 99 },
    dribbling: { type: Number, required: true, min: 1, max: 99 },
    defending: { type: Number, required: true, min: 1, max: 99 },
    physical: { type: Number, required: true, min: 1, max: 99 },
  },
  { timestamps: true }
);

export const CardModel = mongoose.model<ICard>('Card', CardSchema);