import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getPersistentUserId } from '../utils/userId';
import '../styles/lobby.css';

interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isCpu: boolean;
}

interface LobbyProps {
  onGameStarted: (roomId: string, playerId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameStarted }) => {
  const socket = useSocket();

  // Inputs
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  // Active room state
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Successfully created or joined room
    socket.on('lobby:joined', ({ roomId, players, isHost }) => {
      setCurrentRoomId(roomId);
      setPlayers(players);
      setIsHost(isHost);
      setErrorMessage(null);
    });

    // Roster update (players join/leave or CPU added)
    socket.on('lobby:updated', ({ players }) => {
      setPlayers(players);
    });

    // Error from server
    socket.on('lobby:error', ({ message }) => {
      setErrorMessage(message);
    });

    // Host launched match
    socket.on('game:started', () => {
      if (currentRoomId) {
        onGameStarted(currentRoomId, getPersistentUserId());
      }
    });

    return () => {
      socket.off('lobby:joined');
      socket.off('lobby:updated');
      socket.off('lobby:error');
      socket.off('game:started');
    };
  }, [socket, currentRoomId, onGameStarted]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Please enter a display name');
      return;
    }
    const generatedRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    socket.emit('lobby:create', {
      roomId: generatedRoomId,
      playerName: playerName.trim(),
      maxPlayers,
      userId: getPersistentUserId(),
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomIdInput.trim()) {
      setErrorMessage('Please enter both your name and a room code');
      return;
    }
    socket.emit('lobby:join', {
      roomId: roomIdInput.trim().toUpperCase(),
      playerName: playerName.trim(),
      userId: getPersistentUserId(),
    });
  };

  const handleAddCpu = () => {
    if (currentRoomId) {
      socket.emit('lobby:add_cpu', { roomId: currentRoomId });
    }
  };

  const handleStartGame = () => {
    if (currentRoomId && isHost) {
      socket.emit('lobby:start', { roomId: currentRoomId });
    }
  };

  // --- Render Waiting Room ---
  if (currentRoomId) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <div className="room-header">
            <div>
              <h3>Match Lobby</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Slots: {players.length} / {maxPlayers}
              </span>
            </div>
            <span className="room-code-tag">{currentRoomId}</span>
          </div>

          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id} className="player-item">
                <span>{p.name} {p.id === getPersistentUserId() ? '(You)' : ''}</span>
                {p.isHost && <span className="player-tag host">HOST</span>}
                {p.isCpu && <span className="player-tag cpu">BOT</span>}
              </li>
            ))}
          </ul>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          {isHost && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddCpu}
                disabled={players.length >= maxPlayers}
              >
                + Add CPU Bot
              </button>
              <button
                type="button"
                className="btn-start"
                onClick={handleStartGame}
                disabled={players.length < 2}
              >
                Start Match ({players.length} Players)
              </button>
            </div>
          )}

          {!isHost && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Waiting for the host to launch match...
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Render Join/Create Landing Form ---
  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2 className="lobby-title">footyCards</h2>

        <div className="form-group">
          <label>Your Display Name</label>
          <input
            type="text"
            placeholder="e.g. Tactician99"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={15}
          />
        </div>

        {/* Create Room Section */}
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label>Max Room Capacity (2 - 10 Players)</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} Players
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Create New Room
          </button>
        </form>

        <div className="divider">OR</div>

        {/* Join Room Section */}
        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label>Room Code</label>
            <input
              type="text"
              placeholder="e.g. 8K2XA"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              maxLength={6}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ width: '100%' }}>
            Join Room
          </button>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};