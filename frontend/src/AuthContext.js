// frontend/src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
const API_BASE_URL = '/api';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Проверяем авторизацию при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/check-auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
        setError('Ошибка при проверке авторизации');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    if (!user) { // Если пользователя нет в состоянии, проверяем авторизацию
      checkAuth();
    }
  }, []);  
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при входе');
      }
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', data.token);
      
      // Получаем данные профиля
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        setUser(profileData.user);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.message || 'Ошибка при входе');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (name, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    
    try {
        const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, confirm_password: confirmPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при регистрации');
      }
      
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Ошибка при регистрации');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Получение данных профиля
  const fetchProfile = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return { success: false, message: 'Не авторизован' };
      }
      
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Ошибка при получении профиля:', err);
      setError('Ошибка при получении профиля');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        fetchProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);