import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import type { ClientGameState, RoundShowdown, AnyBattleStat, PlayerState, GameCard } from './types/game';
import { Lobby } from './components/Lobby';
import { GameArena } from './components/GameArena';
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

  return (
    <div className="game-screen">
      {/* 1. Sleek Match Stand Header Bar */}
      <div className="table-topbar">
        <div className="table-stand-title">
          <span className="stand-name">FootyCards</span>
          <span className="stand-room-id">ROOM {activeRoomId}</span>
        </div>

        <div className="table-top-right">
          <div className="table-round-pill">
            <span className="round-pill-lbl">ROUND</span>
            <span className="round-pill-val">{gameState.currentRound} / 11</span>
          </div>
        </div>
      </div>

      {/* 2. Game Arena (Football Pitch with Clash Zone, Player Hand & Standings) */}
      <GameArena
        gameState={gameState}
        lastShowdown={lastShowdown}
        currentUserId={currentUserId}
        calledCard={calledCard}
        onCallStat={handleCallStat}
        onSubmitCard={handleSubmitCard}
      />

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
