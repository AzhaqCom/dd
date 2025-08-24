import React from 'react';
import { StoryService } from '../../services/StoryService';
import './DialogueScene.css';

/**
 * Composant pour afficher les scènes de dialogue avec PNJ
 */
const DialogueScene = ({ 
  scene, 
  gameState, 
  onChoice, 
  onBack 
}) => {
  // Obtenir les données du dialogue
  const dialogueData = StoryService.getDialogueData(scene, gameState);
  const availableChoices = StoryService.getAvailableChoices(scene, gameState);

  const handleChoiceClick = (choice) => {
    if (onChoice) {
      onChoice(choice);
    }
  };

  return (
    <div className="dialogue-scene">
      {/* En-tête du dialogue */}
      <div className="dialogue-header">
        {dialogueData.portrait && (
          <div className="character-portrait">
            <img 
              src={dialogueData.portrait} 
              alt={dialogueData.speaker}
              className={`portrait mood-${dialogueData.mood}`}
            />
          </div>
        )}
        <div className="character-info">
          <h3 className="character-name">{dialogueData.speaker}</h3>
          {scene.metadata?.location && (
            <p className="location-text">à {scene.metadata.location}</p>
          )}
        </div>
      </div>

      {/* Contenu du dialogue */}
      <div className="dialogue-content">
          <div className="description-text">
          {dialogueData.description}
         
        </div>
        <div className="dialogue-text">
          {dialogueData.text.split('\n').map((line, index) => (
            line.trim() === '' ? 
              <br key={index} /> : 
              <p key={index}>{line}</p>
          ))}
        </div>
      </div>

      {/* Choix de dialogue */}
      <div className="dialogue-choices">
        {availableChoices.map((choice, index) => (
          <button
            key={index}
            className={`dialogue-choice ${choice.action?.type === 'openShop' ? 'shop-choice' : ''}`}
            onClick={() => handleChoiceClick(choice)}
          >
            <span className="choice-text">{choice.text}</span>
            {choice.condition && (
              <span className="choice-requirement">
                {/* Affichage conditionnel des pré-requis */}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bouton de retour si fourni */}
      {onBack && (
        <div className="dialogue-controls">
          <button className="back-button" onClick={onBack}>
            ← Retour
          </button>
        </div>
      )}
    </div>
  );
};

export default DialogueScene;