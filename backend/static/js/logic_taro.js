document.addEventListener('DOMContentLoaded', function() {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    const leftCurtain = document.getElementById('leftCurtain');
    const rightCurtain = document.getElementById('rightCurtain');
    const stageContent = document.getElementById('stageContent');
    const openCurtainBtn = document.getElementById('openCurtainBtn');
    const beginReadingBtn = document.getElementById('beginReadingBtn');
    const readingType = document.getElementById('readingType');
    const questionInterface = document.getElementById('questionInterface');
    const questionBox = document.getElementById('questionBox');
    const questionInput = document.getElementById('questionInput');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const tarotCardsContainer = document.getElementById('tarotCardsContainer');
    const tarotCards = document.getElementById('tarotCards');
    const selectedCardsDisplay = document.getElementById('selectedCardsDisplay');
    const selectedCardsGrid = document.getElementById('selectedCardsGrid');
    const interpretationContainer = document.getElementById('interpretationContainer');
    const interpretationText = document.getElementById('interpretationText');
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingText = document.getElementById('loadingText');
    if (openCurtainBtn) {
        console.log("openCurtainBtn найдена");
        openCurtainBtn.addEventListener('click', openCurtains);
    } else {
        console.error("openCurtainBtn не найдена!");
    }
    
    if (beginReadingBtn) {
        console.log("beginReadingBtn найдена");
        beginReadingBtn.addEventListener('click', beginReading);
    } else {
        console.error("beginReadingBtn не найдена!");
    }
    
    if (nextQuestionBtn) {
        console.log("nextQuestionBtn найдена");
        nextQuestionBtn.addEventListener('click', nextQuestion);
    } else {
        console.error("nextQuestionBtn не найдена!");
    }
    
    if (prevQuestionBtn) {
        console.log("prevQuestionBtn найдена");
        prevQuestionBtn.addEventListener('click', prevQuestion);
    } else {
        console.error("prevQuestionBtn не найдена!");
    }
    let sessionId = null;
    let currentQuestion = 1;
    const userResponses = ['', '', ''];
    let selectedCardIds = [];
    const selectedCards = [];
    const maxSelectedCards = 3;
    
    function openCurtains() {
        leftCurtain.classList.add('open');
        rightCurtain.classList.add('open');
        openCurtainBtn.classList.add('hidden');
        
        setTimeout(() => {
            stageContent.classList.add('visible');
            stageContent.style.overflow = 'visible';
            document.body.style.overflow = 'auto';
        }, 1000);
    }
    
    function beginReading() {
    console.log("beginReading вызвана");
    const selectedType = readingType.value;
    
    document.querySelector('.card-selection').style.display = 'none';
    document.querySelector('.tarot-reader').style.display = 'none';
    document.querySelector('.stage-title').style.display = 'none';
    document.querySelector('.stage-subtitle').style.display = 'none';
    
    loadingContainer.style.display = 'flex';
    loadingText.textContent = 'Создание новой сессии...';

    fetch('/api/new-session', {
        method: 'POST'
    })
    .then(response => {
        console.log("Ответ от /api/new-session получен:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Данные сессии:", data);
        sessionId = data.session_id;
        setTimeout(() => {
            loadingContainer.style.display = 'none';
            
            if (selectedType === 'ai') {
                console.log("Показываю интерфейс вопросов");
                questionInterface.style.display = 'block';
                updateQuestionInterface();
            } else {
                // Логика для персональных раскладов
                console.log("Персональные расклады");
            }
        }, 1500);
    })
    .catch(error => {
        console.error('Ошибка при создании сессии:', error);
        loadingContainer.style.display = 'none';
        alert('Произошла ошибка при подключении к серверу.');
    });
}

function nextQuestion() {
    console.log("nextQuestion вызвана, текущий вопрос:", currentQuestion);
    userResponses[currentQuestion - 1] = questionInput.value;
    
    if (currentQuestion === 3) {
        questionInterface.style.display = 'none';
        
        loadingContainer.style.display = 'flex';
        loadingText.textContent = 'Подготовка карт Таро...';
        
        fetch('/api/submit-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                responses: userResponses
            })
        })
        .then(response => {
            console.log("Ответ от /api/submit-questions получен:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Данные вопросов отправлены:", data);
            setTimeout(() => {
                loadingContainer.style.display = 'none';
                
                console.log("Показываю карты Таро");
                showTarotCards();
            }, 1500);
        })
        .catch(error => {
            console.error('Ошибка при отправке ответов:', error);
            loadingContainer.style.display = 'none';
            alert('Произошла ошибка при подключении к серверу.');
        });
    } else {
        currentQuestion++;
        updateQuestionInterface();
    }
}   
    function updateQuestionInterface() {
        const questionTitle = questionBox.querySelector('.question-title');
        const questionText = questionBox.querySelector('.question-text');
        
        questionTitle.textContent = `Вопрос ${currentQuestion} из 3`;
        questionInput.value = userResponses[currentQuestion - 1];
        
        prevQuestionBtn.style.display = currentQuestion === 1 ? 'none' : 'block';
        
        switch(currentQuestion) {
            case 1:
                questionText.textContent = 'Какой главный вопрос вы хотели бы задать картам?';
                break;
            case 2:
                questionText.textContent = 'Есть ли какие-то конкретные области вашей жизни, о которых вы хотите узнать?';
                break;
            case 3:
                questionText.textContent = 'Что вы чувствуете в данный момент?';
                nextQuestionBtn.textContent = 'Завершить';
                break;
            default:
                questionText.textContent = 'Поделитесь вашими мыслями.';
        }
    }
    
    function nextQuestion() {
        userResponses[currentQuestion - 1] = questionInput.value;
        
        if (currentQuestion === 3) {
            questionInterface.style.display = 'none';
            
            loadingContainer.style.display = 'flex';
            loadingText.textContent = 'Подготовка карт Таро...';
            
            fetch('/api/submit-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    responses: userResponses
                })
            })
            .then(response => response.json())
            .then(data => {
                setTimeout(() => {
                    loadingContainer.style.display = 'none';
                    
                    showTarotCards();
                }, 1500);
            })
            .catch(error => {
                console.error('Ошибка при отправке ответов:', error);
                loadingContainer.style.display = 'none';
                alert('Произошла ошибка при подключении к серверу.');
            });
        } else {
            currentQuestion++;
            updateQuestionInterface();
        }
    }
    
    function prevQuestion() {
        userResponses[currentQuestion - 1] = questionInput.value;
        currentQuestion--;
        updateQuestionInterface();
    }
// backend/static/js/logic_taro.js
    function showTarotCards() {
        console.log("showTarotCards вызвана");
        tarotCardsContainer.classList.remove('hidden');
        tarotCardsContainer.classList.add('visible');
        tarotCards.innerHTML = '';
        document.body.style.overflow = 'auto';
        tarotCardsContainer.style.overflow = 'visible';
        const instructionElement = document.createElement('div');
        instructionElement.className = 'cards-instruction';
        instructionElement.textContent = 'Выберите 3 карты, которые привлекают ваше внимание';
        tarotCards.appendChild(instructionElement);
        
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'cards-grid';
        tarotCards.appendChild(cardsGrid);
        
        loadingContainer.style.display = 'flex';
        loadingText.textContent = 'Подготовка карт Таро...';

        fetch('/api/random-subset-cards?count=20')
            .then(response => response.json())
            .then(data => {
                loadingContainer.style.display = 'none';
                const totalCards = data.cards.length;
                const arcAngle = 120;
                const angleStep = arcAngle / (totalCards - 1);
                const startAngle = -arcAngle / 2; 
                data.cards.forEach((cardData, index) => {
                    const card = document.createElement('div');
                    card.className = 'tarot-card';
                    const angle = startAngle + (index * angleStep);
                    const angleRad = angle * Math.PI / 180;
                    const radius = 300; // Можешь изменить под нужную дугу

                    const x = radius * Math.sin(angleRad);
                    const y = radius * (1 - Math.cos(angleRad));

                    card.style.position = 'absolute';
                    card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
                    card.style.zIndex = totalCards - Math.abs(index - totalCards / 2);
                    card.dataset.cardId = cardData.id || index;
                    card.dataset.cardName = cardData.name;

                    card.innerHTML = `
                        <div class="card-inner">
                            <div class="card-front"></div>
                            <div class="card-back">
                                <img src="/static/images/tarot/${cardData.image}" alt="${cardData.name}" class="card-image">
                                <div class="card-name">${cardData.name}</div>
                            </div>
                        </div>
                    `;

                    card.addEventListener('click', handleCardSelection);
                    cardsGrid.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Ошибка при загрузке карт:', error);
                loadingContainer.style.display = 'none';
                cardsGrid.innerHTML = '<div class="error-message">Ошибка загрузки карт. Пожалуйста, попробуйте снова.</div>';
            });

        selectedCardsDisplay.style.display = 'block';
    }

        function handleCardSelection(event) {
            const card = event.currentTarget;
            const cardId = parseInt(card.dataset.cardId);
            const cardName = card.dataset.cardName;

            if (selectedCardIds.includes(cardId)) {
                const index = selectedCardIds.indexOf(cardId);
                selectedCardIds.splice(index, 1);
                selectedCards.splice(index, 1);
                card.classList.remove('selected');
                card.querySelector('.card-inner').style.animation = 'flipBack 0.5s forwards';
                setTimeout(() => {
                    card.querySelector('.card-inner').style.animation = '';
                }, 500);
            } else if (selectedCardIds.length < maxSelectedCards) {
                const cardDataElement = card.querySelector('.card-back img');
                const cardImage = cardDataElement ? cardDataElement.getAttribute('src').split('/').pop() : '';
                selectedCardIds.push(cardId);
                selectedCards.push({
                    id: cardId,
                    name: cardName,
                    image: cardImage,
                    type: 'unknown',
                    suit: null
                });
                card.classList.add('selected');
            } else {
                alert('Вы уже выбрали максимальное количество карт (3). Чтобы выбрать другую карту, сначала отмените выбор одной из текущих.');
            }

            updateSelectedCardsDisplay();
            
            if (selectedCardIds.length === maxSelectedCards) {
                selectedCardsDisplay.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function updateSelectedCardsDisplay() {
        selectedCardsGrid.innerHTML = '';
        
        for (const card of selectedCards) {
            const cardElement = document.createElement('div');
            cardElement.className = 'selected-card';
            cardElement.innerHTML = `
                <img src="/static/images/tarot/${card.image}" alt="${card.name}" class="selected-card-image">
                <div class="selected-card-name">${card.name}</div>
            `;
            selectedCardsGrid.appendChild(cardElement);
        }
        if (selectedCardIds.length === maxSelectedCards) {
            const interpretButton = document.createElement('button');
            interpretButton.className = 'btn btn-primary interpret-btn';
            interpretButton.textContent = 'Получить интерпретацию';
            interpretButton.addEventListener('click', getInterpretation);
            selectedCardsGrid.appendChild(interpretButton);
        }
    }
    function getInterpretation() {
    loadingContainer.style.display = 'flex';
    const loadingMessages = [
        'Соединение с энергией карт...',
        'Анализ выбранных символов...',
        'Чтение астральных линий...',
        'Интерпретация взаимосвязи карт...',
        'Подготовка персонального расклада...'
    ];
    
    let messageIndex = 0;
    loadingText.textContent = loadingMessages[messageIndex];
    
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingText.textContent = loadingMessages[messageIndex];
    }, 2000);
    
    fetch('/api/draw-cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: sessionId,
            cards: selectedCards.map(card => card.name)
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка сервера: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        clearInterval(messageInterval);
        setTimeout(() => {
            loadingContainer.style.display = 'none';
            interpretationContainer.style.opacity = '0';
            interpretationContainer.style.display = 'block';
            const formattedText = formatInterpretationText(data.message);
            interpretationText.innerHTML = formattedText;
            document.body.style.overflow = 'auto';
            setTimeout(() => {
                interpretationContainer.style.opacity = '1';
                interpretationContainer.style.transition = 'opacity 1s ease';
                interpretationContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }, 1500);
    })
    .catch(error => {
        clearInterval(messageInterval);
        
        console.error('Ошибка при получении интерпретации:', error);
        loadingContainer.style.display = 'none';
        alert('Произошла ошибка при получении интерпретации. Пожалуйста, попробуйте еще раз.');
    });
}
function formatInterpretationText(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>');
    const paragraphs = text.split('\n\n');
    return paragraphs.map(p => {
        if (p.trim().startsWith('<h3>')) {
            return p;
        }
        return `<p>${p}</p>`;
    }).join('');
}
    openCurtainBtn.addEventListener('click', openCurtains);
    beginReadingBtn.addEventListener('click', beginReading);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    prevQuestionBtn.addEventListener('click', prevQuestion);
});
