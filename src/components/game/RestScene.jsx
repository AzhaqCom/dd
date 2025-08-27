import React, { useState, useMemo } from 'react';
import { StoryService } from '../../services/StoryService';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { useTimeStore } from '../../stores/timeStore';
import { TimeService } from '../../services/TimeService';
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
  
  // ✅ NOUVEAU: Intégration du système temporel
  const timeStore = useTimeStore();
  const currentTime = useTimeStore(state => state.currentTime);
  
  // Validation des repos disponibles avec le système temporel
  const restAvailability = useMemo(() => {
    const shortValidation = TimeService.validateRestAvailability(
      { currentTime, history: timeStore.history }, 
      'short', 
      scene
    );
    const longValidation = TimeService.validateRestAvailability(
      { currentTime, history: timeStore.history }, 
      'long', 
      scene
    );
    
    return {
      short: shortValidation,
      long: longValidation
    };
  }, [currentTime, timeStore.history, scene]);
  
  // Formatage du temps actuel pour l'affichage
  const formattedTime = useMemo(() => {
    return TimeService.formatTime(currentTime);
  }, [currentTime]);

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

    // ✅ NOUVEAU: Validation avec système temporel
    const validation = restAvailability[restType];
    if (!validation.allowed) {
      addCombatMessage(
        `Impossible d'effectuer ce repos: ${validation.reasons.join(', ')}`,
        'error'
      );
      setRestInProgress(false);
      return;
    }

    // ✅ NOUVEAU: Message avec heure de fin calculée
    const endTime = validation.endTime;
    addCombatMessage(
      `${playerCharacter.name} commence un ${restType === 'short' ? 'repos court' : 'repos long'} (fin: ${endTime?.time} - ${endTime?.period})`,
      'rest-start'
    );

    // Simuler un délai pour l'immersion
    setTimeout(() => {
      // ✅ NOUVEAU: Avancer le temps avec le système temporel
      const timeAdvanced = timeStore.performRest(restType);
      
      if (restType === 'short') {
        shortRestPlayer();
        addCombatMessage(
          `Repos court terminé ! (${formattedTime.time} - ${formattedTime.period})`, 
          'rest-complete'
        );
      } else {
        longRestPlayer();
        addCombatMessage(
          `Repos long terminé ! Tous vos points de vie et emplacements de sorts ont été restaurés. (${formattedTime.time} - ${formattedTime.period})`, 
          'rest-complete'
        );
      }

      // ✅ NOUVEAU: Ajouter événements temporels si changement de jour/phase
      const timeEvents = TimeService.generateTimeEvents(
        { ...currentTime, day: currentTime.day, hour: currentTime.hour - (restType === 'long' ? 8 : 1) },
        timeStore.currentTime
      );
      
      timeEvents.forEach(event => {
        if (event.message) {
          addCombatMessage(event.message, 'time-event');
        }
      });

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
          {/* ✅ NOUVEAU: Informations temporelles */}
          <div className="time-info">
            <span className="current-time">🕐 {formattedTime.time} - {formattedTime.period}</span>
            <span className="current-day">{formattedTime.day}</span>
          </div>
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
          
          {/* ✅ NOUVEAU: Informations de validation temporelle */}
          <div className="temporal-status">
            <div className="safety-level">
              <span className="safety-label">Sécurité du lieu:</span>
              <span className={`safety-value safety-${scene.metadata?.safety || 0}`}>
                {getSafetyIcon(scene.metadata?.safety || 0)} {scene.metadata?.safety || 0}/5
              </span>
            </div>
            
            {restAvailability.long.warnings?.length > 0 && (
              <div className="temporal-warnings">
                {restAvailability.long.warnings.map((warning, i) => (
                  <div key={i} className="warning">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
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
          availableChoices.map((choice, index) => {
            // ✅ NOUVEAU: Validation temporelle pour chaque choix de repos
            const validation = choice.restType ? restAvailability[choice.restType] : null;
            const isRestDisabled = validation && !validation.allowed;
            
            return (
              <div key={index} className="choice-container">
                <button
                  className={`choice-button ${choice.restType ? `rest-${choice.restType}` : ''} ${isRestDisabled ? 'disabled' : ''}`}
                  onClick={() => handleChoiceClick(choice)}
                  disabled={restInProgress || isRestDisabled}
                  title={isRestDisabled ? validation.reasons.join(', ') : validation?.endTime ? `Fin: ${validation.endTime.time} - ${validation.endTime.period}` : ''}
                >
                  {choice.text}
                  {/* ✅ NOUVEAU: Affichage des durées et heures de fin */}
                  {validation && validation.allowed && (
                    <div className="choice-time-info">
                      <span className="duration">
                        ({validation.timeRequired === 60 ? '1h' : `${Math.floor(validation.timeRequired / 60)}h`})
                      </span>
                      <span className="end-time">
                        → {validation.endTime?.time} {validation.endTime?.period}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* ✅ NOUVEAU: Messages d'erreur pour repos impossibles */}
                {isRestDisabled && (
                  <div className="choice-error">
                    {validation.reasons.map((reason, i) => (
                      <div key={i} className="error-message">
                        ❌ {reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
  
  /**
   * Obtient l'icône de sécurité selon le niveau
   */
  function getSafetyIcon(safety) {
    const icons = ['💀', '⚠️', '😐', '😊', '🛡️', '🏰'];
    return icons[Math.min(safety, 5)] || '❓';
  }
};

export default RestScene;