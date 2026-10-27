import React from 'react';
import type { GameCard, AnyBattleStat } from '../types/game';
import '../styles/cards.css';

interface CardViewProps {
  card: GameCard;
  isClickable?: boolean;
  isSelected?: boolean;
  highlightedStat?: AnyBattleStat | null;
  allowStatSelection?: boolean;
  hideStats?: boolean; // When true: hides stat numbers for opponents before showdown
  onSelectStat?: (stat: AnyBattleStat) => void;
  onCardClick?: () => void;
  isCompact?: boolean;
}

export const getPositionColor = (pos: string) => {
  switch (pos) {
    case 'ST':
    case 'LW':
    case 'RW':
      return { bg: '#7f1d1d', border: '#b91c1c', accent: '#fca5a5' }; // Crimson
    case 'CM':
    case 'CDM':
    case 'CAM':
    case 'LM':
    case 'RM':
      return { bg: '#854d0e', border: '#ca8a04', accent: '#fde047' }; // Amber/Gold
    case 'CB':
    case 'RB':
    case 'LB':
      return { bg: '#115e59', border: '#14b8a6', accent: '#5eead4' }; // Teal/Emerald
    case 'GK':
      return { bg: '#581c87', border: '#a855f7', accent: '#d8b4fe' }; // Royal Purple
    default:
      return { bg: '#1e293b', border: '#475569', accent: '#cbd5e1' };
  }
};

export const getStatIcon = (key: AnyBattleStat) => {
  switch (key) {
    case 'rating': return '⭐';
    case 'pace': return '⚡';
    case 'shooting': return '🎯';
    case 'passing': return '⚽';
    case 'dribbling': return '✨';
    case 'defending': return '🛡️';
    case 'physical': return '💪';
    case 'diving': return '🧤';
    case 'handling': return '👐';
    case 'kicking': return '👟';
    case 'reflexes': return '⚡';
    case 'speed': return '🏃';
    case 'positioning': return '📍';
    default: return '✦';
  }
};

export const CardBackView: React.FC<{
  remainingCount?: number;
  label?: string;
  className?: string;
  isCompact?: boolean;
  onClick?: () => void;
}> = ({ remainingCount, label = 'FOOTY DUEL', className = '', isCompact = false, onClick }) => {
  return (
    <div className={`card-back-container ${isCompact ? 'compact' : ''} ${className}`} onClick={onClick}>
      <div className="card-back-inner-frame">
        <svg viewBox="0 0 100 100" className="card-back-compass">
          <circle cx="50" cy="50" r="34" fill="none" stroke="#e5b842" strokeWidth="1.2" opacity="0.6"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5b842" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4"/>
          {/* 4-pointed gold compass star */}
          <polygon points="50,12 54,46 88,50 54,54 50,88 46,54 12,50 46,46" fill="none" stroke="#e5b842" strokeWidth="1.6"/>
          <polygon points="50,20 53,47 80,50 53,53 50,80 47,53 20,50 47,47" fill="#e5b842" opacity="0.25"/>
          <circle cx="50" cy="50" r="3" fill="#e5b842"/>
        </svg>
        <span className="card-back-brand">{label}</span>
        {typeof remainingCount === 'number' && (
          <span className="card-back-badge">{remainingCount} CARDS</span>
        )}
      </div>
    </div>
  );
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  isClickable = false,
  isSelected = false,
  highlightedStat = null,
  allowStatSelection = false,
  hideStats = false,
  onSelectStat,
  onCardClick,
  isCompact = false,
}) => {
  const isGk = card.position === 'GK';
  const posTheme = getPositionColor(card.position);

  const statsList: { key: AnyBattleStat; label: string }[] = isGk
    ? [
        { key: 'rating', label: 'RATING' },
        { key: 'diving', label: 'DIVING' },
        { key: 'handling', label: 'HANDLING' },
        { key: 'kicking', label: 'KICKING' },
        { key: 'reflexes', label: 'REFLEXES' },
        { key: 'speed', label: 'SPEED' },
        { key: 'positioning', label: 'POSITIONING' },
      ]
    : [
        { key: 'rating', label: 'OVERALL' },
        { key: 'pace', label: 'PACE' },
        { key: 'shooting', label: 'SHOOTING' },
        { key: 'passing', label: 'PASSING' },
        { key: 'dribbling', label: 'DRIBBLING' },
        { key: 'defending', label: 'DEFENDING' },
        { key: 'physical', label: 'PHYSICAL' },
      ];

  const handleStatClick = (e: React.MouseEvent, statKey: AnyBattleStat) => {
    if (allowStatSelection) {
      e.stopPropagation();
      if (onSelectStat) {
        onSelectStat(statKey);
      }
    }
  };

  return (
    <div
      className={`duel-card ${isGk ? 'is-gk' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${isCompact ? 'compact' : ''}`}
      style={{ borderColor: isSelected ? 'var(--accent-gold)' : posTheme.border }}
      onClick={onCardClick}
    >
      {/* 1. Colored Header Banner (Zoro Card Header) */}
      <div className="duel-card-header" style={{ backgroundColor: posTheme.bg }}>
        <div className="duel-card-title-group">
          <span className="duel-card-name" title={card.name}>
            {card.name}
          </span>
          <span className="duel-card-subtitle">
            {card.club} • {card.position}
          </span>
        </div>
        <div className="duel-card-header-right">
          {!hideStats && isGk && <span className="duel-gk-badge">TRUMP</span>}
          <span className="duel-card-ovr-badge">{hideStats ? '--' : card.stats.rating}</span>
        </div>
      </div>

      {/* 2. Middle Portrait Section */}
      <div className="duel-card-portrait-stage">
        {card.image && (
          <img
            src={card.image}
            alt={card.name}
            className="duel-card-photo"
            loading="lazy"
          />
        )}
        <div className="duel-card-badge-row">
          {card.countryFlag && (
            <img
              src={card.countryFlag}
              alt={card.nationality}
              className="duel-badge-flag"
              loading="lazy"
            />
          )}
          {card.clubLogo && (
            <img
              src={card.clubLogo}
              alt={card.club}
              className="duel-badge-club"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Bottom Stats Plate (Vertical List Matching Screenshot) */}
      <div className="duel-card-stats-plate">
        {statsList.map(({ key, label }) => {
          const isHighlighted = highlightedStat === key;
          const statVal = hideStats ? '?' : (card.stats[key] ?? '-');
          const isSelectableRow = allowStatSelection;

          return (
            <div
              key={key}
              className={`duel-stat-row ${isHighlighted ? 'active-category' : ''} ${isSelectableRow ? 'selectable' : ''}`}
              onClick={(e) => handleStatClick(e, key)}
            >
              <div className="duel-stat-left">
                <span className="duel-stat-icon">{getStatIcon(key)}</span>
                <span className="duel-stat-name">{label}</span>
              </div>
              <span className="duel-stat-value">{statVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};