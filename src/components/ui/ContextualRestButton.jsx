/**
 * ContextualRestButton - Bouton de repos contextuel basé sur la sécurité des lieux
 * 
 * OBJECTIF : Afficher les options de repos disponibles selon la scène actuelle
 * INTÉGRATION : Utilise le système temporel et les métadonnées des scènes
 * 
 * @author Claude Code - Système de Temporalité
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { TimeService } from '../../services/TimeService';
import './ContextualRestButton.css';

/**
 * Composant bouton de repos contextuel
 */
const ContextualRestButton = ({ 
  currentScene, 
  onRest,
  className = ''
}) => {
  const [showRestMenu, setShowRestMenu] = useState(false);
  const timeState = useTimeStore();
  
  // Ne pas afficher si c'est une scène REST narrative
  if (currentScene?.type?.includes('REST') && currentScene?.narrative) {
    return null;
  }
  
  // Analyser le contexte de repos
  const restContext = analyzeRestContext(currentScene, timeState);
  
  // Si aucun repos possible, afficher une indication
  if (!restContext.canShort && !restContext.canLong) {
    return (
      <div className={`contextual-rest-button unavailable ${className}`}>
        <button 
          className="rest-button-disabled"
          title={restContext.reason}
          disabled
        >
          <span className="rest-icon">😰</span>
          <span className="rest-text">Repos impossible</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={`contextual-rest-button ${className}`}>
      {/* Bouton principal */}
      <button 
        className={`rest-button-main ${restContext.safety <= 2 ? 'dangerous' : 'safe'}`}
        onClick={() => setShowRestMenu(!showRestMenu)}
        title={`Repos disponible (Sécurité: ${restContext.safety}/5)`}
      >
        <span className="rest-icon">💤</span>
        <span className="rest-text">Repos</span>
        <span className="safety-indicator">{getSafetyIcon(restContext.safety)}</span>
      </button>
      
      {/* Menu des options de repos */}
      {showRestMenu && (
        <div className="rest-menu">
          <div className="rest-location-info">
            <span className="location-name">📍 {restContext.location}</span>
            <span className="safety-level">
              Sécurité: {getSafetyIcon(restContext.safety)} {restContext.safety}/5
            </span>
          </div>
          
          <div className="rest-options">
            {/* Repos court */}
            {restContext.canShort && (
              <RestOption
                type="short"
                duration="1 heure"
                effects="Récupère des PV avec dés de vie"
                restrictions={restContext.shortRestrictions}
                onSelect={() => handleRestSelect('short')}
                timeState={timeState}
              />
            )}
            
            {/* Repos long */}
            {restContext.canLong && (
              <RestOption
                type="long"
                duration="8 heures"
                effects="Récupération complète PV + sorts"
                restrictions={restContext.longRestrictions}
                onSelect={() => handleRestSelect('long')}
                timeState={timeState}
              />
            )}
          </div>
          
          {/* Avertissements */}
          {restContext.warnings.length > 0 && (
            <div className="rest-warnings">
              {restContext.warnings.map((warning, i) => (
                <div key={i} className="rest-warning">
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
          
          <button 
            className="rest-menu-close"
            onClick={() => setShowRestMenu(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
  
  /**
   * Gère la sélection d'un type de repos
   */
  function handleRestSelect(restType) {
    setShowRestMenu(false);
    
    if (onRest) {
      onRest(restType, restContext);
    }
  }
};

/**
 * Composant pour une option de repos individuelle
 */
const RestOption = ({ 
  type, 
  duration, 
  effects, 
  restrictions, 
  onSelect, 
  timeState 
}) => {
  const validation = TimeService.validateRestAvailability(timeState, type, {});
  const isDisabled = !validation.allowed;
  
  return (
    <button 
      className={`rest-option rest-${type} ${isDisabled ? 'disabled' : ''}`}
      onClick={onSelect}
      disabled={isDisabled}
      title={isDisabled ? validation.reasons.join(', ') : `${effects} - Fin: ${validation.endTime?.time || 'N/A'}`}
    >
      <div className="rest-option-header">
        <span className="rest-option-icon">
          {type === 'long' ? '🌙' : '⏰'}
        </span>
        <span className="rest-option-name">
          Repos {type === 'long' ? 'Long' : 'Court'}
        </span>
        <span className="rest-duration">({duration})</span>
      </div>
      
      <div className="rest-option-effects">
        {effects}
      </div>
      
      {validation.endTime && (
        <div className="rest-option-time">
          Fin: {validation.endTime.time} - {validation.endTime.period}
        </div>
      )}
      
      {restrictions.length > 0 && (
        <div className="rest-option-restrictions">
          {restrictions.map((restriction, i) => (
            <span key={i} className="restriction-tag">
              {getRestrictionIcon(restriction)} {getRestrictionText(restriction)}
            </span>
          ))}
        </div>
      )}
      
      {isDisabled && (
        <div className="rest-option-disabled-reason">
          {validation.reasons[0]}
        </div>
      )}
    </button>
  );
};

// =============================================
// 🔧 FONCTIONS UTILITAIRES
// =============================================

/**
 * Analyse le contexte de repos selon la scène actuelle
 */
function analyzeRestContext(scene, timeState) {
  const metadata = scene?.metadata || {};
  
  const context = {
    safety: metadata.safety || 0,
    environment: metadata.environment || 'unknown',
    location: metadata.location || 'Lieu inconnu',
    canShort: false,
    canLong: false,
    shortRestrictions: [],
    longRestrictions: [],
    warnings: [],
    reason: ''
  };
  
  // Vérifier la sécurité de base
  if (context.safety >= 1) {
    context.canShort = true;
  } else {
    context.reason = 'Lieu trop dangereux pour se reposer';
  }
  
  if (context.safety >= 3) {
    context.canLong = true;
  } else if (context.canShort) {
    context.reason = 'Lieu insuffisamment sûr pour un repos long';
  }
  
  // Analyser les restrictions spécifiques
  const restAvailability = metadata.restAvailability || {};
  const restrictions = restAvailability.restrictions || [];
  
  // Appliquer les restrictions
  if (restAvailability.short === false) {
    context.canShort = false;
    context.shortRestrictions.push('forbidden');
  }
  
  if (restAvailability.long === false) {
    context.canLong = false;
    context.longRestrictions.push('forbidden');
  }
  
  // Analyser les restrictions individuelles
  restrictions.forEach(restriction => {
    switch (restriction) {
      case 'noise_risk':
        context.shortRestrictions.push('noise_risk');
        context.longRestrictions.push('noise_risk');
        context.warnings.push('Le bruit pourrait attirer des ennemis');
        break;
      case 'interrupted_rest':
        context.longRestrictions.push('interrupted_rest');
        context.warnings.push('Le repos pourrait être interrompu');
        break;
      case 'weather_risk':
        context.shortRestrictions.push('weather_risk');
        context.longRestrictions.push('weather_risk');
        context.warnings.push('Conditions météo défavorables');
        break;
      case 'time_pressure':
        context.longRestrictions.push('time_pressure');
        context.warnings.push('Le temps presse');
        break;
    }
  });
  
  return context;
}

/**
 * Obtient l'icône de sécurité selon le niveau
 */
function getSafetyIcon(safety) {
  const icons = ['💀', '⚠️', '😐', '😊', '🛡️', '🏰'];
  return icons[Math.min(safety, 5)] || '❓';
}

/**
 * Obtient l'icône pour une restriction
 */
function getRestrictionIcon(restriction) {
  const icons = {
    noise_risk: '🔊',
    interrupted_rest: '⚡',
    weather_risk: '🌧️',
    time_pressure: '⏰',
    forbidden: '🚫'
  };
  return icons[restriction] || '⚠️';
}

/**
 * Obtient le texte pour une restriction
 */
function getRestrictionText(restriction) {
  const texts = {
    noise_risk: 'Risque de bruit',
    interrupted_rest: 'Peut être interrompu',
    weather_risk: 'Météo défavorable',
    time_pressure: 'Temps limité',
    forbidden: 'Interdit'
  };
  return texts[restriction] || restriction;
}

export default ContextualRestButton;