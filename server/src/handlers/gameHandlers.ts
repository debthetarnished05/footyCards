import { Server, Socket } from 'socket.io';
import { RoomManager } from '../engine/RoomManager.js';
import type { AnyBattleStat } from '../types/index.js';

export const registerGameHandlers = (io: Server, socket: Socket, roomManager: RoomManager) => {
  const currentUserId = (socket.data.userId || socket.id) as string;

  // Helper: Sends sanitized private hand & public state to each human player via their current socketId
  const broadcastRoomState = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    for (const player of room.players) {
      if (!player.isCpu && player.socketId) {
        io.to(player.socketId).emit('game:state_sync', room.engine.getClientView(player.id));
      }
    }
  };

  // Helper: Runs CPU turns with a delay, resolves showdowns, and manages transitions
  const processTurnCycle = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const engine = room.engine;

    // Check if any CPU bot needs to take an action (calling or responding)
    const cpuNeedsMove = Object.values(engine.getState().players).some(
      (p) =>
        p.isCpu &&
        !p.hasSubmitted &&
        (engine.getState().phase === 'OPPONENT_RESPONSES' || engine.getState().callerId === p.id)
    );

    if (cpuNeedsMove) {
      broadcastRoomState(roomId);

      setTimeout(() => {
        const activeRoom = roomManager.getRoom(roomId);
        if (!activeRoom || !activeRoom.engine) return;

        activeRoom.engine.executeCpuTurns();
        broadcastRoomState(roomId);

        checkAndResolveShowdown(roomId);
      }, 1500);
    } else {
      checkAndResolveShowdown(roomId);
    }
  };

  // Helper to resolve rounds once everyone submitted
  const checkAndResolveShowdown = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.engine) return;

    const engine = room.engine;

    if (engine.allPlayersSubmitted()) {
      const showdownResult = engine.resolveRound();
      io.to(roomId).emit('round:showdown', showdownResult);
      broadcastRoomState(roomId);

      // 4-second review window before next round begins
      setTimeout(() => {
        const currentRoom = roomManager.getRoom(roomId);
        if (!currentRoom || !currentRoom.engine) return;

        const hasNextRound = currentRoom.engine.advanceToNextRound();

        if (hasNextRound) {
          broadcastRoomState(roomId);
          processTurnCycle(roomId);
        } else {
          const finalWinners = currentRoom.engine.getGameWinners();
          io.to(roomId).emit('game:over', {
            finalState: currentRoom.engine.getState(),
            winners: finalWinners.winners,
            highestScore: finalWinners.highestScore,
          });
        }
      }, 4000);
    }
  };

  // --- AUTOMATIC SESSION RE-ATTACHMENT ON CONNECT ---
  // When a socket connects or reconnects, auto-discover if this user has an active room
  const existingSession = roomManager.findRoomByUserId(currentUserId);
  if (existingSession) {
    const { room, player } = existingSession;
    player.socketId = socket.id;
    player.connected = true;
    player.isCpu = false;
    if (player.name.includes('(BOT)')) {
      player.name = player.name.replace(' (BOT)', '').replace('(BOT)', '').trim();
    }
    if (room.engine) {
      room.engine.reconnectPlayer(player.id, player.id);
    }
    socket.join(room.id);
    if (room.state === 'PLAYING') {
      broadcastRoomState(room.id);
    } else {
      io.to(room.id).emit('lobby:updated', { players: room.players });
    }
  }

  // --- LOBBY EVENTS ---

  // 1. Create a Room
  socket.on(
    'lobby:create',
    ({
      roomId,
      playerName,
      maxPlayers,
      userId,
    }: {
      roomId: string;
      playerName: string;
      maxPlayers?: number;
      userId?: string;
    }) => {
      const effectiveUserId = userId || currentUserId;
      const room = roomManager.createRoom(roomId, effectiveUserId, socket.id, playerName, maxPlayers);
      socket.join(roomId);
      socket.emit('lobby:joined', { roomId, players: room.players, isHost: true });
    }
  );

  // 2. Join an Existing Room
  socket.on(
    'lobby:join',
    ({ roomId, playerName, userId }: { roomId: string; playerName: string; userId?: string }) => {
      const effectiveUserId = userId || currentUserId;
      const result = roomManager.joinRoom(roomId, effectiveUserId, socket.id, playerName);
      if (!result.success) {
        socket.emit('lobby:error', { message: result.error });
        return;
      }
      socket.join(roomId);
      const room = roomManager.getRoom(roomId)!;
      io.to(roomId).emit('lobby:updated', { players: room.players });
      socket.emit('lobby:joined', { roomId, players: room.players, isHost: false });
    }
  );

  // 3. Add a CPU Player to Lobby
  socket.on('lobby:add_cpu', ({ roomId }: { roomId: string }) => {
    const result = roomManager.addCpu(roomId);
    if (result.success) {
      const room = roomManager.getRoom(roomId)!;
      io.to(roomId).emit('lobby:updated', { players: room.players });
    } else {
      socket.emit('lobby:error', { message: result.error });
    }
  });

  // 4. Start Match
  socket.on('lobby:start', async ({ roomId }: { roomId: string }) => {
    const result = await roomManager.startGame(roomId, currentUserId);
    if (!result.success) {
      socket.emit('lobby:error', { message: result.error });
      return;
    }

    io.to(roomId).emit('game:started');
    broadcastRoomState(roomId);
    processTurnCycle(roomId);
  });

  // 5. Explicit Reconnect Event
  socket.on(
    'player:reconnect',
    ({ roomId, userId }: { roomId: string; userId?: string }) => {
      const effectiveUserId = userId || currentUserId;
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('game:error', { message: 'Room no longer exists or match ended.' });
        return;
      }

      const reconnected = roomManager.reconnectPlayer(roomId, effectiveUserId, socket.id);
      if (reconnected) {
        socket.join(roomId);
        socket.emit('player:reconnected', { newPlayerId: effectiveUserId });
        if (room.state === 'PLAYING') {
          broadcastRoomState(roomId);
        } else {
          io.to(roomId).emit('lobby:updated', { players: room.players });
        }
      }
    }
  );

  // --- GAMEPLAY EVENTS ---

  // 6. Caller selects their card and calls the stat
  socket.on(
    'round:caller_select',
    ({
      roomId,
      cardId,
      category,
      userId,
    }: {
      roomId: string;
      cardId: string;
      category: AnyBattleStat;
      userId?: string;
    }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || !room.engine) {
        socket.emit('game:error', { message: 'Match is no longer active.' });
        return;
      }

      const effectiveUserId = userId || currentUserId;
      socket.join(roomId);
      roomManager.reconnectPlayer(roomId, effectiveUserId, socket.id);

      const caller = room.engine.getState().players[effectiveUserId];
      const success = room.engine.callerSelect(effectiveUserId, cardId, category);
      if (!success) {
        socket.emit('game:error', { message: 'Invalid move: not your turn or card not in hand.' });
        return;
      }

      io.to(roomId).emit('round:category_chosen', {
        callerId: effectiveUserId,
        callerName: caller?.name || 'Caller',
        selectedCategory: category,
      });

      broadcastRoomState(roomId);
      processTurnCycle(roomId);
    }
  );

  // 7. Non-caller submits their response card
  socket.on(
    'round:submit_card',
    ({
      roomId,
      cardId,
      chosenGkStat,
      userId,
    }: {
      roomId: string;
      cardId: string;
      chosenGkStat?: AnyBattleStat;
      userId?: string;
    }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || !room.engine) {
        socket.emit('game:error', { message: 'Match is no longer active.' });
        return;
      }

      const effectiveUserId = userId || currentUserId;
      socket.join(roomId);
      roomManager.reconnectPlayer(roomId, effectiveUserId, socket.id);

      const success = room.engine.playerSubmit(effectiveUserId, cardId, chosenGkStat);
      if (!success) {
        const engineState = room.engine.getState();
        const p = engineState.players[effectiveUserId];
        let reason = 'Could not submit this card.';
        if (!p) reason = 'Player not recognized in this match.';
        else if (p.hasSubmitted) reason = 'You have already submitted a card this round.';
        else if (engineState.phase !== 'OPPONENT_RESPONSES') reason = `Cannot submit card during ${engineState.phase}.`;
        else if (engineState.callerId === effectiveUserId) reason = 'Caller cannot submit as opponent.';
        else if (!p.hand.some((c) => c && c.cardId === cardId)) reason = 'Card is not in your hand.';

        socket.emit('game:error', { message: reason });
        return;
      }

      broadcastRoomState(roomId);
      processTurnCycle(roomId);
    }
  );

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    roomManager.handlePlayerDisconnect(socket.id);
  });
};
