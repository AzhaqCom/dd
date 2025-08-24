/**
 * Character Manager Service - Pure business logic for character management
 */

import { getModifier, rollDie, getConstitutionModifier } from '../utils/calculations'
import { CombatEngine } from './combatEngine'
import { ProgressionEngine } from './ProgressionEngine'

export class CharacterManager {
  /**
   * Calculates proficiency bonus for a character level
   * @param {number} level - Character level
   * @returns {number} Proficiency bonus
   */
  static getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1
  }

  /**
   * Calculates spell save DC for a character
   * @param {Object} character - The character
   * @returns {number} Spell save DC
   */
  static getSpellSaveDC(character) {
    if (!character.spellcasting) return 8

    const spellcastingAbility = this.getSpellcastingAbility(character)
    const abilityModifier = getModifier(character.stats[spellcastingAbility])
    const proficiencyBonus = this.getProficiencyBonus(character.level)

    return 8 + abilityModifier + proficiencyBonus
  }

  /**
   * Gets the spellcasting ability for a character class
   * @param {Object} character - The character
   * @returns {string} The ability name
   */
  static getSpellcastingAbility(character) {
    if (!character.spellcasting) return 'intelligence'

    return character.spellcasting.ability || (() => {
      switch (character.class) {
        case 'Magicien': return 'intelligence'
        case 'Clerc': return 'sagesse'
        case 'Barde': return 'charisme'
        case 'Rôdeur':
        case 'Paladin': return 'sagesse'
        case 'Sorcier':
        case 'Occultiste': return 'charisme'
        default: return 'intelligence'
      }
    })()
  }

  /**
   * Calculates attack bonus for a character with specific action
   * @param {Object} character - The character
   * @param {Object} action - The action being performed
   * @returns {number} Attack bonus
   */
  static getAttackBonus(character, action) {
    const proficiencyBonus = this.getProficiencyBonus(character.level)

    switch (action.actionType) {
      case 'spell':
        return CombatEngine.calculateSpellAttackBonus(character)

      case 'weapon':
        let statToUse = action.stat || 'force'

        // Handle finesse weapons
        if (action.properties?.includes('finesse')) {
          const forceBonus = getModifier(character.stats.force)
          const dexBonus = getModifier(character.stats.dexterite)
          statToUse = dexBonus > forceBonus ? 'dexterite' : 'force'
        }

        const isProficient = this.isWeaponProficient(character, action)
        const profBonus = isProficient ? proficiencyBonus : 0

        return getModifier(character.stats[statToUse]) + profBonus

      default:
        return 0
    }
  }

  /**
   * Checks if character is proficient with a weapon
   * @param {Object} character - The character
   * @param {Object} weapon - The weapon
   * @returns {boolean} True if proficient
   */
  static isWeaponProficient(character, weapon) {
    if (!character.weaponProficiencies) return false

    // Check specific weapon proficiency
    if (character.weaponProficiencies.includes(weapon.id)) return true

    // Check category proficiency
    const isSimple = ['dagger', 'club', 'quarterstaff', 'lightCrossbow', 'shortbow'].includes(weapon.id)
    
    if (isSimple && character.weaponProficiencies.includes('simple')) return true
    if (!isSimple && character.weaponProficiencies.includes('martial')) return true

    return false
  }

  /**
   * Processes character level up
   * @param {Object} character - The character to level up
   * @returns {Object} Updated character with level changes
   */
  static levelUp(character) {
    const newLevel = character.level + 1
    
    // Vérification niveau valide (maximum 20)
    if (newLevel > 20) return character

    // Calculate HP gain
    const hitDie = this.getHitDie(character.class)
    const conModifier = getConstitutionModifier(character)
    const hpGain = Math.max(1, rollDie(hitDie) + conModifier)

    const updatedCharacter = {
      ...character,
      level: newLevel,
      maxHP: character.maxHP + hpGain,
      currentHP: character.currentHP + hpGain,
      currentXP: character.currentXP || character.experience || 0, // Conserver l'XP
      proficiencyBonus: this.getProficiencyBonus(newLevel),
    }

    // Update spell slots for spellcasters based on level
    if (character.spellcasting) {
      const spellSlots = this.generateSpellSlotsForLevel(newLevel, character.class)
      updatedCharacter.spellcasting = {
        ...character.spellcasting,
        spellSlots: spellSlots
      }
    }
    
    return updatedCharacter
  }

  /**
   * Génère les emplacements de sorts pour un niveau et une classe donnés
   */
  static generateSpellSlotsForLevel(level, characterClass) {
    // Table simple pour les lanceurs de sorts complets (Magicien, Clerc, etc.)
    const fullCasterSlots = {
      1: { 1: { max: 2, used: 0 } },
      2: { 1: { max: 3, used: 0 } },
      3: { 1: { max: 4, used: 0 }, 2: { max: 2, used: 0 } },
      4: { 1: { max: 4, used: 0 }, 2: { max: 3, used: 0 } },
      5: { 1: { max: 4, used: 0 }, 2: { max: 3, used: 0 }, 3: { max: 2, used: 0 } }
    }

    // Retourner les slots selon la classe
    if (characterClass === 'Magicien' || characterClass === 'Clerc') {
      return fullCasterSlots[level] || {}
    }
    
    return {}
  }

  /**
   * Gets hit die size for a class
   * @param {string} characterClass - The character class
   * @returns {number} Hit die size
   */
  static getHitDie(characterClass) {
    const hitDice = {
      'Guerrier': 10,
      'Magicien': 6,
      'Roublard': 8,
      'Clerc': 8,
      'Rôdeur': 10,
      'Paladin': 10
    }
    return hitDice[characterClass] || 8
  }

  /**
   * Processes short rest for a character
   * @param {Object} character - The character
   * @param {number} hitDieSpent - Number of hit dice to spend
   * @returns {Object} Updated character after short rest
   */
  static shortRest(character, hitDieSpent = 0) {
    if (hitDieSpent <= 0) return character

    const hitDie = this.getHitDie(character.class)
    const conModifier = getConstitutionModifier(character)
    
    let healing = 0
    const availableHitDice = character.hitDice || Math.floor(character.level / 2)
    const actualSpent = Math.min(hitDieSpent, availableHitDice)

    for (let i = 0; i < actualSpent; i++) {
      healing += Math.max(1, rollDie(hitDie) + conModifier)
    }

    return {
      ...character,
      currentHP: Math.min(character.maxHP, character.currentHP + healing),
      hitDice: availableHitDice - actualSpent
    }
  }

  /**
   * Processes long rest for a character
   * @param {Object} character - The character
   * @returns {Object} Updated character after long rest
   */
  static longRest(character) {
    const updatedCharacter = {
      ...character,
      currentHP: character.maxHP,
      hitDice: character.level, // Recover all hit dice
    }

    // Restore spell slots if spellcaster
    if (character.spellcasting) {
      updatedCharacter.spellcasting = {
        ...character.spellcasting,
        slotsRemaining: { ...character.spellcasting.slotsTotal }
      }
    }

    return updatedCharacter
  }

  /**
   * Applies damage to a character
   * @param {Object} character - The character
   * @param {number} damage - Damage amount
   * @returns {Object} Updated character
   */
  static takeDamage(character, damage) {
    return {
      ...character,
      currentHP: Math.max(0, character.currentHP - damage)
    }
  }

  /**
   * Applies healing to a character
   * @param {Object} character - The character  
   * @param {number} healing - Healing amount
   * @returns {Object} Updated character
   */
  static heal(character, healing) {
    return {
      ...character,
      currentHP: Math.min(character.maxHP, character.currentHP + healing)
    }
  }

  /**
   * Consumes a spell slot
   * @param {Object} character - The character
   * @param {number} spellLevel - Level of spell slot to consume
   * @returns {Object} Updated character
   */
  static consumeSpellSlot(character, spellLevel) {
    if (!character.spellcasting || spellLevel <= 0) return character

    const remaining = character.spellcasting.slotsRemaining[spellLevel] || 0
    if (remaining <= 0) return character

    return {
      ...character,
      spellcasting: {
        ...character.spellcasting,
        slotsRemaining: {
          ...character.spellcasting.slotsRemaining,
          [spellLevel]: remaining - 1
        }
      }
    }
  }

  /**
   * Adds experience to a character
   * @param {Object} character - The character
   * @param {number} xp - Experience points to add
   * @returns {Object} Updated character (may include level up)
   */
  static addExperience(character, xp) {
    const currentXP = character.currentXP || character.experience || 0
    const newXP = currentXP + xp
    
    return this.processLevelUps({ ...character, currentXP: newXP })
  }

  /**
   * Processes multiple level ups safely
   * @param {Object} character - The character with updated XP
   * @returns {Object} Updated character after all applicable level ups
   */
  static processLevelUps(character) {
    let updatedCharacter = { ...character }
    let levelUpCount = 0
    const maxLevelUps = 10
    const maxLevel = 20
    
    while (levelUpCount < maxLevelUps && updatedCharacter.level < maxLevel) {
      const xpToNext = this.getXPToNextLevel(updatedCharacter.level)
      
      if (updatedCharacter.currentXP >= xpToNext) {
        const oldLevel = updatedCharacter.level
        updatedCharacter = this.levelUp(updatedCharacter)
        
        if (updatedCharacter.level <= oldLevel) {
          console.error(`⚠️ Level up failed to increase level (${oldLevel} → ${updatedCharacter.level})`)
          break
        }
        
        levelUpCount++
      } else {
        break
      }
    }
    
    if (levelUpCount >= maxLevelUps) {
      console.warn('⚠️ Limite de montées de niveau atteinte pour éviter une boucle infinie')
    }
    
    return updatedCharacter
  }

  /**
   * Gets XP total required to reach a level
   * @param {number} level - The target level
   * @returns {number} Total XP required to reach that level
   */
  static getXPForLevel(level) {
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000]
    return xpTable[level - 1] || 0
  }

  /**
   * Gets XP required for next level
   * @param {number} currentLevel - Current character level
   * @returns {number} XP required for next level
   */
  static getXPToNextLevel(currentLevel) {
    return ProgressionEngine.getXPToNextLevel(currentLevel)
  }
}