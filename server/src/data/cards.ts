import type { PositionType } from '../models/Card.js';

export interface CardData {
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

export const MASTER_DECK: CardData[] = [
  // --- Forwards (ST, LW, RW) ---
  { cardId: 'c1', name: 'Erling Haaland', club: 'Manchester City', nationality: 'Norway', position: 'ST', rating: 91, pace: 89, shooting: 93, passing: 66, dribbling: 80, defending: 45, physical: 88 },
  { cardId: 'c2', name: 'Kylian Mbappé', club: 'Real Madrid', nationality: 'France', position: 'ST', rating: 91, pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 36, physical: 78 },
  { cardId: 'c3', name: 'Harry Kane', club: 'Bayern Munich', nationality: 'England', position: 'ST', rating: 90, pace: 69, shooting: 93, passing: 84, dribbling: 83, defending: 49, physical: 83 },
  { cardId: 'c4', name: 'Vinícius Jr.', club: 'Real Madrid', nationality: 'Brazil', position: 'LW', rating: 90, pace: 95, shooting: 84, passing: 81, dribbling: 91, defending: 29, physical: 69 },
  { cardId: 'c5', name: 'Mohamed Salah', club: 'Liverpool', nationality: 'Egypt', position: 'RW', rating: 89, pace: 89, shooting: 87, passing: 82, dribbling: 88, defending: 45, physical: 76 },
  { cardId: 'c6', name: 'Robert Lewandowski', club: 'Barcelona', nationality: 'Poland', position: 'ST', rating: 88, pace: 75, shooting: 88, passing: 80, dribbling: 85, defending: 44, physical: 82 },
  { cardId: 'c7', name: 'Bukayo Saka', club: 'Arsenal', nationality: 'England', position: 'RW', rating: 87, pace: 86, shooting: 83, passing: 83, dribbling: 87, defending: 65, physical: 76 },
  { cardId: 'c8', name: 'Son Heung-min', club: 'Tottenham', nationality: 'South Korea', position: 'LW', rating: 87, pace: 87, shooting: 89, passing: 84, dribbling: 84, defending: 42, physical: 70 },
  { cardId: 'c9', name: 'Lautaro Martínez', club: 'Inter Milan', nationality: 'Argentina', position: 'ST', rating: 89, pace: 82, shooting: 88, passing: 75, dribbling: 86, defending: 48, physical: 85 },
  { cardId: 'c10', name: 'Victor Osimhen', club: 'Galatasaray', nationality: 'Nigeria', position: 'ST', rating: 87, pace: 89, shooting: 85, passing: 66, dribbling: 81, defending: 42, physical: 82 },

  // --- Midfielders (CM, CDM, CAM, LM, RM) ---
  { cardId: 'c11', name: 'Kevin De Bruyne', club: 'Manchester City', nationality: 'Belgium', position: 'CM', rating: 90, pace: 72, shooting: 87, passing: 94, dribbling: 87, defending: 65, physical: 78 },
  { cardId: 'c12', name: 'Rodri', club: 'Manchester City', nationality: 'Spain', position: 'CDM', rating: 91, pace: 66, shooting: 80, passing: 86, dribbling: 84, defending: 87, physical: 85 },
  { cardId: 'c13', name: 'Jude Bellingham', club: 'Real Madrid', nationality: 'England', position: 'CAM', rating: 90, pace: 80, shooting: 87, passing: 83, dribbling: 88, defending: 78, physical: 83 },
  { cardId: 'c14', name: 'Martin Ødegaard', club: 'Arsenal', nationality: 'Norway', position: 'CAM', rating: 89, pace: 74, shooting: 82, passing: 89, dribbling: 88, defending: 64, physical: 67 },
  { cardId: 'c15', name: 'Federico Valverde', club: 'Real Madrid', nationality: 'Uruguay', position: 'CM', rating: 88, pace: 88, shooting: 82, passing: 84, dribbling: 84, defending: 80, physical: 84 },
  { cardId: 'c16', name: 'Florian Wirtz', club: 'Bayer Leverkusen', nationality: 'Germany', position: 'CAM', rating: 88, pace: 81, shooting: 81, passing: 87, dribbling: 89, defending: 53, physical: 68 },
  { cardId: 'c17', name: 'Declan Rice', club: 'Arsenal', nationality: 'England', position: 'CDM', rating: 87, pace: 76, shooting: 68, passing: 82, dribbling: 79, defending: 86, physical: 86 },
  { cardId: 'c18', name: 'Bernardo Silva', club: 'Manchester City', nationality: 'Portugal', position: 'CM', rating: 88, pace: 69, shooting: 78, passing: 86, dribbling: 92, defending: 69, physical: 74 },
  { cardId: 'c19', name: 'Nicolò Barella', club: 'Inter Milan', nationality: 'Italy', position: 'CM', rating: 87, pace: 79, shooting: 76, passing: 83, dribbling: 86, defending: 77, physical: 82 },
  { cardId: 'c20', name: 'Bruno Fernandes', club: 'Manchester United', nationality: 'Portugal', position: 'CAM', rating: 87, pace: 71, shooting: 85, passing: 90, dribbling: 83, defending: 69, physical: 77 },

  // --- Defenders (CB, RB, LB) ---
  { cardId: 'c21', name: 'Virgil van Dijk', club: 'Liverpool', nationality: 'Netherlands', position: 'CB', rating: 89, pace: 78, shooting: 60, passing: 72, dribbling: 72, defending: 89, physical: 86 },
  { cardId: 'c22', name: 'Rúben Dias', club: 'Manchester City', nationality: 'Portugal', position: 'CB', rating: 88, pace: 62, shooting: 39, passing: 70, dribbling: 68, defending: 89, physical: 87 },
  { cardId: 'c23', name: 'William Saliba', club: 'Arsenal', nationality: 'France', position: 'CB', rating: 87, pace: 82, shooting: 30, passing: 71, dribbling: 73, defending: 87, physical: 83 },
  { cardId: 'c24', name: 'Theo Hernández', club: 'AC Milan', nationality: 'France', position: 'LB', rating: 87, pace: 95, shooting: 72, passing: 76, dribbling: 84, defending: 79, physical: 88 },
  { cardId: 'c25', name: 'Antonio Rüdiger', club: 'Real Madrid', nationality: 'Germany', position: 'CB', rating: 88, pace: 82, shooting: 55, passing: 71, dribbling: 66, defending: 86, physical: 86 },
  { cardId: 'c26', name: 'Trent Alexander-Arnold', club: 'Liverpool', nationality: 'England', position: 'RB', rating: 86, pace: 76, shooting: 74, passing: 90, dribbling: 80, defending: 80, physical: 74 },
  { cardId: 'c27', name: 'Alessandro Bastoni', club: 'Inter Milan', nationality: 'Italy', position: 'CB', rating: 87, pace: 75, shooting: 40, passing: 76, dribbling: 75, defending: 87, physical: 82 },
  { cardId: 'c28', name: 'Gabriel Magalhães', club: 'Arsenal', nationality: 'Brazil', position: 'CB', rating: 86, pace: 68, shooting: 42, passing: 65, dribbling: 65, defending: 86, physical: 84 },
  { cardId: 'c29', name: 'Alphonso Davies', club: 'Bayern Munich', nationality: 'Canada', position: 'LB', rating: 84, pace: 95, shooting: 68, passing: 77, dribbling: 84, defending: 76, physical: 77 },
  { cardId: 'c30', name: 'Achraf Hakimi', club: 'Paris Saint-Germain', nationality: 'Morocco', position: 'RB', rating: 84, pace: 92, shooting: 75, passing: 79, dribbling: 80, defending: 75, physical: 78 },

  // --- Goalkeepers (GK) ---
  { cardId: 'c31', name: 'Thibaut Courtois', club: 'Real Madrid', nationality: 'Belgium', position: 'GK', rating: 89, pace: 46, shooting: 20, passing: 68, dribbling: 50, defending: 90, physical: 84 },
  { cardId: 'c32', name: 'Alisson Becker', club: 'Liverpool', nationality: 'Brazil', position: 'GK', rating: 89, pace: 50, shooting: 25, passing: 85, dribbling: 55, defending: 90, physical: 80 },
  { cardId: 'c33', name: 'Ederson', club: 'Manchester City', nationality: 'Brazil', position: 'GK', rating: 88, pace: 64, shooting: 22, passing: 93, dribbling: 60, defending: 86, physical: 78 },
];