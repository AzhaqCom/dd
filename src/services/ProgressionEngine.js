/**
 * Progression Engine - Pure XP and leveling calculations
 * Contains only pure functions for character progression without side effects
 * All character state management is handled by CharacterManager
 */

export class ProgressionEngine {
  /**
   * XP table for D&D 5e progression
   */
  static XP_TABLE = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000]

  /**
   * Gets XP total required to reach a level
   * @param {number} level - The target level (1-20)
   * @returns {number} Total XP required to reach that level
   */
  static getXPForLevel(level) {
    if (level < 1 || level > 20) return 0
    return this.XP_TABLE[level - 1] || 0
  }

  /**
   * Gets XP required for next level from current level
   * @param {number} currentLevel - Current character level
   * @returns {number} XP required for next level
   */
  static getXPToNextLevel(currentLevel) {
    if (currentLevel >= 20) return Infinity
    return this.getXPForLevel(currentLevel + 1)
  }

  /**
   * Calculates what level a character should be based on their XP
   * @param {number} currentXP - Character's current XP
   * @returns {number} Level that the character should be
   */
  static calculateLevelFromXP(currentXP) {
    if (currentXP < 0) return 1

    for (let level = 20; level >= 1; level--) {
      if (currentXP >= this.getXPForLevel(level)) {
        return level
      }
    }
    return 1
  }

  /**
   * Calculates how much XP is needed to reach the next level
   * @param {number} currentXP - Character's current XP
   * @param {number} currentLevel - Character's current level
   * @returns {number} XP needed for next level (0 if already at max level)
   */
  static getXPToNext(currentXP, currentLevel) {
    if (currentLevel >= 20) return 0
    
    const nextLevelXP = this.getXPToNextLevel(currentLevel)
    return Math.max(0, nextLevelXP - currentXP)
  }

  /**
   * Calculates progression percentage to next level
   * @param {number} currentXP - Character's current XP
   * @param {number} currentLevel - Character's current level
   * @returns {number} Percentage (0-100) of progress to next level
   */
  static getProgressionPercentage(currentXP, currentLevel) {
    if (currentLevel >= 20) return 100

    const currentLevelXP = this.getXPForLevel(currentLevel)
    const nextLevelXP = this.getXPToNextLevel(currentLevel)
    const progressXP = currentXP - currentLevelXP
    const levelSpanXP = nextLevelXP - currentLevelXP

    if (levelSpanXP <= 0) return 100
    return Math.min(100, Math.max(0, (progressXP / levelSpanXP) * 100))
  }

  /**
   * Determines if character should level up based on XP
   * @param {number} currentXP - Character's current XP
   * @param {number} currentLevel - Character's current level
   * @returns {boolean} True if character has enough XP to level up
   */
  static shouldLevelUp(currentXP, currentLevel) {
    if (currentLevel >= 20) return false
    return currentXP >= this.getXPToNextLevel(currentLevel)
  }

  /**
   * Calculates how many levels a character should gain
   * @param {number} currentXP - Character's current XP
   * @param {number} currentLevel - Character's current level
   * @returns {number} Number of levels to gain (0 if no level up)
   */
  static calculateLevelGains(currentXP, currentLevel) {
    const targetLevel = this.calculateLevelFromXP(currentXP)
    return Math.max(0, targetLevel - currentLevel)
  }

  /**
   * Calculates new hit points gained on level up based on class
   * @param {string} characterClass - Character's class
   * @param {number} constitutionModifier - Constitution modifier
   * @param {boolean} useAverage - Use average HP gain instead of rolling
   * @returns {number} Hit points gained
   */
  static calculateHPGain(characterClass, constitutionModifier, useAverage = true) {
    const hitDieByClass = {
      'barbarian': 12,
      'fighter': 10,
      'paladin': 10,
      'ranger': 10,
      'bard': 8,
      'cleric': 8,
      'druid': 8,
      'monk': 8,
      'rogue': 8,
      'warlock': 8,
      'sorcerer': 6,
      'wizard': 6
    }

    const hitDie = hitDieByClass[characterClass?.toLowerCase()] || 8
    const baseGain = useAverage ? Math.floor((hitDie / 2) + 1) : Math.floor(Math.random() * hitDie) + 1
    
    return Math.max(1, baseGain + constitutionModifier)
  }

  /**
   * Calculates proficiency bonus based on level
   * @param {number} level - Character level
   * @returns {number} Proficiency bonus
   */
  static getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1
  }

  /**
   * Calculates spell slots gained on level up for spellcasting classes
   * @param {string} characterClass - Character's class
   * @param {number} newLevel - New character level
   * @returns {Object} Spell slots by level
   */
  static calculateSpellSlotsForLevel(characterClass, newLevel) {
    // Simplified spell slot progression - can be expanded
    const spellcastingClasses = ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'warlock']
    
    if (!spellcastingClasses.includes(characterClass?.toLowerCase())) {
      return {}
    }

    // Basic progression for full casters
    const slots = {}
    if (newLevel >= 1) slots['1'] = Math.min(4, Math.floor(newLevel / 2) + 1)
    if (newLevel >= 3) slots['2'] = Math.min(3, Math.floor((newLevel - 1) / 2))
    if (newLevel >= 5) slots['3'] = Math.min(3, Math.floor((newLevel - 3) / 2))
    if (newLevel >= 7) slots['4'] = Math.min(3, Math.floor((newLevel - 5) / 2))
    if (newLevel >= 9) slots['5'] = Math.min(3, Math.floor((newLevel - 7) / 2))

    return slots
  }

  /**
   * Calculates experience points gained from combat
   * @param {Array} enemies - Array of defeated enemies
   * @param {number} partySize - Size of the adventuring party
   * @returns {number} Experience points to distribute
   */
  static calculateCombatExperience(enemies, partySize = 1) {
    const totalXP = enemies.reduce((sum, enemy) => {
      // XP by Challenge Rating - D&D 5e table
      const crToXP = {
        '0': 10,
        '1/8': 25,
        '1/4': 50,
        '1/2': 100,
        '1': 200,
        '2': 450,
        '3': 700,
        '4': 1100,
        '5': 1800,
        '6': 2300,
        '7': 2900,
        '8': 3900,
        '9': 5000,
        '10': 5900
      }
      
      return sum + (crToXP[enemy.challengeRating] || 100)
    }, 0)

    return Math.floor(totalXP / partySize)
  }
}