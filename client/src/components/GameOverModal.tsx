import React from 'react';
import type { PlayerState } from '../types/game';
import '../styles/game.css';

interface GameOverModalProps {
  winners: PlayerState[];
  highestScore: number;
  allPlayers: Record<string, PlayerState>;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winners,
  highestScore,
  allPlayers,
  onPlayAgain,
}) => {
  const sortedLeaderboard = Object.values(allPlayers).sort((a, b) => b.score - a.score);

  return (
    <div className="modal-backdrop">
      <div className="game-over-modal">
        <h2 style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>MATCH CONCLUDED</h2>
        <div className="winner-name">
          🏆 {winners.map((w) => w.name).join(', ')} Wins!
        </div>
        <p style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
          Top Score: {highestScore} pts
        </p>

        <ul className="leaderboard-list">
          {sortedLeaderboard.map((player, rank) => (
            <li key={player.id} className="leaderboard-item">
              <span>
                <strong>#{rank + 1}</strong> {player.name} {player.isCpu ? '(BOT)' : ''}
              </span>
              <span style={{ fontWeight: 700 }}>{player.score} pts</span>
            </li>
          ))}
        </ul>

        <button className="btn-primary" onClick={onPlayAgain} style={{ width: '100%', marginTop: '12px' }}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
};