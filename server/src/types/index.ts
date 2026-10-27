import type { PositionType } from '../models/Card.js';

export type OutfieldStat = 'rating' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
export type GkStat = 'rating' | 'diving' | 'handling' | 'kicking' | 'reflexes' | 'speed' | 'positioning';
export type AnyBattleStat = OutfieldStat | GkStat;

export interface GameCard {
  cardId: string;
  name: string;
  club: string;
  nationality: string;
  position: PositionType;
  image?: string;
  clubLogo?: string;
  countryFlag?: string;
  stats: Record<string, number>;
}

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  isCpu: boolean;
  score: number; // Allowed to go negative
  hand: GameCard[];
  hasSubmitted: boolean;
  connected: boolean;
}

export type MatchPhase = 
  | 'LOBBY'
  | 'CALLER_SELECTION'
  | 'OPPONENT_RESPONSES'
  | 'SHOWDOWN'
  | 'GAME_OVER';

export interface RoundSubmission {
  playerId: string;
  card: GameCard;
  statUsed: AnyBattleStat;
  effectiveValue: number;
}

export interface RoundShowdown {
  roundNumber: number;
  calledCategory: AnyBattleStat;
  callerId: string;
  submissions: RoundSubmission[];
  winnerIds: string[];
  winningValue: number;
  callerWon: boolean;
}

export interface GameRoomState {
  roomId: string;
  phase: MatchPhase;
  currentRound: number;
  maxPlayers: number;
  callerId: string;
  selectedCategory: AnyBattleStat | null;
  players: Record<string, PlayerState>;
  turnOrder: string[];
  submissions: Record<string, { card: GameCard; statUsed: AnyBattleStat; effectiveValue: number }>;
  history: RoundShowdown[];
}