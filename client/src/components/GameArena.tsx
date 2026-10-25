import React from 'react';
import type { ClientGameState, RoundShowdown } from '../types/game';
import { CardView } from './CardView';
import '../styles/game.css';

interface GameArenaProps {
  gameState: ClientGameState;
  lastShowdown: RoundShowdown | null;
  currentUserId: string;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameState,
  lastShowdown,
  currentUserId,
}) => {
  const { currentRound, selectedCategory, callerId, players, phase, submissions } = gameState;
  const caller = players[callerId];
  const isShowdown = phase === 'SHOWDOWN';

  return (
    <div className="arena-container">
      {/* Central Announcement Banner */}
      <div className="arena-status-banner">
        {phase === 'CALLER_SELECTION' && (
          <>
            <div className="banner-subtitle">
              Round {currentRound} of 11
            </div>
            <div className="banner-stat-title">
              {callerId === currentUserId ? 'Your Call!' : `${caller?.name || 'Caller'} is choosing...`}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Select a card and stat category to battle with
            </p>
          </>
        )}

        {phase === 'OPPONENT_RESPONSES' && (
          <>
            <div className="banner-subtitle">Active Battle Stat</div>
            <div className="banner-stat-title">{selectedCategory?.toUpperCase()}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Players are selecting their best counter-card
            </p>
          </>
        )}

        {isShowdown && lastShowdown && (
          <>
            <div className="showdown-banner">
              Winner(s):{' '}
              {lastShowdown.winnerIds
                .map((id) => (id === currentUserId ? 'You' : players[id]?.name || 'Player'))
                .join(', ')}{' '}
              with {lastShowdown.winningValue} {lastShowdown.calledCategory.toUpperCase()}!
            </div>
            <div className="banner-subtitle">Next round will begin shortly...</div>
          </>
        )}
      </div>

      {/* Played Cards Submission Field */}
      <div className="submissions-board">
        {Object.values(players).map((player) => {
          const submissionData = submissions[player.id];
          const hasPlayed = player.hasSubmitted || !!submissionData;

          return (
            <div key={player.id} className="submission-slot">
              <span className="player-label">
                {player.name} {player.id === currentUserId ? '(You)' : ''}
              </span>

              {/* Show actual card if showdown phase or if it's the current user's submitted card */}
              {isShowdown && submissionData?.card ? (
                <CardView
                  card={submissionData.card}
                  highlightedStat={submissionData.statUsed}
                  isSelected={lastShowdown?.winnerIds.includes(player.id)}
                />
              ) : hasPlayed ? (
                submissionData?.card && player.id === currentUserId ? (
                  <CardView
                    card={submissionData.card}
                    highlightedStat={selectedCategory}
                    isSelected={true}
                  />
                ) : (
                  <div className="card-face-down">
                    <span className="face-down-logo">READY</span>
                  </div>
                )
              ) : (
                <div className="card-face-down" style={{ opacity: 0.35 }}>
                  <span className="face-down-logo" style={{ fontSize: '1rem' }}>WAITING</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};