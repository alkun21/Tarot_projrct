// frontend/src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { useAuth } from '../AuthContext';
const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { login, register, isAuthenticated, loading } = useAuth();
  
  // Состояния для формы входа
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Состояния для формы регистрации
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Если пользователь уже авторизован, перенаправляем на профиль
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Сбрасываем сообщения об ошибках при переключении вкладок
    setLoginError('');
    setRegisterError('');
    setRegisterSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail || !loginPassword) {
      setLoginError('Пожалуйста, заполните все поля');
      return;
    }
    
    const result = await login(loginEmail, loginPassword);
    
    if (!result.success) {
      setLoginError(result.message || 'Ошибка при входе');
    } else {
      // Перенаправление на профиль произойдет автоматически через useEffect
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    
    if (!registerName || !registerEmail || !registerPassword || !registerConfirm) {
      setRegisterError('Пожалуйста, заполните все поля');
      return;
    }
    
    if (registerPassword !== registerConfirm) {
      setRegisterError('Пароли не совпадают');
      return;
    }
    
    // Проверка сложности пароля
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(registerPassword)) {
      setRegisterError('Пароль должен содержать минимум 8 символов, включая заглавные, строчные буквы и цифры');
      return;
    }
    
    const result = await register(registerName, registerEmail, registerPassword, registerConfirm);
    
    if (result.success) {
      setRegisterSuccess('Регистрация успешно завершена! Теперь вы можете войти в систему.');
      // Очищаем поля формы
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirm('');
      // Переключаемся на вкладку входа
      setTimeout(() => {
        setActiveTab('login');
      }, 2000);
    } else {
      setRegisterError(result.message || 'Ошибка при регистрации');
    }
  };

  // Если загрузка, показываем спиннер
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="container">
          <nav>
            <Link to="/" className="logo">
              <i className="fas fa-moon"></i> Mystic<span>Tarot</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="auth-section">
          <div className="mystical-bg">
            <div className="stars" id="stars"></div>
          </div>

          <div className="auth-container">
            <div className="tarot-card tarot-card-1"></div>
            <div className="tarot-card tarot-card-2"></div>

            <div className="auth-image">
              <div className="image-content">
                <div className="crystal-ball"></div>
                <h2>Добро пожаловать в мир Таро</h2>
                <p>
                  Раскройте тайны карт и получите глубокие личные предсказания с
                  помощью нашей ИИ-платформы
                </p>
              </div>
            </div>

            <div className="auth-forms">
              <div className="tabs">
                <div 
                  className={`tab ${activeTab === 'login' ? 'active' : ''}`} 
                  onClick={() => handleTabChange('login')}
                >
                  Вход
                </div>
                <div 
                  className={`tab ${activeTab === 'register' ? 'active' : ''}`} 
                  onClick={() => handleTabChange('register')}
                >
                  Регистрация
                </div>
              </div>

              <div className={`form-container ${activeTab === 'login' ? 'active' : ''}`}>
                <form onSubmit={handleLoginSubmit}>
                  {loginError && <div className="error-message">{loginError}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="login-email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="login-email"
                      className="form-input"
                      placeholder="Введите ваш email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password" className="form-label">Пароль</label>
                    <input
                      type="password"
                      id="login-password"
                      className="form-input"
                      placeholder="Введите ваш пароль"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <a href="#" className="forgot-password">Забыли пароль?</a>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Вход...' : 'Войти'}
                  </button>
                </form>
              </div>

              <div className={`form-container ${activeTab === 'register' ? 'active' : ''}`}>
                <form onSubmit={handleRegisterSubmit}>
                  {registerError && <div className="error-message">{registerError}</div>}
                  {registerSuccess && <div className="success-message">{registerSuccess}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="register-name" className="form-label">Имя</label>
                    <input
                      type="text"
                      id="register-name"
                      className="form-input"
                      placeholder="Введите ваше имя"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="register-email"
                      className="form-input"
                      placeholder="Введите ваш email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-password" className="form-label">Пароль</label>
                    <input
                      type="password"
                      id="register-password"
                      className="form-input"
                      placeholder="Создайте пароль"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-confirm" className="form-label">Подтверждение пароля</label>
                    <input
                      type="password"
                      id="register-confirm"
                      className="form-input"
                      placeholder="Подтвердите пароль"
                      value={registerConfirm}
                      onChange={(e) => setRegisterConfirm(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Регистрация...' : 'Создать аккаунт'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;