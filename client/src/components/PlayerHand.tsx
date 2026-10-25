import React, { useState } from 'react';
import type { GameCard, AnyBattleStat, OutfieldStat } from '../types/game';
import { CardView } from './CardView';
import '../styles/cards.css';

interface PlayerHandProps {
  hand: (GameCard | null)[];
  isMyTurnToCall: boolean;
  isMyTurnToRespond: boolean;
  activeCategory: OutfieldStat | null;
  onCallStat: (cardId: string, stat: OutfieldStat) => void;
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
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Filter out any null slots
  const validCards = hand.filter((c): c is GameCard => c !== null);
  const selectedCard = validCards.find((c) => c.cardId === selectedCardId);

  const handleCardClick = (card: GameCard) => {
    if (isMyTurnToCall) {
      setSelectedCardId(card.cardId);
    } else if (isMyTurnToRespond) {
      if (card.position === 'GK') {
        // For GK trumps, select the card first so user can choose which stat to play
        setSelectedCardId(card.cardId);
      } else {
        // Standard card responds immediately to the active category
        onSubmitCard(card.cardId);
      }
    }
  };

  const handleStatSelect = (stat: AnyBattleStat) => {
    if (!selectedCard) return;

    if (isMyTurnToCall) {
      // Caller can only call outfield stats (or overall rating)
      const validOutfieldStats: OutfieldStat[] = [
        'rating', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'
      ];
      if (validOutfieldStats.includes(stat as OutfieldStat)) {
        onCallStat(selectedCard.cardId, stat as OutfieldStat);
        setSelectedCardId(null);
      }
    } else if (isMyTurnToRespond && selectedCard.position === 'GK') {
      // Respond with GK trump using the selected stat
      onSubmitCard(selectedCard.cardId, stat);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="hand-tray-container">
      <div className="hand-tray-header">
        <span>Your Squad ({validCards.length} cards remaining)</span>
        {isMyTurnToCall && (
          <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            {selectedCardId
              ? 'Click a stat on your chosen card to announce the category!'
              : 'Your Turn: Select a card to play'}
          </span>
        )}
        {isMyTurnToRespond && (
          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
            {selectedCard && selectedCard.position === 'GK'
              ? 'Select which GK stat to trump with!'
              : `Playing against: ${activeCategory?.toUpperCase()}`}
          </span>
        )}
      </div>

      <div className="hand-cards-scroll">
        {validCards.map((card) => {
          const isSelected = card.cardId === selectedCardId;
          const canClick = isMyTurnToCall || isMyTurnToRespond;

          return (
            <CardView
              key={card.cardId}
              card={card}
              isClickable={canClick}
              isSelected={isSelected}
              highlightedStat={activeCategory}
              allowStatSelection={
                (isMyTurnToCall && isSelected) ||
                (isMyTurnToRespond && isSelected && card.position === 'GK')
              }
              onCardClick={() => handleCardClick(card)}
              onSelectStat={handleStatSelect}
            />
          );
        })}
      </div>
    </div>
  );
};