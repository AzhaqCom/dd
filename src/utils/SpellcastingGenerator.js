import { getClassConfiguration } from '../data/classConfigurations.js';
import { getModifier } from './calculations.js';

/**
 * Générateur automatique de structure spellcasting unifiée
 * Utilise classConfigurations.js pour créer la structure selon les règles D&D
 */
export class SpellcastingGenerator {

  /**
   * Génère la structure spellcasting pour un personnage selon sa classe
   * @param {Object} character - Le personnage
   * @param {string} archetype - Archétype optionnel
   * @returns {Object|null} Structure spellcasting ou null si pas de sorts
   */
  static generateSpellcastingForCharacter(character, archetype = null) {
    const config = getClassConfiguration(character.class, archetype);
    
    // Pas de spellcasting pour cette classe
    if (!config?.spellcasting) {
      return null;
    }

    const spellcasting = config.spellcasting;
    const level = character.level;

    // Vérifier si le niveau permet l'incantation
    if (spellcasting.startLevel && level < spellcasting.startLevel) {
      return null;
    }

    // Calculer les valeurs selon le niveau
    const abilityScore = character.stats[spellcasting.ability] || 10;
    const abilityMod = getModifier(abilityScore);
    
    const result = {
      // === CONFIGURATION DE BASE ===
      ability: spellcasting.ability,
      type: spellcasting.type,
      ritual: spellcasting.ritual || false,
      
      // === EMPLACEMENTS DE SORTS ===
      spellSlots: this.generateSpellSlots(level, character.class, archetype),
      
      // === SORTS CONNUS/PRÉPARÉS ===
      cantrips: [],  // À remplir selon les choix du joueur
      knownSpells: [],
      preparedSpells: [],
      
      // === MÉTADONNÉES OPTIONNELLES ===
      spellcastingClass: archetype ? character.class : null,
      startLevel: spellcasting.startLevel || 1,
      maxKnown: this.calculateMaxKnown(spellcasting, level),
      maxPrepared: this.calculateMaxPrepared(spellcasting, level, abilityMod),
      
      // === RESTRICTIONS ===
      schoolRestrictions: spellcasting.schoolRestrictions || [],
      ritualCasting: spellcasting.ritual || false,
      
      // === SORTS INNÉS ===
      innateSpells: {}
    };

    return result;
  }

  /**
   * Génère les emplacements de sorts selon le niveau et la classe
   * @param {number} level - Niveau du personnage
   * @param {string} className - Nom de la classe
   * @param {string} archetype - Archétype optionnel
   * @returns {Object} Emplacements de sorts
   */
  static generateSpellSlots(level, className, archetype = null) {
    const slots = {};

    // Table des emplacements pour lanceurs complets (Magicien, Clerc, etc.)
    const fullCasterSlots = {
      1: { 1: 2 },
      2: { 1: 3 },
      3: { 1: 4, 2: 2 },
      4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 },
      7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 },
      9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
    };

    // Table pour demi-lanceurs (Paladin, Rôdeur)
    const halfCasterSlots = {
      2: { 1: 2 },
      3: { 1: 3 },
      5: { 1: 4, 2: 2 },
      6: { 1: 4, 2: 2 },
      7: { 1: 4, 2: 3 },
      9: { 1: 4, 2: 3, 3: 2 },
      10: { 1: 4, 2: 3, 3: 2 }
    };

    // Table pour tiers-lanceurs (Chevalier Mystique, Filou Arcanique)
    const thirdCasterSlots = {
      3: { 1: 2 },
      4: { 1: 3 },
      7: { 1: 4, 2: 2 },
      8: { 1: 4, 2: 2 },
      10: { 1: 4, 2: 3 },
      11: { 1: 4, 2: 3 },
      13: { 1: 4, 2: 3, 3: 2 },
      14: { 1: 4, 2: 3, 3: 2 }
    };

    let slotTable;

    // Sélectionner la table selon la classe/archétype
    if (className === 'Magicien' || className === 'Clerc' || className === 'Druide' || className === 'Ensorceleur' || className === 'Barde') {
      slotTable = fullCasterSlots;
    } else if (className === 'Paladin' || className === 'Rôdeur') {
      slotTable = halfCasterSlots;
    } else if (archetype === 'Chevalier Mystique' || archetype === 'Filou Arcanique') {
      slotTable = thirdCasterSlots;
    } else {
      // Classes avec progression spéciale (Inventeur, etc.)
      slotTable = fullCasterSlots; // Par défaut
    }

    const levelSlots = slotTable[Math.min(level, 20)] || {};
    
    for (const [spellLevel, maxSlots] of Object.entries(levelSlots)) {
      slots[spellLevel] = {
        max: maxSlots,
        used: 0,
        available: maxSlots
      };
    }

    return slots;
  }

  /**
   * Calcule le nombre maximum de sorts connus
   */
  static calculateMaxKnown(spellcastingConfig, level) {
    if (spellcastingConfig.type !== 'known') return null;
    
    const knownProgression = spellcastingConfig.spellsKnown;
    if (typeof knownProgression === 'object') {
      return knownProgression[level] || 0;
    }
    
    return null;
  }

  /**
   * Calcule le nombre maximum de sorts préparés
   */
  static calculateMaxPrepared(spellcastingConfig, level, abilityMod) {
    if (spellcastingConfig.type !== 'prepared') return null;
    
    if (typeof spellcastingConfig.spellsPrepared === 'function') {
      return spellcastingConfig.spellsPrepared(level, abilityMod);
    }
    
    // Formule standard D&D : niveau + modificateur
    return level + Math.max(1, abilityMod);
  }

  /**
   * Met à jour automatiquement le spellcasting d'un personnage selon son niveau
   * @param {Object} character - Le personnage à mettre à jour
   * @returns {Object} Personnage avec spellcasting mis à jour
   */
  static updateSpellcastingForLevel(character) {
    if (!character.spellcasting) {
      // Générer pour la première fois
      const generated = this.generateSpellcastingForCharacter(character);
      return {
        ...character,
        spellcasting: generated
      };
    }

    // Mettre à jour les slots et limites existantes
    const newSlots = this.generateSpellSlots(character.level, character.class, character.archetype);
    const abilityMod = getModifier(character.stats[character.spellcasting.ability] || 10);
    
    const config = getClassConfiguration(character.class, character.archetype);
    const maxKnown = this.calculateMaxKnown(config.spellcasting, character.level);
    const maxPrepared = this.calculateMaxPrepared(config.spellcasting, character.level, abilityMod);

    return {
      ...character,
      spellcasting: {
        ...character.spellcasting,
        spellSlots: {
          ...character.spellcasting.spellSlots,
          ...newSlots
        },
        maxKnown,
        maxPrepared
      }
    };
  }

  /**
   * Valide la cohérence d'une structure spellcasting
   * @param {Object} spellcasting - Structure à valider
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateSpellcasting(spellcasting) {
    const errors = [];

    // Vérifications de base
    if (!spellcasting.ability) {
      errors.push('Ability is required');
    }

    if (!['prepared', 'known', 'innate'].includes(spellcasting.type)) {
      errors.push('Type must be prepared, known, or innate');
    }

    // Vérifier cohérence slots
    if (spellcasting.spellSlots) {
      Object.entries(spellcasting.spellSlots).forEach(([level, slot]) => {
        if (slot.used > slot.max) {
          errors.push(`Spell level ${level}: used (${slot.used}) > max (${slot.max})`);
        }
        if (slot.available !== slot.max - slot.used) {
          errors.push(`Spell level ${level}: available should be ${slot.max - slot.used}, got ${slot.available}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}