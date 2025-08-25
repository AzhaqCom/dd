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
   * Trouve la meilleure position pour attaquer (position adjacente aux cibles)
   * @param {Object} entity - L'entité
   * @param {Object} currentPos - Position actuelle
   * @param {number} movement - Mouvement disponible
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TargetSelector)
   * @returns {Object|null} Meilleure position d'attaque
   */
  static findBestAttackPosition(entity, currentPos, movement, gameState, dependencies) {
    const { TargetSelector } = dependencies
    const attackPositions = []
    
    // Trouver toutes les cibles potentielles
    const targets = TargetSelector.findTargets(entity, gameState)
    if (!targets.length) {
      console.log(`🎯 DEBUG: Aucune cible trouvée pour ${entity.name}`)
      return null
    }
    
    // Pour chaque cible, trouver les positions adjacentes (portée 1 pour mélée)
    targets.forEach(target => {
      const targetPos = CombatUtils.getCurrentPosition(target, gameState)
      if (!targetPos) return
      
      // Positions adjacentes à la cible (8 directions)
      const adjacentPositions = [
        { x: targetPos.x - 1, y: targetPos.y - 1 }, // Nord-Ouest
        { x: targetPos.x, y: targetPos.y - 1 },     // Nord
        { x: targetPos.x + 1, y: targetPos.y - 1 }, // Nord-Est
        { x: targetPos.x - 1, y: targetPos.y },     // Ouest
        { x: targetPos.x + 1, y: targetPos.y },     // Est
        { x: targetPos.x - 1, y: targetPos.y + 1 }, // Sud-Ouest
        { x: targetPos.x, y: targetPos.y + 1 },     // Sud
        { x: targetPos.x + 1, y: targetPos.y + 1 }  // Sud-Est
      ]
      
      adjacentPositions.forEach(pos => {
        // Vérifier si la position est valide
        if (pos.x < 0 || pos.x >= this.PLATEAU_WIDTH || pos.y < 0 || pos.y >= this.PLATEAU_HEIGHT) {
          return // Hors plateau
        }
        
        // Vérifier si on peut y arriver
        const distance = Math.abs(pos.x - currentPos.x) + Math.abs(pos.y - currentPos.y)
        if (distance > movement) {
          return // Trop loin
        }
        
        // Vérifier si la position est libre
        const posKey = `${pos.x},${pos.y}`
        const isOccupied = Object.values(gameState.combatPositions || {}).some(existingPos => 
          existingPos && existingPos.x === pos.x && existingPos.y === pos.y
        )
        if (isOccupied) {
          return // Position occupée
        }
        
        // Position valide pour attaquer cette cible !
        attackPositions.push({
          position: pos,
          distance: distance,
          target: target,
          score: 100 - distance, // Plus proche = meilleur score
          reason: `attaque_${target.name}`
        })
      })
    })
    
    if (!attackPositions.length) {
      console.log(`⚔️ DEBUG: Aucune position d'attaque accessible pour ${entity.name}`)
      return null
    }
    
    console.log(`⚔️ DEBUG: ${attackPositions.length} positions d'attaque trouvées pour ${entity.name}`)
    
    // Retourner la position avec le meilleur score (plus proche)
    return attackPositions.sort((a, b) => b.score - a.score)[0]
  }

  /**
   * Trouve la meilleure position pour attaques de mêlée en tenant compte de aiWeight
   * @param {Object} entity - L'entité qui se déplace
   * @param {Object} currentPos - Position actuelle
   * @param {number} movement - Mouvement disponible
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TargetSelector)
   * @returns {Object|null} Meilleure position {position, distance, target, attack, score}
   */
  static findBestMeleePosition(entity, currentPos, movement, gameState, dependencies) {
    const { TargetSelector } = dependencies
    const attackPositions = []
    
    // Obtenir les attaques de mêlée de l'entité
    const meleeAttacks = (entity.attacks || []).filter(attack => 
      attack.type === 'melee' && (attack.range || 1) <= 1
    )
    
    if (!meleeAttacks.length) {
      console.log(`⚔️ DEBUG: ${entity.name} n'a pas d'attaque de mêlée`)
      return null
    }
    
    // Trouver toutes les cibles potentielles
    const targets = TargetSelector.findTargets(entity, gameState)
    if (!targets.length) {
      console.log(`🎯 DEBUG: Aucune cible trouvée pour ${entity.name}`)
      return null
    }
    
    // Pour chaque cible, trouver les positions adjacentes
    targets.forEach(target => {
      const targetPos = CombatUtils.getCurrentPosition(target, gameState)
      if (!targetPos) return
      
      // Positions adjacentes à la cible (8 directions - portée 1)
      const adjacentPositions = [
        { x: targetPos.x - 1, y: targetPos.y - 1 }, // Nord-Ouest
        { x: targetPos.x, y: targetPos.y - 1 },     // Nord
        { x: targetPos.x + 1, y: targetPos.y - 1 }, // Nord-Est
        { x: targetPos.x - 1, y: targetPos.y },     // Ouest
        { x: targetPos.x + 1, y: targetPos.y },     // Est
        { x: targetPos.x - 1, y: targetPos.y + 1 }, // Sud-Ouest
        { x: targetPos.x, y: targetPos.y + 1 },     // Sud
        { x: targetPos.x + 1, y: targetPos.y + 1 }  // Sud-Est
      ]
      
      adjacentPositions.forEach(pos => {
        // Vérifier si la position est valide
        if (pos.x < 0 || pos.x >= this.PLATEAU_WIDTH || pos.y < 0 || pos.y >= this.PLATEAU_HEIGHT) {
          return // Hors plateau
        }
        
        // Vérifier si on peut y arriver
        const distance = Math.abs(pos.x - currentPos.x) + Math.abs(pos.y - currentPos.y)
        if (distance > movement) {
          return // Trop loin
        }
        
        // Vérifier si la position est libre
        const isOccupied = Object.values(gameState.combatPositions || {}).some(existingPos => 
          existingPos && existingPos.x === pos.x && existingPos.y === pos.y
        )
        if (isOccupied) {
          return // Position occupée
        }
        
        // Trouver la meilleure attaque de mêlée pour cette cible
        const bestMeleeAttack = meleeAttacks.reduce((best, attack) => {
          return (attack.aiWeight || 50) > (best?.aiWeight || 0) ? attack : best
        }, null)
        
        if (bestMeleeAttack) {
          // Score = aiWeight de l'attaque + bonus proximité
          const score = (bestMeleeAttack.aiWeight || 50) + (100 - distance)
          
          attackPositions.push({
            position: pos,
            distance: distance,
            target: target,
            attack: bestMeleeAttack,
            score: score,
            reason: `melee_${target.name}_${bestMeleeAttack.name}`
          })
          
          console.log(`⚔️ DEBUG: Position mêlée (${pos.x},${pos.y}) pour ${target.name} avec ${bestMeleeAttack.name} - Score: ${score}`)
        }
      })
    })
    
    if (!attackPositions.length) {
      console.log(`⚔️ DEBUG: Aucune position de mêlée accessible pour ${entity.name}`)
      return null
    }
    
    console.log(`⚔️ DEBUG: ${attackPositions.length} positions de mêlée trouvées pour ${entity.name}`)
    
    // Retourner la position avec le meilleur score
    return attackPositions.sort((a, b) => b.score - a.score)[0]
  }

  /**
   * Trouve la meilleure position pour attaques à distance en tenant compte de aiWeight
   * @param {Object} entity - L'entité qui se déplace
   * @param {Object} currentPos - Position actuelle
   * @param {number} movement - Mouvement disponible
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TargetSelector)
   * @returns {Object|null} Meilleure position {position, distance, target, attack, score}
   */
  static findBestRangedPosition(entity, currentPos, movement, gameState, dependencies) {
    const { TargetSelector } = dependencies
    const rangedPositions = []
    
    // Obtenir les attaques à distance de l'entité
    const rangedAttacks = (entity.attacks || []).filter(attack => 
      attack.type === 'ranged' && (attack.range || 6) > 1
    )
    
    if (!rangedAttacks.length) {
      console.log(`🏹 DEBUG: ${entity.name} n'a pas d'attaque à distance`)
      return null
    }
    
    // Trouver toutes les cibles potentielles
    const targets = TargetSelector.findTargets(entity, gameState)
    if (!targets.length) {
      console.log(`🎯 DEBUG: Aucune cible trouvée pour ${entity.name}`)
      return null
    }
    
    // Trouver la meilleure attaque à distance globale (pour optimiser le mouvement)
    const bestRangedAttack = rangedAttacks.reduce((best, attack) => {
      return (attack.aiWeight || 50) > (best?.aiWeight || 0) ? attack : best
    }, null)
    
    if (!bestRangedAttack) {
      console.log(`🏹 DEBUG: Pas d'attaque à distance valide pour ${entity.name}`)
      return null
    }
    
    const attackRange = bestRangedAttack.range || 6
    console.log(`🏹 DEBUG: Analyse attaque ${bestRangedAttack.name} (portée: ${attackRange}, poids: ${bestRangedAttack.aiWeight})`)
    
    // Pour chaque cible, calculer la distance actuelle et voir si on a besoin de bouger
    targets.forEach(target => {
      const targetPos = CombatUtils.getCurrentPosition(target, gameState)
      if (!targetPos) return
      
      const currentDistance = Math.max(
        Math.abs(currentPos.x - targetPos.x), 
        Math.abs(currentPos.y - targetPos.y)
      )
      
      console.log(`🏹 DEBUG: Distance actuelle à ${target.name}: ${currentDistance} (portée requise: ${attackRange})`)
      
      // Si déjà à portée, pas besoin de bouger
      if (currentDistance <= attackRange) {
        rangedPositions.push({
          position: currentPos,
          distance: 0,
          target: target,
          attack: bestRangedAttack,
          score: bestRangedAttack.aiWeight + 50, // Bonus pour ne pas bouger
          reason: `range_${target.name}_sur_place`
        })
        console.log(`🏹 DEBUG: Déjà à portée de ${target.name} - Pas de mouvement nécessaire`)
        return
      }
      
      // Sinon, trouver la position minimale pour être à portée
      const minDistanceNeeded = currentDistance - attackRange
      if (minDistanceNeeded > movement) {
        console.log(`🏹 DEBUG: ${target.name} trop loin même avec mouvement (besoin: ${minDistanceNeeded}, dispo: ${movement})`)
        return // Cible inaccessible même avec mouvement
      }
      
      // Chercher positions qui mettent la cible à portée avec mouvement minimal
      for (let x = Math.max(0, currentPos.x - movement); x <= Math.min(this.PLATEAU_WIDTH - 1, currentPos.x + movement); x++) {
        for (let y = Math.max(0, currentPos.y - movement); y <= Math.min(this.PLATEAU_HEIGHT - 1, currentPos.y + movement); y++) {
          const moveDistance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y)
          if (moveDistance > movement || moveDistance === 0) continue
          
          // Vérifier si la position est libre
          const isOccupied = Object.values(gameState.combatPositions || {}).some(existingPos => 
            existingPos && existingPos.x === x && existingPos.y === y
          )
          if (isOccupied) continue
          
          // Distance de cette position à la cible
          const distanceToTarget = Math.max(
            Math.abs(x - targetPos.x), 
            Math.abs(y - targetPos.y)
          )
          
          // Vérifier si cette position met la cible à portée
          if (distanceToTarget <= attackRange) {
            // Score = aiWeight - coût mouvement + bonus selon distance optimale
            const optimalDistance = Math.min(3, attackRange) // Distance idéale (ni trop près, ni trop loin)
            const distanceBonus = Math.max(0, 20 - Math.abs(distanceToTarget - optimalDistance))
            const score = bestRangedAttack.aiWeight - moveDistance + distanceBonus
            
            rangedPositions.push({
              position: { x, y },
              distance: moveDistance,
              target: target,
              attack: bestRangedAttack,
              score: score,
              reason: `range_${target.name}_${bestRangedAttack.name}`
            })
            
            console.log(`🏹 DEBUG: Position distance (${x},${y}) pour ${target.name} - mouvement: ${moveDistance}, distance cible: ${distanceToTarget}, score: ${score}`)
          }
        }
      }
    })
    
    if (!rangedPositions.length) {
      console.log(`🏹 DEBUG: Aucune position à distance accessible pour ${entity.name}`)
      return null
    }
    
    console.log(`🏹 DEBUG: ${rangedPositions.length} positions à distance trouvées pour ${entity.name}`)
    
    // Retourner la position avec le meilleur score
    return rangedPositions.sort((a, b) => b.score - a.score)[0]
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