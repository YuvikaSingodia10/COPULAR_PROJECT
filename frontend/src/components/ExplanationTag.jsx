import React from 'react';

function ExplanationTag({ item }) {
  const isMatched = item.matched;
  return (
    <span className={`explanation-tag ${isMatched ? 'matched' : 'unmatched'}`}>
      <i className={`bi ${isMatched ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
      {item.item}
      {item.points > 0 && <span className="ms-1">(+{item.points})</span>}
    </span>
  );
}

export default ExplanationTag;
