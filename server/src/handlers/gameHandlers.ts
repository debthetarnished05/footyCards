import { Server, Socket } from 'socket.io';
import { RoomManager } from '../engine/RoomManager.js';
import type { OutfieldStat, AnyBattleStat } from '../types/index.js';

export const registerGameHandlers = (io: Server, socket: Socket, roomManager: RoomManager) => {

  // Helper: Sends sanitized private hand & public state to each human player
  const broadcastRoomState = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    for (const player of room.players) {
      if (!player.isCpu) {
        io.to(player.id).emit('game:state_sync', room.engine.getClientView(player.id));
      }
    }
  };

  // Helper: Runs CPU turns, checks for round resolution, and handles post-round delay
  const processTurnCycle = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const engine = room.engine;

    // Trigger CPU moves if applicable
    engine.executeCpuTurns();
    broadcastRoomState(roomId);

    // If everyone submitted, reveal cards and resolve points
    if (engine.allPlayersSubmitted()) {
      const showdownResult = engine.resolveRound();
      io.to(roomId).emit('round:showdown', showdownResult);
      broadcastRoomState(roomId);

      // 4-second delay so players can see the revealed cards before the next round begins
      setTimeout(() => {
        const hasNextRound = engine.advanceToNextRound();

        if (hasNextRound) {
          // If the newly designated caller is a CPU, trigger its call
          engine.executeCpuTurns();
          broadcastRoomState(roomId);
        } else {
          // Match finished (11 rounds complete)
          const finalWinners = engine.getGameWinners();
          io.to(roomId).emit('game:over', {
            finalState: engine.getState(),
            winners: finalWinners.winners,
            highestScore: finalWinners.highestScore,
          });
        }
      }, 4000);
    }
  };

  // --- LOBBY EVENTS ---

  // 1. Create a Room
  socket.on('lobby:create', ({ roomId, playerName, maxPlayers }) => {
    const room = roomManager.createRoom(roomId, socket.id, playerName, maxPlayers);
    socket.join(roomId);
    socket.emit('lobby:joined', { roomId, players: room.players, isHost: true });
  });

  // 2. Join an Existing Room
  socket.on('lobby:join', ({ roomId, playerName }) => {
    const result = roomManager.joinRoom(roomId, socket.id, playerName);
    if (!result.success) {
      socket.emit('lobby:error', { message: result.error });
      return;
    }
    socket.join(roomId);
    const room = roomManager.getRoom(roomId)!;
    io.to(roomId).emit('lobby:updated', { players: room.players });
    socket.emit('lobby:joined', { roomId, players: room.players, isHost: false });
  });

  // 3. Add a CPU Player to Lobby
  socket.on('lobby:add_cpu', ({ roomId }) => {
    const result = roomManager.addCpu(roomId);
    if (result.success) {
      const room = roomManager.getRoom(roomId)!;
      io.to(roomId).emit('lobby:updated', { players: room.players });
    } else {
      socket.emit('lobby:error', { message: result.error });
    }
  });

  // 4. Start Match
  socket.on('lobby:start', async ({ roomId }) => {
    const result = await roomManager.startGame(roomId, socket.id);
    if (!result.success) {
      socket.emit('lobby:error', { message: result.error });
      return;
    }

    io.to(roomId).emit('game:started');
    broadcastRoomState(roomId);

    // Check if initial caller is CPU
    processTurnCycle(roomId);
  });

  // --- GAMEPLAY EVENTS ---

  // 5. Caller selects their card and calls the stat
  socket.on('round:caller_select', ({ roomId, cardId, category }: { roomId: string; cardId: string; category: OutfieldStat }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const success = room.engine.callerSelect(socket.id, cardId, category);
    if (!success) {
      socket.emit('game:error', { message: 'Invalid move: not your turn or card not in hand.' });
      return;
    }

    io.to(roomId).emit('round:category_chosen', {
      callerId: socket.id,
      selectedCategory: category,
    });

    processTurnCycle(roomId);
  });

  // 6. Non-caller submits their response card (with optional chosen GK stat for trumps)
  socket.on('round:submit_card', ({ roomId, cardId, chosenGkStat }: { roomId: string; cardId: string; chosenGkStat?: AnyBattleStat }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const success = room.engine.playerSubmit(socket.id, cardId, chosenGkStat);
    if (!success) {
      socket.emit('game:error', { message: 'Could not submit this card.' });
      return;
    }

    processTurnCycle(roomId);
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    const { roomId, roomEmpty } = roomManager.removePlayer(socket.id);
    if (roomId && !roomEmpty) {
      const room = roomManager.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('lobby:updated', { players: room.players });
      }
    }
  });
};