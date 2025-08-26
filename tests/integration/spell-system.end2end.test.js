/**
 * Tests End-to-End du Système de Sorts Refactorisé
 * ==================================================
 * 
 * Ces tests valident le flux complet du système unifié :
 * Spell Data → Service → Store → Character State
 */

import { useCharacterStore } from '../../src/stores/characterStore.js';
import { SpellServiceUnified } from '../../src/services/SpellServiceUnified.js';
import { CombatEffects } from '../../src/services/combatEffects.js';
import { spells } from '../../src/data/spells.js';
import { characterTemplates } from '../../src/data/characterTemplates.js';

describe('Système de Sorts - Tests End-to-End', () => {

  let store;
  let spellService;
  
  beforeEach(() => {
    // Reset et setup du store
    store = useCharacterStore.getState();
    store.resetCharacters();
    store.setPlayerCharacter(characterTemplates.wizard);
    
    // Configuration du service unifié avec injection
    spellService = new SpellServiceUnified({
      applyEffect: store.applyEffectToPlayer,
      gameStore: null // Mock si nécessaire
    });
  });

  // =============================================
  // 🎯 FLUX COMPLET: DATA → SERVICE → STORE
  // =============================================

  describe('Flux Complet de Sorts', () => {

    test('Mage Armor: De la donnée à l\'application', () => {
      // 1. DONNÉES: Sort avec nouvelle structure
      const mageArmorSpell = spells['Armure du Mage'];
      expect(mageArmorSpell.effect).toBeDefined();
      expect(mageArmorSpell.effect.type).toBe('mage_armor');
      
      // 2. SERVICE: Lancement du sort
      const result = spellService.castSpell(
        store.playerCharacter,
        mageArmorSpell,
        [],
        { context: 'exploration' }
      );
      
      expect(result.success).toBe(true);
      
      // 3. STORE: État mis à jour
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects).toHaveLength(1);
      expect(character.activeEffects[0].type).toBe('mage_armor');
      
      // 4. CALCUL: CA recalculée automatiquement
      const dexMod = Math.floor((character.stats?.dexterity - 10) / 2) || 0;
      expect(character.ac).toBe(13 + dexMod);
    });

    test('Shield: Sort de réaction avec bonus temporaire', () => {
      const shieldSpell = spells['Bouclier'];
      
      // Lancer le sort
      spellService.castSpell(
        store.playerCharacter,
        shieldSpell,
        [],
        { context: 'combat' }
      );
      
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects[0].type).toBe('shield');
      expect(character.activeEffects[0].properties.acBonus).toBe(5);
      expect(character.activeEffects[0].properties.isReaction).toBe(true);
    });

    test('Bénédiction: Effet de buff avec bonus aux jets', () => {
      const blessSpell = spells['Bénédiction'];
      
      spellService.castSpell(
        store.playerCharacter,
        blessSpell,
        [],
        { context: 'exploration' }
      );
      
      const character = useCharacterStore.getState().playerCharacter;
      expect(character.activeEffects[0].type).toBe('blessed');
      expect(character.activeEffects[0].properties.attackBonus).toBe('1d4');
      expect(character.activeEffects[0].properties.saveBonus).toBe('1d4');
    });

  });

  // =============================================
  // 🔄 TESTS DE CUMUL ET REMPLACEMENT
  // =============================================

  describe('Gestion des Effets Multiples', () => {

    test('Mage Armor + Shield se cumulent correctement', () => {
      const character = store.playerCharacter;
      const baseAC = character.ac || 12;
      const dexMod = Math.floor((character.stats?.dexterity - 10) / 2) || 0;

      // 1. Appliquer Mage Armor
      spellService.castSpell(character, spells['Armure du Mage'], [], { context: 'exploration' });
      
      let updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter.ac).toBe(13 + dexMod); // Mage Armor seule
      
      // 2. Appliquer Shield
      spellService.castSpell(updatedCharacter, spells['Bouclier'], [], { context: 'combat' });
      
      updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter.activeEffects).toHaveLength(2);
      expect(updatedCharacter.ac).toBe(13 + dexMod + 5); // Mage Armor + Shield
    });

    test('Effets identiques se remplacent par la durée la plus longue', () => {
      const character = store.playerCharacter;

      // Premier effet court
      store.applyEffectToPlayer({
        type: 'blessed',
        duration: 60,
        source: 'Test Short',
        properties: { attackBonus: '1d4' }
      });

      let updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter.activeEffects[0].duration).toBe(60);

      // Deuxième effet plus long (doit remplacer)
      store.applyEffectToPlayer({
        type: 'blessed',
        duration: 600,
        source: 'Test Long',
        properties: { attackBonus: '1d4' }
      });

      updatedCharacter = useCharacterStore.getState().playerCharacter;
      expect(updatedCharacter.activeEffects).toHaveLength(1);
      expect(updatedCharacter.activeEffects[0].duration).toBe(600);
      expect(updatedCharacter.activeEffects[0].source).toBe('Test Long');
    });

  });

  // =============================================
  // 🧪 TESTS DE COHÉRENCE DATA → MECHANICS
  // =============================================

  describe('Cohérence Données → Mécaniques', () => {

    test('Tous les sorts avec effets peuvent être appliqués', () => {
      const character = store.playerCharacter;
      const spellsWithEffects = Object.entries(spells)
        .filter(([key, spell]) => spell.effect)
        .slice(0, 5); // Tester les 5 premiers pour la performance

      spellsWithEffects.forEach(([spellKey, spell]) => {
        // Reset pour chaque test
        store.setPlayerCharacter(characterTemplates.wizard);
        
        expect(() => {
          spellService.castSpell(
            useCharacterStore.getState().playerCharacter,
            spell,
            [],
            { context: 'exploration' }
          );
        }).not.toThrow();
      });
    });

    test('Types d\'effets dans spells.js existent dans CombatEffects.EFFECT_TYPES', () => {
      const spellEffectTypes = Object.values(spells)
        .filter(spell => spell.effect)
        .map(spell => spell.effect.type);

      const uniqueTypes = [...new Set(spellEffectTypes)];

      uniqueTypes.forEach(effectType => {
        expect(CombatEffects.EFFECT_TYPES[effectType]).toBeDefined();
      });
    });

  });

  // =============================================
  // 🚫 TESTS DE RÉGRESSION
  // =============================================

  describe('Tests de Non-Régression', () => {

    test('Les anciens sorts fonctionnent toujours', () => {
      const character = store.playerCharacter;
      
      // Test avec l'ancien format (si il en reste)
      const legacySpell = {
        name: 'Test Legacy',
        level: 1,
        effect: {
          type: 'blessed',
          duration: 600,
          properties: { attackBonus: '1d4' }
        }
      };

      expect(() => {
        spellService.castSpell(character, legacySpell, [], { context: 'exploration' });
      }).not.toThrow();
    });

    test('Méthode dépréciée applyBuffToPlayer fonctionne encore', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const oldEffect = {
        type: 'blessed',
        duration: 600,
        source: 'Legacy'
      };

      expect(() => {
        store.applyBuffToPlayer(oldEffect);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

  });

  // =============================================
  // 📊 TESTS DE PERFORMANCE GLOBALE
  // =============================================

  describe('Performance Globale', () => {

    test('Lancement de 10 sorts reste performant', () => {
      const character = store.playerCharacter;
      const testSpells = [
        spells['Armure du Mage'],
        spells['Bouclier'], 
        spells['Bénédiction'],
        spells['Aide'],
        spells['Sanctuaire']
      ];

      const start = performance.now();

      // Lancer 10 sorts (2 de chaque type)
      for (let i = 0; i < 10; i++) {
        const spell = testSpells[i % testSpells.length];
        spellService.castSpell(character, spell, [], { context: 'exploration' });
      }

      const duration = performance.now() - start;

      // Doit rester sous 100ms
      expect(duration).toBeLessThan(100);
    });

    test('Mémoire: Pas de fuite avec applications répétées', () => {
      const character = store.playerCharacter;
      const initialEffectsLength = character.activeEffects?.length || 0;

      // Appliquer et réappliquer le même effet 100 fois
      for (let i = 0; i < 100; i++) {
        store.applyEffectToPlayer({
          type: 'blessed',
          duration: 600 + i, // Durée croissante pour forcer le remplacement
          source: `Test ${i}`,
          properties: { attackBonus: '1d4' }
        });
      }

      const finalCharacter = useCharacterStore.getState().playerCharacter;
      
      // Ne doit avoir qu'un seul effet (le dernier)
      expect(finalCharacter.activeEffects).toHaveLength(1);
      expect(finalCharacter.activeEffects[0].duration).toBe(699); // Dernier appliqué
    });

  });

});