const API_BASE_URL = '/api';

export const createSession = async () => {
  const response = await fetch(`${API_BASE_URL}/new-session`, {
    method: 'POST'
  });
  return response.json();
};

export const submitQuestions = async (sessionId, responses) => {
  const response = await fetch(`${API_BASE_URL}/submit-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      session_id: sessionId,
      responses: responses
    })
  });
  return response.json();
};

export const getCards = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
};

export const getInterpretation = async (sessionId, cards, detail = 'detailed') => {
  const response = await fetch(`${API_BASE_URL}/draw-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      session_id: sessionId,
      cards: cards,
      detail: detail
    })
  });
  return response.json();
};

export const saveReading = async (sessionId, readingName, description, readingData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }
    
    const response = await fetch(`${API_BASE_URL}/save-reading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        reading_name: readingName,
        description: description,
        reading_data: readingData
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error saving reading:', error);
    return { success: false, message: 'Ошибка при сохранении чтения' };
  }
};

export const getUserReadings = async (limit = 10, offset = 0) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }
    
    const response = await fetch(`${API_BASE_URL}/user/readings?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user readings:', error);
    return { success: false, message: 'Ошибка при получении истории чтений' };
  }
};

export const getReading = async (readingId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }
    
    const response = await fetch(`${API_BASE_URL}/user/readings/${readingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reading:', error);
    return { success: false, message: 'Ошибка при получении чтения' };
  }
};

export const deleteReading = async (readingId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Пользователь не авторизован' };
    }
    
    const response = await fetch(`${API_BASE_URL}/user/readings/${readingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting reading:', error);
    return { success: false, message: 'Ошибка при удалении чтения' };
  }
};