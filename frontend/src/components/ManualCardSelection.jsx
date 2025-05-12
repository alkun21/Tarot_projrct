// frontend/src/components/ManualCardSelection.jsx
import React, { useState, useEffect } from 'react';
import './ManualCardSelection.css';

function ManualCardSelection({ sessionId, allCards, onComplete, readingDetail, onReadingDetailChange }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState([]);
  const [localReadingDetail, setLocalReadingDetail] = useState(readingDetail);

  // Debug initial props
  console.log('ManualCardSelection инициализирован с allCards:', allCards);
  console.log('Initial readingDetail:', readingDetail);
  
  // Check if cards have ids
  useEffect(() => {
    if (Array.isArray(allCards) && allCards.length > 0) {
      console.log("Проверка первой карты:", allCards[0]);
      console.log("ID первой карты:", allCards[0].id);
    }
  }, [allCards]);

  useEffect(() => {
    if (Array.isArray(allCards)) {
      setFilteredCards(
        allCards.filter(card => 
          card.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      console.error('allCards не является массивом:', allCards);
      setFilteredCards([]);
    }
  }, [searchTerm, allCards]);

  useEffect(() => {
    // Update local state when prop changes
    setLocalReadingDetail(readingDetail);
  }, [readingDetail]);

  const handleCardSelect = (card) => {
    // Debug info
    console.log("Попытка выбрать карту:", card);
    
    // Enhanced logging to debug card structure
    console.log("Тип карты:", typeof card);
    console.log("Свойства карты:", Object.keys(card));
    
    // Check if the card is a valid object
    if (!card || typeof card !== 'object') {
      console.error("Карта не является объектом:", card);
      return;
    }
    
    // Check if the card has an id property
    if (card.id === undefined) {
      console.error("Карта не имеет ID:", card);
      
      // If no ID but we have a name, we can generate an ID
      if (card.name) {
        card = { ...card, id: `generated-${card.name.replace(/\s+/g, '-').toLowerCase()}` };
        console.log("Сгенерирован ID для карты:", card.id);
      } else {
        return;
      }
    }
    
    // Create a safe copy of the current selected cards
    const currentSelected = [...selectedCards];
    
    // Check if this card is already selected - use strict equality on id
    const cardIndex = currentSelected.findIndex(c => c.id === card.id);
    
    if (cardIndex !== -1) {
      // Card is already selected, remove it
      currentSelected.splice(cardIndex, 1);
      console.log("Удаление карты. ID:", card.id);
    } else if (currentSelected.length < 3) {
      // Card is not selected and we have room, add it
      currentSelected.push(card);
      console.log("Добавление карты. ID:", card.id);
    } else {
      // Already have 3 cards
      alert('Вы уже выбрали 3 карты. Удалите одну, чтобы выбрать другую.');
      return;
    }
    
    // Update state with the new selection
    console.log("Новый список выбранных карт:", currentSelected);
    setSelectedCards(currentSelected);
  };

  const handleReadingDetailChange = (value) => {
    console.log("Changing reading detail to:", value);
    setLocalReadingDetail(value);
    // Pass the change up to the parent component
    if (onReadingDetailChange) {
      onReadingDetailChange(value);
    }
  };

  const handleSubmit = () => {
    if (selectedCards.length !== 3) {
      alert('Пожалуйста, выберите 3 карты.');
      return;
    }
    // Pass both selected cards and reading detail to ensure consistency
    onComplete(selectedCards, localReadingDetail);
  };

  // Function to check if a card is selected - using strict equality with id
  const isCardSelected = (card) => {
    if (!card || !card.id) return false;
    return selectedCards.some(selectedCard => selectedCard.id === card.id);
  };

  return (
    <div className="manual-card-selection">
      <h2>Укажите карты, которые вам выпали</h2>
      <p>Выберите 3 карты из списка ниже:</p>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск карт..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="selected-cards-preview">
        <h3>Выбранные карты ({selectedCards.length}/3):</h3>
        <div className="selected-cards-container">
          {selectedCards.map((card, index) => (
            <div key={`selected-${card.id || index}`} className="selected-card-item">
              <img 
                src={`/static/images/tarot/${card.image}`} 
                alt={card.name} 
                className="selected-card-image"
              />
              <span>{card.name}</span>
              <button 
                className="remove-card-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardSelect(card);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - selectedCards.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="empty-card-slot">
              <div className="empty-card-placeholder">
                <span>Выберите карту</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cards-list">
        {Array.isArray(filteredCards) && filteredCards.length > 0 ? (
          filteredCards.map((card, index) => {
            // Ensure card has an id
            const cardId = card.id || `card-${index}`;
            const cardWithId = card.id ? card : { ...card, id: cardId };
            
            return (
              <div 
                key={`list-card-${cardId}`} 
                className={`card-list-item ${isCardSelected(cardWithId) ? 'selected' : ''}`}
                onClick={() => handleCardSelect(cardWithId)}
              >
                <img 
                  src={`/static/images/tarot/${card.image}`} 
                  alt={card.name} 
                  className="card-thumbnail"
                />
                <span className="card-name">{card.name}</span>
              </div>
            );
          })
        ) : (
          <div className="no-cards-message">
            Карты не найдены. Проверьте поисковый запрос или обновите страницу.
          </div>
        )}
      </div>

      <div className="manual-selection-controls">
        <div className="reading-detail-selector">
          <label>Детализация расклада:</label>
          <select 
            value={localReadingDetail}
            onChange={(e) => handleReadingDetailChange(e.target.value)}
          >
            <option value="detailed">Подробный</option>
            <option value="brief">Краткий</option>
          </select>
        </div>
        <button 
          className="submit-cards-btn" 
          onClick={handleSubmit}
          disabled={selectedCards.length !== 3}
        >
          Получить интерпретацию
        </button>
      </div>
    </div>
  );
}

export default ManualCardSelection;