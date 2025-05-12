// frontend/src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Profile.css'; 
import { useAuth } from '../AuthContext';
import { getUserReadings, deleteReading } from '../api/tarotApi';

const Profile = () => {
  const { user, loading, isAuthenticated, logout, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [aiReadings, setAiReadings] = useState([]);
  const [userReadings, setUserReadings] = useState([]);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchUserData();
    }
  }, [isAuthenticated]);
  
  // Функция для получения данных пользователя с сервера
  const fetchUserData = async () => {
    setIsLoadingReadings(true);
    try {
      // Получаем историю гаданий
      const readingsData = await getUserReadings(10, 0);
      
      if (readingsData.success) {
        // Разделяем чтения на ИИ-интерпретации и Пользовательские расклады
        const ai = [];
        const user = [];
        
        readingsData.readings.forEach(reading => {
          if (reading.reading_data && reading.reading_data.isAiGenerated) {
            ai.push(reading);
          } else {
            user.push(reading);
          }
        });
        
        setAiReadings(ai);
        setUserReadings(user);
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
    } finally {
      setIsLoadingReadings(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleDeleteReading = async (readingId) => {
    if (window.confirm('Вы уверены, что хотите удалить это чтение?')) {
      setDeleteInProgress(true);
      try {
        const result = await deleteReading(readingId);
        if (result.success) {
          // Обновляем списки после удаления
          setAiReadings(prev => prev.filter(reading => reading.id !== readingId));
          setUserReadings(prev => prev.filter(reading => reading.id !== readingId));
        } else {
          alert('Ошибка при удалении чтения: ' + result.message);
        }
      } catch (error) {
        console.error('Ошибка при удалении чтения:', error);
      } finally {
        setDeleteInProgress(false);
      }
    }
  };
  
  const viewReading = (reading) => {
    // Сохраняем выбранное чтение в localStorage для просмотра на отдельной странице
    localStorage.setItem('viewReading', JSON.stringify(reading));
    navigate('/view-reading/' + reading.id);
  };

  // Показываем индикатор загрузки, пока данные загружаются
  if (loading || !user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <>
      <div className="stars-bg" id="stars"></div>

      <header>
        <div className="container">
          <nav>
            <Link to="/" className="logo">
              <i className="fas fa-moon"></i> Mystic<span>Tarot</span>
            </Link>
            <div className="user-actions">
              <div className="user-avatar">{user.avatar || user.name.charAt(0).toUpperCase()}</div>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          <div className="dashboard-header">
            <div className="dashboard-title">
              <div>
                <h1>Личный кабинет</h1>
                <p className="dashboard-subtitle">
                  Добро пожаловать, {user.name.split(' ')[0]}! Здесь вы можете управлять своими
                  гаданиями и настройками профиля.
                </p>
              </div>
              <Link to="/" className="btn btn-primary">Новое гадание</Link>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="main-content">
              <div className="card">
                <div className="card-header">
                  <h2>Ваши сохраненные расклады</h2>
                </div>
                <div className="reading-history">
                  {isLoadingReadings ? (
                    <div className="loading-spinner">Загрузка раскладов...</div>
                  ) : userReadings.length > 0 ? (
                    userReadings.map(reading => (
                      <div className="reading-item" key={reading.id}>
                        <div className="reading-icon">
                          <i className={`fas fa-${reading.icon || 'book'}`}></i>
                        </div>
                        <div className="reading-details">
                          <h3>{reading.name}</h3>
                          <p>{reading.description || 'Пользовательский расклад'}</p>
                          <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                            {reading.date} в {reading.time}
                          </p>
                        </div>
                        <div className="reading-actions">
                          <button className="action-btn" onClick={() => viewReading(reading)}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="action-btn" 
                            onClick={() => handleDeleteReading(reading.id)}
                            disabled={deleteInProgress}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">У вас пока нет пользовательских раскладов</p>
                  )}
                </div>
              </div>
            </div>

            <div className="sidebar">
              <div className="card">
                <div className="user-profile">
                  <div className="profile-avatar">{user.avatar || user.name.charAt(0).toUpperCase()}</div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <div className="profile-actions">
                    <button onClick={handleLogout} className="btn btn-outline">Выйти</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* <footer>
        <div className="container">
          <p>&copy; 2025 MysticTarot. Все права защищены.</p>
        </div>
      </footer> */}
    </>
  );
};

export default Profile;