/**
 * Tests unitaires pour TimeService
 * 
 * OBJECTIF : Valider tous les calculs temporels critiques
 * COUVERTURE : Calculs de base, formatage, logique métier, edge cases
 * 
 * @author Claude Code - Système de Temporalité
 * @version 1.0.0
 */

import { TimeService } from './TimeService';

describe('TimeService - Calculs temporels de base', () => {
  
  describe('addMinutes', () => {
    test('ajoute des minutes sans dépassement', () => {
      const time = { day: 1, hour: 10, minute: 30 };
      const result = TimeService.addMinutes(time, 15);
      
      expect(result).toEqual({
        day: 1,
        hour: 10,
        minute: 45
      });
    });
    
    test('gère le dépassement de minutes vers heures', () => {
      const time = { day: 1, hour: 10, minute: 50 };
      const result = TimeService.addMinutes(time, 20);
      
      expect(result).toEqual({
        day: 1,
        hour: 11,
        minute: 10
      });
    });
    
    test('gère le dépassement d\'heures vers jours', () => {
      const time = { day: 1, hour: 23, minute: 30 };
      const result = TimeService.addMinutes(time, 60);
      
      expect(result).toEqual({
        day: 2,
        hour: 0,
        minute: 30
      });
    });
    
    test('gère les dépassements multiples', () => {
      const time = { day: 1, hour: 23, minute: 50 };
      const result = TimeService.addMinutes(time, 130); // 2h10
      
      expect(result).toEqual({
        day: 2,
        hour: 2,
        minute: 0
      });
    });
    
    test('gère les minutes négatives', () => {
      const time = { day: 1, hour: 10, minute: 15 };
      const result = TimeService.addMinutes(time, -30);
      
      expect(result).toEqual({
        day: 1,
        hour: 9,
        minute: 45
      });
    });
    
    test('empêche les jours négatifs', () => {
      const time = { day: 1, hour: 0, minute: 0 };
      const result = TimeService.addMinutes(time, -60);
      
      expect(result.day).toBe(1);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
    });
    
    test('lance une erreur pour des paramètres invalides', () => {
      expect(() => TimeService.addMinutes(null, 30)).toThrow();
      expect(() => TimeService.addMinutes({ day: 1 }, 'invalid')).toThrow();
    });
  });
  
  describe('addHours', () => {
    test('ajoute des heures correctement', () => {
      const time = { day: 1, hour: 10, minute: 0 };
      const result = TimeService.addHours(time, 2);
      
      expect(result).toEqual({
        day: 1,
        hour: 12,
        minute: 0
      });
    });
    
    test('gère le dépassement de jour', () => {
      const time = { day: 1, hour: 22, minute: 0 };
      const result = TimeService.addHours(time, 8);
      
      expect(result).toEqual({
        day: 2,
        hour: 6,
        minute: 0
      });
    });
  });
  
  describe('addDays', () => {
    test('ajoute des jours correctement', () => {
      const time = { day: 1, hour: 10, minute: 0 };
      const result = TimeService.addDays(time, 3);
      
      expect(result).toEqual({
        day: 4,
        hour: 10,
        minute: 0
      });
    });
  });
});

describe('TimeService - Calculs de phases', () => {
  
  describe('calculatePhase', () => {
    test('calcule correctement les phases', () => {
      expect(TimeService.calculatePhase(3)).toBe('night');
      expect(TimeService.calculatePhase(8)).toBe('morning');
      expect(TimeService.calculatePhase(14)).toBe('day');
      expect(TimeService.calculatePhase(19)).toBe('evening');
      expect(TimeService.calculatePhase(23)).toBe('night');
    });
    
    test('gère les heures limites', () => {
      expect(TimeService.calculatePhase(6)).toBe('morning');
      expect(TimeService.calculatePhase(12)).toBe('day');
      expect(TimeService.calculatePhase(18)).toBe('evening');
      expect(TimeService.calculatePhase(22)).toBe('night');
    });
    
    test('lance une erreur pour des heures invalides', () => {
      expect(() => TimeService.calculatePhase(-1)).toThrow();
      expect(() => TimeService.calculatePhase(24)).toThrow();
    });
  });
  
  describe('isNightHour et isDayHour', () => {
    test('détecte correctement la nuit', () => {
      expect(TimeService.isNightHour(23)).toBe(true);
      expect(TimeService.isNightHour(3)).toBe(true);
      expect(TimeService.isNightHour(22)).toBe(true);
      expect(TimeService.isNightHour(5)).toBe(true);
      expect(TimeService.isNightHour(6)).toBe(false);
      expect(TimeService.isNightHour(12)).toBe(false);
    });
    
    test('détecte correctement le jour', () => {
      expect(TimeService.isDayHour(8)).toBe(true);
      expect(TimeService.isDayHour(15)).toBe(true);
      expect(TimeService.isDayHour(21)).toBe(true);
      expect(TimeService.isDayHour(23)).toBe(false);
      expect(TimeService.isDayHour(3)).toBe(false);
    });
  });
  
  describe('getNextPhase', () => {
    test('retourne la phase suivante', () => {
      expect(TimeService.getNextPhase('night')).toBe('morning');
      expect(TimeService.getNextPhase('morning')).toBe('day');
      expect(TimeService.getNextPhase('day')).toBe('evening');
      expect(TimeService.getNextPhase('evening')).toBe('night');
    });
  });
});

describe('TimeService - Formatage et affichage', () => {
  
  describe('formatTime', () => {
    test('formate correctement un temps valide', () => {
      const time = { day: 3, hour: 14, minute: 30, phase: 'day' };
      const result = TimeService.formatTime(time);
      
      expect(result).toEqual({
        time: '14:30',
        period: 'Jour',
        day: 'Jour 3',
        phase: 'day',
        dayTime: 'day'
      });
    });
    
    test('gère les temps incomplets', () => {
      const time = { hour: 8 };
      const result = TimeService.formatTime(time);
      
      expect(result.time).toBe('08:00');
      expect(result.day).toBe('Jour 1');
    });
    
    test('gère les temps invalides', () => {
      const result = TimeService.formatTime(null);
      
      expect(result.time).toBe('--:--');
      expect(result.period).toBe('Inconnu');
    });
  });
  
  describe('getPeriodName', () => {
    test('retourne les noms de période corrects', () => {
      expect(TimeService.getPeriodName(3)).toBe('Nuit');
      expect(TimeService.getPeriodName(8)).toBe('Matin');
      expect(TimeService.getPeriodName(14)).toBe('Jour');
      expect(TimeService.getPeriodName(20)).toBe('Soir');
      expect(TimeService.getPeriodName(23)).toBe('Nuit');
    });
  });
});

describe('TimeService - Logique métier', () => {
  
  describe('calculateActionTimeCost', () => {
    test('calcule le coût selon le type de scène', () => {
      const combatScene = { type: 'combat' };
      expect(TimeService.calculateActionTimeCost(combatScene)).toBe(30);
      
      const dialogueScene = { type: 'dialogue' };
      expect(TimeService.calculateActionTimeCost(dialogueScene)).toBe(15);
      
      const interactiveScene = { type: 'interactive' };
      expect(TimeService.calculateActionTimeCost(interactiveScene)).toBe(60);
    });
    
    test('utilise le coût explicite du choix', () => {
      const scene = { type: 'text' };
      const choice = { consequences: { timeCost: 90 } };
      
      expect(TimeService.calculateActionTimeCost(scene, choice)).toBe(90);
    });
    
    test('applique les modificateurs contextuels', () => {
      const scene = { type: 'interactive' };
      const context = { isNight: true };
      
      const cost = TimeService.calculateActionTimeCost(scene, null, context);
      expect(cost).toBe(90); // 60 * 1.5
    });
    
    test('utilise un coût par défaut pour types inconnus', () => {
      const unknownScene = { type: 'unknown_type' };
      expect(TimeService.calculateActionTimeCost(unknownScene)).toBe(15);
    });
  });
  
  describe('validateRestAvailability', () => {
    test('valide un repos dans un lieu sûr', () => {
      const timeState = {
        currentTime: { day: 1, hour: 12, minute: 0 },
        history: { lastRest: null }
      };
      const scene = {
        metadata: { safety: 4 }
      };
      
      const result = TimeService.validateRestAvailability(timeState, 'long', scene);
      expect(result.allowed).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });
    
    test('rejette un repos dans un lieu dangereux', () => {
      const timeState = {
        currentTime: { day: 1, hour: 12, minute: 0 },
        history: { lastRest: null }
      };
      const scene = {
        metadata: { safety: 1 }
      };
      
      const result = TimeService.validateRestAvailability(timeState, 'long', scene);
      expect(result.allowed).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
    
    test('avertit pour repos récent', () => {
      const timeState = {
        currentTime: { day: 1, hour: 20, minute: 0 },
        history: { 
          lastRest: { 
            type: 'long', 
            time: { day: 1, hour: 8, minute: 0 }
          } 
        }
      };
      const scene = {
        metadata: { safety: 4 }
      };
      
      const result = TimeService.validateRestAvailability(timeState, 'long', scene);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('TimeService - Utilitaires', () => {
  
  describe('getTimeDifference', () => {
    test('calcule la différence entre deux temps', () => {
      const time1 = { day: 1, hour: 8, minute: 0 };
      const time2 = { day: 1, hour: 10, minute: 30 };
      
      const diff = TimeService.getTimeDifference(time1, time2);
      expect(diff.hours).toBe(2);
      expect(diff.minutes).toBe(30);
      expect(diff.totalMinutes).toBe(150);
    });
    
    test('gère les différences sur plusieurs jours', () => {
      const time1 = { day: 1, hour: 22, minute: 0 };
      const time2 = { day: 2, hour: 8, minute: 0 };
      
      const diff = TimeService.getTimeDifference(time1, time2);
      expect(diff.hours).toBe(10);
      expect(diff.days).toBe(0);
      expect(diff.totalMinutes).toBe(600);
    });
  });
  
  describe('timeToTotalMinutes et totalMinutesToTime', () => {
    test('convertit correctement en minutes totales', () => {
      const time = { day: 2, hour: 3, minute: 45 };
      const totalMinutes = TimeService.timeToTotalMinutes(time);
      
      // (2-1) * 24 * 60 + 3 * 60 + 45 = 1440 + 180 + 45 = 1665
      expect(totalMinutes).toBe(1665);
    });
    
    test('convertit correctement depuis minutes totales', () => {
      const totalMinutes = 1665;
      const time = TimeService.totalMinutesToTime(totalMinutes);
      
      expect(time).toEqual({
        day: 2,
        hour: 3,
        minute: 45
      });
    });
    
    test('round trip conversion', () => {
      const originalTime = { day: 5, hour: 14, minute: 37 };
      const totalMinutes = TimeService.timeToTotalMinutes(originalTime);
      const convertedTime = TimeService.totalMinutesToTime(totalMinutes);
      
      expect(convertedTime).toEqual(originalTime);
    });
  });
  
  describe('generateTimeEvents', () => {
    test('génère un événement de nouveau jour', () => {
      const oldTime = { day: 1, hour: 23, minute: 0 };
      const newTime = { day: 2, hour: 1, minute: 0 };
      
      const events = TimeService.generateTimeEvents(oldTime, newTime);
      expect(events.some(e => e.type === 'new_day')).toBe(true);
    });
    
    test('génère un événement de changement de phase', () => {
      const oldTime = { day: 1, hour: 11, minute: 30 };
      const newTime = { day: 1, hour: 13, minute: 0 };
      
      const events = TimeService.generateTimeEvents(oldTime, newTime);
      expect(events.some(e => e.type === 'phase_change')).toBe(true);
    });
    
    test('génère des événements spéciaux', () => {
      const oldTime = { day: 1, hour: 23, minute: 30 };
      const newTime = { day: 2, hour: 0, minute: 30 };
      
      const events = TimeService.generateTimeEvents(oldTime, newTime);
      expect(events.some(e => e.type === 'midnight')).toBe(true);
    });
  });
});

describe('TimeService - Validation et tests', () => {
  
  describe('validateTimeObject', () => {
    test('valide un objet temps correct', () => {
      const validTime = { day: 1, hour: 12, minute: 30 };
      expect(TimeService.validateTimeObject(validTime)).toBe(true);
    });
    
    test('rejette des objets temps invalides', () => {
      expect(TimeService.validateTimeObject(null)).toBe(false);
      expect(TimeService.validateTimeObject({})).toBe(false);
      expect(TimeService.validateTimeObject({ day: 0, hour: 12 })).toBe(false);
      expect(TimeService.validateTimeObject({ day: 1, hour: 25 })).toBe(false);
      expect(TimeService.validateTimeObject({ day: 1, hour: 12, minute: 60 })).toBe(false);
    });
  });
  
  describe('createTestTime', () => {
    test('crée un temps de test valide', () => {
      const testTime = TimeService.createTestTime(2, 15, 30);
      
      expect(testTime).toEqual({
        day: 2,
        hour: 15,
        minute: 30,
        phase: 'day'
      });
      expect(TimeService.validateTimeObject(testTime)).toBe(true);
    });
    
    test('utilise les valeurs par défaut', () => {
      const testTime = TimeService.createTestTime();
      
      expect(testTime.day).toBe(1);
      expect(testTime.hour).toBe(8);
      expect(testTime.minute).toBe(0);
      expect(testTime.phase).toBe('morning');
    });
  });
});

describe('TimeService - Edge cases et robustesse', () => {
  
  test('gère les grandes valeurs de minutes', () => {
    const time = { day: 1, hour: 0, minute: 0 };
    const result = TimeService.addMinutes(time, 10080); // 7 jours
    
    expect(result.day).toBe(8);
    expect(result.hour).toBe(0);
    expect(result.minute).toBe(0);
  });
  
  test('gère les transitions de phase complexes', () => {
    // Transition directe de matin à soir (cas rare mais possible)
    const oldTime = { day: 1, hour: 11, minute: 0 };
    const newTime = { day: 1, hour: 19, minute: 0 };
    
    const events = TimeService.generateTimeEvents(oldTime, newTime);
    expect(events.length).toBeGreaterThan(0);
  });
  
  test('maintient la cohérence lors de calculs en chaîne', () => {
    let time = { day: 1, hour: 8, minute: 0 };
    
    // Série de calculs
    time = TimeService.addMinutes(time, 127); // +2h07
    time = TimeService.addHours(time, 3);     // +3h
    time = TimeService.addDays(time, 1);      // +1 jour
    time = TimeService.addMinutes(time, -30); // -30min
    
    expect(TimeService.validateTimeObject(time)).toBe(true);
    expect(time.day).toBe(2);
    expect(time.hour).toBe(12); // 8 + 2 + 3 - 0.5 = 12.5 -> 12h30
    expect(time.minute).toBe(37); // 0 + 7 + 0 - 30 = 37 (avec gestion dépassement)
  });
});