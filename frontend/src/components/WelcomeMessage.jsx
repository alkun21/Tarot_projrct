// frontend/src/components/WelcomeMessage.jsx
import React from 'react';
import './WelcomeMessage.css';
const WelcomeMessage = ({ message, onContinue, readingDetail, onChangeReadingDetail }) => {
  return (
    <div className="welcome-message-container">
      <div className="welcome-message-content">
        <h2 className="welcome-title">Добро пожаловать в мир Таро</h2>
        {message && <p className="welcome-text">{message}</p>}
        <p className="welcome-description">
          Сейчас вам будет предложено ответить на три вопроса, которые помогут нам точнее интерпретировать карты Таро.
          Ваши ответы повлияют на глубину и точность предсказания.
        </p>
        <div className="reading-preference">
          <h3>Выберите тип интерпретации:</h3>
          
          <div className="reading-options">
            <div 
              className={`reading-option ${readingDetail === 'detailed' ? 'selected' : ''}`}
              onClick={() => onChangeReadingDetail('detailed')}
            >
              <div className="option-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <h4>Подробная</h4>
              <p>Полная интерпретация с детальным анализом символов и взаимосвязей между картами</p>
            </div>
            
            <div 
              className={`reading-option ${readingDetail === 'brief' ? 'selected' : ''}`}
              onClick={() => onChangeReadingDetail('brief')}
            >
              <div className="option-icon">
                <i className="fas fa-feather"></i>
              </div>
              <h4>Краткая</h4>
              <p>Сжатая интерпретация с акцентом на ключевые аспекты и практические советы</p>
            </div>
          </div>
        </div>
        
        <button className="continue-btn" onClick={onContinue}>
          Продолжить к вопросам
        </button>
      </div>
    </div>
  );
};

export default WelcomeMessage;