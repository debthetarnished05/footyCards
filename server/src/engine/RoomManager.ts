import { GameEngine } from './GameEngine.js';
import { CardModel } from '../models/Card.js';
import type { GameCard } from '../types/index.js';

export interface LobbyPlayer {
  id: string; // Socket ID
  name: string;
  isHost: boolean;
  isCpu: boolean;
}

export interface RoomInstance {
  id: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  engine: GameEngine | null;
  state: 'LOBBY' | 'PLAYING';
}

export class RoomManager {
  private rooms: Map<string, RoomInstance> = new Map();

  // Create a new room with the host as the first player
  public createRoom(roomId: string, hostSocketId: string, hostName: string, maxPlayers: number = 4): RoomInstance {
    const room: RoomInstance = {
      id: roomId,
      players: [
        { id: hostSocketId, name: hostName, isHost: true, isCpu: false },
      ],
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 10),
      engine: null,
      state: 'LOBBY',
    };
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): RoomInstance | undefined {
    return this.rooms.get(roomId);
  }

  // Add another human player to an existing room
  public joinRoom(roomId: string, socketId: string, playerName: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room does not exist' };
    if (room.state !== 'LOBBY') return { success: false, error: 'Game already in progress' };
    if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };

    room.players.push({ id: socketId, name: playerName, isHost: false, isCpu: false });
    return { success: true };
  }

  // Add a CPU player into the lobby
  public addCpu(roomId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.state !== 'LOBBY') return { success: false, error: 'Cannot add CPU while in game' };
    if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };

    const cpuIndex = room.players.filter((p) => p.isCpu).length + 1;
    room.players.push({
      id: `cpu_${Date.now()}_${cpuIndex}`,
      name: `CPU Bot ${cpuIndex}`,
      isHost: false,
      isCpu: true,
    });
    return { success: true };
  }

  // Fetch cards from MongoDB, format them into GameCard objects, and initialize GameEngine
  public async startGame(roomId: string, requestingSocketId: string): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find((p) => p.isHost);
    if (!host || host.id !== requestingSocketId) {
      return { success: false, error: 'Only the host can start the game' };
    }
    if (room.players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    const neededCards = room.players.length * 11;
    const dbCards = await CardModel.find({}).lean();

    if (dbCards.length === 0) {
      return { success: false, error: 'No cards found in database. Run seed script first.' };
    }

    // Expand card pool if needed so deck has at least neededCards
    let deckPool = [...dbCards];
    let multiplier = 2;
    while (deckPool.length < neededCards) {
      const cloned = dbCards.map((c) => ({
        ...c,
        cardId: `${c.cardId}_dup${multiplier}`,
        name: `${c.name} (${multiplier})`,
      }));
      deckPool = deckPool.concat(cloned);
      multiplier++;
    }

    // Convert raw MongoDB card docs to flat GameCard objects
    const formattedDeck: GameCard[] = deckPool.map((c: any) => {
      const stats: Record<string, number> = { rating: c.rating };

      if (c.position === 'GK') {
        stats.diving = c.diving ?? 0;
        stats.handling = c.handling ?? 0;
        stats.kicking = c.kicking ?? 0;
        stats.reflexes = c.reflexes ?? 0;
        stats.speed = c.speed ?? 0;
        stats.positioning = c.positioning ?? 0;
      } else {
        stats.pace = c.pace ?? 0;
        stats.shooting = c.shooting ?? 0;
        stats.passing = c.passing ?? 0;
        stats.dribbling = c.dribbling ?? 0;
        stats.defending = c.defending ?? 0;
        stats.physical = c.physical ?? 0;
      }

      return {
        cardId: c.cardId,
        name: c.name,
        club: c.club,
        nationality: c.nationality,
        position: c.position,
        stats,
      };
    });

    room.engine = new GameEngine(
      room.id,
      room.players.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost, isCpu: p.isCpu })),
      formattedDeck
    );
    room.state = 'PLAYING';

    return { success: true };
  }

  // Handle player departures/disconnects
  public removePlayer(socketId: string): { roomId?: string; roomEmpty?: boolean } {
    for (const [roomId, room] of this.rooms.entries()) {
      const idx = room.players.findIndex((p) => p.id === socketId);
      if (idx !== -1) {
        room.players.splice(idx, 1);

        // If no human players left, remove room completely
        const humanCount = room.players.filter((p) => !p.isCpu).length;
        if (humanCount === 0) {
          this.rooms.delete(roomId);
          return { roomId, roomEmpty: true };
        }

        // Reassign host if the host disconnected
        if (!room.players.some((p) => p.isHost)) {
          const nextHuman = room.players.find((p) => !p.isCpu);
          if (nextHuman) nextHuman.isHost = true;
        }

        return { roomId, roomEmpty: false };
      }
    }
    return {};
  }
}