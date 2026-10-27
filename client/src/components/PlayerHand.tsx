import React, { useState } from 'react';
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

  // Active category abbreviation or label
  const currentCategory: AnyBattleStat = activeCategory || 'rating';
  const categoryLabel = (activeCategory || 'rating').toUpperCase().slice(0, 3);

  // Sort cards by active category descending (or by rating if no category)
  const sortedCards = [...validCards].sort((a, b) => {
    const valA = a.position === 'GK' && activeCategory && activeCategory !== 'rating'
      ? Math.max(...Object.values(a.stats))
      : a.stats[currentCategory] ?? a.stats.rating ?? 0;
    const valB = b.position === 'GK' && activeCategory && activeCategory !== 'rating'
      ? Math.max(...Object.values(b.stats))
      : b.stats[currentCategory] ?? b.stats.rating ?? 0;
    return valB - valA;
  });

  const activeCard = selectedCardId
    ? validCards.find((c) => c.cardId === selectedCardId) ?? null
    : null;

  const hasGkInHand = validCards.some((c) => c.position === 'GK');

  const handleCardClick = (card: GameCard) => {
    if (selectedCardId === card.cardId) {
      setSelectedCardId(null);
      setSelectedGkStat(null);
    } else {
      setSelectedCardId(card.cardId);
      if (card.position === 'GK') {
        setSelectedGkStat('rating');
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

  const handleLockInAction = () => {
    if (!activeCard) return;

    if (isMyTurnToCall) {
      const statToCall = activeCard.position === 'GK' ? 'rating' : (selectedGkStat || 'rating');
      onCallStat(activeCard.cardId, statToCall);
    } else if (isMyTurnToRespond) {
      if (activeCard.position === 'GK') {
        onSubmitCard(activeCard.cardId, selectedGkStat || 'rating');
      } else {
        onSubmitCard(activeCard.cardId);
      }
    }
  };

  if (validCards.length === 0) {
    return (
      <div className="hand-tray-container">
        <div className="hand-tray-header">
          <span className="hand-tray-title">YOUR HAND</span>
          <span className="duel-action-prompt muted">No cards remaining</span>
        </div>
      </div>
    );
  }

  // Generate dynamic text for the Lock In button
  const getLockInButtonText = () => {
    if (!activeCard) {
      if (isMyTurnToCall) return 'Select a card to lead';
      if (isMyTurnToRespond) return 'Select a card to lock in 🔒';
      return 'Waiting for turn...';
    }

    const lastName = activeCard.name.split(' ').pop() || activeCard.name;

    if (isMyTurnToCall) {
      if (activeCard.position === 'GK') {
        return `Lock in ${lastName} · Call OVR (${activeCard.stats.rating}) 🔒`;
      }
      const chosenStat = selectedGkStat || 'rating';
      const statVal = activeCard.stats[chosenStat] ?? activeCard.stats.rating;
      return `Lock in ${lastName} · ${statVal} ${chosenStat.toUpperCase().slice(0, 3)} 🔒`;
    }

    if (isMyTurnToRespond) {
      if (activeCard.position === 'GK') {
        const statToUse = selectedGkStat || 'rating';
        const statVal = activeCard.stats[statToUse] ?? 0;
        return `Lock in ${lastName} · TRUMP ${statVal} ${statToUse.toUpperCase().slice(0, 3)} 🔒`;
      }
      const effectiveVal = activeCard.stats[currentCategory] ?? 0;
      return `Lock in ${lastName} · ${effectiveVal} ${categoryLabel} 🔒`;
    }

    return `Locked in · ${lastName}`;
  };

  const isButtonEnabled = (isMyTurnToCall || isMyTurnToRespond) && !!activeCard;

  return (
    <div className="hand-tray-container">
      {/* 1. Header Bar: Title, Count, Sort, GK Trump Toggle, and Big Green Lock-in Button */}
      <div className="hand-tray-header">
        <div className="hand-header-left">
          <span className="hand-main-title">YOUR HAND</span>
          <div className="hand-count-meta">
            <span className="hand-count-bold">{validCards.length} cards available</span>
            <span className="hand-count-sub">11 dealt · {11 - validCards.length} played · 1 per round</span>
          </div>
        </div>

        <div className="hand-header-right">
          <div className="hand-sort-pill">
            <span>Sort: {activeCategory ? activeCategory.toUpperCase() : 'PACE'} ↓</span>
          </div>

          <div className={`hand-gk-toggle-box ${hasGkInHand ? 'is-ready' : ''}`}>
            <span className="gk-toggle-text">
              GK trump · {hasGkInHand ? 'Ready' : 'Off'}
            </span>
            <div className={`gk-switch-ui ${hasGkInHand ? 'active' : ''}`}>
              <div className="gk-switch-knob" />
            </div>
          </div>

          <button
            className={`hand-lock-in-btn ${isButtonEnabled ? 'is-active' : 'is-disabled'}`}
            disabled={!isButtonEnabled}
            onClick={handleLockInAction}
          >
            {getLockInButtonText()}
          </button>
        </div>
      </div>

      {/* 2. Horizontal Cards Ribbon */}
      <div className="hand-cards-scroll">
        {sortedCards.map((card) => {
          const isSelected = card.cardId === activeCard?.cardId;
          const isGk = card.position === 'GK';

          // Effective value for this card against the active category
          let topStatVal: number | string = card.stats[currentCategory] ?? card.stats.rating ?? '-';
          let topStatLbl = categoryLabel;

          if (isGk) {
            if (isSelected && selectedGkStat) {
              topStatVal = card.stats[selectedGkStat] ?? '-';
              topStatLbl = selectedGkStat.toUpperCase().slice(0, 3);
            } else if (activeCategory && activeCategory !== 'rating') {
              const bestVal = Math.max(...Object.values(card.stats));
              topStatVal = bestVal;
              topStatLbl = 'TRUMP';
            }
          }

          return (
            <div
              key={card.cardId}
              className={`hand-card-column ${isSelected ? 'is-selected' : ''}`}
            >
              {/* Top Tag Pill above each card */}
              <div className={`card-ribbon-tag ${isSelected ? 'tag-selected' : ''}`}>
                {isSelected ? (
                  <>
                    <span className="tag-check">✓ SELECTED</span>
                    <span className="tag-val-lime">{topStatVal} {topStatLbl}</span>
                    <span className="tag-playable">PLAYABLE</span>
                  </>
                ) : (
                  <>
                    <span className="tag-val">{topStatVal} {topStatLbl}</span>
                    <span className="tag-playable">
                      {isGk ? 'GK · OPTIONAL TRUMP 6 STATS' : 'PLAYABLE'}
                    </span>
                  </>
                )}
              </div>

              {/* The Floodlight Series Card */}
              <CardView
                card={card}
                isCompact={true}
                isSelected={isSelected}
                isClickable={true}
                highlightedStat={
                  isMyTurnToCall && isGk ? 'rating' : (isSelected && selectedGkStat ? selectedGkStat : activeCategory)
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
