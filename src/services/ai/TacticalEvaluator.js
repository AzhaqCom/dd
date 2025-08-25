import { CombatUtils } from './CombatUtils'

/**
 * Évaluateur tactique pour l'IA de combat - scoring et analyse des positions/actions
 */
class TacticalEvaluator {

  /**
   * Calcule le score hybride : priorité de base + modificateurs intelligents
   * @param {Object} action - L'action à évaluer
   * @param {Object} entity - L'entité qui effectue l'action
   * @param {Object} gameState - État du jeu
   * @returns {number} Score total de l'action
   */
  static calculateHybridScore(action, entity, gameState) {
    let score = action.priorityScore || 50 // Base from aiPriority
    
    // Add intelligent modifiers from entity data
    if (entity.aiModifiers && action.priorityType) {
      const modifiers = entity.aiModifiers[action.priorityType]
      if (modifiers) {
        score += this.applyAIModifiers(modifiers, action, entity, gameState)
      }
    }
    
    // Add action-specific bonuses from attack/spell data
    if (action.aiWeight) {
      score += action.aiWeight
    }
    
    // ✅ AMÉLIORATION: Bonus pour urgence de soin
    if (action.healingUrgency) {
      score += action.healingUrgency
    }
    
    // Situational bonuses from action data
    if (action.situational) {
      score += this.applySituationalBonuses(action.situational, action, entity, gameState)
    }
    
    // Health-based adjustments
    score += this.getHealthAdjustments(action, entity, gameState)
    
    // Distance and positioning
    score += this.getPositionalAdjustments(action, entity, gameState)
    
    return Math.max(0, score)
  }

  /**
   * Applique les modificateurs d'IA depuis la configuration de l'entité
   * @param {Object} modifiers - Modificateurs d'IA
   * @param {Object} action - L'action
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {number} Bonus total
   */
  static applyAIModifiers(modifiers, action, entity, gameState) {
    let bonus = 0
    
    // Ally low HP bonus
    if (modifiers.allyLowHPBonus && action.target) {
      const targetHP = action.target.currentHP / action.target.maxHP
      if (targetHP < 0.3) {
        bonus += modifiers.allyLowHPBonus
      }
    }
    
    // Critical HP bonus  
    if (modifiers.criticalHPBonus && action.target) {
      const targetHP = action.target.currentHP / action.target.maxHP
      if (targetHP < 0.15) {
        bonus += modifiers.criticalHPBonus
      }
    }
    
    // Multiple enemies bonus
    if (modifiers.multipleEnemiesBonus) {
      const enemyCount = gameState.combatEnemies?.length || 0
      if (enemyCount > 1) {
        bonus += modifiers.multipleEnemiesBonus
      }
    }
    
    // Safe distance bonus
    if (modifiers.safeDistanceBonus && action.target) {
      const distance = CombatUtils.getDistanceToTarget(action, entity, gameState)
      if (distance > 2) {
        bonus += modifiers.safeDistanceBonus
      }
    }
    
    // Low HP target bonus
    if (modifiers.lowHPBonus && action.target) {
      const targetHP = action.target.currentHP / action.target.maxHP
      if (targetHP < 0.4) {
        bonus += modifiers.lowHPBonus
      }
    }
    
    return bonus
  }

  /**
   * Applique les bonus situationnels depuis les données d'action
   * @param {Object} situational - Bonus situationnels
   * @param {Object} action - L'action
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {number} Bonus total
   */
  static applySituationalBonuses(situational, action, entity, gameState) {
    let bonus = 0
    
    if (situational.lowHPTarget && action.target) {
      const targetHP = action.target.currentHP / action.target.maxHP
      if (targetHP < 0.4) {
        bonus += situational.lowHPTarget
      }
    }
    
    if (situational.safeDistance) {
      const distance = CombatUtils.getDistanceToTarget(action, entity, gameState)
      if (distance > 2) {
        bonus += situational.safeDistance
      }
    }
    
    if (situational.desperateBonus) {
      const entityHP = entity.currentHP / entity.maxHP
      if (entityHP < 0.3) {
        bonus += situational.desperateBonus
      }
    }
    
    return bonus
  }

  /**
   * Obtient les ajustements de score basés sur la santé
   * @param {Object} action - L'action
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {number} Ajustement de score
   */
  static getHealthAdjustments(action, entity, gameState) {
    let adjustment = 0
    const entityHP = entity.currentHP / entity.maxHP
    
    // Low health entity prioritizes healing/defensive actions
    if (entityHP < 0.3) {
      if (action.actionType === 'spell' && action.name?.toLowerCase().includes('soin')) {
        adjustment += 80
      }
      if (action.type === 'protect' || action.actionType === 'defensive') {
        adjustment += 60
      }
    }
    
    // High health entity can be more aggressive
    if (entityHP > 0.8) {
      if (action.actionType === 'attack') {
        adjustment += 20
      }
    }
    
    return adjustment
  }

  /**
   * Obtient les ajustements de score basés sur la position
   * @param {Object} action - L'action
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {number} Ajustement de score
   */
  static getPositionalAdjustments(action, entity, gameState) {
    let adjustment = 0
    
    const distance = CombatUtils.getDistanceToTarget(action, entity, gameState)
    const actionRange = CombatUtils.getActionRange(action)
    
    // In range bonus
    if (distance <= actionRange) {
      adjustment += 25
    } else {
      adjustment -= 50 // Out of range penalty
    }
    
    // Optimal range bonus
    if (entity.role === 'healer' && distance > 2) {
      adjustment += 15 // Healers prefer distance
    } else if (entity.role === 'tank' && distance <= 1) {
      adjustment += 15 // Tanks prefer close range
    }
    
    return adjustment
  }

  /**
   * Évalue la qualité tactique d'une position pour une entité
   * @param {Object} entity - L'entité à évaluer
   * @param {Object} position - Position {x, y} à évaluer
   * @param {Object} gameState - État du jeu
   * @returns {number} Score tactique (plus haut = meilleur)
   */
  static evaluatePosition(entity, position, gameState) {
    let score = 0
    
    // === SÉCURITÉ DÉFENSIVE ===
    const threateningEnemies = this.countThreateningEnemiesAtPosition(entity, position, gameState)
    score -= threateningEnemies * 25 // Malus exposition aux ennemis
    
    // === BONUS COUVERTURE (simulé) ===
    // TODO: Implémenter détection couverture réelle
    if (this.hasPartialCover(position, gameState)) score += 20
    if (this.hasFullCover(position, gameState)) score += 40
    
    // === BONUS ÉLÉVATION (simulé) ===
    if (this.isElevated(position, gameState)) score += 15
    
    // === BONUS RÔLE-SPÉCIFIQUE ===
    switch (entity.role) {
      case 'tank':
        // Tank préfère être au front, protéger alliés
        score += this.evaluateTankPosition(entity, position, gameState)
        break
      case 'healer':
        // Healer préfère sécurité + ligne de vue alliés
        score += this.evaluateHealerPosition(entity, position, gameState)
        break
      case 'dps':
      case 'caster':
        // DPS préfère distance sécurisée, champ de tir
        score += this.evaluateDPSPosition(entity, position, gameState)
        break
      case 'skirmisher':
        // Skirmisher préfère mobilité, routes d'évasion
        score += this.evaluateSkirmisherPosition(entity, position, gameState)
        break
      case 'brute':
        // Brute préfère proximité ennemis, charge
        score += this.evaluateBrutePosition(entity, position, gameState)
        break
    }
    
    return score
  }

  /**
   * Compte les ennemis menaçants à une position donnée
   * @param {Object} entity - L'entité
   * @param {Object} position - Position à évaluer
   * @param {Object} gameState - État du jeu
   * @param {Object} dependencies - Dépendances (TargetSelector)
   * @returns {number} Nombre d'ennemis menaçants
   */
  static countThreateningEnemiesAtPosition(entity, position, gameState, dependencies = {}) {
    // Import via dependencies pour éviter circularité
    const findTargets = dependencies.TargetSelector?.findTargets || 
      // Fallback simple si pas de dépendances
      ((entity, gameState) => {
        if (entity.type === 'companion') {
          return gameState.combatEnemies || []
        } else {
          const targets = []
          if (gameState.playerCharacter) targets.push(gameState.playerCharacter)
          if (gameState.activeCompanions) targets.push(...gameState.activeCompanions)
          return targets
        }
      })
    
    const targets = findTargets(entity, gameState)
    let count = 0
    
    targets.forEach(target => {
      const targetPos = CombatUtils.getCurrentPosition(target, gameState)
      
      // SÉCURITÉ : Vérifier que la position existe
      if (!targetPos || !position) {
        return // Ignorer cette cible si position invalide
      }
      
      const distance = CombatUtils.getDistance(position, targetPos)
      // Considérer comme menaçant si dans portée d'attaque
      if (distance <= (target.attacks?.[0]?.range || 1)) {
        count++
      }
    })
    
    return count
  }

  // === MÉTHODES D'ÉVALUATION PAR RÔLE (stubs pour l'instant) ===

  /**
   * Évalue une position pour un tank
   */
  static evaluateTankPosition(entity, position, gameState) {
    // Tank préfère être entre alliés et ennemis
    return 0
  }

  /**
   * Évalue une position pour un healer
   */
  static evaluateHealerPosition(entity, position, gameState) {
    // Healer préfère distance sécurisée avec ligne de vue alliés
    return 0
  }

  /**
   * Évalue une position pour un DPS
   */
  static evaluateDPSPosition(entity, position, gameState) {
    // DPS préfère distance sécurisée avec champ de tir
    return 0
  }

  /**
   * Évalue une position pour un skirmisher
   */
  static evaluateSkirmisherPosition(entity, position, gameState) {
    // Skirmisher préfère positions avec routes d'évasion
    return 0
  }

  /**
   * Évalue une position pour un brute
   */
  static evaluateBrutePosition(entity, position, gameState) {
    // Brute préfère proximité des ennemis
    // Import via dependencies si disponible
    const findTargets = (entity, gameState) => {
      if (entity.type === 'companion') {
        return gameState.combatEnemies || []
      } else {
        const targets = []
        if (gameState.playerCharacter) targets.push(gameState.playerCharacter)
        if (gameState.activeCompanions) targets.push(...gameState.activeCompanions)
        return targets
      }
    }

    const targets = findTargets(entity, gameState)
    let score = 0
    
    targets.forEach(target => {
      const targetPos = CombatUtils.getCurrentPosition(target, gameState)
      
      // SÉCURITÉ : Vérifier que les positions existent
      if (!targetPos || !position) {
        return // Ignorer cette cible si position invalide
      }
      
      const distance = CombatUtils.getDistance(position, targetPos)
      score += Math.max(0, 10 - distance) // Plus proche = mieux
    })
    
    return score
  }

  // === MÉTHODES DE DÉTECTION ENVIRONNEMENTALE (stubs) ===

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

export { TacticalEvaluator }