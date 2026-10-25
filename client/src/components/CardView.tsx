import React from 'react';
import type { GameCard, AnyBattleStat } from '../types/game';
import '../styles/cards.css';

interface CardViewProps {
  card: GameCard;
  isClickable?: boolean;
  isSelected?: boolean;
  highlightedStat?: AnyBattleStat | null;
  allowStatSelection?: boolean;
  hideStats?: boolean; // When true: hides OVR, Position, and stat numbers
  onSelectStat?: (stat: AnyBattleStat) => void;
  onCardClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isClickable = false,
  isSelected = false,
  highlightedStat = null,
  allowStatSelection = false,
  hideStats = false,
  onSelectStat,
  onCardClick,
}) => {
  const isGk = card.position === 'GK';

  const statsList: { key: AnyBattleStat; label: string }[] = isGk
    ? [
        { key: 'diving', label: 'DIV' },
        { key: 'handling', label: 'HAN' },
        { key: 'kicking', label: 'KIC' },
        { key: 'reflexes', label: 'REF' },
        { key: 'speed', label: 'SPD' },
        { key: 'positioning', label: 'POS' },
      ]
    : [
        { key: 'pace', label: 'PAC' },
        { key: 'shooting', label: 'SHO' },
        { key: 'passing', label: 'PAS' },
        { key: 'dribbling', label: 'DRI' },
        { key: 'defending', label: 'DEF' },
        { key: 'physical', label: 'PHY' },
      ];

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
      <div className="card-inner-surface">
        {!hideStats && isGk && <span className="trump-badge">TRUMP GK</span>}

        {/* Top Half: OVR/POS (blank if hideStats) & Horizontally Centered Face */}
        <div className="card-top-half">
          {!hideStats ? (
            <div
              className={`card-primary-info ${highlightedStat === 'rating' ? 'active-category' : ''} ${allowStatSelection ? 'selectable' : ''}`}
              onClick={(e) => handleStatClick(e, 'rating')}
            >
              <span className="card-overall-rating">{card.stats.rating}</span>
              <span className="card-position-text">{card.position}</span>
            </div>
          ) : (
            <div className="card-primary-info" style={{ opacity: 0 }}>
              <span className="card-overall-rating">--</span>
              <span className="card-position-text">--</span>
            </div>
          )}

          {card.image && (
            <img
              src={card.image}
              alt={card.name}
              className="card-player-portrait"
              loading="lazy"
            />
          )}
        </div>

        {/* Lower Half: Player Name, Stats Bar, Badges */}
        <div className="card-bottom-half">
          <div className="card-player-name" title={card.name}>
            {card.name}
          </div>

          <div className="card-horizontal-stats">
            {statsList.map(({ key, label }) => {
              const isHighlighted = highlightedStat === key;
              return (
                <div
                  key={key}
                  className={`stat-column ${isHighlighted ? 'active-category' : ''} ${allowStatSelection ? 'selectable' : ''}`}
                  onClick={(e) => handleStatClick(e, key)}
                >
                  <span className="stat-column-label">{label}</span>
                  <span className="stat-column-value">
                    {hideStats ? '?' : (card.stats[key] ?? '-')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card-footer-badges">
            {card.countryFlag && (
              <img
                src={card.countryFlag}
                alt={card.nationality}
                className="card-badge-flag"
                loading="lazy"
              />
            )}
            {card.clubLogo && (
              <img
                src={card.clubLogo}
                alt={card.club}
                className="card-badge-club"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};