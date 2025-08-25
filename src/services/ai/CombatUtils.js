import { calculateDistance } from '../../utils/calculations'

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
    
    // Essayer plusieurs clés possibles pour l'entité
    const entityKeys = [entity.id, entity.name, entity.id?.split('_')[0], entity.name?.toLowerCase()].filter(Boolean)
    const targetKeys = [action.target.id, action.target.name, action.target.id?.split('_')[0], action.target.name?.toLowerCase()].filter(Boolean)
    
    let entityPos = null
    let targetPos = null
    
    for (const key of entityKeys) {
      entityPos = gameState.combatPositions?.[key]
      if (entityPos) break
    }
    
    for (const key of targetKeys) {
      targetPos = gameState.combatPositions?.[key]
      if (targetPos) break
    }
    
    if (!entityPos || !targetPos) return 999
    
    return calculateDistance(entityPos, targetPos)
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
   * Utilitaire distance générique entre deux positions
   * @param {Object} pos1 - Première position {x, y}
   * @param {Object} pos2 - Deuxième position {x, y}
   * @returns {number} Distance Manhattan (Infinity si positions invalides)
   */
  static getDistance(pos1, pos2) {
    if (!pos1 || !pos2 || pos1.x === undefined || pos2.x === undefined) {
      console.warn(`⚠️ DEBUG: getDistance avec positions invalides:`, { pos1, pos2 });
      return Infinity; // Distance infinie si positions invalides
    }
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
  }

  /**
   * Obtient la position actuelle d'une entité
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu contenant les positions
   * @returns {Object|null} Position {x, y} ou null si non trouvée
   */
  static getCurrentPosition(entity, gameState) {
    const key = entity.id || entity.name
    
    // Recherche intelligente de position avec plusieurs stratégies
    let position = gameState.combatPositions[key]
    
    if (!position) {
      // Stratégie 1: Chercher par nom exact
      position = gameState.combatPositions[entity.name]
      
      if (!position && entity.id) {
        // Stratégie 2: Chercher par id
        position = gameState.combatPositions[entity.id]
      }
      
      if (!position) {
        // Stratégie 3: Chercher par pattern (gobelin_0_1 -> "Gobelin 1", etc.)
        const possibleKeys = Object.keys(gameState.combatPositions)
        const matchingKey = possibleKeys.find(k => 
          k.toLowerCase().includes(entity.name.toLowerCase()) ||
          entity.name.toLowerCase().includes(k.toLowerCase())
        )
        if (matchingKey) {
          position = gameState.combatPositions[matchingKey]
        }
      }
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