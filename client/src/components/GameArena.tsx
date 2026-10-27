import React from 'react';
import type { ClientGameState, RoundShowdown, GameCard } from '../types/game';
import { CardView, CardBackView } from './CardView';
import '../styles/game.css';
import '../styles/cards.css';

interface GameArenaProps {
  gameState: ClientGameState;
  lastShowdown: RoundShowdown | null;
  currentUserId: string;
  calledCard?: GameCard | null;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameState,
  lastShowdown,
  currentUserId,
  calledCard,
}) => {
  const { selectedCategory, callerId, players, phase, submissions } = gameState;
  const caller = players[callerId];
  const isShowdown = phase === 'SHOWDOWN';
  const callerCard = (submissions[callerId]?.card as GameCard | undefined) || calledCard;

  const allPlayers = Object.values(players);
  const rivals = allPlayers.filter((p) => p.id !== currentUserId);
  const isTwoPlayer = rivals.length === 1;
  const singleRival = rivals[0];

  return (
    <div className="arena-center-pitch">
      {/* Showdown Winner Pill Banner */}
      {isShowdown && lastShowdown && (
        <div className="showdown-banner-pill">
          🏆 {lastShowdown.winnerIds.map((id) => (id === currentUserId ? 'YOU' : players[id]?.name || 'RIVAL')).join(', ')} WINS!
          <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '3px', fontWeight: 700 }}>
            {lastShowdown.winningValue} {lastShowdown.calledCategory.toUpperCase()}
            {!lastShowdown.callerWon && (
              <span style={{ color: '#f87171', marginLeft: '6px' }}>(-1 pt caller penalty)</span>
            )}
          </div>
        </div>
      )}

      {/* Slim Status Ribbon (Low-profile, zero scroll impact) */}
      <div className="arena-status-bar">
        {phase === 'CALLER_SELECTION' && (
          <span className="arena-status-text">
            {callerId === currentUserId
              ? '⭐ YOUR CALL — SELECT A CARD BELOW & PICK A STAT'
              : `⏳ ${caller?.name?.toUpperCase() || 'RIVAL'} IS CHOOSING A TRAIT...`}
          </span>
        )}
        {phase === 'OPPONENT_RESPONSES' && (
          <span className="arena-status-text">
            {callerId === currentUserId
              ? '⏳ WAITING FOR OPPONENTS TO PLAY THEIR COUNTER...'
              : players[currentUserId]?.hasSubmitted
              ? '⏳ COUNTER SUBMITTED — WAITING FOR SHOWDOWN...'
              : `⚔️ BATTLE TRAIT: ${selectedCategory?.toUpperCase()} — SELECT A CARD TO PLAY!`}
          </span>
        )}
      </div>

      {isTwoPlayer && singleRival ? (
        /* ========================================================
           2-PLAYER ARENA CLASH: RIVAL CARD — VS EMBLEM — YOUR CARD
           ======================================================== */
        <div className="arena-duel-clash">
          {/* Opponent Card Slot on Left */}
          <div className="arena-card-slot">
            <div className={`slot-player-pill ${callerId === singleRival.id ? 'is-turn' : ''}`}>
              <span>{singleRival.name} {singleRival.isCpu ? '(BOT)' : ''}</span>
              <span className="slot-score">{singleRival.score} pts</span>
            </div>

            {isShowdown && submissions[singleRival.id]?.card ? (
              <CardView
                card={submissions[singleRival.id].card}
                highlightedStat={submissions[singleRival.id].statUsed || selectedCategory}
                isSelected={lastShowdown?.winnerIds.includes(singleRival.id)}
                isCompact={true}
              />
            ) : phase === 'OPPONENT_RESPONSES' && singleRival.id === callerId && callerCard ? (
              <CardView
                card={callerCard}
                highlightedStat={selectedCategory}
                hideStats={true}
                isCompact={true}
              />
            ) : singleRival.hasSubmitted && !isShowdown ? (
              <CardBackView label="READY" isCompact={true} />
            ) : (
              <CardBackView
                label={singleRival.id === callerId ? 'CALLING' : 'THINKING'}
                className="dimmed"
                isCompact={true}
              />
            )}
          </div>

          {/* Sleek Central VS Emblem */}
          <div className="arena-vs-badge">
            <span className="vs-badge-text">VS</span>
            {selectedCategory && (
              <span className="vs-badge-trait">{selectedCategory.toUpperCase()}</span>
            )}
          </div>

          {/* Player Card Slot on Right */}
          <div className="arena-card-slot">
            <div className={`slot-player-pill is-you ${callerId === currentUserId ? 'is-turn' : ''}`}>
              <span>YOU</span>
              <span className="slot-score">{players[currentUserId]?.score ?? 0} pts</span>
            </div>

            {isShowdown && submissions[currentUserId]?.card ? (
              <CardView
                card={submissions[currentUserId].card}
                highlightedStat={submissions[currentUserId].statUsed || selectedCategory}
                isSelected={lastShowdown?.winnerIds.includes(currentUserId)}
                isCompact={true}
              />
            ) : submissions[currentUserId]?.card ? (
              <CardView
                card={submissions[currentUserId].card}
                highlightedStat={submissions[currentUserId].statUsed || selectedCategory}
                isSelected={true}
                isCompact={true}
              />
            ) : (
              <CardBackView
                label={callerId === currentUserId ? 'YOUR MOVE' : 'SELECTING'}
                className="dimmed"
                isCompact={true}
              />
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           3-TO-10 PLAYER ARENA: ACTIVE TRAIT BADGE + MULTI-PLAYER GRID
           ======================================================== */
        <>
          {selectedCategory && (
            <div className="arena-active-stat-badge">
              <span className="stat-label">BATTLE TRAIT:</span>
              <span className="stat-name">{selectedCategory.toUpperCase()}</span>
            </div>
          )}

          <div className="arena-multi-grid">
            {allPlayers.map((p) => {
              const isCaller = p.id === callerId;
              const isYou = p.id === currentUserId;
              const subData = submissions[p.id];
              const hasPlayed = p.hasSubmitted || !!subData;

              return (
                <div key={p.id} className="arena-card-slot">
                  <div className={`slot-player-pill ${isYou ? 'is-you' : ''} ${isCaller ? 'is-turn' : ''}`}>
                    <span>{p.name} {isYou ? '(You)' : p.isCpu ? '(BOT)' : ''}</span>
                    <span className="slot-score">{p.score} pts</span>
                  </div>

                  {isShowdown && subData?.card ? (
                    <CardView
                      card={subData.card}
                      highlightedStat={subData.statUsed || selectedCategory}
                      isSelected={lastShowdown?.winnerIds.includes(p.id)}
                      isCompact={true}
                    />
                  ) : phase === 'OPPONENT_RESPONSES' && isCaller && callerCard ? (
                    <CardView
                      card={callerCard}
                      highlightedStat={selectedCategory}
                      hideStats={!isYou}
                      isCompact={true}
                    />
                  ) : hasPlayed ? (
                    isYou && subData?.card ? (
                      <CardView
                        card={subData.card}
                        highlightedStat={subData.statUsed || selectedCategory}
                        isSelected={true}
                        isCompact={true}
                      />
                    ) : (
                      <CardBackView label="READY" isCompact={true} />
                    )
                  ) : (
                    <CardBackView
                      label={isCaller ? 'CALLING' : 'THINKING'}
                      className="dimmed"
                      isCompact={true}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};