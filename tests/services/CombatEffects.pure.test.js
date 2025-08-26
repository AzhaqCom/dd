/**
 * Tests Unitaires pour les Fonctions Pures de CombatEffects
 * ======================================================
 * 
 * Ce fichier teste la nouvelle architecture immutable du système d'effets.
 * Chaque test valide l'immutabilité, le déterminisme et la robustesse.
 */

import { CombatEffects } from '../../src/services/combatEffects.js';

describe('CombatEffects - Fonctions Pures', () => {

  // =============================================
  // 📦 DONNÉES DE TEST
  // =============================================

  const createTestCharacter = (overrides = {}) => ({
    name: 'TestCharacter',
    baseAC: 10,
    stats: {
      dexterity: 14, // +2 modifier
      strength: 12,
      constitution: 13
    },
    currentHP: 20,
    maxHP: 25,
    activeEffects: [],
    ...overrides
  });

  const createEffectData = (type, overrides = {}) => ({
    type,
    duration: 3600,
    source: 'Test Spell',
    properties: {},
    ...overrides
  });

  // =============================================
  // 🧪 TESTS D'IMMUTABILITÉ
  // =============================================

  describe('Immutabilité', () => {
    
    test('applyEffectPure ne modifie pas l\'objet original', () => {
      const originalCharacter = createTestCharacter();
      const originalSnapshot = JSON.parse(JSON.stringify(originalCharacter));
      const effectData = createEffectData('mage_armor', {
        properties: { setAC: 13, usesDexMod: true }
      });

      const result = CombatEffects.applyEffectPure(originalCharacter, effectData);

      // L'objet original ne doit PAS être modifié
      expect(originalCharacter).toEqual(originalSnapshot);
      
      // Le résultat doit être une nouvelle instance
      expect(result).not.toBe(originalCharacter);
      
      // L'effet doit être appliqué au résultat
      expect(result.activeEffects).toHaveLength(1);
      expect(result.activeEffects[0].type).toBe('mage_armor');
      expect(result.ac).toBe(15); // 13 (Mage Armor) + 2 (Dex)
    });

    test('calculateTotalACPure ne modifie pas le personnage', () => {
      const character = createTestCharacter({
        activeEffects: [{
          type: 'shield',
          properties: { acBonus: 5 }
        }]
      });
      const originalSnapshot = JSON.parse(JSON.stringify(character));

      const totalAC = CombatEffects.calculateTotalACPure(character);

      // L'objet ne doit pas être modifié
      expect(character).toEqual(originalSnapshot);
      
      // Le calcul doit être correct
      expect(totalAC).toBe(17); // 10 (base) + 2 (Dex) + 5 (Shield)
    });

    test('Modifications en cascade préservent l\'immutabilité', () => {
      const character = createTestCharacter();
      
      // Application de plusieurs effets successifs
      const withMageArmor = CombatEffects.applyEffectPure(character, 
        createEffectData('mage_armor', { properties: { setAC: 13, usesDexMod: true } })
      );
      
      const withShield = CombatEffects.applyEffectPure(withMageArmor, 
        createEffectData('shield', { properties: { acBonus: 5 } })
      );

      // Chaque étape doit préserver l'immutabilité
      expect(character.activeEffects).toHaveLength(0);
      expect(withMageArmor.activeEffects).toHaveLength(1);
      expect(withShield.activeEffects).toHaveLength(2);
      
      // Les objets doivent être distincts
      expect(character).not.toBe(withMageArmor);
      expect(withMageArmor).not.toBe(withShield);
    });

  });

  // =============================================
  // 🎯 TESTS DE DÉTERMINISME
  // =============================================

  describe('Déterminisme', () => {

    test('calculateTotalACPure est déterministe', () => {
      const character = createTestCharacter({
        baseAC: 10,
        stats: { dexterity: 16 }, // +3 modifier
        activeEffects: [
          {
            type: 'mage_armor',
            properties: { setAC: 13, usesDexMod: true }
          },
          {
            type: 'shield',
            properties: { acBonus: 5 }
          }
        ]
      });

      const ac1 = CombatEffects.calculateTotalACPure(character);
      const ac2 = CombatEffects.calculateTotalACPure(character);
      const ac3 = CombatEffects.calculateTotalACPure(character);

      // Toujours le même résultat
      expect(ac1).toBe(ac2);
      expect(ac2).toBe(ac3);
      expect(ac1).toBe(21); // 13 (Mage Armor) + 3 (Dex) + 5 (Shield)
    });

    test('applyEffectPure produit des résultats cohérents', () => {
      const character = createTestCharacter();
      const effectData = createEffectData('blessed', {
        properties: { attackBonus: '1d4', saveBonus: '1d4' }
      });

      const result1 = CombatEffects.applyEffectPure(character, effectData);
      const result2 = CombatEffects.applyEffectPure(character, effectData);

      // Les structures doivent être identiques (hors IDs et timestamps)
      expect(result1.activeEffects[0].type).toBe(result2.activeEffects[0].type);
      expect(result1.activeEffects[0].properties).toEqual(result2.activeEffects[0].properties);
      expect(result1.ac).toBe(result2.ac);
    });

  });

  // =============================================
  // ✅ TESTS DE VALIDATION
  // =============================================

  describe('Validation des entrées', () => {

    test('applyEffectPure rejette les types d\'effets invalides', () => {
      const character = createTestCharacter();
      const invalidEffectData = createEffectData('nonexistent_effect');

      expect(() => {
        CombatEffects.applyEffectPure(character, invalidEffectData);
      }).toThrow('Type d\'effet inconnu: nonexistent_effect');
    });

    test('applyEffectPure rejette un personnage null', () => {
      const effectData = createEffectData('mage_armor');

      expect(() => {
        CombatEffects.applyEffectPure(null, effectData);
      }).toThrow('Le paramètre character est requis');
    });

    test('calculateTotalACPure gère les personnages null', () => {
      const result = CombatEffects.calculateTotalACPure(null);
      expect(result).toBe(10); // CA par défaut
    });

    test('calculateTotalACPure gère les stats manquantes', () => {
      const character = { name: 'Test' }; // Pas de stats
      const result = CombatEffects.calculateTotalACPure(character);
      expect(result).toBe(10); // 10 (baseAC default) + 0 (no dex) = 10
    });

  });

  // =============================================
  // 🎮 TESTS DE MÉCANIQUES DE JEU
  // =============================================

  describe('Mécaniques de jeu', () => {

    test('Mage Armor remplace la CA de base avec Dextérité', () => {
      const character = createTestCharacter({
        baseAC: 10,
        stats: { dexterity: 16 } // +3 modifier
      });
      
      const result = CombatEffects.applyEffectPure(character, 
        createEffectData('mage_armor', {
          properties: { setAC: 13, usesDexMod: true }
        })
      );

      expect(result.ac).toBe(16); // 13 (Mage Armor) + 3 (Dex)
    });

    test('Shield ajoute un bonus temporaire de CA', () => {
      const character = createTestCharacter({
        baseAC: 12,
        stats: { dexterity: 14 } // +2
      });

      const result = CombatEffects.applyEffectPure(character,
        createEffectData('shield', {
          properties: { acBonus: 5, isReaction: true }
        })
      );

      expect(result.ac).toBe(19); // 12 (base) + 2 (Dex) + 5 (Shield)
    });

    test('Effets multiples se combinent correctement', () => {
      const character = createTestCharacter({
        baseAC: 10,
        stats: { dexterity: 14 } // +2
      });

      let result = CombatEffects.applyEffectPure(character,
        createEffectData('mage_armor', { properties: { setAC: 13, usesDexMod: true } })
      );

      result = CombatEffects.applyEffectPure(result,
        createEffectData('shield', { properties: { acBonus: 5 } })
      );

      expect(result.ac).toBe(20); // 13 (Mage Armor) + 2 (Dex) + 5 (Shield)
      expect(result.activeEffects).toHaveLength(2);
    });

    test('Remplacement d\'effet avec durée plus longue', () => {
      const character = createTestCharacter();

      // Premier effet court
      let result = CombatEffects.applyEffectPure(character,
        createEffectData('blessed', { duration: 60 })
      );

      expect(result.activeEffects).toHaveLength(1);
      expect(result.activeEffects[0].duration).toBe(60);

      // Deuxième effet plus long (doit remplacer)
      result = CombatEffects.applyEffectPure(result,
        createEffectData('blessed', { duration: 600 })
      );

      expect(result.activeEffects).toHaveLength(1);
      expect(result.activeEffects[0].duration).toBe(600);
    });

    test('Conservation d\'effet avec durée plus courte', () => {
      const character = createTestCharacter();

      // Premier effet long
      let result = CombatEffects.applyEffectPure(character,
        createEffectData('blessed', { duration: 600 })
      );

      // Deuxième effet plus court (ne doit PAS remplacer)
      result = CombatEffects.applyEffectPure(result,
        createEffectData('blessed', { duration: 60 })
      );

      expect(result.activeEffects).toHaveLength(1);
      expect(result.activeEffects[0].duration).toBe(600); // Garde l'original
    });

  });

  // =============================================
  // 🛡️ TESTS DE CAS LIMITES
  // =============================================

  describe('Cas limites', () => {

    test('CA minimum de 1 même avec malus extrême', () => {
      const character = createTestCharacter({
        baseAC: 1,
        stats: { dexterity: 1 } // -5 modifier
      });

      const result = CombatEffects.calculateTotalACPure(character);
      expect(result).toBe(1); // Ne peut pas descendre en dessous de 1
    });

    test('Gestion des effets avec propriétés manquantes', () => {
      const character = createTestCharacter({
        activeEffects: [
          { type: 'mage_armor' }, // Pas de properties
          { type: 'shield', properties: { acBonus: 2 } }
        ]
      });

      const result = CombatEffects.calculateTotalACPure(character);
      expect(result).toBeGreaterThan(0); // Ne doit pas planter
    });

    test('Effets avec types non reconnus sont ignorés', () => {
      const character = createTestCharacter({
        activeEffects: [
          { type: 'unknown_effect', properties: { acBonus: 999 } },
          { type: 'shield', properties: { acBonus: 2 } }
        ]
      });

      const result = CombatEffects.calculateTotalACPure(character);
      expect(result).toBe(14); // 10 (base) + 2 (Dex) + 2 (Shield uniquement)
    });

  });

  // =============================================
  // 📊 TESTS DE PERFORMANCE ET PROFONDEUR
  // =============================================

  describe('Performance et structure', () => {

    test('Copie profonde fonctionne avec objets imbriqués', () => {
      const character = createTestCharacter({
        inventory: [
          { name: 'Sword', properties: { damage: '1d8', type: 'slashing' } }
        ],
        spellcasting: {
          knownSpells: ['mage_armor', 'shield'],
          preparedSpells: ['mage_armor']
        }
      });

      const result = CombatEffects.applyEffectPure(character,
        createEffectData('blessed')
      );

      // Vérifier que les objets imbriqués sont bien copiés
      expect(result.inventory).not.toBe(character.inventory);
      expect(result.spellcasting).not.toBe(character.spellcasting);
      expect(result.inventory[0]).not.toBe(character.inventory[0]);
    });

    test('Performance acceptable avec nombreux effets', () => {
      let character = createTestCharacter();

      // Appliquer 10 effets différents
      const effectTypes = ['blessed', 'mage_armor', 'shield', 'aid', 'sanctuary'];
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        const effectType = effectTypes[i % effectTypes.length];
        character = CombatEffects.applyEffectPure(character,
          createEffectData(effectType, { duration: 100 + i })
        );
      }

      const duration = performance.now() - start;

      expect(character.activeEffects.length).toBeLessThanOrEqual(effectTypes.length);
      expect(duration).toBeLessThan(100); // Moins de 100ms
    });

  });

});