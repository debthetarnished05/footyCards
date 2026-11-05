import { GameEngine } from './GameEngine.js';
import { CardModel } from '../models/Card.js';
import { MASTER_DECK } from '../data/cards.js';
import type { GameCard } from '../types/index.js';

export interface LobbyPlayer {
  id: string; // Persistent user ID
  socketId: string; // Current transient socket ID
  name: string;
  isHost: boolean;
  isCpu: boolean;
  connected?: boolean;
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
  public createRoom(
    roomId: string,
    hostUserId: string,
    hostSocketId: string,
    hostName: string,
    maxPlayers: number = 4
  ): RoomInstance {
    const room: RoomInstance = {
      id: roomId,
      players: [
        {
          id: hostUserId,
          socketId: hostSocketId,
          name: hostName,
          isHost: true,
          isCpu: false,
          connected: true,
        },
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

  // Find a room where the user is an active participant
  public findRoomByUserId(userId: string): { room: RoomInstance; player: LobbyPlayer } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.id === userId || p.socketId === userId);
      if (player) {
        return { room, player };
      }
    }
    return null;
  }

  // Add another human player to an existing room
  public joinRoom(
    roomId: string,
    userId: string,
    socketId: string,
    playerName: string
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room does not exist' };

    const existingPlayer = room.players.find((p) => p.id === userId);
    if (existingPlayer) {
      // Re-attaching to lobby
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      return { success: true };
    }

    if (room.state !== 'LOBBY') return { success: false, error: 'Game already in progress' };
    if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };

    room.players.push({
      id: userId,
      socketId,
      name: playerName,
      isHost: false,
      isCpu: false,
      connected: true,
    });
    return { success: true };
  }

  // Add a CPU player into the lobby
  public addCpu(roomId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.state !== 'LOBBY') return { success: false, error: 'Cannot add CPU while in game' };
    if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };

    const cpuIndex = room.players.filter((p) => p.isCpu).length + 1;
    const cpuId = `cpu_${Date.now()}_${cpuIndex}`;
    room.players.push({
      id: cpuId,
      socketId: cpuId,
      name: `CPU Bot ${cpuIndex}`,
      isHost: false,
      isCpu: true,
      connected: true,
    });
    return { success: true };
  }

  // Fetch cards and initialize GameEngine
  public async startGame(roomId: string, requestingUserId: string): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find((p) => p.isHost);
    if (!host || (host.id !== requestingUserId && host.socketId !== requestingUserId)) {
      return { success: false, error: 'Only the host can start the game' };
    }
    if (room.players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    const neededCards = room.players.length * 11;
    let dbCards: any[] = [];
    try {
      dbCards = await (CardModel as any).find({}).lean();
    } catch {
      // Database unavailable, fallback below
    }

    if (!dbCards || dbCards.length === 0) {
      const allMasterCards: any[] = [];
      for (const cardList of Object.values(MASTER_DECK)) {
        allMasterCards.push(...cardList);
      }
      dbCards = allMasterCards;
    }

    if (dbCards.length < neededCards) {
      const multiplied: any[] = [];
      while (multiplied.length < neededCards) {
        multiplied.push(...dbCards);
      }
      dbCards = multiplied;
    }

    const formattedDeck: GameCard[] = dbCards.map((c: any) => ({
      cardId: c.cardId || String(c._id),
      name: c.name,
      club: c.club,
      nationality: c.nationality,
      position: c.position,
      rating: c.rating,
      image: c.image,
      clubLogo: c.clubLogo,
      countryFlag: c.countryFlag,
      stats: {
        rating: c.rating,
        pace: c.pace,
        shooting: c.shooting,
        passing: c.passing,
        dribbling: c.dribbling,
        defending: c.defending,
        physical: c.physical,
        diving: c.diving,
        handling: c.handling,
        kicking: c.kicking,
        reflexes: c.reflexes,
        speed: c.speed,
        positioning: c.positioning,
      },
    }));

    room.engine = new GameEngine(
      roomId,
      room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isCpu: p.isCpu,
      })),
      formattedDeck
    );
    room.state = 'PLAYING';

    return { success: true };
  }

  // Reconnect a player whose socket connection dropped and reconnected with a new socket.id
  public reconnectPlayer(roomId: string, userId: string, newSocketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find((p) => p.id === userId || p.socketId === userId);
    if (!player) return false;

    player.socketId = newSocketId;
    player.connected = true;
    player.isCpu = false;
    if (player.name.includes('(BOT)')) {
      player.name = player.name.replace(' (BOT)', '').replace('(BOT)', '').trim();
    }

    if (room.engine) {
      room.engine.reconnectPlayer(player.id, player.id);
    }

    return true;
  }

  // Handle player departures/disconnects. In active games, keeps room alive to allow transient reconnects.
  public handlePlayerDisconnect(socketId: string): { roomId?: string; roomEmpty?: boolean } {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;

        if (room.state === 'PLAYING' && room.engine) {
          // Delay bot takeover / room cleanup by 60 seconds to allow cloud reconnects
          setTimeout(() => {
            const currentRoom = this.rooms.get(roomId);
            if (!currentRoom || !currentRoom.engine) return;
            const p = currentRoom.players.find((pl) => pl.id === player.id);
            if (p && !p.connected) {
              p.isCpu = true;
              if (!p.name.includes('(BOT)')) p.name += ' (BOT)';
              currentRoom.engine.handlePlayerDisconnect(p.id);

              const anyHumans = currentRoom.players.some((pl) => !pl.isCpu);
              if (!anyHumans) {
                this.rooms.delete(roomId);
              }
            }
          }, 60000);

          return { roomId, roomEmpty: false };
        } else {
          // In lobby, clean up if not reconnected in 15s
          setTimeout(() => {
            const currentRoom = this.rooms.get(roomId);
            if (!currentRoom || currentRoom.state !== 'LOBBY') return;
            const p = currentRoom.players.find((pl) => pl.id === player.id);
            if (p && !p.connected) {
              const pIdx = currentRoom.players.findIndex((pl) => pl.id === player.id);
              if (pIdx !== -1) currentRoom.players.splice(pIdx, 1);
              if (currentRoom.players.filter((pl) => !pl.isCpu).length === 0) {
                this.rooms.delete(roomId);
              }
            }
          }, 15000);

          return { roomId, roomEmpty: false };
        }
      }
    }
    return {};
  }

  public removePlayer(socketId: string): { roomId?: string; roomEmpty?: boolean } {
    return this.handlePlayerDisconnect(socketId);
  }
}
