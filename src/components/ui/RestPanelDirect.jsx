import React, { useMemo } from 'react';
import { useCharacterStore } from '../../stores/characterStore';
import { useTimeStore } from '../../stores/timeStore';
import { TimeService } from '../../services/TimeService';
import { SceneManager } from '../../services/SceneManager';
import './RestPanelDirect.css';

/**
 * Panneau de repos direct et simple - Remplace la logique de scène virtuelle
 * Gère les repos avec validation temporelle D&D 5e intégrée
 */
const RestPanelDirect = ({ onRestChoice, onClose }) => {
  const { playerCharacter } = useCharacterStore();
  const timeStore = useTimeStore();
  const currentTime = useTimeStore(state => state.currentTime);

  // Créer une scène virtuelle basique pour les validations
  const currentScene = useMemo(() => ({
    metadata: {
      safety: 3, // Sécurité moyenne par défaut
      restAvailability: {
        short: true,
        long: true,
        restrictions: []
      }
    }
  }), []);

  // Validation des repos avec la nouvelle logique D&D
  const restValidation = useMemo(() => {
    const shortValidation = TimeService.validateRestAvailability(
      { currentTime, history: timeStore.history }, 
      'short', 
      currentScene
    );
    const longValidation = TimeService.validateRestAvailability(
      { currentTime, history: timeStore.history }, 
      'long', 
      currentScene
    );
    
    return {
      short: shortValidation,
      long: longValidation
    };
  }, [currentTime, timeStore.history, currentScene]);

  const handleRestClick = async (restType) => {
    const validation = restValidation[restType];
    
    if (!validation.allowed) {
      // Afficher les raisons du refus (tu peux ajouter un toast/message ici)
      console.warn(`Repos ${restType} refusé:`, validation.reasons);
      return;
    }

    // Effectuer le repos via le handler parent
    await onRestChoice(restType);
    
    // Fermer le panneau après repos réussi
    onClose();
  };

  const formatTime = (timeObj) => {
    return `${timeObj.hour.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rest-panel-direct">
      <div className="rest-header">
        <h3>🏕️ Options de Repos</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>

      <div className="rest-info">
        <div className="current-time">
          <strong>Heure actuelle:</strong> {formatTime(currentTime)} - Jour {currentTime.day}
        </div>
        <div className="character-status">
          <span>❤️ PV: {playerCharacter.currentHp}/{playerCharacter.maxHp}</span>
          <span>🎲 Dés de vie: {playerCharacter.hitDiceRemaining || 0}</span>
        </div>
      </div>

      <div className="rest-options">
        {/* Repos Court */}
        <div className="rest-option">
          <button 
            className={`rest-button short ${!restValidation.short.allowed ? 'disabled' : ''}`}
            onClick={() => handleRestClick('short')}
            disabled={!restValidation.short.allowed}
          >
            <div className="button-content">
              <span className="button-icon">💤</span>
              <div className="button-text">
                <strong>Repos Court (1h)</strong>
                <small>Récupère des PV via les dés de vie</small>
              </div>
            </div>
          </button>
          
          {!restValidation.short.allowed && (
            <div className="rest-error">
              {restValidation.short.reasons.map((reason, index) => (
                <div key={index} className="error-message">❌ {reason}</div>
              ))}
            </div>
          )}
        </div>

        {/* Repos Long */}
        <div className="rest-option">
          <button 
            className={`rest-button long ${!restValidation.long.allowed ? 'disabled' : ''}`}
            onClick={() => handleRestClick('long')}
            disabled={!restValidation.long.allowed}
          >
            <div className="button-content">
              <span className="button-icon">🛌</span>
              <div className="button-text">
                <strong>Repos Long (8h)</strong>
                <small>Récupération complète PV + sorts</small>
              </div>
            </div>
          </button>
          
          {!restValidation.long.allowed && (
            <div className="rest-error">
              {restValidation.long.reasons.map((reason, index) => (
                <div key={index} className="error-message">❌ {reason}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestPanelDirect;