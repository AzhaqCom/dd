/**
 * Interface unifiée pour tous les lanceurs de sorts
 * Abstraction qui permet au joueur, compagnons, ennemis et PNJ d'utiliser le même système
 */

import { getModifier } from '../utils/calculations.js';

/**
 * Interface SpellCaster unifiée pour tous les types d'entités
 */
export class SpellCaster {
  constructor(entity, context = 'combat') {
    this.entity = entity;
    this.context = context;
    this.type = this.determineEntityType(entity);
  }

  /**
   * Détermine le type d'entité (player/companion/enemy/npc)
   */
  determineEntityType(entity) {
    if (entity.type) return entity.type;
    if (entity.id === 'player') return 'player';
    if (entity.role && ['tank', 'healer', 'dps', 'support'].includes(entity.role)) return 'companion';
    if (entity.challengeRating || entity.xp) return 'enemy';
    return 'character'; // Fallback générique
  }

  /**
   * Vérifie si cette entité peut lancer des sorts
   */
  canCast() {
    return this.entity.spellcasting !== null && this.entity.spellcasting !== undefined;
  }

  /**
   * Obtient la capacité d'incantation (Intelligence, Sagesse, Charisme)
   */
  getSpellcastingAbility() {
    if (!this.canCast()) return null;
    return this.entity.spellcasting.ability || 'intelligence';
  }

  /**
   * Obtient le modificateur de la capacité d'incantation
   */
  getSpellcastingModifier() {
    const ability = this.getSpellcastingAbility();
    if (!ability) return 0;

    const abilityScore = this.entity.stats?.[ability] || 10;
    return getModifier(abilityScore);
  }

  /**
   * Calcule le bonus d'attaque de sort
   */
  getSpellAttackBonus() {
    const proficiencyBonus = this.getProficiencyBonus();
    const abilityMod = this.getSpellcastingModifier();
    return proficiencyBonus + abilityMod;
  }

  /**
   * Calcule le DD de sauvegarde des sorts
   */
  getSpellSaveDC() {
    const proficiencyBonus = this.getProficiencyBonus();
    const abilityMod = this.getSpellcastingModifier();
    return 8 + proficiencyBonus + abilityMod;
  }

  /**
   * Obtient le bonus de maîtrise selon le niveau
   */
  getProficiencyBonus() {
    const level = this.entity.level || 1;
    return Math.ceil(level / 4) + 1;
  }

  /**
   * Obtient les emplacements de sorts disponibles
   */
  getAvailableSpellSlots() {
    if (!this.canCast() || !this.entity.spellcasting.spellSlots) return {};

    const slots = {};
    Object.entries(this.entity.spellcasting.spellSlots).forEach(([level, slot]) => {
      if (slot.available > 0) {
        slots[level] = slot;
      }
    });

    return slots;
  }

  /**
   * Vérifie si un sort peut être lancé
   */
  canCastSpell(spell, atLevel = null) {
    if (!this.canCast()) return false;

    const spellcasting = this.entity.spellcasting;

    // Cantrips peuvent toujours être lancés
    if (spell.level === 0) {
      return spellcasting.cantrips?.includes(spell.name) ||
        spellcasting.cantrips?.includes(spell.id);
    }

    // Vérifier si le sort est connu/préparé
    const isKnown = spellcasting.knownSpells?.includes(spell.name) ||
      spellcasting.knownSpells?.includes(spell.id);
    const isPrepared = spellcasting.preparedSpells?.includes(spell.name) ||
      spellcasting.preparedSpells?.includes(spell.id);

    if (spellcasting.type === 'known' && !isKnown) return false;
    if (spellcasting.type === 'prepared' && !isPrepared) return false;

    // Vérifier les emplacements de sorts
    const castingLevel = atLevel || spell.level;
    const availableSlots = this.getAvailableSpellSlots();

    for (let level = castingLevel; level <= 9; level++) {
      if (availableSlots[level]?.available > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Consomme un emplacement de sort
   */
  consumeSpellSlot(spellLevel) {
    if (!this.canCast() || spellLevel === 0) return this.entity; // Cantrips ne consomment pas

    const spellSlots = this.entity.spellcasting.spellSlots;
    if (!spellSlots) return this.entity;

    // Trouver le slot de niveau le plus bas disponible
    for (let level = spellLevel; level <= 9; level++) {
      const slot = spellSlots[level];
      if (slot && slot.available > 0) {
        const updatedSlots = {
          ...spellSlots,
          [level]: {
            ...slot,
            used: slot.used + 1,
            available: slot.available - 1
          }
        };

        return {
          ...this.entity,
          spellcasting: {
            ...this.entity.spellcasting,
            spellSlots: updatedSlots
          }
        };
      }
    }

    return this.entity; // Aucun slot disponible
  }

  /**
   * Lance un sort de manière unifiée
   */
  castSpell(spell, targets = [], options = {}) {
    const result = {
      success: false,
      caster: this.entity,
      spell: spell,
      targets: targets,
      messages: [],
      effects: [],
      damageResults: [],
      healingResults: []
    };

    // 1. Validation
    if (!this.canCastSpell(spell, options.castingLevel)) {
      result.messages.push(`${this.entity.name} ne peut pas lancer ${spell.name}`);
      return result;
    }

    // 2. Consommer l'emplacement de sort
    const castingLevel = options.castingLevel || spell.level;
    result.caster = this.consumeSpellSlot(castingLevel);

    // 3. Traiter les effets du sort
    const spellEffects = this.processSpellEffects(spell, targets, castingLevel, options);
    result.effects = spellEffects.effects;
    result.messages = [...result.messages, ...spellEffects.messages];
    result.damageResults = spellEffects.damageResults || [];
    result.healingResults = spellEffects.healingResults || [];

    result.success = true;
    return result;
  }

  /**
   * Traite les effets d'un sort selon sa définition
   */
  processSpellEffects(spell, targets, castingLevel, options = {}) {
    const results = {
      effects: [],
      messages: [],
      damageResults: [],
      healingResults: []
    };

    if (spell.damage) {
      // Sort de dégâts
      this.processDamageSpell(spell, targets, castingLevel, results);

      // Ajout des messages de dégâts
      results.damageResults.forEach(dmg => {
        results.messages.push(
          `${this.entity.name} lance ${spell.name} sur ${dmg.targetName} et inflige ${dmg.damage} points de dégâts ${dmg.damageType || ''}`
        );
      });

    } else if (spell.healing) {
      // Sort de soin
      this.processHealingSpell(spell, targets, castingLevel, results);

      // Ajout des messages de soin
      results.healingResults.forEach(heal => {
        results.messages.push(
          `${this.entity.name} lance ${spell.name} sur ${heal.targetName} et soigne ${heal.amount} points de vie`
        );
      });

    } else if (spell.buff) {
      // Sort de renforcement
      this.processBuffSpell(spell, targets, castingLevel, results);

      // Message pour les buffs
      targets.forEach(target => {
        results.messages.push(
          `${this.entity.name} lance ${spell.name} sur ${target.name}`
        );
      });
    }

    return results;
  }

  /**
   * Traite un sort de dégâts
   */
  processDamageSpell(spell, targets, castingLevel, results) {
    targets.forEach(target => {
      let damage = this.rollDamage(spell.damage, castingLevel - spell.level);

      // Jet de sauvegarde si requis
      if (spell.saveType) {
        const saveSuccess = this.rollSavingThrow(target, spell);
        if (saveSuccess && spell.saveType) {
          damage = Math.floor(damage / 2); // Demi-dégâts
        }
      }

      results.damageResults.push({
        targetId: target.id || target.name,
        targetName: target.name,
        damage: damage,
        damageType: spell.damage.type,
        source: this.entity.name
      });
    });
  }

  /**
   * Traite un sort de soin
   */
  processHealingSpell(spell, targets, castingLevel, results) {
    targets.forEach(target => {
      // Lancer les dés de base sans le bonus (pour éviter le bug des strings)
      let healing = this.rollDamageBase(spell.healing, castingLevel - spell.level);

      // Ajouter modificateur si spécifié
      if (spell.healing.bonus === 'wisdom' || spell.healing.bonus === 'charisma') {
        healing += this.getSpellcastingModifier();
      } else if (typeof spell.healing.bonus === 'number') {
        healing += spell.healing.bonus;
      }

      results.healingResults.push({
        targetId: target.id || target.name,
        targetName: target.name,
        amount: healing,
        source: this.entity.name
      });
    });
  }

  /**
   * Traite un sort de renforcement/buff
   */
  processBuffSpell(spell, targets, castingLevel, results) {
    targets.forEach(target => {
      results.effects.push({
        type: 'buff',
        targetId: target.id || target.name,
        targetName: target.name,
        buffType: spell.buff,
        duration: spell.buff?.duration || spell.duration || 600, // Durée du buff ou 10 rounds par défaut
        source: this.entity.name
      });
    });
  }

  /**
   * Lance les dégâts selon une formule de dés
   */
  rollDamage(damageData, bonusLevels = 0) {
    const match = damageData.dice.match(/(\d+)d(\d+)/);
    if (!match) return parseInt(damageData.bonus) || 0;

    let [, numDice, dieSize] = match;
    numDice = parseInt(numDice);
    dieSize = parseInt(dieSize);

    // Scaling pour niveaux supérieurs
    numDice += bonusLevels;

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }

    const bonus = parseInt(damageData.bonus) || 0;
    return total + bonus;
  }

  /**
   * Lance uniquement les dés sans bonuses textuels (pour les soins)
   */
  rollDamageBase(damageData, bonusLevels = 0) {
    const match = damageData.dice.match(/(\d+)d(\d+)/);
    if (!match) return 0;

    let [, numDice, dieSize] = match;
    numDice = parseInt(numDice);
    dieSize = parseInt(dieSize);

    // Scaling pour niveaux supérieurs
    numDice += bonusLevels;

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }

    return total;
  }

  /**
   * Lance un jet de sauvegarde pour une cible
   */
  rollSavingThrow(target, spell) {
    if (!spell.saveType) return false;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const saveBonus = getModifier(target.stats?.[spell.saveType] || 10);
    const saveDC = spell.saveDC || this.getSpellSaveDC();

    return (d20 + saveBonus) >= saveDC;
  }

  /**
   * Obtient tous les sorts disponibles pour ce lanceur
   */
  getAvailableSpells() {
    if (!this.canCast()) return [];

    const spellcasting = this.entity.spellcasting;
    const available = [];

    // Cantrips
    if (spellcasting.cantrips) {
      available.push(...spellcasting.cantrips.map(name => ({ name, level: 0, type: 'cantrip' })));
    }

    // Sorts selon le type de lanceur
    if (spellcasting.type === 'known' && spellcasting.knownSpells) {
      available.push(...spellcasting.knownSpells.map(name => ({ name, type: 'known' })));
    } else if (spellcasting.type === 'prepared' && spellcasting.preparedSpells) {
      available.push(...spellcasting.preparedSpells.map(name => ({ name, type: 'prepared' })));
    }

    return available;
  }
}