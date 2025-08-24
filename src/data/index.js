/**
 * Centralized data exports for the RPG game
 */

export { character } from './character'
export { characterTemplates } from './characterTemplates'
export { classConfigurations } from './classConfigurations'
export { companions } from './companions'
export { enemies } from './enemies'
export { items } from './items'
export { levels } from './levels'
export { scenes } from './scenes'
export { spells } from './spells'
export { weapons } from './weapons'

// Utility function to get all data
export const getAllData = () => ({
  character,
  characterTemplates,
  classConfigurations,
  companions,
  enemies,
  items,
  levels,
  scenes,
  spells,
  weapons
})

// OBSOLÈTE: Validation basique non utilisée - remplacée par types/story pour le nouveau système narratif
export const validateData = () => {
  const errors = []
  
  // Basic validation - can be extended
  if (!character) errors.push('Character data missing')
  if (!scenes) errors.push('Scenes data missing')
  if (!spells) errors.push('Spells data missing')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}