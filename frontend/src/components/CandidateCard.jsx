import React from 'react';
import ExplanationTag from './ExplanationTag';
import ConfidenceBadge from './ConfidenceBadge';

function CandidateCard({ candidate, isAdmin, onReveal, revealData, onStatusChange, onOverride }) {
  const { rank, candidate_code, score, confidence_score, status, explanation } = candidate;

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

  const getStatusColor = () => {
    switch (status) {
      case 'shortlisted': return { bg: 'rgba(108, 60, 224, 0.15)', color: '#8b5cf6', border: 'rgba(108, 60, 224, 0.3)' };
      case 'accepted': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'var(--border-color)' };
    }
  };

  const statusStyle = getStatusColor();

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
          <span
            className="status-badge"
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {(status || 'pending').toUpperCase()}
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <ConfidenceBadge confidence={parseFloat(confidence_score) || 0} />
          <div className="score-display">
            <div className="score-value">{score}</div>
            <div className="score-label">Points</div>
          </div>
        </div>
      </div>

      {/* Action Buttons — Human in the loop */}
      <div className="candidate-actions">
        {status !== 'shortlisted' && status !== 'accepted' && (
          <button
            className="action-btn shortlist"
            onClick={() => onStatusChange(candidate_code, 'shortlisted')}
          >
            ⭐ Shortlist
          </button>
        )}
        {status !== 'accepted' && (
          <button
            className="action-btn accept"
            onClick={() => onStatusChange(candidate_code, 'accepted')}
          >
            ✔ Accept
          </button>
        )}
        {status !== 'rejected' && (
          <button
            className="action-btn reject"
            onClick={() => onStatusChange(candidate_code, 'rejected')}
          >
            ✘ Reject
          </button>
        )}
        <button
          className="action-btn override"
          onClick={() => onOverride(candidate)}
          title="Override this candidate's ranking"
        >
          🚩 Override
        </button>
        {isAdmin && !revealData && (
          <button
            className="btn-reveal"
            onClick={() => onReveal(candidate)}
          >
            👁️ Reveal
          </button>
        )}
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
