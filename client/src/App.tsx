import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import type { ClientGameState, RoundShowdown, AnyBattleStat, PlayerState, GameCard } from './types/game';
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

  const [calledCard, setCalledCard] = useState<GameCard | null>(null);

  useEffect(() => {
    socket.on('game:state_sync', (syncedState: ClientGameState) => {
      setGameState(syncedState);

      const callerSub = syncedState.submissions[syncedState.callerId];
      if (callerSub && callerSub.card) {
        setCalledCard(callerSub.card);
      } else if (syncedState.phase === 'CALLER_SELECTION') {
        setCalledCard(null);
      }
    });

    socket.on('round:category_chosen', (data: { callerId: string; callerName: string; card?: GameCard; selectedCategory: AnyBattleStat }) => {
      if (data.card) {
        setCalledCard(data.card);
      }
    });

    socket.on('round:showdown', (showdownResult: RoundShowdown) => {
      setLastShowdown(showdownResult);
    });

    socket.on('game:over', ({ winners, highestScore }) => {
      setGameOverData({ winners, highestScore });
    });

    socket.on('game:error', ({ message }: { message: string }) => {
      console.error('Game error:', message);
    });

    return () => {
      socket.off('game:state_sync');
      socket.off('round:category_chosen');
      socket.off('round:showdown');
      socket.off('game:over');
      socket.off('game:error');
    };
  }, [socket]);

  const handleGameStarted = (roomId: string, playerId: string) => {
    setActiveRoomId(roomId);
    setCurrentUserId(playerId || socket.id || '');
  };

  const handleCallStat = (cardId: string, category: AnyBattleStat) => {
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

  const rivals = Object.values(gameState.players).filter((p) => p.id !== currentUserId);

  return (
    <div className="game-screen">
      {/* 1. Edge-to-Edge Match Topbar */}
      <div className="table-topbar">
        {/* Left: Brand Emblem & Titles */}
        <div className="table-brand">
          <div className="table-brand-emblem">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#e5b842" strokeWidth="2" opacity="0.6" />
              <polygon points="50,14 54,46 86,50 54,54 50,86 46,54 14,50 46,46" fill="#e5b842" />
            </svg>
          </div>
          <div className="table-brand-titles">
            <span className="table-brand-title">Footy Duel</span>
            <span className="table-brand-subtitle">Tactical Wager</span>
          </div>
        </div>

        {/* Center: Round Shield Badge */}
        <div className="table-round-badge">
          <span className="table-round-label">ROUND</span>
          <span className="table-round-num">{gameState.currentRound} / 11</span>
        </div>

        {/* Right: Scores */}
        <div className="table-scores-bar">
          <div className={`score-box is-you ${gameState.callerId === currentUserId ? 'is-turn' : ''}`}>
            <span className="score-lbl">YOU</span>
            <span className="score-val">{myPlayer?.score ?? 0}</span>
          </div>
          {rivals.map((rival) => (
            <div
              key={rival.id}
              className={`score-box is-rival ${gameState.callerId === rival.id ? 'is-turn' : ''}`}
              title={rival.name}
            >
              <span className="score-lbl">
                {rivals.length === 1 ? 'RIVAL' : rival.name}
              </span>
              <span className="score-val">{rival.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Center Field: Opponents & Played Cards Arena */}
      <GameArena
        gameState={gameState}
        lastShowdown={lastShowdown}
        currentUserId={currentUserId}
        calledCard={calledCard}
      />

      {/* 3. Bottom Tray: Player Cards Side-by-Side */}
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