/**
 * Game constants
 */

// Grid configuration
export const GRID_WIDTH = 8
export const GRID_HEIGHT = 6

// Combat phases
export const COMBAT_PHASES = {
  INITIATIVE: 'initiative',
  COMBAT: 'combat', 
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

// Game phases
export const GAME_PHASES = {
  CHARACTER_SELECTION: 'character-selection',
  GAME: 'game',
  COMBAT: 'combat',
  REST: 'rest'
}

// Entity types
export const ENTITY_TYPES = {
  PLAYER: 'player',
  COMPANION: 'companion', 
  ENEMY: 'enemy'
}

// Action types
export const ACTION_TYPES = {
  WEAPON: 'weapon',
  SPELL: 'spell',
  ABILITY: 'ability'
}

// Damage types
export const DAMAGE_TYPES = {
  PIERCING: 'perforant',
  SLASHING: 'tranchant',
  BLUDGEONING: 'contondant',
  FIRE: 'feu',
  COLD: 'froid',
  LIGHTNING: 'foudre',
  POISON: 'poison',
  ACID: 'acide',
  PSYCHIC: 'psychique',
  FORCE: 'force',
  NECROTIC: 'nécrotique',
  RADIANT: 'radiant'
}

// Rest types
export const REST_TYPES = {
  SHORT: 'short',
  LONG: 'long'
}