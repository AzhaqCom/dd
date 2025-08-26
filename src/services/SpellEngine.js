/**
 * SpellEngine - Calculs purs et logique de sorts sans état
 * Contient uniquement des fonctions pures sans effets de bord
 */

import { rollDice, getModifier } from '../utils/calculations.js';

export class SpellEngine {

  /**
   * Calcule les dégâts d'un sort selon le niveau de lancement
   * @param {Object} spell - Le sort
   * @param {number} castingLevel - Niveau de lancement
   * @param {Object} caster - Le lanceur
   * @returns {Object} Résultat des dégâts
   */
  static calculateSpellDamage(spell, castingLevel, caster) {
    if (!spell.damage) return null;

    const baseDamage = spell.damage;
    const levelDifference = Math.max(0, castingLevel - spell.level);

    let numDice = 1;
    let dieSize = 6;
    let bonus = 0;
    let damageType = baseDamage.type || 'force';

    // Parser la formule de dés
    if (baseDamage.dice) {
      const match = baseDamage.dice.match(/(\d+)d(\d+)/);
      if (match) {
        numDice = parseInt(match[1]);
        dieSize = parseInt(match[2]);
      }
    }

    // Ajouter bonus de base
    if (typeof baseDamage.bonus === 'number') {
      bonus = baseDamage.bonus;
    }

    // Scaling automatique pour niveaux supérieurs
    if (spell.scalingDamage) {
      numDice += levelDifference * spell.scalingDamage.dicePerLevel || levelDifference;
    } else {
      // Scaling par défaut : +1d6 par niveau pour la plupart des sorts
      numDice += levelDifference;
    }

    // Lancer les dés
    let totalDamage = 0;
    for (let i = 0; i < numDice; i++) {
      totalDamage += Math.floor(Math.random() * dieSize) + 1;
    }

    return {
      total: totalDamage + bonus,
      breakdown: `${numDice}d${dieSize}${bonus > 0 ? `+${bonus}` : ''}`,
      type: damageType,
      dice: numDice,
      dieSize: dieSize,
      bonus: bonus
    };
  }

  /**
   * Calcule les soins d'un sort
   * @param {Object} spell - Le sort de soin
   * @param {number} castingLevel - Niveau de lancement
   * @param {Object} caster - Le lanceur
   * @returns {Object} Résultat des soins
   */
  static calculateSpellHealing(spell, castingLevel, caster) {
    if (!spell.healing) return null;

    const baseHealing = spell.healing;
    const levelDifference = Math.max(0, castingLevel - spell.level);

    let numDice = 1;
    let dieSize = 8; // d8 par défaut pour les soins
    let bonus = 0;

    // Parser la formule de dés
    if (baseHealing.dice) {
      const match = baseHealing.dice.match(/(\d+)d(\d+)/);
      if (match) {
        numDice = parseInt(match[1]);
        dieSize = parseInt(match[2]);
      }
    }

    // Ajouter bonus selon le type
    if (baseHealing.bonus === 'wisdom' || baseHealing.bonus === 'charisma' || baseHealing.bonus === 'intelligence') {
      const abilityScore = caster.stats?.[baseHealing.bonus] || 10;
      bonus = getModifier(abilityScore);
    } else if (typeof baseHealing.bonus === 'number') {
      bonus = baseHealing.bonus;
    }

    // Scaling pour niveaux supérieurs
    if (spell.scalingHealing) {
      numDice += levelDifference * (spell.scalingHealing.dicePerLevel || 1);
    } else {
      // Scaling par défaut : +1d8 par niveau pour les soins
      numDice += levelDifference;
    }

    // Lancer les dés
    let totalHealing = 0;
    for (let i = 0; i < numDice; i++) {
      totalHealing += Math.floor(Math.random() * dieSize) + 1;
    }

    return {
      total: totalHealing + bonus,
      breakdown: `${numDice}d${dieSize}${bonus > 0 ? `+${bonus}` : ''}`,
      dice: numDice,
      dieSize: dieSize,
      bonus: bonus
    };
  }

  /**
   * Calcule le DD de sauvegarde d'un sort
   * @param {Object} spell - Le sort
   * @param {Object} caster - Le lanceur
   * @returns {number} DD de sauvegarde
   */
  static calculateSpellSaveDC(spell, caster) {
    if (!caster.spellcasting) return 10;

    const spellcastingAbility = caster.spellcasting.ability || 'intelligence';
    const abilityScore = caster.stats?.[spellcastingAbility] || 10;
    const abilityMod = getModifier(abilityScore);
    const proficiencyBonus = Math.ceil((caster.level || 1) / 4) + 1;

    return 8 + abilityMod + proficiencyBonus;
  }

  /**
   * Calcule le bonus d'attaque de sort
   * @param {Object} caster - Le lanceur
   * @returns {number} Bonus d'attaque de sort
   */
  static calculateSpellAttackBonus(caster) {
    if (!caster.spellcasting) return 0;

    const spellcastingAbility = caster.spellcasting.ability || 'intelligence';
    const abilityScore = caster.stats?.[spellcastingAbility] || 10;
    const abilityMod = getModifier(abilityScore);
    const proficiencyBonus = Math.ceil((caster.level || 1) / 4) + 1;

    return abilityMod + proficiencyBonus;
  }

  /**
   * Détermine les cibles valides pour un sort
   * @param {Object} spell - Le sort
   * @param {Object} caster - Le lanceur
   * @param {Array} potentialTargets - Cibles potentielles
   * @param {Object} context - Contexte (positions, etc.)
   * @returns {Array} Cibles valides
   */
  static validateSpellTargets(spell, caster, potentialTargets, context = {}) {
    const validTargets = [];


    if (spell.validTargets?.includes("self") && potentialTargets.length === 0) {
    
      potentialTargets = [caster];
    }

    potentialTargets.forEach(target => {
 

      // Vérifier la portée
      const inRange = this.isTargetInRange(spell, caster, target, context);
   

      if (inRange) {
        // Vérifier le type de cible
        const validType = this.isValidTargetType(spell, caster, target);
     
        if (validType) {
          validTargets.push(target);
     
        }
      }
    });

    return validTargets;
  }

  /**
   * Vérifie si une cible est à portée
   * @param {Object} spell - Le sort
   * @param {Object} caster - Le lanceur
   * @param {Object} target - La cible
   * @param {Object} context - Contexte avec positions
   * @returns {boolean} Vrai si à portée
   */
  static isTargetInRange(spell, caster, target, context = {}) {
    // Si pas d'informations de position, accepter (hors combat)
    if (!context.positions) {
     
      return true;
    }

    const range = spell.range || '9 mètres';


    // Sorts personnels
    if (range === 'Personnel' || range === 'Self') {
      const isPersonal = target.id === caster.id || target.name === caster.name;
   
      return isPersonal;
    }

    // Sorts de contact
    if (range === 'Contact' || range === 'Touch') {
      const distance = this.calculateDistance(caster, target, context);
      const inTouchRange = distance <= 1.5;
  
      return inTouchRange;
    }

    // Parser la portée en mètres
    const rangeMatch = range.match(/(\d+)\s*mètres?/);
    if (rangeMatch) {
      const rangeMeters = parseInt(rangeMatch[1]);
      const distance = this.calculateDistance(caster, target, context);
      const inRange = distance <= rangeMeters;
      
      return inRange;
    }

   
    return true; // Par défaut, accepter si impossible de déterminer
  }

  /**
   * Vérifie si une cible est d'un type valide pour le sort
   * @param {Object} spell - Le sort
   * @param {Object} caster - Le lanceur
   * @param {Object} target - La cible
   * @returns {boolean} Vrai si type valide
   */
  static isValidTargetType(spell, caster, target) {
    const targetType = spell.targetType;



    if (!targetType) {

      return true; // Pas de restriction
    }

    let result = false;
    switch (targetType) {
      case 'self':
        result = target.id === caster.id || target.name === caster.name;

        return result;

      case 'ally':
        result = this.isAlly(caster, target);

        return result;

      case 'enemy':
        result = this.isEnemy(caster, target);

        return result;

      case 'creature':

        return true; // Toute créature

      default:

        return true;
    }
  }

  /**
   * Détermine si une cible est un allié
   * @param {Object} caster - Le lanceur
   * @param {Object} target - La cible
   * @returns {boolean} Vrai si allié
   */
  static isAlly(caster, target) {
    const casterType = caster.type || 'player';
    const targetType = target.type || 'player';

    // Joueur et compagnons sont alliés
    if ((casterType === 'player' || casterType === 'companion') &&
      (targetType === 'player' || targetType === 'companion')) {
      return true;
    }

    // Ennemis entre eux sont alliés
    if (casterType === 'enemy' && targetType === 'enemy') {
      return true;
    }

    return false;
  }

  /**
   * Détermine si une cible est un ennemi
   * @param {Object} caster - Le lanceur
   * @param {Object} target - La cible
   * @returns {boolean} Vrai si ennemi
   */
  static isEnemy(caster, target) {
    return !this.isAlly(caster, target) && caster.id !== target.id;
  }

  /**
   * Calcule la distance entre deux entités
   * @param {Object} entity1 - Première entité
   * @param {Object} entity2 - Deuxième entité
   * @param {Object} context - Contexte avec positions
   * @returns {number} Distance en mètres
   */
  static calculateDistance(entity1, entity2, context) {
    if (!context.positions) {

      return 0;
    }

   


    const pos1 = context.positions[entity1.id] || context.positions[entity1.name] || context.positions['player'];
    const pos2 = context.positions[entity2.id] || context.positions[entity2.name] || context.positions['player'];



    if (!pos1 || !pos2) {

      return Infinity;
    }

    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const gridDistance = Math.sqrt(dx * dx + dy * dy);
    const meters = gridDistance * 1.5;


    return meters;
  }

  /**
   * Résout les effets de zone d'un sort
   * @param {Object} spell - Le sort
   * @param {Object} origin - Point d'origine
   * @param {Array} potentialTargets - Cibles potentielles
   * @param {Object} context - Contexte
   * @returns {Array} Cibles affectées par la zone
   */
  static resolveAreaOfEffect(spell, origin, potentialTargets, context = {}) {
    if (!spell.areaOfEffect && !spell.isAreaEffect) {
      return potentialTargets.slice(0, 1); // Sort à cible unique
    }

    const aoe = spell.areaOfEffect;
    if (!aoe) return potentialTargets; // AoE non définie, affecter toutes les cibles

    const affectedTargets = [];

    potentialTargets.forEach(target => {
      if (this.isTargetInAoE(target, origin, aoe, context)) {
        affectedTargets.push(target);
      }
    });

    return affectedTargets;
  }

  /**
   * Vérifie si une cible est dans la zone d'effet
   * @param {Object} target - La cible
   * @param {Object} origin - Point d'origine
   * @param {Object} aoe - Zone d'effet
   * @param {Object} context - Contexte
   * @returns {boolean} Vrai si dans la zone
   */
  static isTargetInAoE(target, origin, aoe, context) {
    if (!context.positions) return true; // Pas de positions, accepter

    const targetPos = context.positions[target.id] || context.positions[target.name];
    if (!targetPos) return false;

    const distance = this.calculateDistance(origin, target, context);

    switch (aoe.shape) {
      case 'sphere':
      case 'circle':
        const radiusMeters = (aoe.radius || aoe.size || 3) * 1.5; // Convertir en mètres
        return distance <= radiusMeters;

      case 'cube':
      case 'square':
        const sizeMeters = (aoe.size || 3) * 1.5;
        return distance <= sizeMeters;

      case 'cone':
        // Implémentation simplifiée du cône
        const coneRange = (aoe.range || 4.5) * 1.5;
        return distance <= coneRange;

      default:
        return distance <= 4.5; // 3 mètres par défaut
    }
  }

  /**
   * Lance un jet de sauvegarde
   * @param {Object} target - La cible qui fait le jet
   * @param {string} saveType - Type de sauvegarde
   * @param {number} saveDC - DD du jet
   * @returns {Object} Résultat du jet
   */
  static rollSavingThrow(target, saveType, saveDC) {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const abilityScore = target.stats?.[saveType] || 10;
    const abilityMod = getModifier(abilityScore);

    // TODO: Ajouter bonus de maîtrise si approprié
    const total = d20Roll + abilityMod;
    const success = total >= saveDC;

    return {
      roll: d20Roll,
      modifier: abilityMod,
      total: total,
      dc: saveDC,
      success: success,
      advantage: false, // TODO: Gérer avantage/désavantage
      disadvantage: false
    };
  }

  /**
   * Lance un jet d'attaque de sort
   * @param {Object} caster - Le lanceur
   * @param {Object} target - La cible
   * @returns {Object} Résultat du jet d'attaque
   */
  static rollSpellAttack(caster, target) {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const attackBonus = this.calculateSpellAttackBonus(caster);
    const total = d20Roll + attackBonus;
    const targetAC = target.ac || 10;

    const hit = total >= targetAC || d20Roll === 20;
    const criticalHit = d20Roll === 20;
    const criticalMiss = d20Roll === 1;

    return {
      roll: d20Roll,
      attackBonus: attackBonus,
      total: total,
      targetAC: targetAC,
      hit: hit,
      criticalHit: criticalHit,
      criticalMiss: criticalMiss
    };
  }
}