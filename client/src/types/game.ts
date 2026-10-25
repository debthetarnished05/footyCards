export type PositionType =
  | 'ST' | 'LW' | 'RW'
  | 'CM' | 'CDM' | 'CAM' | 'LM' | 'RM'
  | 'CB' | 'RB' | 'LB'
  | 'GK';

export type OutfieldStat = 'rating' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
export type GkStat = 'rating' | 'diving' | 'handling' | 'kicking' | 'reflexes' | 'speed' | 'positioning';
export type AnyBattleStat = OutfieldStat | GkStat;

export interface GameCard {
  cardId: string;
  name: string;
  club: string;
  nationality: string;
  position: PositionType;
  stats: Record<string, number>;
}

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  isCpu: boolean;
  score: number;
  hand: (GameCard | null)[];
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
  calledCategory: OutfieldStat;
  callerId: string;
  submissions: RoundSubmission[];
  winnerIds: string[];
  winningValue: number;
  callerWon: boolean;
}

export interface ClientGameState {
  roomId: string;
  phase: MatchPhase;
  currentRound: number;
  maxPlayers: number;
  callerId: string;
  selectedCategory: OutfieldStat | null;
  players: Record<string, PlayerState>;
  turnOrder: string[];
  submissions: Record<string, any>;
  history: RoundShowdown[];
}