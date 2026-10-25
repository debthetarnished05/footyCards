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
// Helper: Runs CPU turns with a 3-second delay, resolves showdowns, and manages transitions
const processTurnCycle = (roomId: string) => {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.engine) return;

  const engine = room.engine;

  // Check if any CPU bot needs to take an action (either calling or responding)
  const cpuNeedsMove = Object.values(engine.getState().players).some(
    (p) => p.isCpu && !p.hasSubmitted && (engine.getState().phase === 'OPPONENT_RESPONSES' || engine.getState().callerId === p.id)
  );

  if (cpuNeedsMove) {
    // Broadcast immediately so players see "WAITING" / card status during the 3-second think time
    broadcastRoomState(roomId);

    setTimeout(() => {
      // Re-verify room and engine still exist after delay
      const activeRoom = roomManager.getRoom(roomId);
      if (!activeRoom || !activeRoom.engine) return;

      activeRoom.engine.executeCpuTurns();
      broadcastRoomState(roomId);

      // Check if all players have submitted after CPU moved
      checkAndResolveShowdown(roomId);
    }, 3000);
  } else {
    // If no CPU move is pending, check directly
    checkAndResolveShowdown(roomId);
  }
};

// Extracted helper to resolve rounds once everyone submitted
const checkAndResolveShowdown = (roomId: string) => {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.engine) return;

  const engine = room.engine;

  if (engine.allPlayersSubmitted()) {
    const showdownResult = engine.resolveRound();
    io.to(roomId).emit('round:showdown', showdownResult);
    broadcastRoomState(roomId);

    // 4-second review window before the next round begins
    setTimeout(() => {
      const hasNextRound = engine.advanceToNextRound();

      if (hasNextRound) {
        broadcastRoomState(roomId);
        // Trigger next turn cycle (handles CPU caller if newly designated caller is a bot)
        processTurnCycle(roomId);
      } else {
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
// Inside server/src/handlers/gameHandlers.ts

  socket.on('round:caller_select', ({ roomId, cardId, category }: { roomId: string; cardId: string; category: OutfieldStat }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const caller = room.engine.getState().players[socket.id];
    const chosenCard = caller?.hand.find((c) => c && c.cardId === cardId);

    const success = room.engine.callerSelect(socket.id, cardId, category);
    if (!success) {
      socket.emit('game:error', { message: 'Invalid move: not your turn or card not in hand.' });
      return;
    }

    // Broadcast the selected category along with the played card object
    io.to(roomId).emit('round:category_chosen', {
      callerId: socket.id,
      callerName: caller?.name || 'Caller',
      card: chosenCard,
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