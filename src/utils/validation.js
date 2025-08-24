/**
 * Validation utilities for game mechanics
 */

import { GRID_WIDTH, GRID_HEIGHT } from './constants'

/**
 * Validates that a position is within grid bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is valid
 */
export const isValidGridPosition = (x, y) => {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT
}


/**
 * Validates if a character can cast a spell
 * @param {Object} character - The character
 * @param {Object} spell - The spell to cast
 * @returns {Object} Validation result with success and message
 */
export const validateSpellcast = (character, spell) => {
  if (!character.spellcasting) {
    return { success: false, message: "Ce personnage ne peut pas lancer de sorts" }
  }

  // Check if spell is known/prepared
  const knownSpells = [
    ...(character.spellcasting.cantrips || []),
    ...(character.spellcasting.preparedSpells || [])
  ]

  if (!knownSpells.includes(spell.id)) {
    return { success: false, message: "Sort non préparé" }
  }

  // Check spell slot availability (cantrips don't require slots)
  if (spell.level > 0) {
    const availableSlots = character.spellcasting.slotsRemaining[spell.level] || 0
    if (availableSlots <= 0) {
      return { success: false, message: "Aucun emplacement de sort disponible" }
    }
  }

  return { success: true }
}

