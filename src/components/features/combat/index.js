/**
 * Export centralisé des composants Combat refactorisés
 */

// Composant principal
export { CombatPanel } from './CombatPanel'

// Grille de combat et positionnement
export { CombatGrid } from './CombatGrid'

// Système de tours et actions
export { CombatTurnManager } from './CombatTurnManager'
export { CombatActionPanel } from './CombatActionPanel'

// Journal et interface
// Note: CombatLog est maintenant dans components/ui/CombatLog
// export { CombatLog, CompactCombatLog } from './CombatLog'

// Cartes de combat (à créer)
// export { CombatantCard, PlayerCombatCard, EnemyCombatCard } from './CombatantCard'

// Utilitaires et constantes
export const COMBAT_PHASES = {
  INITIALIZING: 'initializing',
  INITIATIVE: 'initiative', 
  COMBAT: 'combat',
  PLAYER_TURN: 'player-turn',
  PLAYER_MOVEMENT: 'player-movement',
  COMPANION_TURN: 'companion-turn',
  ENEMY_TURN: 'enemy-turn',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

export const COMBAT_ACTIONS = {
  ATTACK: 'attack',
  SPELL: 'spell',
  MOVE: 'move',
  DEFEND: 'defend',
  PASS: 'pass'
}

export const DAMAGE_TYPES = {
  PHYSICAL: 'physical',
  MAGICAL: 'magical',
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  POISON: 'poison',
  HOLY: 'holy',
  NECROTIC: 'necrotic'
}

export const AOE_SHAPES = {
  SPHERE: 'sphere',
  CUBE: 'cube', 
  LINE: 'line',
  CONE: 'cone'
}