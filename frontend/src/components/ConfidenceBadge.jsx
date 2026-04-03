import React from 'react';

function ConfidenceBadge({ confidence }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  const getColor = () => {
    if (confidence >= 75) return '#10b981';
    if (confidence >= 50) return '#f59e0b';
    if (confidence >= 25) return '#f97316';
    return '#ef4444';
  };

  const getLabel = () => {
    if (confidence >= 75) return 'High';
    if (confidence >= 50) return 'Medium';
    if (confidence >= 25) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="confidence-badge" title={`AI Confidence: ${confidence}% (${getLabel()})`}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="confidence-value" style={{ color: getColor() }}>
        {confidence}%
      </div>
      <div className="confidence-label">{getLabel()}</div>
    </div>
  );
}

export default ConfidenceBadge;
