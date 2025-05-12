// frontend/src/components/TarotCardsContainer.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import './TarotCardsContainer.css';

const TarotCardsContainer = ({ 
  sessionId, 
  selectedCardIds, 
  selectedCards, 
  onCardSelect, 
  onGetInterpretation,
  readingDetail 
}) => {
  const [randomCards, setRandomCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCardAnimationComplete, setIsCardAnimationComplete] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const cardsContainerRef = useRef(null);
  const maxSelectedCards = 3;
  
  // Define arcAngle constant at component level so it's available to all functions
  const arcAngle = 160;

  // Fetch random subset of cards
  useEffect(() => {
    const fetchRandomCards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/random-subset-cards?count=20');
        if (!response.ok) {
          throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        
        // Add unique IDs to cards if they don't have them
        const cardsWithIds = data.cards.map((card, index) => ({
          ...card,
          id: card.id || `card-${index}`
        }));
        
        setRandomCards(cardsWithIds);
        
        // Delay to allow transition animations to complete
        setTimeout(() => {
          setIsCardAnimationComplete(true);
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching random cards:', error);
        // Fallback to mock cards
        const mockCards = Array(20).fill().map((_, i) => ({
          id: `card-${i}`,
          name: `Карта ${i+1}`,
          image: 'default-card.jpg',
          type: 'unknown'
        }));
        setRandomCards(mockCards);
        setTimeout(() => {
          setIsCardAnimationComplete(true);
          setIsLoading(false);
        }, 1500);
      }
    };

    fetchRandomCards();
  }, []);

  // Improved fan layout with smoother curve and better spacing
  const fanLayoutStyles = useMemo(() => {
    // Calculate angle step based on number of cards
    const angleStep = randomCards.length > 1 ? arcAngle / (randomCards.length - 1) : 0;
    // Larger radius for smoother arcs
    const radius = 350; 
    
    return randomCards.map((_, index) => {
      // Calculate angle for each card
      const angle = -arcAngle / 2 + index * angleStep;

      const xPos = Math.sin((angle * Math.PI) / 180) * radius;
      const yPos = -Math.cos((angle * Math.PI) / 180) * radius + radius * 0.1;
      const zIndex = randomCards.length - index;
      
      return {
        transform: `rotate(${angle}deg)`,
        zIndex: zIndex,
        transition: 'transform 0.5s ease, z-index 0.4s ease, box-shadow 0.3s ease',
        position: 'absolute',
        left: `calc(50% + ${xPos}px - 60px)`,
        top: `${yPos}px`,
        transformOrigin: 'center bottom',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        animationDelay: `${index * 50}ms`, // Cascading animation
        borderRadius: '10px',
        border: '1px solid rgba(255, 215, 255, 0.3)'
      };
    });
  }, [randomCards]);

  // Handle card click - select or deselect
  const handleCardClick = (card) => {
    if (!isCardAnimationComplete) return;
    
    // Check if card is already selected
    if (selectedCardIds.includes(card.id)) {
      console.log("Card already selected, skipping");
      return;
    }

    // Check if maximum cards are already selected
    if (selectedCardIds.length >= maxSelectedCards) {
      console.log("Already selected max cards, skipping");
      return;
    }

    onCardSelect(card);
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Enhanced card style with better hover effects
  const getCardStyle = (index, isSelected) => {
    if (!fanLayoutStyles[index]) return {};
    
    const style = { ...fanLayoutStyles[index] };
    
    // Enhanced hover and selection effects
    if (isSelected) {
      style.transform += ' translateY(-40px)';
      style.boxShadow = '0 15px 30px rgba(255, 215, 0, 0.5)';
      style.zIndex = 150; // Higher z-index for selected cards
      style.filter = 'brightness(1.2)';
      style.border = '2px solid gold';
    } else if (hoveredIndex === index) {
      const angleStep = randomCards.length > 1 ? arcAngle / (randomCards.length - 1) : 0;
      const baseRotation = -arcAngle / 2 + index * angleStep;
      style.transform = `translateY(-25px) rotate(${baseRotation}deg)`;
      style.zIndex = 120;
      style.boxShadow = '0 12px 24px rgba(157, 82, 222, 0.7)';
      style.cursor = 'pointer';
      style.filter = 'brightness(1.1)';
    }
    
    return style;
  };

  // Get card image path
  const getCardImagePath = (card) => {
    if (!card.image) return '/images/IMG_1063.WEBP';
    return `/static/images/tarot/${card.image}`;
  };

  // Start reading with selected cards
  const handleStartReading = () => {
    onGetInterpretation(readingDetail);
  };

  return (
    <div className="tarot-cards-container" ref={cardsContainerRef}>
      <div className="cards-selection-title">
        <h2>Выберите три карты для вашего расклада</h2>
        <p>Интуитивно выберите карты, которые вас привлекают</p>
      </div>
      
      {isLoading ? (
        <div className="loading-cards">
          <div className="spinner"></div>
          <p>Тасую колоду...</p>
        </div>
      ) : (
        <>
          {/* Improved tarot cards fan display */}
          <div className="cards-fan">
            {randomCards.map((card, index) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div 
                  key={card.id}
                  className={`tarot-card ${isSelected ? 'selected' : ''}`}
                  style={getCardStyle(index, isSelected)}
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="card-inner">
                    {isSelected ? (
                      <>
                        <img src={getCardImagePath(card)} alt={card.name} className="card-image" />
                        <div className="card-name">{card.name}</div>
                        <div className="selection-number">
                          {selectedCardIds.indexOf(card.id) + 1}
                        </div>
                      </>
                    ) : (
                      <div className="card-back">
                        <div className="card-back-design"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Selected cards display */}
          <div className="selected-cards-section">
            <div className="selected-cards">
              <h3 className="selected-title">Выбранные карты ({selectedCards.length}/{maxSelectedCards})</h3>
              <div className="selected-cards-container">
                {[0, 1, 2].map((index) => (
                  <div key={`slot-${index}`} className="card-slot">
                    {selectedCards[index] ? (
                      <div className="selected-card">
                        <img 
                          src={getCardImagePath(selectedCards[index])}
                          alt={selectedCards[index].name} 
                          className="selected-card-image"
                        />
                        <div className="selected-card-name">
                          {selectedCards[index].name}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-slot">
                        <div className="slot-number">{index + 1}</div>
                        <div className="slot-text">Выберите карту</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cards-controls">
            <div className="selected-cards-info">
              <p>Выбрано карт: {selectedCardIds.length} из 3</p>
              <p className="reading-detail-indicator">
                Уровень интерпретации: {readingDetail === 'detailed' ? 'Подробный' : 'Краткий'}
              </p>
            </div>
            
            <button 
              className={`interpret-btn ${selectedCardIds.length === 3 ? 'active' : ''}`}
              disabled={selectedCardIds.length !== 3}
              onClick={handleStartReading}
            >
              Получить интерпретацию
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TarotCardsContainer;