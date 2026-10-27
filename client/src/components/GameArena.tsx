import React from 'react';
import type { ClientGameState, RoundShowdown, GameCard, AnyBattleStat } from '../types/game';
import { CardView } from './CardView';
import { PlayerHand } from './PlayerHand';
import '../styles/game.css';
import '../styles/cards.css';

interface GameArenaProps {
  gameState: ClientGameState;
  lastShowdown: RoundShowdown | null;
  currentUserId: string;
  calledCard?: GameCard | null;
  onCallStat: (cardId: string, category: AnyBattleStat) => void;
  onSubmitCard: (cardId: string, chosenGkStat?: AnyBattleStat) => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameState,
  lastShowdown,
  currentUserId,
  calledCard,
  onCallStat,
  onSubmitCard,
}) => {
  const { currentRound, selectedCategory, callerId, players, phase, submissions } = gameState;
  const caller = players[callerId];
  const isShowdown = phase === 'SHOWDOWN';
  const callerCard = (submissions[callerId]?.card as GameCard | undefined) || calledCard;

  const allPlayers = Object.values(players);
  const isCaller = callerId === currentUserId;
  const callerDisplayName = caller?.name?.trim() || 'Player 1';

  const myPlayer = players[currentUserId];
  const isMyTurnToCall = phase === 'CALLER_SELECTION' && callerId === currentUserId;
  const isMyTurnToRespond =
    phase === 'OPPONENT_RESPONSES' &&
    callerId !== currentUserId &&
    !myPlayer?.hasSubmitted;

  // Box 1 Turn Text: "(Player 1's turn like that) if that players turn in bracket write you okk?"
  const getTurnText = () => {
    if (phase === 'CALLER_SELECTION') {
      return `${callerDisplayName}'s turn${isCaller ? ' (You)' : ''}`;
    }
    if (phase === 'OPPONENT_RESPONSES') {
      if (myPlayer && !myPlayer.hasSubmitted) {
        return 'Your turn (You)';
      }
      return "Opponents' turn";
    }
    if (phase === 'SHOWDOWN') {
      return 'Showdown!';
    }
    return 'Match in progress';
  };

  return (
    <div className="pitch-game-arena">
      {/* ========================================================
          BOX 1: Whose turn (Top Left)
          ======================================================== */}
      <div className="pitch-hud-box-1">
        <span className="pitch-turn-label">{getTurnText()}</span>
      </div>

      {/* ========================================================
          BOX 2: Round number (Top Center, e.g. 1/11 or 2/11)
          ======================================================== */}
      <div className="pitch-hud-box-2">
        <span className="pitch-round-label">{currentRound} / 11</span>
      </div>

      {/* ========================================================
          BOX 3: Each player's points (Top Right)
          ======================================================== */}
      <div className="pitch-hud-box-3">
        <div className="pitch-scores-row">
          {allPlayers.map((p, idx) => (
            <div key={p.id} className="pitch-player-score">
              <span className={`score-player-name ${p.id === currentUserId ? 'is-you' : ''}`}>
                {p.name}{p.id === currentUserId ? ' (You)' : ''}:
              </span>
              <span className="score-player-points">{p.score}</span>
              {idx < allPlayers.length - 1 && <span className="score-divider">•</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          BOX 4: Center Arena - Selected Cards (Stats replaced with '?')
          ======================================================== */}
      <div className="pitch-hud-box-4">
        {selectedCategory && (
          <div className="arena-called-category-display">
            <span className="category-sub">CALLED STAT</span>
            <span className="category-hero">{selectedCategory.toUpperCase()}</span>
          </div>
        )}

        <div className="arena-cards-row">
          {allPlayers.map((p) => {
            const isYou = p.id === currentUserId;
            const sub = submissions[p.id];
            const card = sub?.card || (p.id === callerId ? (callerCard || calledCard) : null);

            if (card) {
              const isWinner = isShowdown && lastShowdown?.winnerIds.includes(p.id);

              return (
                <div key={p.id} className="arena-player-card-slot">
                  <div className="arena-player-tag">
                    <span className="arena-player-name">{p.name}{isYou ? ' (You)' : ''}</span>
                    {p.id === callerId && <span className="arena-caller-badge">CALLER</span>}
                  </div>

                  <div className={`arena-card-holder ${isWinner ? 'is-winner' : ''}`}>
                    <CardView
                      card={card}
                      isCompact={true}
                      hideStats={!isShowdown}
                      highlightedStat={selectedCategory}
                    />
                  </div>

                  {isShowdown && (
                    <div className="arena-card-showdown-val">
                      <span>
                        {sub?.effectiveValue ?? card.stats[selectedCategory || 'rating'] ?? ''} {(selectedCategory || 'rating').toUpperCase()}
                      </span>
                      {isWinner && <span className="arena-winner-tag">👑 WINNER</span>}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={p.id} className="arena-player-card-slot is-pending">
                <div className="arena-player-tag">
                  <span className="arena-player-name">{p.name}{isYou ? ' (You)' : ''}</span>
                  {p.id === callerId && <span className="arena-caller-badge">CALLER</span>}
                </div>

                <div className="arena-card-placeholder">
                  <span className="placeholder-icon">⚽</span>
                  <span className="placeholder-text">
                    {p.id === callerId
                      ? (isYou ? 'Your turn to call' : 'Caller choosing...')
                      : (isYou ? 'Select a card' : 'Choosing...')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          BOX 5: Player Hand - Fanned Deck with animation (Bottom)
          ======================================================== */}
      <div className="pitch-hud-box-5">
        {myPlayer && (
          <PlayerHand
            hand={myPlayer.hand}
            isMyTurnToCall={isMyTurnToCall}
            isMyTurnToRespond={isMyTurnToRespond}
            activeCategory={selectedCategory}
            onCallStat={onCallStat}
            onSubmitCard={onSubmitCard}
          />
        )}
      </div>
    </div>
  );
};

export default GameArena;
