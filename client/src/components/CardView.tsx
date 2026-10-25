import React from 'react';
import type { GameCard, AnyBattleStat, OutfieldStat } from '../types/game';
import '../styles/cards.css';

interface CardViewProps {
  card: GameCard;
  isClickable?: boolean;
  isSelected?: boolean;
  highlightedStat?: AnyBattleStat | null;
  allowStatSelection?: boolean; // When caller or GK trump picker selects a specific stat
  onSelectStat?: (stat: AnyBattleStat) => void;
  onCardClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isClickable = false,
  isSelected = false,
  highlightedStat = null,
  allowStatSelection = false,
  onSelectStat,
  onCardClick,
}) => {
  const isGk = card.position === 'GK';

  // Stat keys based on player type
  const statKeys: AnyBattleStat[] = isGk
    ? ['diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning']
    : ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

  const statLabels: Record<string, string> = {
    pace: 'PAC',
    shooting: 'SHO',
    passing: 'PAS',
    dribbling: 'DRI',
    defending: 'DEF',
    physical: 'PHY',
    diving: 'DIV',
    handling: 'HAN',
    kicking: 'KIC',
    reflexes: 'REF',
    speed: 'SPD',
    positioning: 'POS',
    rating: 'OVR',
  };

  const handleStatClick = (e: React.MouseEvent, statKey: AnyBattleStat) => {
    e.stopPropagation();
    if (allowStatSelection && onSelectStat) {
      onSelectStat(statKey);
    }
  };

  return (
    <div
      className={`footy-card ${isGk ? 'is-gk' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onCardClick}
    >
      {isGk && <span className="trump-badge">TRUMP GK</span>}

      <div className="card-header">
        <div
          className={`card-rating-badge ${highlightedStat === 'rating' ? 'active-category' : ''} ${allowStatSelection ? 'selectable' : ''}`}
          onClick={(e) => handleStatClick(e, 'rating')}
        >
          <span className="card-overall">{card.stats.rating}</span>
          <span className="card-pos">{card.position}</span>
        </div>
        <div className="card-meta">
          <div className="card-name" title={card.name}>{card.name}</div>
          <div className="card-club" title={card.club}>{card.club}</div>
        </div>
      </div>

      <div className="card-stats-grid">
        {statKeys.map((key) => {
          const isHighlighted = highlightedStat === key;
          return (
            <div
              key={key}
              className={`stat-item ${isHighlighted ? 'active-category' : ''} ${allowStatSelection ? 'selectable' : ''}`}
              onClick={(e) => handleStatClick(e, key)}
            >
              <span className="stat-label">{statLabels[key] || key}</span>
              <span className="stat-val">{card.stats[key] ?? '-'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};