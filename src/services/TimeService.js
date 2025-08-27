/**
 * Service utilitaire pour la gestion des calculs temporels complexes
 * 
 * OBJECTIF : Centraliser la logique métier temporelle complexe
 * ARCHITECTURE : Service statique avec méthodes pures
 * RESPONSABILITÉ : Calculs, validations, et logique métier temporelle
 * 
 * @author Claude Code - Système de Temporalité
 * @version 1.0.0
 * @date 2025-01-XX
 */

/**
 * Service principal pour les opérations temporelles avancées
 * Toutes les méthodes sont statiques et pures (pas d'effets de bord)
 */
export class TimeService {
  
  // =============================================
  // 🕐 CALCULS TEMPORELS DE BASE
  // =============================================
  
  /**
   * Ajoute des minutes à un objet temps avec gestion complète des dépassements
   * @param {Object} currentTime - Temps actuel {day, hour, minute}
   * @param {number} minutes - Minutes à ajouter
   * @returns {Object} Nouvel objet temps
   */
  static addMinutes(currentTime, minutes) {
    if (!currentTime || typeof minutes !== 'number') {
      throw new Error('TimeService.addMinutes: Paramètres invalides');
    }
    
    let { day, hour, minute } = currentTime;
    
    minute += minutes;
    
    // Gestion des dépassements de minutes
    while (minute >= 60) {
      hour++;
      minute -= 60;
    }
    
    // Gestion des minutes négatives
    while (minute < 0) {
      hour--;
      minute += 60;
    }
    
    // Gestion des dépassements d'heures
    while (hour >= 24) {
      day++;
      hour -= 24;
    }
    
    // Gestion des heures négatives
    while (hour < 0) {
      day--;
      hour += 24;
    }
    
    // Empêcher les jours négatifs
    if (day < 1) {
      day = 1;
      hour = 0;
      minute = 0;
    }
    
    return { day, hour, minute };
  }
  
  /**
   * Ajoute des heures à un objet temps
   * @param {Object} currentTime - Temps actuel
   * @param {number} hours - Heures à ajouter
   * @returns {Object} Nouvel objet temps
   */
  static addHours(currentTime, hours) {
    return this.addMinutes(currentTime, hours * 60);
  }
  
  /**
   * Ajoute des jours à un objet temps
   * @param {Object} currentTime - Temps actuel
   * @param {number} days - Jours à ajouter
   * @returns {Object} Nouvel objet temps
   */
  static addDays(currentTime, days) {
    return this.addHours(currentTime, days * 24);
  }
  
  // =============================================
  // 📊 CALCULS DE PHASES ET PÉRIODES
  // =============================================
  
  /**
   * Calcule la phase temporelle selon l'heure
   * @param {number} hour - Heure actuelle (0-23)
   * @returns {string} Phase calculée ('morning', 'day', 'evening', 'night')
   */
  static calculatePhase(hour) {
    if (hour < 0 || hour > 23) {
      throw new Error('TimeService.calculatePhase: Heure invalide (0-23)');
    }
    
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    if (hour >= 18 && hour < 22) return 'evening';
    
    return 'day'; // Fallback
  }
  
  /**
   * Vérifie si une heure donnée est pendant la nuit
   * @param {number} hour - Heure à vérifier
   * @returns {boolean} True si c'est la nuit
   */
  static isNightHour(hour) {
    return hour >= 22 || hour < 6;
  }
  
  /**
   * Vérifie si une heure donnée est pendant le jour
   * @param {number} hour - Heure à vérifier
   * @returns {boolean} True si c'est le jour
   */
  static isDayHour(hour) {
    return hour >= 6 && hour < 22;
  }
  
  /**
   * Obtient la prochaine phase après celle donnée
   * @param {string} currentPhase - Phase actuelle
   * @returns {string} Phase suivante
   */
  static getNextPhase(currentPhase) {
    const phases = ['night', 'morning', 'day', 'evening'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[(currentIndex + 1) % phases.length];
  }
  
  // =============================================
  // 🎨 FORMATAGE ET AFFICHAGE
  // =============================================
  
  /**
   * Formate un objet temps pour l'affichage
   * @param {Object} timeObj - Objet temps {day, hour, minute, phase}
   * @returns {Object} Temps formaté pour l'UI
   */
  static formatTime(timeObj) {
    if (!timeObj || typeof timeObj.hour !== 'number') {
      return {
        time: '--:--',
        period: 'Inconnu',
        day: 'Jour ?',
        phase: 'unknown'
      };
    }
    
    const { hour, minute = 0, day = 1, phase } = timeObj;
    
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    const periodName = this.getPeriodName(hour);
    
    return {
      time: `${formattedHour}:${formattedMinute}`,
      period: periodName,
      day: `Jour ${day}`,
      phase: phase || this.calculatePhase(hour),
      dayTime: this.getDayTimeCategory(hour)
    };
  }
  
  /**
   * Obtient le nom de la période selon l'heure
   * @param {number} hour - Heure (0-23)
   * @returns {string} Nom de la période
   */
  static getPeriodName(hour) {
    if (hour < 6) return 'Nuit';
    if (hour < 12) return 'Matin';
    if (hour < 18) return 'Jour';
    if (hour < 22) return 'Soir';
    return 'Nuit';
  }
  
  /**
   * Obtient la catégorie jour/nuit simplifiée
   * @param {number} hour - Heure (0-23)
   * @returns {string} 'day' ou 'night'
   */
  static getDayTimeCategory(hour) {
    return this.isDayHour(hour) ? 'day' : 'night';
  }
  
  // =============================================
  // ⚖️ LOGIQUE MÉTIER ET VALIDATIONS
  // =============================================
  
  /**
   * Calcule le coût temporel d'une action selon le type de scène
   * @param {Object} scene - Scène actuelle
   * @param {Object} choice - Choix effectué (optionnel)
   * @param {Object} context - Contexte additionnel
   * @returns {number} Coût en minutes
   */
  static calculateActionTimeCost(scene, choice = null, context = {}) {
    // Coût explicite dans les conséquences du choix
    if (choice?.consequences?.timeCost) {
      return choice.consequences.timeCost;
    }
    
    // Coût selon le type de scène
    const sceneCosts = {
      'combat': 30,           // Combat = 30 minutes
      'interactive': 60,      // Exploration = 1 heure
      'dialogue': 15,         // Dialogue = 15 minutes
      'merchant': 30,         // Commerce = 30 minutes
      'text': 10,            // Lecture/narration = 10 minutes
      'rest_long': 480,      // Repos long = 8 heures
      'rest_short': 60,      // Repos court = 1 heure
      'rest_choice': 0       // Le choix détermine le temps
    };
    
    const sceneType = scene.type?.toLowerCase() || 'text';
    const baseCost = sceneCosts[sceneType] || 15; // Défaut : 15 minutes
    
    // Modificateurs selon le contexte
    let modifier = 1;
    
    // Exploration nocturne plus lente
    if (context.isNight && sceneType === 'interactive') {
      modifier *= 1.5;
    }
    
    // Voyage plus long selon la distance
    if (context.travelDistance) {
      modifier *= context.travelDistance;
    }
    
    return Math.round(baseCost * modifier);
  }
  
  /**
   * Vérifie si un repos peut être effectué selon les contraintes temporelles D&D 5e
   * @param {Object} timeState - État temporel actuel
   * @param {string} restType - Type de repos ('short' ou 'long')
   * @param {Object} scene - Scène actuelle
   * @returns {Object} Résultat de la validation
   */
  static validateRestAvailability(timeState, restType, scene) {
    const { currentTime, history } = timeState;
    const sceneMetadata = scene.metadata || {};
    const { hour } = currentTime;
    
    const result = {
      allowed: true,
      reasons: [],
      warnings: [],
      timeRequired: restType === 'long' ? 480 : 60
    };
    
    if (restType === 'long') {
      // === REPOS LONG : Règles D&D 5e ===
      
      // 1. Vérifier l'heure : Nuit (19h-6h) OU lieu très sûr (safety >= 4)
      const isNightTime = hour >= 19 || hour <= 6;
      const isSafePlace = (sceneMetadata.safety || 0) >= 4;
      
      if (!isNightTime && !isSafePlace) {
        result.allowed = false;
        result.reasons.push('Les repos longs ne sont possibles que la nuit (19h-6h) ou dans des lieux très sûrs');
      }
      
      // 2. Vérifier qu'on n'a pas déjà fait un repos long aujourd'hui
      if (history.lastLongRest) {
        const daysSinceLastLongRest = Math.floor(
          this.getTimeDifference(history.lastLongRest.time, currentTime) / (24 * 60)
        );
        
        if (daysSinceLastLongRest < 1) {
          result.allowed = false;
          result.reasons.push('Un seul repos long par jour est autorisé');
        }
      }
      
      // 3. Sécurité minimale pour dormir
      const safety = sceneMetadata.safety || 0;
      if (safety < 2) {
        result.allowed = false;
        result.reasons.push(`Lieu trop dangereux pour dormir (sécurité: ${safety}/5)`);
      }
      
    } else {
      // === REPOS COURT : Règles D&D 5e ===
      
      // 1. Pas 2 repos courts consécutifs sans action entre
      if (history.lastShortRest && !history.hadActionSinceLastRest) {
        result.allowed = false;
        result.reasons.push('Vous devez agir avant de pouvoir faire un autre repos court');
      }
      
      // 2. Sécurité minimale pour se reposer
      const safety = sceneMetadata.safety || 0;
      if (safety < 1) {
        result.allowed = false;
        result.reasons.push(`Lieu trop dangereux pour se reposer (sécurité: ${safety}/5)`);
      }
    }
    
    // Vérifier les restrictions spécifiques de la scène
    const restrictions = sceneMetadata.restAvailability?.restrictions || [];
    if (restrictions.includes('no_long_rest') && restType === 'long') {
      result.allowed = false;
      result.reasons.push('Repos long interdit dans ce lieu');
    }
    if (restrictions.includes('no_short_rest') && restType === 'short') {
      result.allowed = false;
      result.reasons.push('Repos court interdit dans ce lieu');
    }
    
    // Calculer l'heure de fin du repos
    const endTime = this.addMinutes(currentTime, result.timeRequired);
    result.endTime = this.formatTime(endTime);
    
    return result;
  }
  
  // =============================================
  // 🔧 UTILITAIRES ET HELPERS
  // =============================================
  
  /**
   * Calcule la différence entre deux objets temps
   * @param {Object} time1 - Premier temps
   * @param {Object} time2 - Deuxième temps
   * @returns {Object} Différence {days, hours, minutes, totalMinutes}
   */
  static getTimeDifference(time1, time2) {
    const totalMinutes1 = this.timeToTotalMinutes(time1);
    const totalMinutes2 = this.timeToTotalMinutes(time2);
    const diffMinutes = Math.abs(totalMinutes2 - totalMinutes1);
    
    return {
      totalMinutes: diffMinutes,
      minutes: diffMinutes % 60,
      hours: Math.floor(diffMinutes / 60) % 24,
      days: Math.floor(diffMinutes / (24 * 60))
    };
  }
  
  /**
   * Convertit un objet temps en minutes totales
   * @param {Object} timeObj - Objet temps
   * @returns {number} Minutes totales depuis le début du jeu
   */
  static timeToTotalMinutes(timeObj) {
    const { day = 1, hour = 0, minute = 0 } = timeObj;
    return ((day - 1) * 24 * 60) + (hour * 60) + minute;
  }
  
  /**
   * Convertit des minutes totales en objet temps
   * @param {number} totalMinutes - Minutes totales
   * @returns {Object} Objet temps {day, hour, minute}
   */
  static totalMinutesToTime(totalMinutes) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    return {
      day: days + 1,
      hour: hours,
      minute: minutes
    };
  }
  
  /**
   * Génère des événements temporels selon le contexte
   * @param {Object} oldTime - Temps précédent
   * @param {Object} newTime - Nouveau temps
   * @param {Object} context - Contexte du jeu
   * @returns {Array} Événements générés
   */
  static generateTimeEvents(oldTime, newTime, context = {}) {
    const events = [];
    
    // Changement de jour
    if (newTime.day > oldTime.day) {
      events.push({
        type: 'new_day',
        day: newTime.day,
        message: `Un nouveau jour commence... (Jour ${newTime.day})`
      });
    }
    
    // Changement de phase
    const oldPhase = this.calculatePhase(oldTime.hour);
    const newPhase = this.calculatePhase(newTime.hour);
    
    if (oldPhase !== newPhase) {
      events.push({
        type: 'phase_change',
        from: oldPhase,
        to: newPhase,
        message: this.getPhaseChangeMessage(oldPhase, newPhase)
      });
    }
    
    // Événements spéciaux selon l'heure
    if (newTime.hour === 0 && oldTime.hour !== 0) {
      events.push({
        type: 'midnight',
        message: 'Minuit sonne... L\'atmosphère devient plus oppressante.'
      });
    }
    
    if (newTime.hour === 6 && oldTime.hour < 6) {
      events.push({
        type: 'dawn',
        message: 'L\'aube se lève, chassant les ombres de la nuit.'
      });
    }
    
    return events;
  }
  
  /**
   * Génère un message pour un changement de phase
   * @param {string} fromPhase - Phase précédente
   * @param {string} toPhase - Nouvelle phase
   * @returns {string} Message descriptif
   */
  static getPhaseChangeMessage(fromPhase, toPhase) {
    const transitions = {
      'night_morning': 'Les premières lueurs de l\'aube percent l\'obscurité.',
      'morning_day': 'Le soleil monte dans le ciel, réchauffant l\'air.',
      'day_evening': 'Le soleil décline, teintant le ciel de couleurs chaudes.',
      'evening_night': 'L\'obscurité s\'installe, et les ombres s\'allongent.',
      'morning_evening': 'La journée passe rapidement.',
      'day_night': 'La nuit tombe soudainement.'
    };
    
    const key = `${fromPhase}_${toPhase}`;
    return transitions[key] || `Le temps passe de ${fromPhase} à ${toPhase}.`;
  }
  
  // =============================================
  // 🧪 MÉTHODES DE TEST ET DEBUG
  // =============================================
  
  /**
   * Valide qu'un objet temps est correct
   * @param {Object} timeObj - Objet temps à valider
   * @returns {boolean} True si valide
   */
  static validateTimeObject(timeObj) {
    if (!timeObj || typeof timeObj !== 'object') return false;
    
    const { day, hour, minute } = timeObj;
    
    return (
      typeof day === 'number' && day >= 1 &&
      typeof hour === 'number' && hour >= 0 && hour <= 23 &&
      typeof minute === 'number' && minute >= 0 && minute <= 59
    );
  }
  
  /**
   * Crée un objet temps pour les tests
   * @param {number} day - Jour
   * @param {number} hour - Heure
   * @param {number} minute - Minute
   * @returns {Object} Objet temps de test
   */
  static createTestTime(day = 1, hour = 8, minute = 0) {
    return {
      day,
      hour,
      minute,
      phase: this.calculatePhase(hour)
    };
  }
}

export default TimeService;