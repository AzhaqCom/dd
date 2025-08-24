/**
 * Game Logic Service - Core game mechanics and scene processing
 */

import { companions } from '../data/companions'
import { rollD20WithModifier, getModifier } from '../utils/calculations'
import { CharacterManager } from './characterManager'

export class GameLogic {
  /**
   * Processes scene actions and returns appropriate results
   * @param {Object|string} action - The action to process
   * @param {Object} context - Game context and handlers
   * @returns {Object|string|null} Processed action result
   */
  static processSceneAction(action, context) {
    if (typeof action === 'string') {
      return action
    }

    if (typeof action === 'object') {
      switch (action.type) {
        case 'combat':
          return this.processCombatAction(action)
        
        case 'longRest':
          return this.processRestAction(action, context, 'long')
        
        case 'shortRest':
          return this.processRestAction(action, context, 'short')
        
        case 'item':
          return this.processItemAction(action, context)
        
        case 'ally':
          return this.processAllyAction(action, context)
        
        case 'skillCheck':
          return this.processSkillCheck(action, context)
        
        default:
          console.warn("Type d'action inconnu :", action.type)
          return null
      }
    }

    return null
  }

  /**
   * Processes combat encounter actions
   * @param {Object} action - Combat action
   * @returns {Object} Combat encounter data
   */
  static processCombatAction(action) {
    return {
      ...action,
      enemies: action.enemies,
      enemyPositions: action.enemyPositions,
      next: action.next
    }
  }

  /**
   * Processes rest actions
   * @param {Object} action - Rest action
   * @param {Object} context - Game context
   * @param {string} restType - Type of rest ('short' or 'long')
   * @returns {null} Always returns null as rest is handled by context
   */
  static processRestAction(action, context, restType) {
    const nextScene = action.next || action.next
    if (restType === 'long') {
      context.startLongRest(nextScene)
    } else {
      context.startShortRest(nextScene)
    }
    return null // Le repos gère la transition de scène
  }

  /**
   * Processes item gain actions
   * @param {Object} action - Item action
   * @param {Object} context - Game context
   * @returns {string} Next scene
   */
  static processItemAction(action, context) {
    context.handleItemGain(action.item)
    return action.next
  }

  /**
   * Processes ally/companion recruitment
   * @param {Object} action - Ally action
   * @param {Object} context - Game context
   * @returns {string|null} Next scene or null if failed
   */
  static processAllyAction(action, context) {
    const companionToAdd = companions[action.ally]
    
    if (companionToAdd) {
      context.setPlayerCompanion(companionToAdd)
      context.addCombatMessage(
        `${companionToAdd.name} te rejoint dans ton aventure !`, 
        'upgrade'
      )
      return action.next
    } else {
      console.error(`Compagnon '${action.ally}' introuvable.`)
      return null
    }
  }

  /**
   * Processes skill check actions
   * @param {Object} action - Skill check action
   * @param {Object} context - Game context
   * @returns {null} Returns null as skill check is handled by context
   */
  static processSkillCheck(action, context) {
    context.handleSkillCheck(
      action.skill,
      action.dc,
      action.onSuccess,
      action.onPartialSuccess,
      action.onFailure
    )
    return null
  }

  /**
   * Performs a skill check for a character
   * @param {Object} character - The character making the check
   * @param {string} skill - The skill being checked
   * @param {number} dc - Difficulty Class
   * @returns {Object} Skill check result
   */
  static performSkillCheck(character, skill, dc) {
    const skillToAbility = this.getSkillAbilityMapping()
    const ability = skillToAbility[skill] || 'force'
    
    const abilityModifier = getModifier(character.stats[ability])
    const proficiencyBonus = CharacterManager.getProficiencyBonus(character.level)
    
    // Check if character is proficient in this skill
    const isProficient = character.skillProficiencies?.includes(skill) || false
    const totalModifier = abilityModifier + (isProficient ? proficiencyBonus : 0)
    
    const roll = rollD20WithModifier(totalModifier)
    
    return {
      roll: roll,
      total: roll,
      dc: dc,
      success: roll >= dc,
      skill: skill,
      ability: ability,
      modifier: totalModifier,
      proficient: isProficient
    }
  }

  /**
   * Gets the mapping of skills to abilities
   * @returns {Object} Skill to ability mapping
   */
  static getSkillAbilityMapping() {
    return {
      'Acrobaties': 'dexterite',
      'Arcanes': 'intelligence',
      'Athletisme': 'force',
      'Discrétion': 'dexterite',
      'Dressage': 'sagesse',
      'Escamotage': 'dexterite',
      'Histoire': 'intelligence',
      'Insight': 'sagesse',
      'Intimidation': 'charisme',
      'Investigation': 'intelligence',
      'Médecine': 'sagesse',
      'Nature': 'intelligence',
      'Perception': 'sagesse',
      'Persuasion': 'charisme',
      'Religion': 'intelligence',
      'Representation': 'charisme',
      'Survie': 'sagesse',
      'Tromperie': 'charisme'
    }
  }

  /**
   * Calculates experience points gained from combat
   * @param {Array} enemies - Array of defeated enemies
   * @param {number} partySize - Size of the adventuring party
   * @returns {number} Experience points to distribute
   */
  static calculateCombatExperience(enemies, partySize = 1) {
    const totalXP = enemies.reduce((sum, enemy) => {
      // XP by Challenge Rating - simplified table
      const crToXP = {
        '0': 10,
        '1/8': 25,
        '1/4': 50,
        '1/2': 100,
        '1': 200,
        '2': 450,
        '3': 700,
        '4': 1100,
        '5': 1800
      }
      
      return sum + (crToXP[enemy.challengeRating] || 100)
    }, 0)

    return Math.floor(totalXP / partySize)
  }

  /**
   * OBSOLÈTE: Processes end of combat rewards - remplacé par la logique directe dans les stores
   * @param {Array} defeatedEnemies - Enemies that were defeated
   * @param {Object} character - Player character
   * @param {Object} companion - Companion character (optional)
   * @returns {Object} Reward processing result
   */
  static processCombatRewards(defeatedEnemies, character, companion = null) {
    const partySize = companion ? 2 : 1
    const xpGained = this.calculateCombatExperience(defeatedEnemies, partySize)
    
    const result = {
      xpGained,
      messages: [],
      leveledUp: false
    }

    // Award XP to player
    const xpToNext = CharacterManager.getXPToNextLevel(character.level)
    const newPlayerXP = character.experience + xpGained
    
    if (newPlayerXP >= xpToNext) {
      result.leveledUp = true
      result.messages.push(`${character.name} gagne un niveau !`)
    }
    
    result.messages.push(`+${xpGained} XP`)

    return result
  }

  /**
   * Determines if a scene choice should be available based on conditions
   * @param {Object} choice - The choice object
   * @param {Object} gameState - Current game state
   * @returns {boolean} Whether choice is available
   */
  static isChoiceAvailable(choice, gameState) {
    if (!choice.conditions) return true

    return choice.conditions.every(condition => {
      switch (condition.type) {
        case 'hasItem':
          return gameState.playerCharacter.inventory.some(
            item => item.id === condition.itemId
          )
        
        case 'hasCompanion':
          return gameState.playerCompanion !== null
        
        case 'minLevel':
          return gameState.playerCharacter.level >= condition.level
        
        case 'hasSpell':
          const spells = [
            ...(gameState.playerCharacter.spellcasting?.cantrips || []),
            ...(gameState.playerCharacter.spellcasting?.preparedSpells || [])
          ]
          return spells.includes(condition.spellName)
        
        case 'statCheck':
          return gameState.playerCharacter.stats[condition.stat] >= condition.value
        
        default:
          return true
      }
    })
  }

  /**
   * Generates a unique ID for game objects
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique ID
   */
  static generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Deep clones an object (for state management)
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    
    return cloned
  }
}