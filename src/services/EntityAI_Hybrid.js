import { calculateDistance, getModifier } from '../utils/calculations'
import { spells } from '../data/spells'
import { CombatEngine } from './combatEngine'
import { SpellServiceUnified } from './SpellServiceUnified'

// === CLASSE TURNPLAN POUR MOUVEMENT TACTIQUE ===
/**
 * Représente un plan complet de tour : mouvement + action + mouvement
 * Suit les règles D&D 5e : vitesse divisée avant/après action
 */
class TurnPlan {
  constructor() {
    this.phases = []  // Array de phases ordonnées
    this.totalScore = 0
    this.movementUsed = 0
    this.totalMovement = 0
    this.reasoning = ""  // Explication du plan pour debug
  }
  
  /**
   * Ajoute une phase au plan
   * @param {string} type - 'move', 'attack', 'spell', 'end_turn'
   * @param {Object} details - Détails de la phase
   */
  addPhase(type, details) {
    const phase = { type, ...details }
    this.phases.push(phase)
    
    // Tracking du mouvement
    if (type === 'move') {
      this.movementUsed += details.distance || 0
    }
    
    return this
  }
  
  /**
   * Calcule le score tactique total du plan
   */
  calculateTotalScore() {
    this.totalScore = this.phases.reduce((sum, phase) => {
      return sum + (phase.tacticalScore || 0)
    }, 0)
    
    // Bonus pour plans équilibrés mouvement + action
    if (this.phases.some(p => p.type === 'move') && 
        this.phases.some(p => ['attack', 'spell'].includes(p.type))) {
      this.totalScore += 25 // Bonus plan tactique complet
    }
    
    return this.totalScore
  }
  
  /**
   * Vérifie si le plan est valide selon les règles D&D 5e
   */
  isValid() {
    // Vérifier mouvement total
    if (this.movementUsed > this.totalMovement) {
      return false
    }
    
    // Vérifier qu'il n'y a qu'une action principale
    const mainActions = this.phases.filter(p => 
      ['attack', 'spell', 'dash', 'dodge'].includes(p.type)
    )
    
    return mainActions.length <= 1
  }
  
  /**
   * Convertit le plan en description lisible
   */
  describe() {
    const descriptions = this.phases.map(phase => {
      switch (phase.type) {
        case 'move':
          return `Bouge vers ${phase.to.x},${phase.to.y} (${phase.reason})`
        case 'attack':
          return `Attaque ${phase.target.name} avec ${phase.attack.name}`
        case 'spell':
          return `Lance ${phase.spell.name} sur ${phase.target?.name || 'zone'}`
        default:
          return phase.description || `Action ${phase.type}`
      }
    })
    
    return `Plan: ${descriptions.join(' → ')} [Score: ${this.totalScore}]`
  }
}

/**
 * Hybrid Entity AI - Combines existing aiPriority system with intelligent scoring
 * Preserves the flexible aiPriority approach while adding contextual intelligence
 */
export class EntityAI_Hybrid {
  
  /**
   * Main entry point: uses aiPriority as base + intelligent scoring for refinement
   */
  static getBestAction(entity, gameState) {

    
    if (!entity || !entity.role) {
      console.warn('Entity has no role, using fallback AI')
      return this.fallbackAction(entity, gameState)
    }
    
    // 1. Get actions based on aiPriority (existing flexible system)
    const priorityActions = this.getActionsByPriority(entity, gameState)
    
    if (priorityActions.length === 0) {
      return this.fallbackAction(entity, gameState)
    }
    
    // 2. Add intelligent scoring to refine decisions
    const scoredActions = priorityActions.map(action => ({
      action,
      score: this.calculateHybridScore(action, entity, gameState)
    }))
    
    // 3. Sort by total score and return best
    scoredActions.sort((a, b) => b.score - a.score)
    
    const bestAction = scoredActions[0]

    
    return bestAction.action
  }

  /**
   * Gets available actions respecting aiPriority order (preserves existing system)
   */
  static getActionsByPriority(entity, gameState) {
    const actions = []
    
    if (!entity.aiPriority) {
      console.warn(`Entity ${entity.name} has no aiPriority, using fallback`)
      return this.getFallbackActions(entity, gameState)
    }
    
    // Process each priority in order (existing system logic)
    entity.aiPriority.forEach((priorityType, index) => {

      const basePriority = 100 - (index * 15) // Respect priority order
      
      const priorityActions = this.getActionsForPriorityType(priorityType, entity, gameState)

      
      priorityActions.forEach(action => {
        action.priorityScore = basePriority
        action.priorityType = priorityType
        action.priorityIndex = index
        actions.push(action)
      })
    })

    
    return actions
  }

  /**
   * Gets specific actions for a priority type (enhanced from original system)
   */
  static getActionsForPriorityType(priorityType, entity, gameState) {
    const actions = []
    
    // Essayer plusieurs clés possibles pour trouver la position
    const possibleKeys = [
      entity.id,
      entity.name, 
      entity.id?.split('_')[0], // Enlever le suffixe _0_0
      entity.name?.toLowerCase()
    ].filter(Boolean)
    
    
    let entityPos = null
    let usedKey = null
    
    for (const key of possibleKeys) {
      entityPos = gameState.combatPositions?.[key]
      if (entityPos) {
        usedKey = key
        break
      }
    }

    
    if (!entityPos) {
      // ⚠️ FALLBACK ROBUSTE: Générer position par défaut si manquante
      console.warn(`⚠️ Position manquante pour ${entity.name} (${entity.id}). Génération de position fallback.`)
      
      // Essayer d'obtenir une position de spawn basée sur le type d'entité
      entityPos = this.generateFallbackPosition(entity, gameState)
      
      if (entityPos && gameState.combatPositions) {
        // Sauvegarder la position générée pour éviter la régénération
        const fallbackKey = entity.id || entity.name
        gameState.combatPositions[fallbackKey] = entityPos
        console.log(`✅ Position fallback générée pour ${entity.name}:`, entityPos)
      } else {
        // Si même le fallback échoue, utiliser les actions à distance uniquement
        console.warn(`❌ Impossible de générer une position pour ${entity.name}. Actions limitées.`)
        return this.getDistanceLimitedActions(entity, gameState, priorityType)
      }
    }

    switch (priorityType) {
      case 'protect':
        const fragileAlly = this.findMostWoundedAlly(entity, gameState)
        if (fragileAlly) {
          actions.push({
            type: 'protect',
            target: fragileAlly,
            name: 'Protection',
            description: `Protéger ${fragileAlly.name}`,
            actionType: 'ability'
          })
        }
        break
        
      case 'heal':
        const allAllies = this.getAllies(entity, gameState)
        const woundedAllies = this.findWoundedAllies(entity, gameState)
        
        console.log(`🏥 ${entity.name} évalue heal:`)
        console.log(`  👥 Tous alliés:`, allAllies.map(a => `${a.name} (${a.currentHP}/${a.maxHP})`))
        console.log(`  🩹 Alliés blessés:`, woundedAllies.map(a => `${a.name} (${a.currentHP}/${a.maxHP})`))
        
        woundedAllies.forEach(ally => {
          // ✅ AMÉLIORATION: Sélection intelligente des sorts selon la cible
          const healingSpells = this.getHealingSpells(entity, ally)
          
          // Prendre seulement le meilleur sort pour éviter la surcharge d'actions
          const bestSpell = healingSpells[0]
          
          if (bestSpell) {
            const allyHealthPercent = ally.currentHP / ally.maxHP
            
            // Ajuster le score d'action selon l'urgence
            let priorityBonus = 0
            if (allyHealthPercent <= 0.25) {
              priorityBonus = 80 // Critique: Priorité maximale
            } else if (allyHealthPercent <= 0.5) {
              priorityBonus = 50 // Important
            } else if (allyHealthPercent <= 0.8) {
              priorityBonus = 20 // Optionnel
            }
            
            const action = {
              type: 'spell',
              spell: bestSpell,
              targets: [ally],
              target: ally,
              actionType: 'spell',
              name: bestSpell.name,
              description: `${bestSpell.name} sur ${ally.name} (${Math.round(allyHealthPercent * 100)}% HP)`,
              healingUrgency: priorityBonus // Pour le scoring
            }
            actions.push(action)
          }
        })
        break
        
      case 'taunt':
        const targets = this.findTargets(entity, gameState)
        if (targets.length > 0) {
          actions.push({
            type: 'taunt',
            targets: targets,
            name: 'Provocation',
            description: 'Attirer l\'attention',
            actionType: 'ability'
          })
        }
        break
        
      case 'melee_attack':
        const meleeAttacks = this.getMeleeAttacks(entity)
        const meleeTargets = this.findTargetsInMeleeRange(entity, gameState)
        
        meleeAttacks.forEach(attack => {
          meleeTargets.forEach(target => {
            actions.push({
              ...attack,
              type: 'melee', // Ajout explicite du type
              target: target,
              actionType: 'attack',
              description: `${attack.name} sur ${target.name}`
            })
          })
        })
        break
        
      case 'ranged_attack':
        const rangedAttacks = this.getRangedAttacks(entity)
        const rangedTargets = this.findTargetsInRange(entity, gameState)
        
        rangedAttacks.forEach(attack => {
          rangedTargets.forEach(target => {
            actions.push({
              ...attack,
              type: 'ranged', // Ajout explicite du type
              target: target,
              actionType: 'attack',
              description: `${attack.name} sur ${target.name}`
            })
          })
        })
        break
        
      case 'hit_and_run':
        // Combine movement + attack
        const runTargets = this.findIsolatedTargets(entity, gameState)
        const quickAttacks = this.getQuickAttacks(entity)
        quickAttacks.forEach(attack => {
          runTargets.forEach(target => {
            actions.push({
              ...attack,
              target: target,
              actionType: 'hit_and_run',
              description: `Harcèlement: ${attack.name} sur ${target.name}`,
              requiresMovement: true
            })
          })
        })
        break
        
      case 'buff':
        const buffSpells = this.getBuffSpells(entity)
        const buffTargets = this.getAllies(entity, gameState)
        buffSpells.forEach(spell => {
          buffTargets.forEach(target => {
            actions.push({
              type: 'spell', // AJOUT OBLIGATOIRE
              spell: spell,
              targets: [target],
              target: target,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${target.name}`
            })
          })
        })
        break
        
      case 'ranged_support':
        const supportSpells = this.getSupportSpells(entity)
        const supportTargets = this.getAllies(entity, gameState) // CORRECTIF : Cibler les alliés !
        supportSpells.forEach(spell => {
          supportTargets.forEach(target => {
            actions.push({
              type: 'spell', // AJOUT OBLIGATOIRE
              spell: spell,
              targets: [target],
              target: target,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${target.name}`
            })
          })
        })
        break
        
      case 'ranged_spell':
        // NOUVEAU : Sorts à distance offensifs

        const offensiveSpells = this.getOffensiveSpells(entity)
        const spellTargets = this.findTargets(entity, gameState)

        
        offensiveSpells.forEach(spell => {
          spellTargets.forEach(target => {
            actions.push({
              type: 'spell',
              spell: spell,
              targets: [target],
              target: target, // Compatibilité
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${target.name}`
            })
          })
        })
        break
        
      case 'area_damage':
        // NOUVEAU : Sorts de zone
        const aoeSpells = this.getAoESpells(entity)
        const groupedTargets = this.findGroupedTargets(entity, gameState)
        aoeSpells.forEach(spell => {
          if (groupedTargets.length >= 2) { // Au moins 2 cibles pour l'AoE
            actions.push({
              type: 'spell',
              spell: spell,
              targets: groupedTargets,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${groupedTargets.length} ennemis`
            })
          }
        })
        break
        
      case 'debuff':
        // NOUVEAU : Sorts de contrôle/affaiblissement
        const debuffSpells = this.getDebuffSpells(entity)
        const strongTargets = this.findStrongTargets(entity, gameState)
        debuffSpells.forEach(spell => {
          strongTargets.forEach(target => {
            actions.push({
              type: 'spell',
              spell: spell,
              targets: [target],
              target: target,
              actionType: 'spell',
              name: spell.name,
              description: `${spell.name} sur ${target.name}`
            })
          })
        })
        break
    }
    
    return actions
  }

  /**
   * Calculates hybrid score: aiPriority base + intelligent modifiers
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
   * Applies AI modifiers from entity configuration
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
      const distance = this.getDistanceToTarget(action, entity, gameState)
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
   * Applies situational bonuses from action data
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
      const distance = this.getDistanceToTarget(action, entity, gameState)
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
   * Gets health-based score adjustments
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
   * Gets positional score adjustments
   */
  static getPositionalAdjustments(action, entity, gameState) {
    let adjustment = 0
    
    const distance = this.getDistanceToTarget(action, entity, gameState)
    const actionRange = this.getActionRange(action)
    
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

  // ========================================
  // HELPER METHODS
  // ========================================

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

  static getActionRange(action) {
    if (action.range) return action.range
    if (action.actionType === 'spell' && action.range) return action.range
    if (action.type === 'melee') return 1
    if (action.type === 'ranged') return 6
    return 1
  }

  static findMostWoundedAlly(entity, gameState) {
    const allies = this.getAllies(entity, gameState)
    return allies.reduce((mostWounded, ally) => {
      const allyHP = ally.currentHP / ally.maxHP
      const mostWoundedHP = mostWounded ? mostWounded.currentHP / mostWounded.maxHP : 1
      return allyHP < mostWoundedHP ? ally : mostWounded
    }, null)
  }

  static findWoundedAllies(entity, gameState) {
    const allies = this.getAllies(entity, gameState)
    
    // ✅ AMÉLIORATION: Seuil intelligent pour les soins
    return allies.filter(ally => {
      const healthPercent = ally.currentHP / ally.maxHP
      
      // Différents seuils selon la gravité
      if (healthPercent <= 0.25) {
        // Critique: Toujours soigner
        return true
      } else if (healthPercent <= 0.6) {
        // Modéré: Soigner si on a des sorts à bas niveau
        return true
      } else if (healthPercent <= 0.8) {
        // Léger: Soigner seulement si surplus de spell slots
        const spellSlots = entity.spellcasting?.spellSlots
        if (spellSlots) {
          const totalSlots = Object.values(spellSlots).reduce((sum, slot) => sum + (slot?.max || 0), 0)
          const usedSlots = Object.values(spellSlots).reduce((sum, slot) => sum + (slot?.used || 0), 0)
          const availablePercent = totalSlots > 0 ? (totalSlots - usedSlots) / totalSlots : 0
          
          // Soigner seulement si plus de 70% des sorts disponibles
          return availablePercent > 0.7
        }
        return false
      }
      
      // HP > 80%: Ne pas soigner (évite le gaspillage)
      return false
    })
    .sort((a, b) => {
      // Trier par urgence: les plus blessés en premier
      const aPercent = a.currentHP / a.maxHP
      const bPercent = b.currentHP / b.maxHP
      return aPercent - bPercent
    })
  }

  static getAllies(entity, gameState) {
    const allies = []
    

    
    if (entity.type === 'companion') {
      // For companions: player + other companions are allies
      if (gameState.playerCharacter) {
        allies.push(gameState.playerCharacter)
      }
      if (gameState.activeCompanions) {
        gameState.activeCompanions.forEach(companion => {
          if (companion.id !== entity.id && companion.name !== entity.name) {
            allies.push(companion)
          }
        })
      }
    }
    

    return allies
  }

  static findTargets(entity, gameState) {

    
    if (entity.type === 'companion') {
      const enemies = gameState.combatEnemies || []
      return enemies
    } else {
      // Enemy targets player and companions
      const targets = []
      if (gameState.playerCharacter) targets.push(gameState.playerCharacter)
      if (gameState.activeCompanions) targets.push(...gameState.activeCompanions)
      return targets
    }
  }

  static getMeleeAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'melee') || []
  }

  static getRangedAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'ranged') || []
  }

  static getQuickAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'melee' || attack.type === 'ranged') || []
  }

  static getHealingSpells(entity, targetAlly = null) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter doublons avec Set
    const allSpells = [
      ...new Set([
        ...(entity.spellcasting.knownSpells || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.cantrips || [])
      ])
    ]
    
    const healingSpells = allSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.healing || // Propriété healing directe
        spell.name?.toLowerCase().includes('soin') || // Nom contient "soin"
        spell.targetType === 'ally' && spell.name?.toLowerCase().includes('heal') // Anglais
      ))

    // ✅ AMÉLIORATION: Trier les sorts par efficacité selon la cible
    if (targetAlly) {
      const targetHealthPercent = targetAlly.currentHP / targetAlly.maxHP
      const missingHP = targetAlly.maxHP - targetAlly.currentHP
      
      return healingSpells.sort((a, b) => {
        // Prioriser selon l'urgence et l'efficacité
        let scoreA = 0
        let scoreB = 0
        
        // Bonus pour les cantrips si peu de dégâts (économise les spell slots)
        if (missingHP <= 10) {
          if (a.level === 0) scoreA += 30
          if (b.level === 0) scoreB += 30
        }
        
        // Bonus pour les sorts puissants si dégâts importants
        if (targetHealthPercent < 0.3) {
          scoreA += (a.level || 0) * 10
          scoreB += (b.level || 0) * 10
        }
        
        // Malus pour les sorts trop puissants sur cibles avec beaucoup de HP
        if (targetHealthPercent > 0.6) {
          if ((a.level || 0) > 1) scoreA -= 20
          if ((b.level || 0) > 1) scoreB -= 20
        }
        
        return scoreB - scoreA
      })
    }
    
    return healingSpells
  }

  static getBuffSpells(entity) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter les doublons en utilisant Set
    const availableSpells = [
      ...new Set([
        ...(entity.spellcasting.cantrips || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.knownSpells || [])
      ])
    ]
    
    console.log(`🔍 ${entity.name} évalue ${availableSpells.length} sorts pour buffs:`, availableSpells)
    
    const buffSpells = availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) {
          console.warn(`❌ Sort "${spellName}" introuvable dans spells.js`)
          return null
        }
        return { id: spellName, ...spell, name: spellName }
      })
      .filter(spell => spell && this.isBuffSpell(spell))
    
    console.log(`✅ ${entity.name} sorts de buff détectés:`, buffSpells.map(s => s.name))
    return buffSpells
  }

  /**
   * Détermine si un sort est un buff basé sur ses propriétés
   * @param {Object} spell - Le sort à analyser  
   * @returns {boolean} True si c'est un sort de buff
   */
  static isBuffSpell(spell) {
    // Si le sort a une propriété 'buff', c'est un buff !
    return !!spell.buff
  }

  static getSupportSpells(entity) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter doublons avec Set
    const availableSpells = [
      ...new Set([
        ...(entity.spellcasting.cantrips || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.knownSpells || [])
      ])
    ]
    
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        // ❌ CORRECTION: Exclure les sorts de soin de ranged_support
        // Les sorts de soin sont gérés dans le cas 'heal' uniquement
        
        // Sorts de protection/buff sur alliés (mais PAS de soin)
        (spell.targetType === 'ally' && !spell.damage && !spell.healing && !spell.name?.toLowerCase().includes('soin')) ||
        
        // Sorts utilitaires non offensifs (détection, etc.)
        (spell.school === 'Divination' && !spell.damage) ||
        (spell.school === 'Transmutation' && spell.targetType === 'ally' && !spell.healing) ||
        
        // Sorts défensifs spécifiques
        spell.name?.toLowerCase().includes('protection') ||
        spell.name?.toLowerCase().includes('bouclier') ||
        spell.name?.toLowerCase().includes('détection')
      ))
  }

  static findTargetsInMeleeRange(entity, gameState) {
    return this.findTargets(entity, gameState).filter(target => {
      const distance = this.getDistanceToTarget({target}, entity, gameState)
      return distance <= 1
    })
  }

  static findTargetsInRange(entity, gameState) {
    return this.findTargets(entity, gameState).filter(target => {
      const distance = this.getDistanceToTarget({target}, entity, gameState)
      return distance <= 6 // Standard ranged
    })
  }

  static findIsolatedTargets(entity, gameState) {
    // Simplified: just return all targets for hit-and-run
    return this.findTargets(entity, gameState)
  }

  static getFallbackActions(entity, gameState) {
    const actions = []
    
    const targets = this.findTargets(entity, gameState)
    
    // 1. ATTAQUES AVEC ARMES (système existant)
    if (entity.attacks && entity.attacks.length > 0) {
      entity.attacks.forEach(attack => {
        targets.forEach(target => {
          // VÉRIFIER LA PORTÉE avant de créer l'action
          const distance = this.getDistanceToTarget({target}, entity, gameState)
          const attackRange = attack.range || (attack.type === 'melee' ? 1 : 6)
          
          if (distance <= attackRange) {
            actions.push({
              ...attack,
              type: attack.type === 'melee' ? 'melee' : 'attack',
              target: target,
              actionType: 'attack',
              priorityScore: attack.type === 'melee' ? 30 : 50, // Priorité arme > mains nues
              description: `${attack.name} sur ${target.name}`
            })
          }
        })
      })
    }
    
    // 2. ATTAQUE À MAINS NUES (Fallback D&D) - TOUJOURS DISPONIBLE
    const meleeTargets = targets.filter(target => {
      const distance = this.getDistanceToTarget({target}, entity, gameState)
      return distance <= 1 // Portée mains nues = 1 case
    })
    
    meleeTargets.forEach(target => {
      actions.push({
        name: "Attaque à mains nues",
        type: 'melee',
        range: 1,
        damageDice: "1",
        damageBonus: Math.max(0, getModifier(entity.stats?.force || 10)),
        damageType: "contondant",
        target: target,
        actionType: 'attack',
        priorityScore: 10, // Score très bas = vraiment dernier recours
        description: `Attaque à mains nues sur ${target.name}`
      })
    })
    
    return actions
  }

  static fallbackAction(entity, gameState) {
    const fallbackActions = this.getFallbackActions(entity, gameState)
    return fallbackActions.length > 0 ? fallbackActions[0] : null
  }

  // === NOUVEAUX SYSTÈMES TACTIQUES - PHASE 2 ===

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
   * Planifie un tour complet : mouvement + action (+ mouvement)
   * @param {Object} entity - L'entité qui planifie
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan optimal ou null
   */
  static planCompleteTurn(entity, gameState) {
    console.log(`🎯 DEBUG: Début planCompleteTurn pour ${entity.name}`);
    const possiblePlans = []
    
    try {
      // === PLAN 1: ATTAQUER DEPUIS POSITION ACTUELLE ===
      console.log(`🎯 DEBUG: Évaluation plan 1 - Attaque sur place`);
      const attackInPlace = this.evaluateAttackInPlace(entity, gameState)
      if (attackInPlace) {
        possiblePlans.push(attackInPlace)
        console.log(`✅ DEBUG: Plan 1 ajouté`);
      } else {
        console.log(`❌ DEBUG: Plan 1 rejeté`);
      }
      
      // === PLAN 2: BOUGER PUIS ATTAQUER ===
      console.log(`🎯 DEBUG: Évaluation plan 2 - Bouger puis attaquer`);
      const moveThenAttack = this.evaluateMoveThenAttack(entity, gameState)
      if (moveThenAttack) {
        possiblePlans.push(moveThenAttack)
        console.log(`✅ DEBUG: Plan 2 ajouté`);
      } else {
        console.log(`❌ DEBUG: Plan 2 rejeté`);
      }
      
      // === PLAN 3: ATTAQUER PUIS SE REPOSITIONNER ===
      console.log(`🎯 DEBUG: Évaluation plan 3 - Hit-and-run`);
      const attackThenMove = this.evaluateAttackThenMove(entity, gameState)
      if (attackThenMove) {
        possiblePlans.push(attackThenMove)
        console.log(`✅ DEBUG: Plan 3 ajouté`);
      } else {
        console.log(`❌ DEBUG: Plan 3 rejeté`);
      }
      
      // === PLAN 4: DOUBLE MOUVEMENT (CHARGE/REPLI) ===
      console.log(`🎯 DEBUG: Évaluation plan 4 - Double mouvement`);
      const doubleMovement = this.evaluateDoubleMovement(entity, gameState)
      if (doubleMovement) {
        possiblePlans.push(doubleMovement)
        console.log(`✅ DEBUG: Plan 4 ajouté`);
      } else {
        console.log(`❌ DEBUG: Plan 4 rejeté`);
      }
      
      console.log(`🎯 DEBUG: ${possiblePlans.length} plans disponibles`);
      
      // Trier par score et retourner le meilleur
      possiblePlans.forEach((plan, index) => {
        const score = plan.calculateTotalScore()
        console.log(`🎯 DEBUG: Plan ${index + 1} score: ${score}`);
      })
      
      possiblePlans.sort((a, b) => b.totalScore - a.totalScore)
      
      const bestPlan = possiblePlans[0]
      if (bestPlan && bestPlan.isValid()) {
        console.log(`🧠 ${entity.name} planifie: ${bestPlan.describe()}`)
        return bestPlan
      }
      
      console.log(`⚠️ DEBUG: Aucun plan valide trouvé pour ${entity.name}`);
      return null
      
    } catch (error) {
      console.error(`❌ DEBUG: Erreur dans planCompleteTurn:`, error);
      throw error;
    }
  }

  /**
   * Évalue plan : Attaquer depuis position actuelle
   */
  static evaluateAttackInPlace(entity, gameState) {
    console.log(`🎯 DEBUG: evaluateAttackInPlace pour ${entity.name}`);
    
    try {
      let currentPos = this.getCurrentPosition(entity, gameState)
      console.log(`🎯 DEBUG: Position actuelle:`, currentPos);
      
      if (!currentPos) {
        console.log(`⚠️ DEBUG: Pas de position trouvée pour ${entity.name}, génération position de fallback`);
        // Générer position fallback comme dans l'ancien système
        currentPos = this.generateFallbackPosition(entity, gameState);
        if (!currentPos) {
          console.log(`❌ DEBUG: Impossible de générer position fallback pour ${entity.name}`);
          return null;
        }
        // Sauvegarder la position générée
        const entityKey = entity.id || entity.name;
        gameState.combatPositions[entityKey] = currentPos;
        console.log(`✅ DEBUG: Position fallback générée:`, currentPos);
      }
      
      const bestAction = this.getBestActionAtPosition(entity, currentPos, gameState)
      console.log(`🎯 DEBUG: Meilleure action:`, bestAction);
      
      if (!bestAction) {
        console.log(`❌ DEBUG: Aucune action disponible depuis position actuelle`);
        return null;
      }
      
      const plan = new TurnPlan()
      // Fix movement undefined pour ennemis
      const entityMovement = entity.movement || entity.speed || 6
      plan.totalMovement = entityMovement
      plan.reasoning = "Attaque depuis position actuelle"
      console.log(`🎯 DEBUG: Movement pour ${entity.name}: ${entityMovement}`);
      
      plan.addPhase('attack', {
        ...bestAction,
        tacticalScore: bestAction.priorityScore || 50
      })
      
      console.log(`✅ DEBUG: Plan attaque sur place créé`);
      return plan
      
    } catch (error) {
      console.error(`❌ DEBUG: Erreur dans evaluateAttackInPlace:`, error);
      return null;
    }
  }

  /**
   * Évalue plan : Bouger puis attaquer  
   */
  static evaluateMoveThenAttack(entity, gameState) {
    console.log(`🎯 DEBUG: evaluateMoveThenAttack pour ${entity.name}`);
    
    const currentPos = this.getCurrentPosition(entity, gameState)
    console.log(`🎯 DEBUG: Position actuelle pour mouvement:`, currentPos);
    
    if (!currentPos) {
      console.log(`❌ DEBUG: Pas de position pour evaluateMoveThenAttack`);
      return null;
    }
    
    const movement = entity.movement || entity.speed || 6
    
    // Rechercher meilleures positions dans la portée de mouvement
    const bestPosition = this.findBestTacticalPosition(entity, currentPos, movement, gameState)
    if (!bestPosition) return null
    
    const bestAction = this.getBestActionAtPosition(entity, bestPosition.position, gameState)
    if (!bestAction) return null
    
    const plan = new TurnPlan()
    plan.totalMovement = movement
    plan.reasoning = "Repositionnement tactique puis attaque"
    
    // Phase mouvement
    plan.addPhase('move', {
      from: currentPos,
      to: bestPosition.position,
      distance: bestPosition.distance,
      reason: bestPosition.reason,
      tacticalScore: bestPosition.score * 0.3 // 30% du score pour mouvement
    })
    
    // Phase attaque
    plan.addPhase('attack', {
      ...bestAction,
      tacticalScore: bestAction.priorityScore || 50
    })
    
    return plan
  }

  /**
   * Évalue plan : Attaquer puis bouger (hit-and-run)
   */
  static evaluateAttackThenMove(entity, gameState) {
    const currentPos = this.getCurrentPosition(entity, gameState)
    const movement = entity.movement || 6
    
    // Vérifier si on peut attaquer depuis position actuelle
    const bestAction = this.getBestActionAtPosition(entity, currentPos, gameState)
    if (!bestAction) return null
    
    // Chercher position de repli
    const escapePosition = this.findBestEscapePosition(entity, currentPos, movement, gameState)
    if (!escapePosition) return null
    
    const plan = new TurnPlan()
    plan.totalMovement = movement
    plan.reasoning = "Hit-and-run : Attaque puis repli"
    
    // Phase attaque
    plan.addPhase('attack', {
      ...bestAction,
      tacticalScore: bestAction.priorityScore || 50
    })
    
    // Phase mouvement
    plan.addPhase('move', {
      from: currentPos,
      to: escapePosition.position,
      distance: escapePosition.distance,
      reason: "repli_tactique",
      tacticalScore: escapePosition.score * 0.4 // 40% pour mouvement d'évasion
    })
    
    return plan
  }

  // === MÉTHODES UTILITAIRES TACTIQUES ===

  /**
   * Trouve la meilleure position tactique accessible
   */
  static findBestTacticalPosition(entity, currentPos, movement, gameState) {
    const candidates = []
    
    // CONSTANTES PLATEAU - TODO: Récupérer depuis gameState
    const PLATEAU_WIDTH = 8
    const PLATEAU_HEIGHT = 6
    
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
        if (x < 0 || x >= PLATEAU_WIDTH || y < 0 || y >= PLATEAU_HEIGHT) {
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
          const score = this.evaluatePosition(entity, position, gameState)
          candidates.push({ position, score, distance, reason: "position_tactique" })
        }
      }
    }
    
    console.log(`🗺️ DEBUG: ${candidates.length} positions libres trouvées pour ${entity.name}`);
    return candidates.sort((a, b) => b.score - a.score)[0] || null
  }

  /**
   * Trouve la meilleure position d'évasion
   */
  static findBestEscapePosition(entity, currentPos, movement, gameState) {
    const targets = this.findTargets(entity, gameState)
    const escapePositions = []
    
    // CONSTANTES PLATEAU - TODO: Récupérer depuis gameState  
    const PLATEAU_WIDTH = 8
    const PLATEAU_HEIGHT = 6
    
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
        if (x < 0 || x >= PLATEAU_WIDTH || y < 0 || y >= PLATEAU_HEIGHT) {
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
            const targetPos = this.getCurrentPosition(target, gameState)
            
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
          
          const score = minEnemyDistance * 10 + this.evaluatePosition(entity, position, gameState)
          escapePositions.push({ position, score, distance })
        }
      }
    }
    
    return escapePositions.sort((a, b) => b.score - a.score)[0] || null
  }

  /**
   * Obtient la meilleure action disponible depuis une position
   */
  static getBestActionAtPosition(entity, position, gameState) {
    console.log(`🎯 DEBUG: getBestActionAtPosition pour ${entity.name} à position`, position);
    
    // Simuler entity à cette position pour calculer actions
    const tempEntity = { ...entity }
    const tempGameState = { ...gameState }
    tempGameState.combatPositions = { ...gameState.combatPositions }
    tempGameState.combatPositions[entity.id || entity.name] = position
    
    // Utiliser la méthode correcte qui existe : getActionableOpportunities
    try {
      const actions = this.getActionableOpportunities(tempEntity, tempGameState)
      console.log(`🎯 DEBUG: Actions trouvées:`, actions);
      return actions.length > 0 ? actions[0] : null
    } catch (error) {
      console.log(`⚠️ DEBUG: getActionableOpportunities failed, using fallback`);
      // Fallback : utiliser getBestAction qui existe
      return this.getBestAction(tempEntity, tempGameState);
    }
  }

  /**
   * Évalue plan : Double mouvement (charge ou repli total)
   */
  static evaluateDoubleMovement(entity, gameState) {
    const currentPos = this.getCurrentPosition(entity, gameState)
    const movement = entity.movement || 6
    
    // Double mouvement = Action Dash
    const totalMovement = movement * 2
    
    if (entity.role === 'brute' || entity.role === 'skirmisher') {
      // Brute : Charge vers ennemi
      // Skirmisher : Repli complet
      const bestPosition = this.findBestTacticalPosition(entity, currentPos, totalMovement, gameState)
      if (!bestPosition) return null
      
      const plan = new TurnPlan()
      plan.totalMovement = totalMovement
      plan.reasoning = entity.role === 'brute' ? "Charge agressive" : "Repli tactique"
      
      plan.addPhase('dash', {
        description: "Action Dash pour double mouvement",
        tacticalScore: 30
      })
      
      plan.addPhase('move', {
        from: currentPos,
        to: bestPosition.position,
        distance: bestPosition.distance,
        reason: bestPosition.reason,
        tacticalScore: bestPosition.score * 0.5
      })
      
      return plan
    }
    
    return null
  }

  /**
   * Compte les ennemis menaçants à une position donnée
   */
  static countThreateningEnemiesAtPosition(entity, position, gameState) {
    const targets = this.findTargets(entity, gameState)
    let count = 0
    
    targets.forEach(target => {
      const targetPos = this.getCurrentPosition(target, gameState)
      
      // SÉCURITÉ : Vérifier que la position existe
      if (!targetPos || !position) {
        return // Ignorer cette cible si position invalide
      }
      
      const distance = this.getDistance(position, targetPos)
      // Considérer comme menaçant si dans portée d'attaque
      if (distance <= (target.attacks?.[0]?.range || 1)) {
        count++
      }
    })
    
    return count
  }

  /**
   * Méthodes d'évaluation par rôle (stubs pour l'instant)
   */
  static evaluateTankPosition(entity, position, gameState) {
    // Tank préfère être entre alliés et ennemis
    return 0
  }

  static evaluateHealerPosition(entity, position, gameState) {
    // Healer préfère distance sécurisée avec ligne de vue alliés
    return 0
  }

  static evaluateDPSPosition(entity, position, gameState) {
    // DPS préfère distance sécurisée avec champ de tir
    return 0
  }

  static evaluateSkirmisherPosition(entity, position, gameState) {
    // Skirmisher préfère positions avec routes d'évasion
    return 0
  }

  static evaluateBrutePosition(entity, position, gameState) {
    // Brute préfère proximité des ennemis
    const targets = this.findTargets(entity, gameState)
    let score = 0
    
    targets.forEach(target => {
      const targetPos = this.getCurrentPosition(target, gameState)
      
      // SÉCURITÉ : Vérifier que les positions existent
      if (!targetPos || !position) {
        return // Ignorer cette cible si position invalide
      }
      
      const distance = this.getDistance(position, targetPos)
      score += Math.max(0, 10 - distance) // Plus proche = mieux
    })
    
    return score
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

  /**
   * Utilitaire distance générique
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

  // === NOUVELLES MÉTHODES POUR SORTS OFFENSIFS ===

  /**
   * Obtient les sorts offensifs à distance
   */
  static getOffensiveSpells(entity) {
    if (!entity.spellcasting) return []
    
    // Obtenir sorts préparés et cantrips
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    
    const offensiveSpells = availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) {
          return null
        }
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.damage || // Sorts de dégâts
        spell.name?.toLowerCase().includes('trait') ||
        spell.name?.toLowerCase().includes('projectile') ||
        spell.school === 'Évocation'
      ))
    
    return offensiveSpells
  }

  /**
   * Obtient les sorts de zone d'effet
   */
  static getAoESpells(entity) {
    if (!entity.spellcasting) return []
    
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.areaOfEffect || 
        spell.isAreaEffect ||
        spell.name?.toLowerCase().includes('boule') ||
        spell.name?.toLowerCase().includes('explosion')
      ))
  }

  /**
   * Obtient les sorts de contrôle/affaiblissement
   */
  static getDebuffSpells(entity) {
    if (!entity.spellcasting) return []
    
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.effect === 'restrained' ||
        spell.name?.toLowerCase().includes('toile') ||
        spell.name?.toLowerCase().includes('entrave') ||
        spell.school === 'Enchantement' ||
        spell.school === 'Invocation'
      ))
  }

  /**
   * Trouve les cibles groupées pour sorts AoE
   */
  static findGroupedTargets(entity, gameState) {
    const targets = this.findTargets(entity, gameState)
    if (targets.length < 2) return targets
    
    // Logique simple : retourner toutes les cibles si elles sont proches
    // TODO: Améliorer avec calcul de distance réelle
    return targets
  }

  /**
   * Trouve les cibles fortes à debuff
   */
  static findStrongTargets(entity, gameState) {
    const targets = this.findTargets(entity, gameState)
    
    // Prioriser les cibles avec plus de HP ou CA élevée
    return targets.sort((a, b) => {
      const aStrength = (a.currentHP || a.maxHP || 0) + (a.ac || 0)
      const bStrength = (b.currentHP || b.maxHP || 0) + (b.ac || 0)
      return bStrength - aStrength
    })
  }

  // === MÉTHODES FALLBACK POSITION ===

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
      const playerPos = this.findPlayerPosition(gameState)
      if (playerPos) {
        basePos = {
          x: playerPos.x + Math.floor(Math.random() * 3) - 1, // -1 à +1 du joueur
          y: playerPos.y + Math.floor(Math.random() * 3) - 1
        }
      }
    } else {
      // Ennemis à distance du joueur
      const playerPos = this.findPlayerPosition(gameState)
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
   * Trouve la position du joueur
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Position du joueur
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
   * Obtient les actions possibles sans position (sorts à distance, etc.)
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @param {string} priorityType - Type de priorité
   * @returns {Array} Actions limitées
   */
  static getDistanceLimitedActions(entity, gameState, priorityType) {
    const actions = []

    // Seuls les sorts et actions à distance sont possibles sans position
    if (priorityType === 'ranged_spell' || priorityType === 'ranged_support') {
      const targets = this.findTargets(entity, gameState)
      
      if (priorityType === 'ranged_spell') {
        const spells = this.getOffensiveSpells(entity)
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
        const allies = this.getAllies(entity, gameState)
        const supportSpells = this.getSupportSpells(entity)
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