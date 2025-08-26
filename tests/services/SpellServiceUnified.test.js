/**
 * Tests pour SpellServiceUnified Refactorisé
 * ==========================================
 * 
 * Tests de la nouvelle architecture avec injection de dépendances.
 */

import { SpellServiceUnified } from '../../src/services/SpellServiceUnified.js';

describe('SpellServiceUnified - Architecture Refactorisée', () => {

  let mockApplyEffect;
  let mockGameStore;
  let spellService;

  beforeEach(() => {
    // Mock des dépendances
    mockApplyEffect = jest.fn();
    mockGameStore = {
      setEnvironmentFlag: jest.fn()
    };

    // Instance du service avec injection
    spellService = new SpellServiceUnified({
      applyEffect: mockApplyEffect,
      gameStore: mockGameStore
    });
  });

  // =============================================
  // 🧪 TESTS D'INJECTION DE DÉPENDANCES
  // =============================================

  describe('Injection de dépendances', () => {

    test('constructeur accepte les dépendances', () => {
      const dependencies = {
        applyEffect: jest.fn(),
        combatStore: { test: 'combat' },
        gameStore: { test: 'game' }
      };

      const service = new SpellServiceUnified(dependencies);

      expect(service.applyEffect).toBe(dependencies.applyEffect);
      expect(service.combatStore).toBe(dependencies.combatStore);
      expect(service.gameStore).toBe(dependencies.gameStore);
    });

    test('constructeur fonctionne sans dépendances', () => {
      const service = new SpellServiceUnified();

      expect(service.applyEffect).toBeUndefined();
      expect(service.combatStore).toBeUndefined();
      expect(service.gameStore).toBeUndefined();
    });

  });

  // =============================================
  // 🎯 TESTS processExplorationSpellResults REFACTORISÉ
  // =============================================

  describe('processExplorationSpellResults', () => {

    test('applique les effets statistiques via injection', () => {
      const castResult = {
        effects: [
          {
            type: 'mage_armor',
            duration: 28800,
            properties: { setAC: 13, usesDexMod: true }
          },
          {
            type: 'blessed',
            duration: 600,
            properties: { attackBonus: '1d4' }
          }
        ]
      };

      spellService.processExplorationSpellResults(castResult);

      // Vérifier que applyEffect a été appelée pour chaque effet statistique
      expect(mockApplyEffect).toHaveBeenCalledTimes(2);
      expect(mockApplyEffect).toHaveBeenCalledWith({
        type: 'mage_armor',
        duration: 28800,
        properties: { setAC: 13, usesDexMod: true }
      });
      expect(mockApplyEffect).toHaveBeenCalledWith({
        type: 'blessed',
        duration: 600,
        properties: { attackBonus: '1d4' }
      });
    });

    test('traite les effets environnementaux séparément', () => {
      const castResult = {
        effects: [
          {
            type: 'light',
            duration: 1800 // 30 minutes
          },
          {
            type: 'detect_magic',
            duration: 600
          }
        ]
      };

      spellService.processExplorationSpellResults(castResult);

      // Vérifier que les flags environnementaux ont été définis
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('lighting', 1800);
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('showMagicAuras', true);
      
      // Aucun effet statistique ne doit être appliqué
      expect(mockApplyEffect).not.toHaveBeenCalled();
    });

    test('combine effets statistiques et environnementaux', () => {
      const castResult = {
        effects: [
          {
            type: 'mage_armor', // Statistique
            duration: 28800,
            properties: { setAC: 13 }
          },
          {
            type: 'light', // Environnemental
            duration: 3600
          }
        ]
      };

      spellService.processExplorationSpellResults(castResult);

      // Les deux types doivent être traités
      expect(mockApplyEffect).toHaveBeenCalledTimes(1);
      expect(mockApplyEffect).toHaveBeenCalledWith({
        type: 'mage_armor',
        duration: 28800,
        properties: { setAC: 13 }
      });

      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('lighting', 3600);
    });

    test('gère gracieusement l\'absence d\'applyEffect', () => {
      const serviceWithoutApplyEffect = new SpellServiceUnified({
        gameStore: mockGameStore
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const castResult = {
        effects: [
          {
            type: 'blessed',
            duration: 600
          }
        ]
      };

      // Ne doit pas planter
      expect(() => {
        serviceWithoutApplyEffect.processExplorationSpellResults(castResult);
      }).not.toThrow();

      // Doit émettre un avertissement
      expect(consoleSpy).toHaveBeenCalledWith(
        'SpellServiceUnified: Aucune méthode applyEffect injectée pour:', 'blessed'
      );

      consoleSpy.mockRestore();
    });

  });

  // =============================================
  // 🔧 TESTS MÉTHODES UTILITAIRES
  // =============================================

  describe('Méthodes utilitaires', () => {

    test('_isStatisticalEffect identifie correctement les effets', () => {
      // Effets statistiques
      expect(spellService._isStatisticalEffect('mage_armor')).toBe(true);
      expect(spellService._isStatisticalEffect('blessed')).toBe(true);
      expect(spellService._isStatisticalEffect('shield')).toBe(true);
      expect(spellService._isStatisticalEffect('restrained')).toBe(true);

      // Effets environnementaux
      expect(spellService._isStatisticalEffect('light')).toBe(false);
      expect(spellService._isStatisticalEffect('detect_magic')).toBe(false);
      expect(spellService._isStatisticalEffect('unknown_effect')).toBe(false);
    });

    test('_applyEnvironmentalEffect traite les effets connus', () => {
      // Light
      spellService._applyEnvironmentalEffect({
        type: 'light',
        duration: 1800
      });
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('lighting', 1800);

      // Detect Magic
      spellService._applyEnvironmentalEffect({
        type: 'detect_magic'
      });
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('showMagicAuras', true);

      // Comprehend Languages
      spellService._applyEnvironmentalEffect({
        type: 'comprehend_languages'
      });
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledWith('translateText', true);
    });

    test('_applyEnvironmentalEffect ignore les effets inconnus', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      spellService._applyEnvironmentalEffect({
        type: 'unknown_environmental_effect'
      });

      // Doit logger mais ne pas planter
      expect(consoleSpy).toHaveBeenCalledWith(
        'SpellServiceUnified: Effet environnemental non géré:', 'unknown_environmental_effect'
      );

      consoleSpy.mockRestore();
    });

    test('_applyEnvironmentalEffect gère l\'absence de gameStore', () => {
      const serviceWithoutGameStore = new SpellServiceUnified({
        applyEffect: mockApplyEffect
      });

      // Ne doit pas planter même sans gameStore
      expect(() => {
        serviceWithoutGameStore._applyEnvironmentalEffect({
          type: 'light',
          duration: 3600
        });
      }).not.toThrow();
    });

  });

  // =============================================
  // 📊 TESTS DE PERFORMANCE
  // =============================================

  describe('Performance', () => {

    test('traitement de nombreux effets reste performant', () => {
      const castResult = {
        effects: []
      };

      // Créer 100 effets mixtes
      for (let i = 0; i < 100; i++) {
        castResult.effects.push({
          type: i % 2 === 0 ? 'blessed' : 'light',
          duration: 600 + i
        });
      }

      const start = performance.now();
      spellService.processExplorationSpellResults(castResult);
      const duration = performance.now() - start;

      // Doit être rapide (moins de 10ms)
      expect(duration).toBeLessThan(10);

      // Vérifier que tous les effets ont été traités
      expect(mockApplyEffect).toHaveBeenCalledTimes(50); // 50 effets 'blessed'
      expect(mockGameStore.setEnvironmentFlag).toHaveBeenCalledTimes(50); // 50 effets 'light'
    });

  });

  // =============================================
  // 🔄 TESTS DE COMPATIBILITÉ
  // =============================================

  describe('Compatibilité', () => {

    test('fonctionne avec l\'ancienne interface (legacy support)', () => {
      // Test de l'ancienne manière d'instancier (pour compatibilité)
      const legacyService = new SpellServiceUnified({
        characterStore: { applyBuffToPlayer: jest.fn() },
        combatStore: { applyEffect: jest.fn() }
      });

      expect(legacyService.characterStore).toBeDefined();
      expect(legacyService.combatStore).toBeDefined();
    });

  });

});