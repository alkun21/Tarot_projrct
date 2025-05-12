        document.addEventListener('DOMContentLoaded', function() {
            const leftCurtain = document.getElementById('leftCurtain');
            const rightCurtain = document.getElementById('rightCurtain');
            const stageContent = document.getElementById('stageContent');
            const openCurtainBtn = document.getElementById('openCurtainBtn');
            
            // Функция для открытия занавесов
            function openCurtains() {
                leftCurtain.classList.add('open');
                rightCurtain.classList.add('open');
                openCurtainBtn.classList.add('hidden');
                
                // Отображаем контент сцены через небольшую задержку
                setTimeout(() => {
                    stageContent.classList.add('visible');
                }, 1000);
            }
            
            // Обработчик события клика по кнопке
            openCurtainBtn.addEventListener('click', openCurtains);
            
            // Опционально: автоматическое открытие занавесов через определенное время
            // setTimeout(openCurtains, 2000);
            
            // Или можно открыть занавесы сразу при загрузке страницы
            // window.addEventListener('load', openCurtains);
        });
// Основные переменные
let currentSessionId = null;
let stageContentElement = null;
let cardsDrawn = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    stageContentElement = document.getElementById('stageContent');
    initializeApp();
    setupEventListeners();
});

// Инициализация приложения
async function initializeApp() {
    // Управление занавесом
    const openCurtainBtn = document.getElementById('openCurtainBtn');
    if (openCurtainBtn) {
        openCurtainBtn.addEventListener('click', () => {
            const leftCurtain = document.getElementById('leftCurtain');
            const rightCurtain = document.getElementById('rightCurtain');
            
            leftCurtain.classList.add('open');
            rightCurtain.classList.add('open');
            openCurtainBtn.classList.add('hidden');
            
            // Показать содержимое после анимации
            setTimeout(() => {
                stageContentElement.classList.add('visible');
            }, 1000);
        });
    }

    // Начать новую сессию Таро при загрузке страницы
    const beginBtn = document.querySelector('.begin-btn');
    if (beginBtn) {
        beginBtn.addEventListener('click', startTarotReading);
    }
}

// Настройка всех слушателей событий
function setupEventListeners() {
    // Добавить слушатели событий для выпадающего списка
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', handleSelectionChange);
    }
}

// Обработка изменения метода выбора карт
function handleSelectionChange(event) {
    const selection = event.target.value;
    // Здесь можно добавить логику в зависимости от выбранного метода
    console.log(`Выбран метод: ${selection}`);
}

// Начать новое чтение Таро
async function startTarotReading() {
    try {
        // Создаем новую сессию на стороне бэкенда
        const response = await fetch('http://localhost:8000/api/new-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Не удалось создать сессию');
        
        const sessionData = await response.json();
        currentSessionId = sessionData.session_id;
        
        // Переходим к экрану чтения
        showReadingInterface(sessionData);
    } catch (error) {
        console.error('Ошибка при начале чтения:', error);
        showErrorMessage('Не удалось подключиться к серверу. Пожалуйста, попробуйте позже.');
    }
}

// Отправить сообщение тарологу
async function sendMessage(message) {
    try {
        const response = await fetch(`http://localhost:8000/api/session/${currentSessionId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) throw new Error('Ошибка при отправке сообщения');
        
        const data = await response.json();
        updateChatInterface(data);
        
        // Если нужно вытянуть карты
        if (data.cards_to_draw > 0) {
            showCardSelection(data.cards_to_draw);
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        showErrorMessage('Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.');
    }
}

// Вытянуть карту
async function drawCard() {
    try {
        const response = await fetch(`http://localhost:8000/api/draw-card`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                session_id: currentSessionId,
                seed: Math.random().toString()
            })
        });
        
        if (!response.ok) throw new Error('Ошибка при вытягивании карты');
        
        const data = await response.json();
        cardsDrawn.push(data.card);
        
        updateCardDisplay();
        return data.card;
    } catch (error) {
        console.error('Ошибка при вытягивании карты:', error);
        showErrorMessage('Не удалось вытянуть карту.');
        return null;
    }
}

// Отправить выбранные карты
async function submitCards() {
    try {
        const response = await fetch(`http://localhost:8000/api/session/${currentSessionId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cards: cardsDrawn })
        });
        
        if (!response.ok) throw new Error('Ошибка при отправке карт');
        
        const data = await response.json();
        cardsDrawn = []; // Очистить выбранные карты
        updateChatInterface(data);
    } catch (error) {
        console.error('Ошибка при отправке карт:', error);
        showErrorMessage('Не удалось отправить выбранные карты.');
    }
}

// Показать интерфейс чтения
function showReadingInterface(sessionData) {
    // Очищаем главную сцену
    stageContentElement.innerHTML = '';
    
    // Создаем интерфейс чтения
    const readingInterface = document.createElement('div');
    readingInterface.className = 'reading-interface';
    
    // Добавляем аватар таролога
    readingInterface.innerHTML = `
        <div class="reading-header">
            <div class="tarot-reader-small">
                <img src="/api/placeholder/80/100" alt="Таролог" class="reader-image-small">
                <div class="reader-name">Кассандра</div>
            </div>
            <h2>Чтение Таро</h2>
        </div>
        
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages"></div>
            
            <div class="card-area" id="cardArea"></div>
            
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="Введите ваш вопрос...">
                <button id="sendBtn">Отправить</button>
            </div>
        </div>
    `;
    
    stageContentElement.appendChild(readingInterface);
    
    // Добавляем первое сообщение от ассистента
    if (sessionData.messages && sessionData.messages.length > 0) {
        const firstMessage = sessionData.messages.find(msg => msg.role === 'assistant');
        if (firstMessage) {
            addMessage('assistant', firstMessage.content);
        }
    }
    
    // Настраиваем обработчики событий
    document.getElementById('sendBtn').addEventListener('click', () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message) {
            addMessage('user', message);
            sendMessage(message);
            messageInput.value = '';
        }
    });
    
    // Отправка сообщения по нажатию Enter
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('sendBtn').click();
        }
    });
}

// Добавить сообщение в чат
function addMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${role}-message`;
    messageElement.innerHTML = `
        <div class="message-content">${content}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Обновить интерфейс чата после получения ответа
function updateChatInterface(data) {
    if (data.message) {
        addMessage('assistant', data.message);
    }
    
    // Отображение вопросов, если они есть
    if (data.questions && data.questions.length > 0) {
        const questionsContainer = document.createElement('div');
        questionsContainer.className = 'suggested-questions';
        
        data.questions.forEach(question => {
            const questionBtn = document.createElement('button');
            questionBtn.className = 'question-btn';
            questionBtn.textContent = question;
            questionBtn.addEventListener('click', () => {
                addMessage('user', question);
                sendMessage(question);
            });
            questionsContainer.appendChild(questionBtn);
        });
        
        document.getElementById('chatMessages').appendChild(questionsContainer);
    }
}

// Показать интерфейс выбора карт
function showCardSelection(numCards) {
    const cardArea = document.getElementById('cardArea');
    cardArea.innerHTML = '';
    
    const cardSelectionElement = document.createElement('div');
    cardSelectionElement.className = 'card-selection-area';
    cardSelectionElement.innerHTML = `
        <h3>Выберите ${numCards} ${numCards === 1 ? 'карту' : 'карты'}</h3>
        <div class="card-deck">
            <button id="drawCardBtn" class="draw-card-btn">Вытянуть карту</button>
        </div>
        <div class="drawn-cards" id="drawnCards"></div>
        <button id="submitCardsBtn" class="submit-cards-btn" disabled>Подтвердить выбор</button>
    `;
    
    cardArea.appendChild(cardSelectionElement);
    
    // Настраиваем кнопки
    document.getElementById('drawCardBtn').addEventListener('click', async () => {
        await drawCard();
        
        if (cardsDrawn.length >= numCards) {
            document.getElementById('drawCardBtn').disabled = true;
        }
        
        document.getElementById('submitCardsBtn').disabled = cardsDrawn.length < numCards;
    });
    
    document.getElementById('submitCardsBtn').addEventListener('click', () => {
        submitCards();
        cardArea.innerHTML = '';
    });
}

// Обновить отображение вытянутых карт
function updateCardDisplay() {
    const drawnCardsElement = document.getElementById('drawnCards');
    if (!drawnCardsElement) return;
    
    drawnCardsElement.innerHTML = '';
    
    cardsDrawn.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'tarot-card';
        cardElement.innerHTML = `
            <div class="card-image">
                <img src="/api/placeholder/100/150" alt="${card}">
            </div>
            <div class="card-name">${card}</div>
        `;
        drawnCardsElement.appendChild(cardElement);
    });
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}