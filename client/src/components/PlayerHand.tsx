import React, { useState } from 'react';
import type { GameCard, AnyBattleStat } from '../types/game';
import { CardView } from './CardView';
import '../styles/cards.css';

interface PlayerHandProps {
  hand: (GameCard | null)[];
  isMyTurnToCall: boolean;
  isMyTurnToRespond: boolean;
  activeCategory: AnyBattleStat | null;
  onCallStat: (cardId: string, stat: AnyBattleStat) => void;
  onSubmitCard: (cardId: string, chosenGkStat?: AnyBattleStat) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isMyTurnToCall,
  isMyTurnToRespond,
  activeCategory,
  onCallStat,
  onSubmitCard,
}) => {
  const validCards = hand.filter((c): c is GameCard => c !== null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // No card is auto-selected; player must deliberately click a card to select it
  const activeCard = selectedCardId
    ? validCards.find((c) => c.cardId === selectedCardId) ?? null
    : null;

  const handleCardClick = (card: GameCard) => {
    if (selectedCardId === card.cardId) {
      // Clicking the already selected card toggles selection off
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.cardId);
    }
  };

  const handleStatSelect = (card: GameCard, stat: AnyBattleStat) => {
    if (isMyTurnToCall) {
      const statToCall = card.position === 'GK' ? 'rating' : stat;
      onCallStat(card.cardId, statToCall);
    } else if (isMyTurnToRespond && card.position === 'GK') {
      onSubmitCard(card.cardId, stat);
    }
  };

  if (validCards.length === 0) {
    return (
      <div className="hand-tray-container">
        <div className="hand-tray-header">
          <span className="hand-tray-title">YOUR SQUAD</span>
          <span className="duel-action-prompt muted">No cards remaining</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hand-tray-container">
      {/* Header with squad count and action buttons / prompts */}
      <div className="hand-tray-header">
        <div className="hand-tray-title">
          YOUR SQUAD <span className="count">({validCards.length} CARDS)</span>
        </div>

        <div className="hand-tray-action-area">
          {activeCard ? (
            <>
              {isMyTurnToCall && activeCard.position === 'GK' && (
                <button
                  className="duel-action-btn gold"
                  onClick={() => onCallStat(activeCard.cardId, 'rating')}
                >
                  ⚔️ LEAD WITH GK — CALL OVERALL ({activeCard.stats.rating})
                </button>
              )}

              {isMyTurnToCall && activeCard.position !== 'GK' && (
                <div className="duel-action-prompt">
                  👉 CLICK A STAT ON {activeCard.name.toUpperCase()} TO CALL IT
                </div>
              )}

              {isMyTurnToRespond && activeCard.position === 'GK' && (
                <div className="duel-action-prompt">
                  🧤 GK TRUMP! CLICK ANY GK STAT ROW TO BATTLE
                </div>
              )}

              {isMyTurnToRespond && activeCard.position !== 'GK' && (
                <button
                  className="duel-action-btn gold"
                  onClick={() => onSubmitCard(activeCard.cardId)}
                >
                  ⚔️ PLAY {activeCard.name.toUpperCase()} ({activeCard.stats[activeCategory || 'rating'] ?? '-'} {(activeCategory || 'rating').toUpperCase()})
                </button>
              )}
            </>
          ) : isMyTurnToCall || isMyTurnToRespond ? (
            <div className="duel-action-prompt">
              👉 CLICK A CARD FROM YOUR SQUAD TO SELECT IT
            </div>
          ) : (
            <div className="duel-action-prompt muted">
              Waiting for round to resolve...
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side horizontal cards scroll */}
      <div className="hand-cards-scroll">
        {validCards.map((card) => {
          const isSelected = card.cardId === activeCard?.cardId;
          const isGk = card.position === 'GK';

          return (
            <div
              key={card.cardId}
              className={`hand-card-wrapper ${isSelected ? 'is-selected' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <CardView
                card={card}
                isCompact={true}
                isSelected={isSelected}
                isClickable={true}
                highlightedStat={
                  isMyTurnToCall && isGk ? 'rating' : activeCategory
                }
                allowStatSelection={
                  isSelected &&
                  (isMyTurnToCall || (isMyTurnToRespond && isGk))
                }
                onCardClick={() => handleCardClick(card)}
                onSelectStat={(stat) => handleStatSelect(card, stat)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};