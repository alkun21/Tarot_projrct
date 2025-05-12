
// frontend/src/components/InterpretationContainer.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import './InterpretationContainer.css';
import { saveReading } from '../api/tarotApi';

function InterpretationContainer({ interpretationText, sessionId, selectedCards, userResponses }) {
  const [showFullInterpretation, setShowFullInterpretation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const displayedText = showFullInterpretation 
    ? interpretationText 
    : interpretationText.length > 500 
      ? interpretationText.substring(0, 500) + '...' 
      : interpretationText;

  const handleSaveReading = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему, чтобы сохранить чтение.');
      return;
    }
    
    try {
      setIsSaving(true);
      // Создаем название для чтения на основе первого вопроса
      const readingName = userResponses && userResponses[0] 
        ? `Чтение: ${userResponses[0].substring(0, 30)}${userResponses[0].length > 30 ? '...' : ''}`
        : 'Новое чтение Таро';
        
      // Создаем описание на основе карт
      const description = selectedCards 
        ? `Карты: ${selectedCards.map(card => card.name).join(', ')}`
        : '';
        
      const readingData = {
        cards: selectedCards,
        questions: userResponses,
        interpretation: interpretationText
      };
      
      const result = await saveReading(sessionId, readingName, description, readingData);
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Ошибка при сохранении чтения: ' + result.message);
      }
    } catch (error) {
      console.error('Ошибка при сохранении чтения:', error);
      alert('Произошла ошибка при сохранении чтения');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="interpretation-container">
      <div className="interpretation-bg"></div>
      <div className="interpretation-content">
        <h2 className="interpretation-title">Ваше чтение карт Таро</h2>
        
        <div 
          className={`interpretation-text ${showFullInterpretation ? 'full' : ''}`}
          dangerouslySetInnerHTML={{ __html: interpretationText }}
        />
        
        {!showFullInterpretation && interpretationText.length > 500 && (
          <button 
            className="show-more-btn"
            onClick={() => setShowFullInterpretation(true)}
          >
            Показать полное толкование
          </button>
        )}
        
        <div className="actions-container">
        <button 
                className="action-btn save-btn" 
                onClick={handleSaveReading}
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : saveSuccess ? 'Сохранено ✓' : 'Сохранить чтение'}
              </button>
              <button className="action-btn new-reading-btn" onClick={() => window.location.reload()}>
                Новое чтение
              </button>
        </div>
      </div>
    </div>
  );
}
export default InterpretationContainer;
