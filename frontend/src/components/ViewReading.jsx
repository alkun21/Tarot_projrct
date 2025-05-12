import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './ViewReading.css';

const ViewReading = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Проверяем аутентификацию
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchReading = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Получаем данные чтения с сервера
        const response = await fetch(`/api/user/readings/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setReading(data.reading);
        } else {
          setError(data.message || 'Не удалось загрузить чтение');
          setTimeout(() => {
            navigate('/profile');
          }, 3000);
        }
      } catch (err) {
        console.error('Ошибка при загрузке чтения:', err);
        setError('Ошибка при загрузке чтения');
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchReading();
    } else {
      // Если ID не указан, перенаправляем на профиль
      navigate('/profile');
    }
  }, [isAuthenticated, navigate, id]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка чтения...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <p>Перенаправление на страницу профиля...</p>
      </div>
    );
  }
  
  if (!reading) {
    return (
      <div className="error-container">
        <h2>Чтение не найдено</h2>
        <p>Перенаправление на страницу профиля...</p>
      </div>
    );
  }
  
  // Извлекаем данные из reading_data
  const { cards, questions, interpretation } = reading.reading_data || {};
  
  return (
    <>
      <div className="stars-bg" id="stars"></div>
      
      <header>
        <div className="container">
          <nav>
            <Link to="/" className="logo">
              <i className="fas fa-moon"></i> Mystic<span>Tarot</span>
            </Link>
            <div className="nav-links">
              <Link to="/profile">Назад в профиль</Link>
            </div>
          </nav>
        </div>
      </header>
      
      <main>
        <div className="container">
          <div className="reading-view">
            <div className="reading-header">
              <h1>{reading.reading_name}</h1>
              <p className="reading-timestamp">{reading.date} в {reading.time}</p>
            </div>
            
            {questions && questions.length > 0 && (
              <div className="reading-questions card">
                <h2>Ваши вопросы</h2>
                <ol>
                  {questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {cards && cards.length > 0 && (
              <div className="reading-cards card">
                <h2>Выбранные карты</h2>
                <div className="cards-container">
                  {cards.map((card, index) => (
                    <div className="card-item" key={index}>
                      <img 
                        src={card.image_url || `/images/cards/${card.name.toLowerCase().replace(/ /g, '_')}.jpg`} 
                        alt={card.name} 
                        className="card-image" 
                      />
                      <p className="card-name">{card.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="reading-interpretation card">
              <h2>Интерпретация</h2>
              <div 
                className="interpretation-text"
                dangerouslySetInnerHTML={{ __html: interpretation }}
              />
            </div>
            
            <div className="reading-actions">
              <Link to="/" className="btn btn-primary">Новое гадание</Link>
              <Link to="/profile" className="btn btn-outline">Вернуться в профиль</Link>
            </div>
          </div>
        </div>
      </main>
      
      <footer>
        <div className="container">
          <p>&copy; 2025 MysticTarot. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
};

export default ViewReading;