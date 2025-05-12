// frontend/src/QuestionInterface.js
import React, { useEffect, useRef } from 'react';
import './QuestionInterface.css';
function QuestionInterface({ currentQuestion, userResponses, onNext, onPrev }) {
  const questionInputRef = useRef(null);

  useEffect(() => {
    if (questionInputRef.current) {
      questionInputRef.current.value = userResponses[currentQuestion - 1] || '';
      questionInputRef.current.focus();
    }
  }, [currentQuestion, userResponses]);
  const getQuestionText = () => {
    switch(currentQuestion) {
      case 1:
        return 'Какой главный вопрос вы хотели бы задать картам?';
      case 2:
        return 'Опишите вашу ситуацию по подробнее';
      case 3:
        return 'Что вы чувствуете в данный момент?';
      default:
        return 'Поделитесь вашими мыслями.';
    }
  };
  const handleNext = () => {
    // Передайте текущее значение из ref обратно в родительский компонент
    onNext(questionInputRef.current.value);
  };
  return (
    <div id="questionInterface" className="question-interface">
      <div id="questionBox" className="question-box">
        <h2 className="question-title">Вопрос {currentQuestion} из 3</h2>
        <p className="question-text">{getQuestionText()}</p>
        <textarea 
          id="questionInput" 
          className="question-input" 
          ref={questionInputRef}
          defaultValue={userResponses[currentQuestion - 1]}
        ></textarea>
        <div className="question-btns">
          {currentQuestion > 1 && (
            <button id="prevQuestionBtn" className="btn btn-outline" onClick={onPrev}>
              Назад
            </button>
          )}
          <button id="nextQuestionBtn" className="btn btn-primary" onClick={onNext}>
            {currentQuestion === 3 ? 'Завершить' : 'Далее'}
          </button>
        </div>
        <div className="question-progress">
          <div className="progress-bar">
            <div className="progress-filled" style={{ width: `${(currentQuestion / 3) * 100}%` }}></div>
          </div>
          <div className="progress-steps">
            <div className={`step ${currentQuestion >= 1 ? 'active' : ''}`}></div>
            <div className={`step ${currentQuestion >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${currentQuestion >= 3 ? 'active' : ''}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default QuestionInterface;