import React from 'react';
import ExplanationTag from './ExplanationTag';

function CandidateCard({ candidate, isAdmin, onReveal, revealData }) {
  const { rank, candidate_code, score, explanation } = candidate;

  const getRankClass = () => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const getRankBadgeClass = () => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  const getRankEmoji = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className={`candidate-card ${getRankClass()}`} style={{ animationDelay: `${(rank - 1) * 0.05}s` }}>
      <div className="candidate-header">
        <div className="candidate-info">
          <div className={`rank-badge ${getRankBadgeClass()}`}>
            {getRankEmoji()}
          </div>
          <div>
            <div className="candidate-code">{candidate_code}</div>
            <div className="candidate-score-label">Rank #{rank}</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          {isAdmin && !revealData && (
            <button
              className="btn-reveal"
              onClick={() => onReveal(candidate)}
            >
              👁️ Reveal Identity
            </button>
          )}
          <div className="score-display">
            <div className="score-value">{score}</div>
            <div className="score-label">Points</div>
          </div>
        </div>
      </div>

      {revealData && (
        <div className="reveal-info">
          <div className="row g-3">
            <div className="col-sm-4">
              <div className="info-label">Name</div>
              <div className="info-value">{revealData.name}</div>
            </div>
            <div className="col-sm-4">
              <div className="info-label">Email</div>
              <div className="info-value">{revealData.email}</div>
            </div>
            <div className="col-sm-4">
              <div className="info-label">Phone</div>
              <div className="info-value">{revealData.phone}</div>
            </div>
          </div>
        </div>
      )}

      <div className="explanation-tags">
        {explanation && explanation.map((item, index) => (
          <ExplanationTag key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

export default CandidateCard;
