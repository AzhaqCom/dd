import React, { useCallback } from 'react';
import { useTypedText } from '../hooks/useTypedText';

const ChoiceButton = React.memo(({ choice, onChoice }) => {
  const handleClick = useCallback(() => {
    const action = choice.next || choice.action;
    onChoice(action);
  }, [choice, onChoice]);

  return (
    <button onClick={handleClick}>
      {choice.text}
    </button>
  );
});

const Scene = ({ text, choices = [], onChoice }) => {
  const { displayedText, isTyping, skipTyping } = useTypedText(text);

  const handleTextClick = useCallback(() => {
    if (isTyping) {
      skipTyping();
    }
  }, [isTyping, skipTyping]);

  const choiceButtons = choices.map((choice, index) => (
    <ChoiceButton 
      key={`${index}-${choice.text}`} 
      choice={choice} 
      onChoice={onChoice} 
    />
  ));

  return (
    <div className="scene scene-container">
      <div 
        className="scene-text" 
        onClick={handleTextClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleTextClick()}
      >
        {displayedText}
      </div>
      <div className="scene-choices">
        {choiceButtons}
      </div>
    </div>
  );
};

export default React.memo(Scene);