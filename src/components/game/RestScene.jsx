import React, { useState } from 'react';
import { StoryService } from '../../services/StoryService';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { SCENE_TYPES } from '../../types/story';
import './RestScene.css';

/**
 * Composant pour afficher les scènes de repos (REST_SHORT, REST_LONG, REST_CHOICE)
 * Suit le même pattern que DialogueScene avec personnalisation complète via les données de scène
 */
const RestScene = ({ 
  scene, 
  gameState, 
  onChoice 
}) => {
  const [restInProgress, setRestInProgress] = useState(false);
  const [restType, setRestType] = useState(null);
  
  // Stores
  const { 
    playerCharacter,
    shortRestPlayer,
    longRestPlayer,
    spendHitDie
  } = useCharacterStore();
  
  const { addCombatMessage } = useGameStore();

  // Obtenir les données de la scène
  const sceneText = StoryService.getSceneText(scene, gameState);
  const availableChoices = StoryService.getAvailableChoices(scene, gameState);

  // Données de repos du personnage
  const restData = {
    currentHP: playerCharacter?.currentHP || 0,
    maxHP: playerCharacter?.maxHP || 0,
    hitDice: playerCharacter?.hitDice || 0,
    hitDiceType: playerCharacter?.hitDiceType || 8,
    needsRest: playerCharacter?.currentHP < playerCharacter?.maxHP || 
               (playerCharacter?.spellcasting && hasUsedSpellSlots())
  };

  function hasUsedSpellSlots() {
    if (!playerCharacter?.spellcasting?.spellSlots) return false;
    return Object.values(playerCharacter.spellcasting.spellSlots).some(slot => slot.used > 0);
  }

  const handleChoiceClick = (choice) => {
    // Si c'est un choix de repos, traiter la mécanique de repos
    if (choice.restType) {
      handleRestChoice(choice);
    } else {
      // Choix normal, déléguer à onChoice
      if (onChoice) {
        onChoice(choice);
      }
    }
  };

  const handleRestChoice = (choice) => {
    const restType = choice.restType;
    setRestType(restType);
    setRestInProgress(true);

    addCombatMessage(
      `${playerCharacter.name} commence un ${restType === 'short' ? 'repos court' : 'repos long'}`,
      'rest-start'
    );

    // Simuler un délai pour l'immersion
    setTimeout(() => {
      if (restType === 'short') {
        shortRestPlayer();
        addCombatMessage('Repos court terminé !', 'rest-complete');
      } else {
        longRestPlayer();
        addCombatMessage('Repos long terminé ! Tous vos points de vie et emplacements de sorts ont été restaurés.', 'rest-complete');
      }

      setRestInProgress(false);
      setRestType(null);

      // Traiter les conséquences du choix et naviguer
      if (onChoice) {
        onChoice(choice);
      }
    }, 1000);
  };

  const handleSpendHitDie = () => {
    try {
      spendHitDie('player');
      addCombatMessage('Dé de vie dépensé !', 'healing');
    } catch (error) {
      console.error('Erreur lors de la dépense du dé de vie:', error);
      addCombatMessage('Impossible de dépenser le dé de vie', 'error');
    }
  };

  return (
    <div className="rest-scene">
      {/* En-tête de la scène de repos */}
      <div className="rest-header">
        <div className="rest-icon">
          {scene.type === SCENE_TYPES.REST_LONG && '🌙'}
          {scene.type === SCENE_TYPES.REST_SHORT && '⏰'}
          {scene.type === SCENE_TYPES.REST_CHOICE && '😴'}
        </div>
        <div className="rest-info">
          <h3 className="rest-title">
            {scene.content?.title || 
             (scene.type === SCENE_TYPES.REST_LONG ? 'Repos long' :
              scene.type === SCENE_TYPES.REST_SHORT ? 'Repos court' : 'Repos')}
          </h3>
          {scene.metadata?.location && (
            <p className="location-text">à {scene.metadata.location}</p>
          )}
        </div>
      </div>

      {/* Contenu de la scène */}
      <div className="rest-content">
        <div className="rest-text">
          {sceneText.split('\n').map((line, index) => (
            line.trim() === '' ? 
              <br key={index} /> : 
              <p key={index}>{line}</p>
          ))}
        </div>

        {/* Informations sur l'état du personnage */}
        <div className="character-status">
          <div className="status-item">
            <span className="status-label">Points de vie:</span>
            <span className={`status-value ${restData.currentHP < restData.maxHP ? 'status-low' : ''}`}>
              {restData.currentHP}/{restData.maxHP}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Dés de vie:</span>
            <span className="status-value">
              {restData.hitDice} disponible{restData.hitDice > 1 ? 's' : ''}
            </span>
          </div>
          
          {restData.needsRest && (
            <div className="rest-recommendation">
              <span className="rest-icon">⚠️</span>
              <span>Repos recommandé</span>
            </div>
          )}
        </div>

        {/* Gestion spéciale pour repos court avec dés de vie */}
        {scene.type === SCENE_TYPES.REST_SHORT && restData.hitDice > 0 && (
          <div className="hit-die-section">
            <button 
              className="hit-die-button"
              onClick={handleSpendHitDie}
              disabled={restData.hitDice === 0}
            >
              Dépenser un dé de vie (d{restData.hitDiceType})
            </button>
          </div>
        )}
      </div>

      {/* Choix disponibles */}
      <div className="rest-choices">
        {restInProgress ? (
          <div className="rest-progress">
            <span className="rest-progress-icon">💤</span>
            <p>Repos en cours...</p>
          </div>
        ) : (
          availableChoices.map((choice, index) => (
            <button
              key={index}
              className={`choice-button ${choice.restType ? `rest-${choice.restType}` : ''}`}
              onClick={() => handleChoiceClick(choice)}
              disabled={restInProgress}
            >
              {choice.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RestScene;