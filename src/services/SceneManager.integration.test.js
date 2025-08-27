/**
 * Tests d'intégration pour le système temporel avec SceneManager
 * 
 * OBJECTIF : Valider l'intégration complète du système temporel avec les scènes
 * COUVERTURE : Transitions, coûts temporels, restrictions, événements
 * 
 * @author Claude Code - Système de Temporalité
 * @version 1.0.0
 */

import { SceneManager } from './SceneManager';
import { TimeService } from './TimeService';
import { useTimeStore } from '../stores/timeStore';
import { prologueScenes } from '../data/scenes/prologue';

// Mock du store pour les tests
let mockTimeStore;

beforeEach(() => {
  // Reset du store avant chaque test
  mockTimeStore = {
    currentTime: { day: 1, hour: 10, minute: 0, phase: 'morning' },
    history: { lastRest: null, totalDaysPlayed: 0, actionsToday: 0, majorEvents: [] },
    advanceTimeByAction: jest.fn(),
    performRest: jest.fn(),
    isNightTime: jest.fn(() => false),
    getState: jest.fn(() => mockTimeStore)
  };
  
  // Mock de useTimeStore
  useTimeStore.getState = jest.fn(() => mockTimeStore);
});

describe('SceneManager - Intégration Temporelle', () => {
  
  describe('processSceneTransition', () => {
    test('calcule correctement le coût temporel d\'une transition dialogue', () => {
      const fromScene = prologueScenes.prologue_heritage;
      const toScene = prologueScenes.prologue_taverne_entree;
      const choice = { text: 'Test', next: toScene.id };
      
      const result = SceneManager.processSceneTransition(fromScene, toScene, choice);
      
      expect(result.success).toBe(true);
      expect(result.timeAdvanced).toBeGreaterThan(0);
      expect(mockTimeStore.advanceTimeByAction).toHaveBeenCalled();
    });
    
    test('utilise le coût temporel explicite du choix', () => {
      const fromScene = prologueScenes.prologue_taverne_entree;
      const toScene = prologueScenes.prologue_taverne_villageois;
      const choice = {
        text: 'Je suis l\'héritier légitime',
        next: toScene.id,
        consequences: { timeCost: 20 }
      };
      
      SceneManager.processSceneTransition(fromScene, toScene, choice);
      
      expect(mockTimeStore.advanceTimeByAction).toHaveBeenCalledWith(
        expect.any(String), 
        20
      );
    });
    
    test('génère des événements temporels lors du changement de jour', () => {
      // Simuler un passage à minuit
      mockTimeStore.currentTime = { day: 1, hour: 23, minute: 45 };
      
      const fromScene = prologueScenes.prologue_heritage;
      const toScene = prologueScenes.prologue_taverne_entree;
      const choice = { 
        text: 'Test', 
        next: toScene.id,
        consequences: { timeCost: 30 } // 30 minutes = passage à minuit
      };
      
      // Mock du nouveau temps après transition
      const newTime = { day: 2, hour: 0, minute: 15 };
      mockTimeStore.advanceTimeByAction.mockImplementation(() => {
        mockTimeStore.currentTime = newTime;
        return newTime;
      });
      
      const result = SceneManager.processSceneTransition(fromScene, toScene, choice);
      
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.some(e => e.type === 'new_day')).toBe(true);
    });
    
    test('applique les modificateurs nocturnes correctement', () => {
      // Simuler la nuit
      mockTimeStore.currentTime = { day: 1, hour: 23, minute: 0 };
      mockTimeStore.isNightTime = jest.fn(() => true);
      
      const fromScene = prologueScenes.prologue_heritage;
      const toScene = prologueScenes.prologue_tunnels_exploration; // Scène d'exploration
      const choice = { text: 'Explorer la nuit', next: toScene.id };
      
      const result = SceneManager.processSceneTransition(fromScene, toScene, choice);
      
      // Le coût devrait être majoré de 30% la nuit pour l'exploration
      expect(result.timeAdvanced).toBeGreaterThan(60); // Plus que le coût de base
    });
  });
  
  describe('calculateTransitionTimeCost', () => {
    test('calcule le coût selon le type de transition', () => {
      const fromScene = { metadata: { location: 'Village' } };
      const toScene = { 
        type: 'combat', 
        metadata: { location: 'Ferme' }
      };
      const choice = {};
      
      const cost = SceneManager.calculateTransitionTimeCost(fromScene, toScene, choice);
      expect(cost).toBe(30); // Combat = 30 minutes
    });
    
    test('reconnaît les mêmes lieux', () => {
      const fromScene = { metadata: { location: 'La Lanterne Vacillante' } };
      const toScene = { metadata: { location: 'La Lanterne Vacillante' } };
      const choice = {};
      
      const cost = SceneManager.calculateTransitionTimeCost(fromScene, toScene, choice);
      expect(cost).toBeLessThan(15); // Même lieu = coût faible
    });
  });
  
  describe('getTransitionType', () => {
    test('détecte les transitions dans le même lieu', () => {
      const from = { metadata: { location: 'Taverne' } };
      const to = { metadata: { location: 'Taverne' } };
      
      const type = SceneManager.getTransitionType(from, to);
      expect(type).toBe('same_location');
    });
    
    test('détecte les types de scènes spécifiques', () => {
      const from = { metadata: { location: 'Village' } };
      const combat = { type: 'combat', metadata: { location: 'Ferme' } };
      const dialogue = { type: 'dialogue', metadata: { location: 'Maison' } };
      
      expect(SceneManager.getTransitionType(from, combat)).toBe('combat');
      expect(SceneManager.getTransitionType(from, dialogue)).toBe('dialogue');
    });
  });
  
  describe('checkTimeRestrictions', () => {
    test('détecte les restrictions nocturnes', () => {
      mockTimeStore.currentTime = { hour: 2, phase: 'night' }; // 2h du matin
      
      const scene = {
        metadata: {
          timeRestrictions: { dayOnly: true }
        }
      };
      
      const restrictions = SceneManager.checkTimeRestrictions(scene);
      expect(restrictions.length).toBeGreaterThan(0);
      expect(restrictions[0]).toContain('journée');
    });
    
    test('détecte les lieux dangereux la nuit', () => {
      mockTimeStore.currentTime = { hour: 23 }; // 23h
      
      const scene = {
        metadata: { safety: 1 } // Lieu dangereux
      };
      
      const restrictions = SceneManager.checkTimeRestrictions(scene);
      expect(restrictions.some(r => r.includes('dangereux la nuit'))).toBe(true);
    });
    
    test('n\'ajoute pas de restrictions pour lieux sûrs', () => {
      mockTimeStore.currentTime = { hour: 14 }; // 14h
      
      const scene = {
        metadata: { safety: 4 } // Lieu sûr
      };
      
      const restrictions = SceneManager.checkTimeRestrictions(scene);
      expect(restrictions.length).toBe(0);
    });
  });
  
  describe('calculateDistance', () => {
    test('calcule la distance entre chapitres', () => {
      const from = { metadata: { chapter: 'prologue' } };
      const to = { metadata: { chapter: 'acte1' } };
      
      const distance = SceneManager.calculateDistance(from, to);
      expect(distance).toBe(5); // Distance max pour changement de chapitre
    });
    
    test('reconnaît les lieux dans la même zone', () => {
      const from = { metadata: { location: 'Ravenscroft - Taverne' } };
      const to = { metadata: { location: 'Ravenscroft - Forge' } };
      
      const distance = SceneManager.calculateDistance(from, to);
      expect(distance).toBe(1); // Même village
    });
  });
});

describe('Intégration avec scènes réelles du prologue', () => {
  
  test('les scènes du prologue ont les métadonnées temporelles correctes', () => {
    const taverne = prologueScenes.prologue_taverne_entree;
    const tunnels = prologueScenes.prologue_tunnels_exploration;
    const combat = prologueScenes.prologue_combat_ombres;
    
    // Vérifier les métadonnées temporelles
    expect(taverne.metadata.safety).toBe(4);
    expect(tunnels.metadata.safety).toBe(1);
    expect(combat.metadata.safety).toBe(0);
    
    // Vérifier les restrictions de repos
    expect(taverne.metadata.restAvailability.long).toBe(true);
    expect(tunnels.metadata.restAvailability.long).toBe(false);
    expect(combat.metadata.restAvailability.short).toBe(false);
  });
  
  test('les choix avec coûts temporels explicites fonctionnent', () => {
    const scene = prologueScenes.prologue_taverne_entree;
    const choiceWithCost = scene.choices.find(c => c.consequences?.timeCost);
    
    expect(choiceWithCost).toBeTruthy();
    expect(choiceWithCost.consequences.timeCost).toBeGreaterThan(0);
    
    // Simuler la transition
    const nextScene = prologueScenes[choiceWithCost.next];
    const result = SceneManager.processSceneTransition(scene, nextScene, choiceWithCost);
    
    expect(mockTimeStore.advanceTimeByAction).toHaveBeenCalledWith(
      expect.any(String),
      choiceWithCost.consequences.timeCost
    );
  });
  
  test('validation temporelle des repos selon les scènes', () => {
    const safeScene = prologueScenes.prologue_taverne_entree;
    const dangerousScene = prologueScenes.prologue_tunnels_exploration;
    
    const timeState = {
      currentTime: mockTimeStore.currentTime,
      history: mockTimeStore.history
    };
    
    // Repos dans lieu sûr
    const safeRest = TimeService.validateRestAvailability(timeState, 'long', safeScene);
    expect(safeRest.allowed).toBe(true);
    
    // Repos dans lieu dangereux
    const dangerousRest = TimeService.validateRestAvailability(timeState, 'long', dangerousScene);
    expect(dangerousRest.allowed).toBe(false);
    expect(dangerousRest.reasons.length).toBeGreaterThan(0);
  });
});

describe('Performance et robustesse', () => {
  
  test('gère les scènes sans métadonnées temporelles', () => {
    const sceneWithoutMeta = { 
      id: 'test', 
      type: 'text',
      content: { text: 'Test' }
    };
    
    const result = SceneManager.processSceneTransition(
      sceneWithoutMeta, 
      sceneWithoutMeta, 
      { text: 'Test', next: 'test' }
    );
    
    expect(result.success).toBe(true);
    expect(typeof result.timeAdvanced).toBe('number');
  });
  
  test('ne plante pas avec des données manquantes', () => {
    const incompleteScene = { type: 'dialogue' };
    
    expect(() => {
      SceneManager.calculateTransitionTimeCost(
        incompleteScene, 
        incompleteScene, 
        {}
      );
    }).not.toThrow();
  });
  
  test('les calculs de temps restent cohérents', () => {
    const scene = prologueScenes.prologue_taverne_entree;
    const choice = scene.choices[0];
    const nextScene = prologueScenes[choice.next];
    
    // Calculer plusieurs fois le même coût
    const cost1 = SceneManager.calculateTransitionTimeCost(scene, nextScene, choice);
    const cost2 = SceneManager.calculateTransitionTimeCost(scene, nextScene, choice);
    const cost3 = SceneManager.calculateTransitionTimeCost(scene, nextScene, choice);
    
    expect(cost1).toBe(cost2);
    expect(cost2).toBe(cost3);
  });
});