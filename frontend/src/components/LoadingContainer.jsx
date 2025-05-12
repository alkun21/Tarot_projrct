// frontend/src/components/LoadingContainer.jsx
import React from 'react';
import './LoadingContainer.css';

const LoadingContainer = ({ text }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="mystical-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-star"></div>
          <div className="spinner-moon"></div>
        </div>
        <p className="loading-text">{text || 'Загрузка...'}</p>
      </div>
    </div>
  );
};

export default LoadingContainer;