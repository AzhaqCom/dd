/**
 * Centralized store exports for the RPG application
 */

export { useGameStore, gameSelectors } from './gameStore'
export { useCharacterStore, characterSelectors } from './characterStore'
export { useCombatStore, combatSelectors } from './combatStore'
export { useUIStore, uiSelectors } from './uiStore'

// Import stores for helper functions
import { useGameStore } from './gameStore'
import { useCharacterStore } from './characterStore'  
import { useCombatStore } from './combatStore'
import { useUIStore } from './uiStore'

// Combined selectors for complex queries
export const combinedSelectors = {
  // Combine game and character state
  getGameStatus: (gameState, characterState) => ({
    phase: gameState.gamePhase,
    scene: gameState.currentScene,
    player: characterState.playerCharacter,
    companion: characterState.playerCompanion,
    isResting: gameState.isShortResting || gameState.isLongResting
  }),

  // Combine combat and character state
  getCombatStatus: (combatState, characterState) => ({
    isInCombat: combatState.isActive,
    phase: combatState.combatPhase,
    currentTurn: combatState.turnOrder[combatState.currentTurnIndex],
    playerAlive: characterState.playerCharacter?.currentHP > 0,
    companionAlive: characterState.playerCompanion?.currentHP > 0,
    enemiesAlive: combatState.combatEnemies.filter(e => e.currentHP > 0).length
  }),

  // UI state with context
  getUIContext: (uiState, gameState, combatState) => ({
    isMobile: uiState.isMobile,
    isInCombat: combatState.isActive,
    showCombatUI: combatState.isActive && uiState.showCombatDetails,
    canShowSidebar: !uiState.isMobile || !combatState.isActive,
    currentModal: uiState.activeModal,
    notifications: uiState.notifications
  })
}

// Store initialization helpers
let isInitialized = false
export const initializeStores = () => {
  // Prevent multiple initializations
  if (isInitialized) return
  
  // Initialize UI responsive detection
  const uiStore = useUIStore.getState()
  uiStore.updateScreenSize()
  
  // Add window resize listener (only once)
  const handleResize = () => {
    uiStore.updateScreenSize()
  }
  
  // Remove existing listener if any
  window.removeEventListener('resize', handleResize)
  window.addEventListener('resize', handleResize)

  isInitialized = true

}

// Store reset helpers
export const resetAllStores = () => {
  useGameStore.getState().resetGame?.() || console.warn('gameStore reset not implemented')
  useCharacterStore.getState().resetCharacters()
  useCombatStore.getState().resetCombat()
  useUIStore.getState().resetUI()
  

}

// Development helpers
export const getStoreStates = () => ({
  game: useGameStore.getState(),
  character: useCharacterStore.getState(),
  combat: useCombatStore.getState(),
  ui: useUIStore.getState()
})

// OBSOLÈTE: Fonction de debug peu utilisée - utilisée uniquement en développement
export const logStoreStates = () => {
  console.group('Store States')

  console.groupEnd()
}