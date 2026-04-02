import React from 'react';

function ExplanationTag({ item }) {
  const getClass = () => {
    if (item.bonus) return 'bonus';
    return item.matched ? 'matched' : 'missed';
  };

  const getIcon = () => {
    if (item.bonus) return '⭐';
    return item.matched ? '✔' : '✘';
  };

  const getLabel = () => {
    const name = item.item.charAt(0).toUpperCase() + item.item.slice(1);
    if (item.bonus) return `${name} (bonus)`;
    return item.matched ? `${name} matched` : `${name} missing`;
  };

  return (
    <span className={`explanation-tag ${getClass()}`}>
      <span>{getIcon()}</span>
      {getLabel()}
      {item.points > 0 && (
        <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>+{item.points}</span>
      )}
    </span>
  );
}

export default ExplanationTag;
