import React from 'react';
import type { GameCard, AnyBattleStat } from '../types/game';
import '../styles/cards.css';

interface CardViewProps {
  card: GameCard;
  isClickable?: boolean;
  isSelected?: boolean;
  highlightedStat?: AnyBattleStat | null;
  allowStatSelection?: boolean;
  hideStats?: boolean;
  onSelectStat?: (stat: AnyBattleStat) => void;
  onCardClick?: () => void;
  isCompact?: boolean;
}

export const getCountryCode = (country: string = ''): string => {
  const map: Record<string, string> = {
    'Spain': 'ES',
    'France': 'FR',
    'Argentina': 'ARG',
    'Portugal': 'POR',
    'Brazil': 'BRA',
    'England': 'ENG',
    'Germany': 'GER',
    'Netherlands': 'NED',
    'Belgium': 'BEL',
    'Italy': 'ITA',
    'Croatia': 'CRO',
    'Poland': 'POL',
    'Norway': 'NOR',
    'Uruguay': 'URU',
    'Senegal': 'SEN',
    'Egypt': 'EGY',
  };
  return map[country] || (country.length <= 3 ? country.toUpperCase() : country.slice(0, 3).toUpperCase()) || 'FC';
};

export const getPositionColor = (pos: string) => {
  switch (pos) {
    case 'ST':
    case 'LW':
    case 'RW':
      return { bg: '#7f1d1d', border: '#b91c1c', accent: '#fca5a5' };
    case 'CM':
    case 'CDM':
    case 'CAM':
    case 'LM':
    case 'RM':
      return { bg: '#854d0e', border: '#ca8a04', accent: '#fde047' };
    case 'CB':
    case 'RB':
    case 'LB':
      return { bg: '#115e59', border: '#14b8a6', accent: '#5eead4' };
    case 'GK':
      return { bg: '#581c87', border: '#a855f7', accent: '#d8b4fe' };
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
}> = ({ remainingCount, label = 'FLOODLIGHT SERIES', className = '', isCompact = false, onClick }) => {
  return (
    <div className={`floodlight-card duel-card card-back ${isCompact ? 'compact' : ''} ${className}`} onClick={onClick}>
      {/* Stadium floodlights glow */}
      <div className="floodlight-stadium-lights">
        <div className="floodlight-beam beam-left" />
        <div className="floodlight-beam beam-right" />
        <div className="floodlight-halo" />
      </div>

      <div className="floodlight-header-row">
        <div className="floodlight-ovr-box">
          <span className="floodlight-ovr-number" style={{ fontSize: isCompact ? '1.1rem' : '1.4rem' }}>XI</span>
          <span className="floodlight-position">SERIES</span>
        </div>
        <span className="floodlight-series-edition">XI / 26</span>
      </div>

      <div className="floodlight-back-center">
        <svg viewBox="0 0 100 100" className="floodlight-back-emblem">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#c5a059" strokeWidth="1.2" opacity="0.6"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#c5a059" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4"/>
          <polygon points="50,14 54,46 86,50 54,54 50,86 46,54 14,50 46,46" fill="none" stroke="#c5a059" strokeWidth="1.6"/>
          <polygon points="50,22 53,47 78,50 53,53 50,78 47,53 22,50 47,47" fill="#c5a059" opacity="0.25"/>
          <circle cx="50" cy="50" r="3" fill="#c5a059"/>
        </svg>
        <span className="floodlight-back-brand">{label}</span>
      </div>

      {typeof remainingCount === 'number' && (
        <div className="floodlight-back-footer">
          <span className="floodlight-back-count">{remainingCount} CARDS</span>
        </div>
      )}
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
  const countryCode = getCountryCode(card.nationality);

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
    if (allowStatSelection) {
      e.stopPropagation();
      if (onSelectStat) {
        onSelectStat(statKey);
      }
    }
  };

  const isOvrHighlighted = highlightedStat === 'rating';

  return (
    <div
      className={`floodlight-card duel-card ${isGk ? 'is-gk' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${isCompact ? 'compact' : ''}`}
      onClick={onCardClick}
    >
      {/* 1. Atmospheric Stadium Floodlights */}
      <div className="floodlight-stadium-lights">
        <div className="floodlight-beam beam-left" />
        <div className="floodlight-beam beam-right" />
        <div className="floodlight-halo" />
      </div>

      {/* 2. Top Header Row: Rating + Position (Left) & Edition/Badge (Right) */}
      <div className="floodlight-header-row">
        <div
          className={`floodlight-ovr-box ${isOvrHighlighted ? 'active-stat' : ''} ${allowStatSelection ? 'selectable' : ''}`}
          onClick={(e) => handleStatClick(e, 'rating')}
          title="Overall Rating (OVR)"
        >
          <span className="floodlight-ovr-number">{hideStats ? '--' : card.stats.rating}</span>
          <span className="floodlight-position">{card.position}</span>
        </div>

        <div className="floodlight-header-right">
          {!hideStats && isGk && <span className="floodlight-gk-pill">TRUMP GK</span>}
          <span className="floodlight-series-edition">XI / 26</span>
        </div>
      </div>

      {/* 3. Center Player Portrait Stage */}
      <div className="floodlight-player-stage">
        {card.image && (
          <img
            src={card.image}
            alt={card.name}
            className="floodlight-player-photo"
            loading="lazy"
          />
        )}
      </div>

      {/* 4. Bottom Info Section: Player Name, Subtitle Line, Divider, Stats Row */}
      <div className="floodlight-bottom-section">
        <div className="floodlight-player-name" title={card.name}>
          {card.name}
        </div>

        <div className="floodlight-subtitle">
          <div className="floodlight-meta-left">
            {card.countryFlag && (
              <img
                src={card.countryFlag}
                alt={card.nationality}
                className="floodlight-mini-flag"
                loading="lazy"
              />
            )}
            <span className="floodlight-country-code">{countryCode}</span>
            <span className="floodlight-sep">/</span>
            <span className="floodlight-series-name">
              {card.club ? card.club.toUpperCase() : 'FLOODLIGHT SERIES'}
            </span>
          </div>
          <span className="floodlight-diamond">◆</span>
        </div>

        <div className="floodlight-divider" />

        <div className="floodlight-stats-row">
          {statsList.map(({ key, label }) => {
            const isHighlighted = highlightedStat === key;
            const statVal = hideStats ? '?' : (card.stats[key] ?? '-');
            const isSelectable = allowStatSelection;

            return (
              <div
                key={key}
                className={`floodlight-stat-col ${isHighlighted ? 'active-stat' : ''} ${isSelectable ? 'selectable' : ''}`}
                onClick={(e) => handleStatClick(e, key)}
                title={label}
              >
                <span className="floodlight-stat-val">{statVal}</span>
                <span className="floodlight-stat-lbl">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
