import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import type { ClientGameState, RoundShowdown, OutfieldStat, AnyBattleStat, PlayerState } from './types/game';
import { Lobby } from './components/Lobby';
import { GameArena } from './components/GameArena';
import { PlayerHand } from './components/PlayerHand';
import { GameOverModal } from './components/GameOverModal';
import './styles/game.css';

export const App: React.FC = () => {
  const socket = useSocket();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [lastShowdown, setLastShowdown] = useState<RoundShowdown | null>(null);
  const [gameOverData, setGameOverData] = useState<{
    winners: PlayerState[];
    highestScore: number;
  } | null>(null);

  useEffect(() => {
    // Synchronize full game state
    socket.on('game:state_sync', (syncedState: ClientGameState) => {
      setGameState(syncedState);
    });

    // Showdown event (reveals round results)
    socket.on('round:showdown', (showdownResult: RoundShowdown) => {
      setLastShowdown(showdownResult);
    });

    // Match concluded
    socket.on('game:over', ({ winners, highestScore }) => {
      setGameOverData({ winners, highestScore });
    });

    return () => {
      socket.off('game:state_sync');
      socket.off('round:showdown');
      socket.off('game:over');
    };
  }, [socket]);

  const handleGameStarted = (roomId: string, playerId: string) => {
    setActiveRoomId(roomId);
    setCurrentUserId(playerId || socket.id || '');
  };

  const handleCallStat = (cardId: string, category: OutfieldStat) => {
    if (!activeRoomId) return;
    socket.emit('round:caller_select', {
      roomId: activeRoomId,
      cardId,
      category,
    });
  };

  const handleSubmitCard = (cardId: string, chosenGkStat?: AnyBattleStat) => {
    if (!activeRoomId) return;
    socket.emit('round:submit_card', {
      roomId: activeRoomId,
      cardId,
      chosenGkStat,
    });
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  if (!activeRoomId || !gameState) {
    return <Lobby onGameStarted={handleGameStarted} />;
  }

  const myPlayer = gameState.players[currentUserId];
  const isMyTurnToCall = gameState.phase === 'CALLER_SELECTION' && gameState.callerId === currentUserId;
  const isMyTurnToRespond =
    gameState.phase === 'OPPONENT_RESPONSES' &&
    gameState.callerId !== currentUserId &&
    !myPlayer?.hasSubmitted;

  return (
    <div className="game-screen">
      {/* Top Bar: Roster and Scores */}
      <div className="match-topbar">
        <div className="match-round-badge">
          ROUND {gameState.currentRound} / 11
        </div>
        <div className="players-roster-bar">
          {Object.values(gameState.players).map((p) => (
            <div
              key={p.id}
              className={`player-roster-pill ${gameState.callerId === p.id ? 'is-turn' : ''}`}
            >
              <span>{p.name} {p.id === currentUserId ? '(You)' : ''}</span>
              <span className="score">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center Field: Played Cards Arena */}
      <GameArena
        gameState={gameState}
        lastShowdown={lastShowdown}
        currentUserId={currentUserId}
      />

      {/* Bottom Tray: Player Hand */}
      {myPlayer && (
        <PlayerHand
          hand={myPlayer.hand}
          isMyTurnToCall={isMyTurnToCall}
          isMyTurnToRespond={isMyTurnToRespond}
          activeCategory={gameState.selectedCategory}
          onCallStat={handleCallStat}
          onSubmitCard={handleSubmitCard}
        />
      )}

      {/* Game Over Leaderboard Modal */}
      {gameOverData && (
        <GameOverModal
          winners={gameOverData.winners}
          highestScore={gameOverData.highestScore}
          allPlayers={gameState.players}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

export default App;