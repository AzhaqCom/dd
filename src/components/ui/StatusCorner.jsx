import React, { useMemo } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { TimeService } from '../../services/TimeService';
import './StatusCorner.css';

/**
 * StatusCorner - Widget compact avec les stats vitales
 * Affiché en permanence en haut au centre de l'écran
 */
const StatusCorner = ({ 
  character, 
  gameFlags = {} 
}) => {
  // ✅ NOUVEAU: Connexion au système temporel avec sélecteurs optimisés
  const day = useTimeStore(state => state.currentTime.day);
  const hour = useTimeStore(state => state.currentTime.hour);
  const minute = useTimeStore(state => state.currentTime.minute);
  const phase = useTimeStore(state => state.currentTime.phase);
  
  const formattedTime = useMemo(() => {
    return TimeService.formatTime({ day, hour, minute, phase });
  }, [day, hour, minute, phase]);
  
  const isNight = useMemo(() => {
    return TimeService.isNightHour(hour);
  }, [hour]);
  
  const currentPhase = useMemo(() => {
    return phase || TimeService.calculatePhase(hour);
  }, [phase, hour]);
  
  if (!character) return null;

  const hpPercentage = (character.currentHP / character.maxHP) * 100;
  const isLowHP = hpPercentage <= 25;
  const isCriticalHP = hpPercentage <= 10;
  
  // ✅ NOUVEAU: Utilisation du TimeService pour le formatage
  const getTimeIcon = (phase) => {
    const icons = {
      morning: '🌅',
      day: '☀️', 
      evening: '🌅',
      night: '🌙'
    };
    return icons[phase] || '🕐';
  };

  // Déterminer l'icône météo (pour plus tard)
  const getWeatherIcon = (weather) => {
    switch(weather) {
      case 'clear': return '☀️';
      case 'rain': return '🌧️';
      case 'storm': return '⛈️';
      case 'snow': return '❄️';
      default: return '🌤️';
    }
  };

  return (
    <div className="status-corner">
      <div className="status-row">
        {/* Points de vie */}
        <div className={`status-item hp-status ${isLowHP ? 'low-hp' : ''} ${isCriticalHP ? 'critical-hp' : ''}`}>
          <span className="status-icon">❤️</span>
          <span className="status-text">
            {character.currentHP}/{character.maxHP}
          </span>
          <div className="mini-bar">
            <div 
              className="mini-bar-fill hp-fill" 
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        {/* Stamina/Energy si disponible */}
        {character.stamina && (
          <div className="status-item stamina-status">
            <span className="status-icon">⚡</span>
            <span className="status-text">
              {character.currentStamina || character.stamina}/{character.stamina}
            </span>
            <div className="mini-bar">
              <div 
                className="mini-bar-fill stamina-fill" 
                style={{ 
                  width: `${((character.currentStamina || character.stamina) / character.stamina) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Or */}
        <div className="status-item gold-status">
          <span className="status-icon">🪙</span>
          <span className="status-text">{character.gold || 0}</span>
        </div>

        {/* ✅ NOUVEAU: Temps avec système temporel intégré */}
        <div className={`status-item time-status ${isNight ? 'night-time' : 'day-time'}`}>
          <span className="status-icon">{getTimeIcon(currentPhase)}</span>
          <span className="status-text">{formattedTime.time}</span>
          <span className="status-period">{formattedTime.period}</span>
          <span className="status-day">{formattedTime.day}</span>
        </div>

        {/* Météo (placeholder pour futur système météo) */}
        {formattedTime?.weather && (
          <div className="status-item weather-status">
            <span className="status-icon">{getWeatherIcon(formattedTime.weather)}</span>
          </div>
        )}
      </div>

      {/* Notifications importantes */}
      <div className="status-notifications">
        {character.canLevelUp && (
          <div className="status-notification level-up">
            <span className="notification-icon">⬆️</span>
            <span className="notification-text">Montée de niveau!</span>
          </div>
        )}
        
        {isLowHP && (
          <div className="status-notification low-health">
            <span className="notification-icon">⚠️</span>
            <span className="notification-text">PV faibles</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCorner;