/**
 * Store Zustand pour la gestion du système temporel du jeu RPG
 * 
 * OBJECTIF : Gérer la progression du temps basée sur les actions du joueur
 * ARCHITECTURE : Store séparé pour éviter la pollution des stores existants
 * PRINCIPE : Temps déterministe basé sur actions, pas sur temps réel
 * 
 * @author Claude Code - Système de Temporalité
 * @version 1.0.0
 * @date 2025-01-XX
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Store principal pour le système temporel
 * Suit les patterns Zustand établis dans le projet
 */
export const useTimeStore = create(
  devtools(
    (set, get) => ({
      // =============================================
      // 🕐 ÉTAT TEMPOREL PRINCIPAL
      // =============================================
      
      currentTime: {
        day: 1,           // Jour du voyage (commence à 1)
        hour: 8,          // Heure (0-23, commence à 8h00 du matin)
        minute: 0,        // Minutes (pour précision future si nécessaire)
        phase: 'morning'  // Phase calculée: 'morning', 'day', 'evening', 'night'
      },
      
      // =============================================
      // ⚙️ CONFIGURATION TEMPORELLE
      // =============================================
      
      config: {
        // Coûts temporels par type d'action (en minutes)
        actionCosts: {
          combat: 30,           // Chaque combat = 30 minutes
          exploration: 60,      // Exploration/Investigation = 1 heure
          dialogue: 15,         // Dialogue simple = 15 minutes
          travel: 120,          // Voyage entre lieux = 2 heures
          rest_short: 60,       // Repos court = 1 heure
          rest_long: 480,       // Repos long = 8 heures (8 * 60)
          scene_transition: 10  // Transition simple = 10 minutes
        },
        
        // Définition des phases temporelles
        phases: {
          night: { start: 22, end: 6 },     // 22h-6h
          morning: { start: 6, end: 12 },   // 6h-12h  
          day: { start: 12, end: 18 },      // 12h-18h
          evening: { start: 18, end: 22 }   // 18h-22h
        }
      },
      
      // =============================================
      // 📊 HISTORIQUE ET STATISTIQUES
      // =============================================
      
      history: {
        lastRest: null,           // Dernière fois qu'un repos a été effectué (legacy)
        lastLongRest: null,       // Dernier repos long effectué
        lastShortRest: null,      // Dernier repos court effectué
        hadActionSinceLastRest: true, // Si une action a été effectuée depuis le dernier repos court
        totalDaysPlayed: 0,       // Nombre total de jours écoulés
        actionsToday: 0,          // Nombre d'actions effectuées aujourd'hui
        majorEvents: []           // Événements temporels importants
      },
      
      // Cache interne pour optimiser les performances
      _formattedTimeCache: null,
      
      // =============================================
      // 🎯 ACTIONS PRINCIPALES
      // =============================================
      
      /**
       * Avance le temps de X minutes et recalcule la phase
       * @param {number} minutes - Nombre de minutes à ajouter
       * @param {string} reason - Raison de l'avancement (pour debug/historique)
       */
      advanceTime: (minutes, reason = 'unknown') => {
        const state = get();
        const newTime = TimeStore._addMinutes(state.currentTime, minutes);
        const newPhase = TimeStore._calculatePhase(newTime.hour, state.config.phases);
        
        // Détection du changement de jour
        const dayChanged = newTime.day > state.currentTime.day;
        
        set({
          currentTime: {
            ...newTime,
            phase: newPhase
          },
          history: {
            ...state.history,
            totalDaysPlayed: dayChanged ? state.history.totalDaysPlayed + 1 : state.history.totalDaysPlayed,
            actionsToday: dayChanged ? 1 : state.history.actionsToday + 1,
            majorEvents: dayChanged 
              ? [...state.history.majorEvents, { type: 'new_day', day: newTime.day, timestamp: Date.now() }]
              : state.history.majorEvents
          }
        });
        
        // Log pour debug
        console.log(`🕐 Temps avancé: +${minutes}min (${reason}) -> Jour ${newTime.day}, ${newTime.hour}:${newTime.minute.toString().padStart(2, '0')} (${newPhase})`);
        
        return newTime;
      },
      
      /**
       * Effectue un repos et avance le temps correspondant (logique D&D 5e)
       * @param {string} restType - Type de repos ('short' ou 'long')
       */
      performRest: (restType) => {
        const state = get();
        const restDuration = restType === 'long' 
          ? state.config.actionCosts.rest_long 
          : state.config.actionCosts.rest_short;
        
        const newTime = state.advanceTime(restDuration, `repos_${restType}`);
        
        // Mettre à jour l'historique selon le type de repos
        const historyUpdate = { ...state.history };
        
        if (restType === 'long') {
          historyUpdate.lastLongRest = {
            time: newTime,
            timestamp: Date.now()
          };
          historyUpdate.hadActionSinceLastRest = true; // Reset après repos long
        } else {
          historyUpdate.lastShortRest = {
            time: newTime,
            timestamp: Date.now()
          };
          historyUpdate.hadActionSinceLastRest = false; // Marque qu'aucune action depuis repos court
        }
        
        // Garder lastRest pour compatibilité
        historyUpdate.lastRest = {
          type: restType,
          time: newTime,
          timestamp: Date.now()
        };
        
        set({
          history: historyUpdate
        });
        
        return newTime;
      },
      
      /**
       * Avance le temps selon le type d'action effectuée (logique D&D 5e)
       * @param {string} actionType - Type d'action ('combat', 'exploration', etc.)
       * @param {number} customDuration - Durée personnalisée (optionnelle)
       */
      advanceTimeByAction: (actionType, customDuration = null) => {
        const state = get();
        const duration = customDuration || state.config.actionCosts[actionType] || state.config.actionCosts.scene_transition;
        
        const newTime = state.advanceTime(duration, `action_${actionType}`);
        
        // Marquer qu'une action a été effectuée (débloque les repos courts)
        if (actionType !== 'rest_short' && actionType !== 'rest_long') {
          set({
            history: {
              ...state.history,
              hadActionSinceLastRest: true
            }
          });
        }
        
        return newTime;
      },
      
      // =============================================
      // 🔍 GETTERS ET UTILITAIRES
      // =============================================
      
      /**
       * Obtient la phase temporelle actuelle
       */
      getTimePhase: () => {
        return get().currentTime.phase;
      },
      
      /**
       * Vérifie si c'est actuellement la nuit
       */
      isNightTime: () => {
        const { hour } = get().currentTime;
        return hour < 6 || hour >= 22;
      },
      
      /**
       * Vérifie si c'est actuellement le jour
       */
      isDayTime: () => {
        const { hour } = get().currentTime;
        return hour >= 6 && hour < 22;
      },
      
      /**
       * Obtient le temps formaté pour l'affichage (version optimisée)
       */
      getFormattedTime: () => {
        const state = get();
        const { day, hour, minute, phase } = state.currentTime;
        
        // Cache simple pour éviter les recalculs
        const cacheKey = `${day}-${hour}-${minute}-${phase}`;
        if (state._formattedTimeCache?.key === cacheKey) {
          return state._formattedTimeCache.value;
        }
        
        const formatted = {
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          day: `Jour ${day}`,
          phase: TimeStore._getPhaseName(phase),
          period: TimeStore._getPhaseName(phase),
          dayTime: TimeStore._getDayTimeCategory(hour)
        };
        
        // Mettre en cache
        set(state => ({
          ...state,
          _formattedTimeCache: { key: cacheKey, value: formatted }
        }));
        
        return formatted;
      },
      
      /**
       * Vérifie si un repos récent a été effectué
       * @param {string} restType - Type de repos à vérifier
       * @param {number} hoursThreshold - Seuil en heures (défaut: 8h pour long, 4h pour court)
       */
      wasRecentRest: (restType, hoursThreshold = null) => {
        const state = get();
        if (!state.history.lastRest) return false;
        
        const threshold = hoursThreshold || (restType === 'long' ? 8 : 4);
        const timeSinceRest = TimeStore._getTimeDifference(state.history.lastRest.time, state.currentTime);
        
        return timeSinceRest.hours < threshold;
      },
      
      // =============================================
      // 🔧 ACTIONS DE DEBUG/ADMIN (pour développement)
      // =============================================
      
      /**
       * Définit directement le temps (pour tests/debug)
       * @param {Object} timeObj - Objet temps complet
       */
      setTime: (timeObj) => {
        set({
          currentTime: {
            ...timeObj,
            phase: TimeStore._calculatePhase(timeObj.hour, get().config.phases)
          }
        });
      },
      
      /**
       * Remet à zéro le système temporel
       */
      resetTime: () => {
        set({
          currentTime: {
            day: 1,
            hour: 8,
            minute: 0,
            phase: 'morning'
          },
          history: {
            lastRest: null,
            lastLongRest: null,
            lastShortRest: null,
            hadActionSinceLastRest: true,
            totalDaysPlayed: 0,
            actionsToday: 0,
            majorEvents: []
          }
        });
      }
    }),
    {
      name: 'time-store',
      // Sérialiser seulement les données essentielles pour la sauvegarde
      partialize: (state) => ({
        currentTime: state.currentTime,
        history: state.history
      })
    }
  )
);

/**
 * Classe utilitaire pour les calculs temporels
 * Méthodes statiques pures pour éviter les side effects
 */
class TimeStore {
  
  /**
   * Ajoute des minutes à un objet temps et gère les dépassements
   * @param {Object} currentTime - Temps actuel
   * @param {number} minutes - Minutes à ajouter
   * @returns {Object} Nouvel objet temps
   */
  static _addMinutes(currentTime, minutes) {
    let { day, hour, minute } = currentTime;
    
    minute += minutes;
    
    // Gestion des dépassements de minutes
    while (minute >= 60) {
      hour++;
      minute -= 60;
    }
    
    // Gestion des dépassements d'heures
    while (hour >= 24) {
      day++;
      hour -= 24;
    }
    
    return { day, hour, minute };
  }
  
  /**
   * Calcule la phase temporelle selon l'heure
   * @param {number} hour - Heure actuelle (0-23)
   * @param {Object} phases - Configuration des phases
   * @returns {string} Phase calculée
   */
  static _calculatePhase(hour, phases) {
    if (hour >= phases.night.start || hour < phases.night.end) return 'night';
    if (hour >= phases.morning.start && hour < phases.morning.end) return 'morning';
    if (hour >= phases.day.start && hour < phases.day.end) return 'day';
    if (hour >= phases.evening.start && hour < phases.evening.end) return 'evening';
    return 'day'; // Fallback
  }
  
  /**
   * Obtient le nom lisible d'une phase
   * @param {string} phase - Phase technique
   * @returns {string} Nom affiché
   */
  static _getPhaseName(phase) {
    const names = {
      morning: 'Matin',
      day: 'Jour',
      evening: 'Soir',
      night: 'Nuit'
    };
    return names[phase] || 'Inconnu';
  }
  
  /**
   * Obtient la catégorie jour/nuit pour l'UI
   * @param {number} hour - Heure actuelle
   * @returns {string} Catégorie
   */
  static _getDayTimeCategory(hour) {
    return hour >= 6 && hour < 22 ? 'day' : 'night';
  }
  
  /**
   * Calcule la différence entre deux temps
   * @param {Object} time1 - Premier temps
   * @param {Object} time2 - Deuxième temps
   * @returns {Object} Différence en jours/heures/minutes
   */
  static _getTimeDifference(time1, time2) {
    const totalMinutes1 = (time1.day * 24 * 60) + (time1.hour * 60) + time1.minute;
    const totalMinutes2 = (time2.day * 24 * 60) + (time2.hour * 60) + time2.minute;
    const diffMinutes = Math.abs(totalMinutes2 - totalMinutes1);
    
    return {
      minutes: diffMinutes % 60,
      hours: Math.floor(diffMinutes / 60) % 24,
      days: Math.floor(diffMinutes / (24 * 60))
    };
  }
}

// Export par défaut pour compatibilité
export default useTimeStore;

/**
 * Sélecteurs pré-définis pour optimiser les re-renders
 * Utilisés dans les composants pour éviter les re-calculs
 */
export const timeSelectors = {
  currentTime: (state) => state.currentTime,
  formattedTime: (state) => state.getFormattedTime(),
  isNight: (state) => state.isNightTime(),
  phase: (state) => state.getTimePhase(),
  dayNumber: (state) => state.currentTime.day
};