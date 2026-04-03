import React from 'react';

function LoadingSpinner({ message = 'Processing...' }) {
  return (
    <div className="loading-overlay" id="loading-spinner">
      <div className="spinner-ring"></div>
      <div className="loading-text">{message}</div>
    </div>
  );
}

export default LoadingSpinner;
