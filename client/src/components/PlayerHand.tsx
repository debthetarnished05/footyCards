import React, { useState, useEffect } from 'react';
import type { GameCard, AnyBattleStat } from '../types/game';
import { CardView } from './CardView';
import '../styles/cards.css';
import '../styles/game.css';

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
  const [selectedGkStat, setSelectedGkStat] = useState<AnyBattleStat | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Responsive full-width viewport tracking
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeCard = selectedCardId
    ? validCards.find((c) => c.cardId === selectedCardId) ?? null
    : null;

  const handleCardClick = (card: GameCard) => {
    if (selectedCardId === card.cardId) {
      setSelectedCardId(null);
      setSelectedGkStat(null);
    } else {
      setSelectedCardId(card.cardId);
      if (card.position === 'GK') {
        setSelectedGkStat(activeCategory || 'rating');
      } else {
        setSelectedGkStat(null);
      }
    }
  };

  const handleStatSelect = (card: GameCard, stat: AnyBattleStat) => {
    if (isMyTurnToCall) {
      const statToCall = card.position === 'GK' ? 'rating' : stat;
      onCallStat(card.cardId, statToCall);
    } else if (isMyTurnToRespond && card.position === 'GK') {
      setSelectedGkStat(stat);
    }
  };

  const handleLockIn = () => {
    if (!activeCard) return;
    if (isMyTurnToCall) {
      const statToCall = activeCard.position === 'GK' ? 'rating' : (selectedGkStat || 'rating');
      onCallStat(activeCard.cardId, statToCall);
    } else if (isMyTurnToRespond) {
      onSubmitCard(activeCard.cardId, selectedGkStat || undefined);
    }
  };

  if (validCards.length === 0) {
    return null;
  }

  const total = validCards.length;
  const mid = (total - 1) / 2;

  // Spread across full screen width (taking ~92% of viewport width)
  const availableWidth = Math.min(1680, Math.max(680, windowWidth * 0.92));
  // Generous gap so cards don't overlap too much
  const spread = total > 1 ? Math.min(132, availableWidth / (total - 1)) : 0;
  // Natural gentle fan curvature across wide span
  const maxAngle = Math.min(16, total * 1.8);

  // Stat choices for caller if a card is selected
  const callerStats: AnyBattleStat[] = activeCard?.position === 'GK'
    ? ['rating', 'diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning']
    : ['rating', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

  return (
    <div className="pitch-fanned-deck-wrapper">
      {/* Floating Action Overlay when a card is selected */}
      {activeCard && (isMyTurnToCall || isMyTurnToRespond) && (
        <div className="pitch-action-overlay">
          {isMyTurnToCall ? (
            <div className="pitch-call-stat-actions">
              <span className="call-prompt-text">
                Choose stat for {activeCard.name.split(' ').pop()}:
              </span>
              <div className="call-stat-pills">
                {callerStats.map((st) => (
                  <button
                    key={st}
                    className={`stat-choice-pill ${selectedGkStat === st ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedGkStat(st);
                      onCallStat(activeCard.cardId, st);
                    }}
                  >
                    {st.toUpperCase().slice(0, 3)} ({activeCard.stats[st] ?? '?'})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className="pitch-lock-in-action-btn" onClick={handleLockIn}>
              Lock In {activeCard.name.split(' ').pop()} 🔒
            </button>
          )}
        </div>
      )}

      {/* The Fanned Deck of Cards taking full screen width */}
      <div className="pitch-fanned-deck">
        {validCards.map((card, idx) => {
          const offset = idx - mid;
          const rotateDeg = total > 1 ? (offset / (mid || 1)) * (maxAngle / 2) : 0;
          const translateY = Math.pow(Math.abs(offset) / (mid || 1), 1.5) * 20;
          const translateX = offset * spread;
          const isSelected = card.cardId === activeCard?.cardId;
          const isHovered = card.cardId === hoveredCardId;

          return (
            <div
              key={card.cardId}
              className={`fanned-card-item ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
              style={{
                transform: isSelected
                  ? `translate(${translateX}px, ${translateY - 55}px) rotate(0deg) scale(1.15)`
                  : isHovered
                  ? `translate(${translateX}px, ${translateY - 42}px) rotate(0deg) scale(1.12)`
                  : `translate(${translateX}px, ${translateY}px) rotate(${rotateDeg}deg)`,
                zIndex: isSelected ? 150 : isHovered ? 100 : idx + 10,
              }}
              onMouseEnter={() => setHoveredCardId(card.cardId)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => handleCardClick(card)}
            >
              <CardView
                card={card}
                isCompact={true}
                isSelected={isSelected}
                isClickable={true}
                highlightedStat={isSelected && selectedGkStat ? selectedGkStat : activeCategory}
                allowStatSelection={isSelected && (isMyTurnToCall || (isMyTurnToRespond && card.position === 'GK'))}
                onSelectStat={(stat) => handleStatSelect(card, stat)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
