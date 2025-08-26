import { calculateDistance } from '../../utils/calculations'
import { getEntityPositionKey } from '../EntityUtils.js'

/**
 * Utilitaires de combat pour calculs de distance et positions
 */
class CombatUtils {
  
  /**
   * Calcule la distance entre une entité et sa cible dans une action
   * @param {Object} action - L'action contenant la cible
   * @param {Object} entity - L'entité qui effectue l'action
   * @param {Object} gameState - État du jeu contenant les positions
   * @returns {number} Distance en cases (999 si invalide)
   */
  static getDistanceToTarget(action, entity, gameState) {
    if (!action.target) return 999
    
    const entityPos = this.getCurrentPosition(entity, gameState)
    const targetPos = this.getCurrentPosition(action.target, gameState)
    
    if (!entityPos || !targetPos) {

      return 999
    }
    
    const distance = calculateDistance(entityPos, targetPos)

    return distance
  }

  /**
   * Détermine la portée d'une action
   * @param {Object} action - L'action à analyser
   * @returns {number} Portée en cases
   */
  static getActionRange(action) {
    if (action.range) return action.range
    if (action.actionType === 'spell' && action.range) return action.range
    if (action.type === 'melee') return 1
    if (action.type === 'ranged') return 6
    return 1
  }

  /**
   * Utilitaire distance générique entre deux positions (D&D - diagonales = 1 case)
   * @param {Object} pos1 - Première position {x, y}
   * @param {Object} pos2 - Deuxième position {x, y}
   * @returns {number} Distance D&D (Infinity si positions invalides)
   */
  static getDistance(pos1, pos2) {
    if (!pos1 || !pos2 || pos1.x === undefined || pos2.x === undefined) {
      console.warn(`⚠️ DEBUG: getDistance avec positions invalides:`, { pos1, pos2 });
      return Infinity; // Distance infinie si positions invalides
    }
    // Distance D&D : diagonales comptent comme 1 case
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
  }

  /**
   * Obtient la position actuelle d'une entité
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu contenant les positions
   * @returns {Object|null} Position {x, y} ou null si non trouvée
   */
  static getCurrentPosition(entity, gameState) {
    // Utiliser le système de clés uniforme
    const positionKey = getEntityPositionKey(entity)
    let position = gameState.combatPositions[positionKey]
    
    // Fallback pour compatibilité avec ancien système
    if (!position && entity.name !== positionKey) {
      position = gameState.combatPositions[entity.name]
    }
    
    if (!position && entity.id && entity.id !== positionKey) {
      position = gameState.combatPositions[entity.id]
    }
    
    // Fallback spécial pour le joueur
    if (!position && (entity.type === 'player' || !entity.type)) {
      position = gameState.combatPositions?.['player']
    }
    
    return position
  }

  /**
   * Trouve la position du joueur
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Position du joueur {x, y}
   */
  static findPlayerPosition(gameState) {
    const playerKeys = ['player', 'playerCharacter', 'hero']
    
    for (const key of playerKeys) {
      const pos = gameState.combatPositions?.[key]
      if (pos) return pos
    }
    
    return null
  }

  /**
   * Obtient les actions possibles sans position (sorts à distance, etc.)
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @param {string} priorityType - Type de priorité
   * @param {Object} dependencies - Objets TargetSelector et ActionRepository
   * @returns {Array} Actions limitées
   */
  static getDistanceLimitedActions(entity, gameState, priorityType, dependencies) {
    const actions = []
    const { TargetSelector, ActionRepository } = dependencies

    // Seuls les sorts et actions à distance sont possibles sans position
    if (priorityType === 'ranged_spell' || priorityType === 'ranged_support') {
      const targets = TargetSelector.findTargets(entity, gameState)
      
      if (priorityType === 'ranged_spell') {
        const spells = ActionRepository.getOffensiveSpells(entity)
        spells.forEach(spell => {
          targets.forEach(target => {
            actions.push({
              type: 'spell',
              spell: spell,
              targets: [target],
              target: target,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${target.name} (sans position)`
            })
          })
        })
      } else if (priorityType === 'ranged_support') {
        const allies = TargetSelector.getAllies(entity, gameState)
        const supportSpells = ActionRepository.getSupportSpells(entity)
        supportSpells.forEach(spell => {
          allies.forEach(ally => {
            actions.push({
              type: 'spell',
              spell: spell,
              targets: [ally],
              target: ally,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${ally.name} (sans position)`
            })
          })
        })
      }
    }

    return actions
  }
}

export { CombatUtils }