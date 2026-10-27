import React, { useState, useEffect } from 'react';
import type { ClientGameState, RoundShowdown, GameCard, AnyBattleStat } from '../types/game';
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
  const { currentRound, selectedCategory, callerId, players, phase, submissions, turnOrder } = gameState;
  const caller = players[callerId];
  const isShowdown = phase === 'SHOWDOWN';
  const callerCard = (submissions[callerId]?.card as GameCard | undefined) || calledCard;

  const allPlayers = Object.values(players);
  const isCaller = callerId === currentUserId;
  const callerDisplayName = caller?.name?.trim() || 'Caller';

  const myPlayer = players[currentUserId];
  const isMyTurnToCall = phase === 'CALLER_SELECTION' && callerId === currentUserId;
  const isMyTurnToRespond =
    phase === 'OPPONENT_RESPONSES' &&
    callerId !== currentUserId &&
    !myPlayer?.hasSubmitted;

  // Live countdown timer for the active turn
  const [timeLeft, setTimeLeft] = useState(25);
  useEffect(() => {
    setTimeLeft(phase === 'SHOWDOWN' ? 5 : 25);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentRound]);

  // Responders (all non-caller players)
  const responders = allPlayers.filter((p) => p.id !== callerId);
  const lockedCount = responders.filter((p) => p.hasSubmitted).length;

  // Standings sorted by score descending
  const standings = [...allPlayers].sort((a, b) => b.score - a.score);

  // Caller Rotation Pipeline
  const currentCallerIdx = turnOrder.indexOf(callerId);
  const rotationPipeline = turnOrder.map((pId, idx) => {
    const p = players[pId];
    const name = p?.name?.split(' ')[0] || `P${idx + 1}`;
    if (pId === callerId) {
      return { id: pId, label: `${name} · NOW`, isNow: true };
    }
    const stepsAhead = (idx - currentCallerIdx + turnOrder.length) % turnOrder.length;
    const futureRound = currentRound + stepsAhead;
    const padRound = futureRound < 10 ? `R0${futureRound}` : `R${futureRound}`;
    return { id: pId, label: `${name} · ${padRound}`, isNow: false };
  });

  // Last Round Summary Ticker
  const getLastRoundTicker = () => {
    if (!lastShowdown) {
      return 'R01 · First round in progress · Match kickoff!';
    }
    const roundNum = lastShowdown.roundNumber < 10 ? `R0${lastShowdown.roundNumber}` : `R${lastShowdown.roundNumber}`;
    const trait = lastShowdown.calledCategory.toUpperCase();
    const winners = lastShowdown.winnerIds.map((id) => (id === currentUserId ? 'You' : players[id]?.name?.split(' ')[0] || 'Player')).join(', ');
    const callerName = players[lastShowdown.callerId]?.name?.split(' ')[0] || 'Caller';
    const callerStatus = !lastShowdown.callerWon ? ` · Caller ${callerName} -1` : '';
    return `${roundNum} · ${trait} · ${winners} won +1${callerStatus}`;
  };

  const padTime = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="arena-dashboard-container">
      {/* ========================================================
          LEFT COLUMN: PHASE HEADER, MAIN PITCH BOX, ROTATION, TICKER
          ======================================================== */}
      <div className="arena-main-column">
        {/* Phase Header Bar with Countdown */}
        <div className="arena-phase-bar">
          <div className="phase-title-tag">
            {phase === 'CALLER_SELECTION' ? (
              <span className="phase-text-lime">
                {isCaller ? 'CALLER PHASE / CHOOSE YOUR CARD & STAT' : `CALLER PHASE / WAITING FOR ${callerDisplayName.toUpperCase()}`}
              </span>
            ) : phase === 'OPPONENT_RESPONSES' ? (
              <span className="phase-text-lime">RESPONSE PHASE / CHOOSE YOUR COUNTER</span>
            ) : phase === 'SHOWDOWN' ? (
              <span className="phase-text-gold">SHOWDOWN / REVEALING ALL CARDS</span>
            ) : (
              <span className="phase-text-lime">TACTICAL FOOTBALL DUEL</span>
            )}
          </div>

          <div className="phase-timer-pill">
            <span className="timer-icon">⏱</span>
            <span className="timer-countdown">00:{padTime(timeLeft)}</span>
            <span className="timer-label">to lock in</span>
          </div>
        </div>

        {/* Football Pitch Container */}
        <div className="arena-football-pitch">
          {/* Top Half of Pitch: The Clash Zone (Caller, The Call, Opponents) */}
          <div className="pitch-clash-zone">
            {/* 1. Left Panel: Caller's Card (Scaled to fit pitch box without overflow) */}
            <div className="pitch-caller-panel">
              <div className="caller-label-row">
                <span className="caller-player-name">{callerDisplayName.split(' ')[0]}</span>
                <span className="caller-badge">CALLER</span>
              </div>

              <div className="caller-card-stage">
                {isShowdown && callerCard ? (
                  /* Revealed caller card on Showdown */
                  <div className={`caller-showdown-card ${lastShowdown?.winnerIds.includes(callerId) ? 'is-winner' : ''}`}>
                    <div className="caller-showdown-head">
                      <span className="caller-showdown-ovr">{callerCard.stats.rating}</span>
                      <span className="caller-showdown-pos">{callerCard.position}</span>
                    </div>
                    <div className="caller-showdown-photo-stage">
                      {callerCard.image && (
                        <img src={callerCard.image} alt={callerCard.name} className="caller-showdown-photo" />
                      )}
                    </div>
                    <div className="caller-showdown-footer">
                      <span className="caller-showdown-val">
                        {submissions[callerId]?.effectiveValue ?? callerCard.stats[selectedCategory || 'rating'] ?? '--'} {(selectedCategory || 'rating').toUpperCase().slice(0, 3)}
                      </span>
                      <span className="caller-showdown-name">{callerCard.name.split(' ').pop()}</span>
                    </div>
                  </div>
                ) : isCaller && callerCard && phase === 'OPPONENT_RESPONSES' ? (
                  /* The caller can preview their own chosen card */
                  <div className="caller-showdown-card is-active">
                    <div className="caller-showdown-head">
                      <span className="caller-showdown-ovr">{callerCard.stats.rating}</span>
                      <span className="caller-showdown-pos">{callerCard.position}</span>
                    </div>
                    <div className="caller-showdown-photo-stage">
                      {callerCard.image && (
                        <img src={callerCard.image} alt={callerCard.name} className="caller-showdown-photo" />
                      )}
                    </div>
                    <div className="caller-showdown-footer">
                      <span className="caller-showdown-val">
                        {callerCard.stats[selectedCategory || 'rating'] ?? '--'} {(selectedCategory || 'rating').toUpperCase().slice(0, 3)}
                      </span>
                      <span className="caller-showdown-name">{callerCard.name.split(' ').pop()}</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Mysterious Stadium Hidden Card matching reference image */
                  <div className="stadium-hidden-card">
                    <div className="hidden-card-inner">
                      <span className="hidden-card-monogram">XI</span>
                      <span className="hidden-card-status">VALUE HIDDEN</span>
                      <span className="hidden-card-lock">🔒</span>
                    </div>
                  </div>
                )}
              </div>

              <span className="caller-stage-footnote">
                {isShowdown ? 'Showdown revealed' : 'Card committed · stat concealed'}
              </span>
            </div>

            {/* 2. Center Panel: The Call Showcase */}
            <div className="pitch-center-panel">
              <span className="the-call-label">THE CALL IS</span>

              <div className="the-call-hero-category">
                {selectedCategory ? (
                  <span className="call-hero-text">{selectedCategory.toUpperCase()}</span>
                ) : (
                  <span className="call-hero-text choosing">CHOOSING...</span>
                )}
              </div>

              <div className="the-call-description">
                <p>The category is public.</p>
                <p>{callerDisplayName}'s value is not. Back your best card.</p>
              </div>

              <div className="all-reveal-pill">
                <span className="pill-lock">🔒</span>
                <span>All cards reveal together</span>
              </div>
            </div>

            {/* 3. Right Panel: Opponents Response Matrix */}
            <div className="pitch-opponents-panel">
              <div className="opponents-matrix-row">
                {responders.map((p) => {
                  const isYou = p.id === currentUserId;
                  const hasSubmitted = p.hasSubmitted || !!submissions[p.id];
                  const subCard = submissions[p.id]?.card;
                  const pName = isYou ? 'You' : p.name.split(' ')[0];

                  return (
                    <div key={p.id} className="opponent-station">
                      <span className={`opponent-station-name ${isYou ? 'is-you' : ''}`}>{pName}</span>

                      <div className={`opponent-mini-card ${hasSubmitted ? 'is-locked' : ''}`}>
                        {isShowdown && subCard ? (
                          /* Showdown revealed opponent card: Clean mini format (no cropped faces!) */
                          <div className={`mini-showdown-card ${lastShowdown?.winnerIds.includes(p.id) ? 'is-winner' : ''}`}>
                            <div className="mini-photo-stage">
                              {subCard.image ? (
                                <img src={subCard.image} alt={subCard.name} className="mini-photo-img" />
                              ) : (
                                <span className="mini-fallback-xi">XI</span>
                              )}
                            </div>
                            <span className="mini-played-stat">
                              {submissions[p.id]?.effectiveValue ?? subCard.stats[selectedCategory || 'rating'] ?? '--'}
                            </span>
                            <span className="mini-player-surname">
                              {subCard.name.split(' ').pop()}
                            </span>
                          </div>
                        ) : (
                          /* Response Phase: Mysterious mini card back matching reference */
                          <div className="mini-card-back">
                            <span className="mini-card-xi">XI</span>
                            {hasSubmitted ? (
                              <span className="mini-card-check">✓</span>
                            ) : (
                              <span className="mini-card-lock">🔒</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="opponent-status-pill">
                        {hasSubmitted ? (
                          <span className="status-locked">LOCKED IN</span>
                        ) : isYou ? (
                          <span className="status-your-turn">YOUR TURN</span>
                        ) : (
                          <span className="status-choosing">CHOOSING</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="opponents-matrix-counter">
                <span>
                  {lockedCount} of {responders.length} opponents locked in
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Half of Pitch: Player Hand inside Game Arena */}
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

        {/* Bottom Meta Strip: Rotation & Last Round Ticker */}
        <div className="arena-meta-strip">
          <div className="caller-rotation-bar">
          <div className="rotation-left-meta">
            <span className="rotation-title">CALLER ROTATION</span>
            <span className="rotation-subtitle">Random first caller · fair rotation</span>
          </div>

          <div className="rotation-pipeline-nodes">
            {rotationPipeline.map((node, i) => (
              <React.Fragment key={node.id}>
                <span className={`pipeline-node ${node.isNow ? 'is-now' : ''}`}>
                  {node.label}
                </span>
                {i < rotationPipeline.length - 1 && <span className="pipeline-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Last Round Summary Bar */}
        <div className="last-round-bar">
          <div className="last-round-content">
            <span className="last-round-badge">LAST ROUND</span>
            <span className="last-round-ticker">{getLastRoundTicker()}</span>
          </div>
          <span className="last-round-history-link">View history ↗</span>
        </div>
      </div>
    </div>

      {/* ========================================================
          RIGHT COLUMN: THE STANDINGS & THE KEEPER EXCEPTION
          ======================================================== */}
      <div className="arena-sidebar-column">
        {/* Widget 1: THE STANDINGS */}
        <div className="standings-widget">
          <div className="standings-header">
            <div className="standings-title-row">
              <span className="standings-title">THE STANDINGS</span>
              <span className="standings-trophy">🏆</span>
            </div>
            <div className="standings-sub-row">
              <span className="standings-round-count">
                AFTER {Math.max(1, currentRound - 1)} ROUNDS
              </span>
              <span className="standings-pts-header">PTS</span>
            </div>
          </div>

          <div className="standings-list">
            {standings.map((p, idx) => {
              const isYou = p.id === currentUserId;
              const rankStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
              const initials = p.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'P';

              return (
                <div key={p.id} className={`standings-row ${isYou ? 'is-you' : ''}`}>
                  <div className="standings-row-left">
                    <span className="standings-rank">{rankStr}</span>
                    <span className="standings-avatar">{initials}</span>
                    <span className="standings-name">
                      {p.name} {isYou ? '(you)' : ''}
                    </span>
                  </div>
                  <span className="standings-score">{p.score}</span>
                </div>
              );
            })}
          </div>

          <div className="standings-footer">
            <p>Round winner +1 · Losing caller -1</p>
            <p>Highest total after round 11 wins.</p>
          </div>
        </div>

        {/* Widget 2: THE KEEPER EXCEPTION */}

      </div>
    </div>
  );
};
