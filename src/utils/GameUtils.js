/**
 * Game Utilities - Pure utility functions for common operations
 * Contains only stateless utility functions without side effects
 */

export class GameUtils {
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
}