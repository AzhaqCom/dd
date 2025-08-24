import React from 'react';
import './StatusCorner.css';

/**
 * StatusCorner - Widget compact avec les stats vitales
 * Affiché en permanence en haut au centre de l'écran
 */
const StatusCorner = ({ 
  character, 
  gameTime, 
  gameFlags = {} 
}) => {
  if (!character) return null;

  const hpPercentage = (character.currentHP / character.maxHP) * 100;
  const isLowHP = hpPercentage <= 25;
  const isCriticalHP = hpPercentage <= 10;
  
  // Formatage du temps
  const formatTime = (time) => {
    const hour = time.hour.toString().padStart(2, '0');
    const period = time.hour < 12 ? 'Matin' : time.hour < 18 ? 'Jour' : 'Soir';
    return `${hour}:00 ${period}`;
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

        {/* Temps */}
        {gameTime && (
          <div className="status-item time-status">
            <span className="status-icon">🕐</span>
            <span className="status-text">{formatTime(gameTime)}</span>
            <span className="status-day">Jour {gameTime.day}</span>
          </div>
        )}

        {/* Météo (si disponible) */}
        {gameTime?.weather && (
          <div className="status-item weather-status">
            <span className="status-icon">{getWeatherIcon(gameTime.weather)}</span>
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