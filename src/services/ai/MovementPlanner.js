import { CombatUtils } from './CombatUtils'

/**
 * Planification des mouvements tactiques pour l'IA
 */
class MovementPlanner {
  
  // Constantes de plateau - TODO: récupérer depuis gameState
  static PLATEAU_WIDTH = 8
  static PLATEAU_HEIGHT = 6

  /**
   * Trouve la meilleure position tactique accessible
   * @param {Object} entity - L'entité
   * @param {Object} currentPos - Position actuelle
   * @param {number} movement - Mouvement disponible
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TacticalEvaluator, TargetSelector)
   * @returns {Object|null} Meilleure position avec score
   */
  static findBestTacticalPosition(entity, currentPos, movement, gameState, dependencies) {
    const { TacticalEvaluator } = dependencies
    const candidates = []
    
    // Obtenir positions occupées pour éviter collisions
    const occupiedPositions = new Set()
    Object.values(gameState.combatPositions || {}).forEach(pos => {
      if (pos && pos.x !== undefined && pos.y !== undefined) {
        occupiedPositions.add(`${pos.x},${pos.y}`)
      }
    })
    
    // Générer positions candidates dans rayon de mouvement ET dans plateau
    for (let x = currentPos.x - movement; x <= currentPos.x + movement; x++) {
      for (let y = currentPos.y - movement; y <= currentPos.y + movement; y++) {
        // VÉRIFICATION PLATEAU : Position doit être dans les limites
        if (x < 0 || x >= this.PLATEAU_WIDTH || y < 0 || y >= this.PLATEAU_HEIGHT) {
          continue // Ignorer positions hors plateau
        }
        
        // VÉRIFICATION COLLISION : Position ne doit pas être occupée
        const posKey = `${x},${y}`
        if (occupiedPositions.has(posKey) && posKey !== `${currentPos.x},${currentPos.y}`) {
          continue // Ignorer positions occupées (sauf position actuelle)
        }
        
        const distance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y)
        if (distance > 0 && distance <= movement) {
          const position = { x, y }
          const score = TacticalEvaluator.evaluatePosition(entity, position, gameState)
          candidates.push({ position, score, distance, reason: "position_tactique" })
        }
      }
    }
    
    console.log(`🗺️ DEBUG: ${candidates.length} positions libres trouvées pour ${entity.name}`)
    return candidates.sort((a, b) => b.score - a.score)[0] || null
  }

  /**
   * Trouve la meilleure position d'évasion
   * @param {Object} entity - L'entité
   * @param {Object} currentPos - Position actuelle
   * @param {number} movement - Mouvement disponible
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TacticalEvaluator, TargetSelector)
   * @returns {Object|null} Meilleure position d'évasion
   */
  static findBestEscapePosition(entity, currentPos, movement, gameState, dependencies) {
    const { TacticalEvaluator, TargetSelector } = dependencies
    const targets = TargetSelector.findTargets(entity, gameState)
    const escapePositions = []
    
    // Obtenir positions occupées pour éviter collisions
    const occupiedPositions = new Set()
    Object.values(gameState.combatPositions || {}).forEach(pos => {
      if (pos && pos.x !== undefined && pos.y !== undefined) {
        occupiedPositions.add(`${pos.x},${pos.y}`)
      }
    })
    
    // Chercher positions qui maximisent la distance aux ennemis
    for (let x = currentPos.x - movement; x <= currentPos.x + movement; x++) {
      for (let y = currentPos.y - movement; y <= currentPos.y + movement; y++) {
        // VÉRIFICATION PLATEAU : Position doit être dans les limites
        if (x < 0 || x >= this.PLATEAU_WIDTH || y < 0 || y >= this.PLATEAU_HEIGHT) {
          continue // Ignorer positions hors plateau
        }
        
        // VÉRIFICATION COLLISION : Position ne doit pas être occupée
        const posKey = `${x},${y}`
        if (occupiedPositions.has(posKey) && posKey !== `${currentPos.x},${currentPos.y}`) {
          continue // Ignorer positions occupées (sauf position actuelle)
        }
        
        const distance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y)
        if (distance > 0 && distance <= movement) {
          const position = { x, y }
          let minEnemyDistance = Infinity
          
          targets.forEach(target => {
            const targetPos = CombatUtils.getCurrentPosition(target, gameState)
            
            // SÉCURITÉ : Utiliser position directe si disponible, sinon ignorer
            if (targetPos && targetPos.x !== undefined && targetPos.y !== undefined) {
              const enemyDistance = Math.abs(x - targetPos.x) + Math.abs(y - targetPos.y)
              minEnemyDistance = Math.min(minEnemyDistance, enemyDistance)
            } else if (target.x !== undefined && target.y !== undefined) {
              // Fallback : utiliser directement target.x, target.y
              const enemyDistance = Math.abs(x - target.x) + Math.abs(y - target.y)
              minEnemyDistance = Math.min(minEnemyDistance, enemyDistance)
            }
          })
          
          const score = minEnemyDistance * 10 + TacticalEvaluator.evaluatePosition(entity, position, gameState)
          escapePositions.push({ position, score, distance })
        }
      }
    }
    
    return escapePositions.sort((a, b) => b.score - a.score)[0] || null
  }

  /**
   * Génère une position de fallback pour une entité sans position
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Position générée ou null
   */
  static generateFallbackPosition(entity, gameState) {
    if (!gameState.combatPositions) {
      console.warn('Aucune combatPositions disponible pour le fallback')
      return null
    }

    // Obtenir les positions existantes pour calculer une position libre
    const existingPositions = Object.values(gameState.combatPositions).filter(Boolean)
    
    if (existingPositions.length === 0) {
      // Première position par défaut si aucune position existe
      return { x: 5, y: 5 }
    }

    // Générer position basée sur le type d'entité
    let basePos = { x: 5, y: 5 }
    
    if (entity.type === 'companion') {
      // Compagnons près du joueur
      const playerPos = CombatUtils.findPlayerPosition(gameState)
      if (playerPos) {
        basePos = {
          x: playerPos.x + Math.floor(Math.random() * 3) - 1, // -1 à +1 du joueur
          y: playerPos.y + Math.floor(Math.random() * 3) - 1
        }
      }
    } else {
      // Ennemis à distance du joueur
      const playerPos = CombatUtils.findPlayerPosition(gameState)
      if (playerPos) {
        // Position à 3-6 cases du joueur
        const angle = Math.random() * Math.PI * 2
        const distance = 3 + Math.random() * 3
        basePos = {
          x: Math.round(playerPos.x + Math.cos(angle) * distance),
          y: Math.round(playerPos.y + Math.sin(angle) * distance)
        }
      }
    }

    // Vérifier que la position n'est pas occupée
    const finalPos = this.findNearestFreePosition(basePos, existingPositions)
    
    return finalPos
  }

  /**
   * Trouve la position libre la plus proche
   * @param {Object} basePos - Position de base
   * @param {Array} existingPositions - Positions occupées
   * @returns {Object} Position libre
   */
  static findNearestFreePosition(basePos, existingPositions) {
    // Vérifier si la position de base est libre
    const isOccupied = existingPositions.some(pos => 
      pos.x === basePos.x && pos.y === basePos.y
    )
    
    if (!isOccupied) {
      return basePos
    }

    // Chercher une position libre en spirale autour de la position de base
    for (let radius = 1; radius <= 5; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const testPos = {
              x: basePos.x + dx,
              y: basePos.y + dy
            }
            
            const isTestOccupied = existingPositions.some(pos =>
              pos.x === testPos.x && pos.y === testPos.y
            )
            
            if (!isTestOccupied && testPos.x >= 0 && testPos.y >= 0) {
              return testPos
            }
          }
        }
      }
    }

    // Fallback final : position aléatoire
    return {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10)
    }
  }

  

  /**
   * Méthodes de détection environnementale (stubs)
   */
  static hasPartialCover(position, gameState) {
    return false // TODO: Implémenter détection couverture
  }

  static hasFullCover(position, gameState) {
    return false // TODO: Implémenter détection couverture
  }

  static isElevated(position, gameState) {
    return false // TODO: Implémenter détection élévation
  }
}

export { MovementPlanner }