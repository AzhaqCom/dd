/**
 * Tests d'Intégration pour CharacterStore - Nouvelle Architecture
 * =============================================================
 * 
 * Ces tests valident l'intégration entre le store refactorisé et les fonctions pures.
 */

import { useCharacterStore } from '../../src/stores/characterStore.js';
import { characterTemplates } from '../../src/data/characterTemplates.js';

describe('CharacterStore - Architecture Refactorisée', () => {

  let store;
  
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    store = useCharacterStore.getState();
    store.resetCharacters();
    store.setPlayerCharacter(characterTemplates.wizard); // Personnage de test
  });

  // =============================================
  // 🧪 TESTS DE LA NOUVELLE MÉTHODE applyEffectToPlayer
  // =============================================

  describe('applyEffectToPlayer', () => {

    test('applique correctement un effet Mage Armor', () => {
      const effectData = {
        type: 'mage_armor',
        duration: 28800,
        source: 'Mage Armor Spell',
        properties: {
          setAC: 13,
          usesDexMod: true
        }
      };

      // Sauvegarder l'état initial
      const initialCharacter = store.playerCharacter;
      const initialAC = initialCharacter.ac || 10;

      // Appliquer l'effet
      store.applyEffectToPlayer(effectData);
      
      // Vérifier les résultats
      const updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter).not.toBe(initialCharacter); // Nouvelle instance
      expect(updatedCharacter.activeEffects).toHaveLength(1);
      expect(updatedCharacter.activeEffects[0].type).toBe('mage_armor');
      expect(updatedCharacter.ac).toBeGreaterThan(initialAC);
    });

    test('applique correctement un effet Shield', () => {
      const effectData = {
        type: 'shield',
        duration: 6, // 1 round
        source: 'Shield Spell',
        properties: {
          acBonus: 5,
          isReaction: true
        }
      };

      const initialAC = store.playerCharacter.ac || 12;

      store.applyEffectToPlayer(effectData);
      
      const updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter.activeEffects).toHaveLength(1);
      expect(updatedCharacter.ac).toBe(initialAC + 5);
    });

    test('combine plusieurs effets correctement', () => {
      // Appliquer Mage Armor
      store.applyEffectToPlayer({
        type: 'mage_armor',
        duration: 28800,
        source: 'Test',
        properties: { setAC: 13, usesDexMod: true }
      });

      // Puis Shield
      store.applyEffectToPlayer({
        type: 'shield',
        duration: 6,
        source: 'Test',
        properties: { acBonus: 5 }
      });

      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects).toHaveLength(2);
      
      // CA = 13 (Mage Armor) + Mod Dex + 5 (Shield)
      const dexMod = Math.floor((character.stats?.dexterity - 10) / 2) || 0;
      expect(character.ac).toBe(13 + dexMod + 5);
    });

  });

  // =============================================
  // 🚫 TESTS GESTION D'ERREURS
  // =============================================

  describe('Gestion d\'erreurs', () => {

    test('gère gracieusement un effet invalide', () => {
      const invalidEffect = {
        type: 'nonexistent_effect',
        duration: 3600,
        source: 'Test'
      };

      // Ne doit pas planter
      expect(() => {
        store.applyEffectToPlayer(invalidEffect);
      }).not.toThrow();

      // L'état ne doit pas changer
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects).toHaveLength(0);
    });

    test('gère l\'absence de personnage joueur', () => {
      // Supprimer le personnage
      store.setPlayerCharacter(null);

      const effectData = {
        type: 'blessed',
        duration: 600,
        source: 'Test'
      };

      // Ne doit pas planter
      expect(() => {
        store.applyEffectToPlayer(effectData);
      }).not.toThrow();
    });

  });

  // =============================================
  // 🔄 TESTS DE COMPATIBILITÉ
  // =============================================

  describe('Compatibilité avec applyBuffToPlayer (deprecated)', () => {

    test('applyBuffToPlayer redirige vers applyEffectToPlayer', () => {
      // Spy sur console.warn pour vérifier l'avertissement
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const oldEffect = {
        type: 'blessed',
        duration: 600,
        source: 'Legacy Test'
      };

      store.applyBuffToPlayer(oldEffect);

      // Vérifier l'avertissement
      expect(consoleSpy).toHaveBeenCalledWith(
        'applyBuffToPlayer est déprécié. Utiliser applyEffectToPlayer avec la nouvelle structure.'
      );

      // Vérifier que l'effet a été appliqué
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects).toHaveLength(1);
      expect(character.activeEffects[0].type).toBe('blessed');

      consoleSpy.mockRestore();
    });

  });

  // =============================================
  // 🎯 TESTS castSpellPlayer REFACTORISÉ
  // =============================================

  describe('castSpellPlayer avec injection de dépendances', () => {

    test('lance un sort avec succès', () => {
      const spell = {
        name: 'Test Spell',
        level: 1,
        effect: {
          type: 'blessed',
          duration: 600,
          properties: {
            attackBonus: '1d4',
            saveBonus: '1d4'
          }
        }
      };

      const result = store.castSpellPlayer(spell);

      // Vérifier que le service unifié a été appelé
      expect(result).toBeDefined();
      // Note: Le test complet nécessiterait de mocker SpellServiceUnified
    });

    test('gère l\'absence de personnage', () => {
      store.setPlayerCharacter(null);

      const result = store.castSpellPlayer('test_spell');

      expect(result.success).toBe(false);
      expect(result.messages).toContain('Aucun personnage joueur');
    });

  });

  // =============================================
  // 📊 TESTS DE PERFORMANCE
  // =============================================

  describe('Performance', () => {

    test('application multiple d\'effets reste performante', () => {
      const start = performance.now();

      // Appliquer 20 effets
      for (let i = 0; i < 20; i++) {
        store.applyEffectToPlayer({
          type: 'blessed',
          duration: 600 + i,
          source: `Test ${i}`,
          properties: { attackBonus: '1d4' }
        });
      }

      const duration = performance.now() - start;
      
      // Doit être rapide (moins de 50ms)
      expect(duration).toBeLessThan(50);
      
      // L'effet doit être présent (remplacé par le dernier avec durée la plus longue)
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects).toHaveLength(1);
      expect(character.activeEffects[0].duration).toBe(619); // Dernier appliqué
    });

  });

});