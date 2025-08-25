import { CombatEngine } from '../combatEngine'
import { SpellServiceUnified } from '../SpellServiceUnified'
import { getModifier } from '../../utils/calculations'
import { TurnPlan } from './TurnPlan'
import { CombatUtils } from './CombatUtils'
import { ActionRepository } from './ActionRepository'
import { TargetSelector } from './TargetSelector'
import { TacticalEvaluator } from './TacticalEvaluator'
import { MovementPlanner } from './MovementPlanner'

/**
 * Planificateur d'actions principal - Orchestrateur de l'IA tactique
 */
class ActionPlanner {

  /**
   * Point d'entrée principal : utilise aiPriority comme base + scoring intelligent
   * @param {Object} entity - L'entité qui planifie
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Meilleure action ou null
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
      score: TacticalEvaluator.calculateHybridScore(action, entity, gameState)
    }))

    // 3. Sort by total score and return best
    scoredActions.sort((a, b) => b.score - a.score)

    const bestAction = scoredActions[0]

    return bestAction.action
  }

  /**
   * Obtient les actions disponibles en respectant l'ordre aiPriority
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Actions classées par priorité
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
   * Obtient des actions spécifiques pour un type de priorité
   * @param {string} priorityType - Type de priorité
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Actions pour ce type de priorité
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
      entityPos = MovementPlanner.generateFallbackPosition(entity, gameState)

      if (entityPos && gameState.combatPositions) {
        // Sauvegarder la position générée pour éviter la régénération
        const fallbackKey = entity.id || entity.name
        gameState.combatPositions[fallbackKey] = entityPos
        console.log(`✅ Position fallback générée pour ${entity.name}:`, entityPos)
      } else {
        // Si même le fallback échoue, utiliser les actions à distance uniquement
        console.warn(`❌ Impossible de générer une position pour ${entity.name}. Actions limitées.`)
        return CombatUtils.getDistanceLimitedActions(entity, gameState, priorityType, {
          TargetSelector, ActionRepository
        })
      }
    }

    switch (priorityType) {
      case 'protect':
        const fragileAlly = TargetSelector.findMostWoundedAlly(entity, gameState)
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
        const allAllies = TargetSelector.getAllies(entity, gameState)
        const woundedAllies = TargetSelector.findWoundedAllies(entity, gameState)

        console.log(`🏥 ${entity.name} évalue heal:`)
        console.log(`  👥 Tous alliés:`, allAllies.map(a => `${a.name} (${a.currentHP}/${a.maxHP})`))
        console.log(`  🩹 Alliés blessés:`, woundedAllies.map(a => `${a.name} (${a.currentHP}/${a.maxHP})`))

        woundedAllies.forEach(ally => {
          // ✅ AMÉLIORATION: Sélection intelligente des sorts selon la cible
          const healingSpells = ActionRepository.getHealingSpells(entity, ally)

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
        const targets = TargetSelector.findTargets(entity, gameState)
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
        const meleeAttacks = ActionRepository.getMeleeAttacks(entity)
        const meleeTargets = TargetSelector.findTargetsInMeleeRange(entity, gameState)

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
        const rangedAttacks = ActionRepository.getRangedAttacks(entity)
        const rangedTargets = TargetSelector.findTargetsInRange(entity, gameState)

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
        const runTargets = TargetSelector.findIsolatedTargets(entity, gameState)
        const quickAttacks = ActionRepository.getQuickAttacks(entity)
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
        const buffSpells = ActionRepository.getBuffSpells(entity)
        const buffTargets = TargetSelector.getAllies(entity, gameState)
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
        const supportSpells = ActionRepository.getSupportSpells(entity)
        const supportTargets = TargetSelector.getAllies(entity, gameState) // CORRECTIF : Cibler les alliés !
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
        const offensiveSpells = ActionRepository.getOffensiveSpells(entity)
        const spellTargets = TargetSelector.findTargets(entity, gameState)

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
        const aoeSpells = ActionRepository.getAoESpells(entity)
        const groupedTargets = TargetSelector.findGroupedTargets(entity, gameState)
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
        const debuffSpells = ActionRepository.getDebuffSpells(entity)
        const strongTargets = TargetSelector.findStrongTargets(entity, gameState)
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
   * Planifie un tour complet : mouvement + action (+ mouvement) - Orchestrateur principal
   * @param {Object} entity - L'entité qui planifie
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan optimal ou null
   */
  static planCompleteTurn(entity, gameState) {
    console.log(`🎯 DEBUG: Début planCompleteTurn pour ${entity.name}`)
    const possiblePlans = []

    try {
      // === PLAN 1: ATTAQUER DEPUIS POSITION ACTUELLE ===
      console.log(`🎯 DEBUG: Évaluation plan 1 - Attaque sur place`)
      const attackInPlace = this.evaluateAttackInPlace(entity, gameState)
      if (attackInPlace) {
        possiblePlans.push(attackInPlace)
        console.log(`✅ DEBUG: Plan 1 ajouté`)
      } else {
        console.log(`❌ DEBUG: Plan 1 rejeté`)
      }

      // === PLAN 2: BOUGER PUIS ATTAQUER ===
      console.log(`🎯 DEBUG: Évaluation plan 2 - Bouger puis attaquer`)
      const moveThenAttack = this.evaluateMoveThenAttack(entity, gameState)
      if (moveThenAttack) {
        possiblePlans.push(moveThenAttack)
        console.log(`✅ DEBUG: Plan 2 ajouté`)
      } else {
        console.log(`❌ DEBUG: Plan 2 rejeté`)
      }

      // === PLAN 3: ATTAQUER PUIS SE REPOSITIONNER ===
      console.log(`🎯 DEBUG: Évaluation plan 3 - Hit-and-run`)
      const attackThenMove = this.evaluateAttackThenMove(entity, gameState)
      if (attackThenMove) {
        possiblePlans.push(attackThenMove)
        console.log(`✅ DEBUG: Plan 3 ajouté`)
      } else {
        console.log(`❌ DEBUG: Plan 3 rejeté`)
      }

      // === PLAN 4: DOUBLE MOUVEMENT (CHARGE/REPLI) ===
      console.log(`🎯 DEBUG: Évaluation plan 4 - Double mouvement`)
      const doubleMovement = this.evaluateDoubleMovement(entity, gameState)
      if (doubleMovement) {
        possiblePlans.push(doubleMovement)
        console.log(`✅ DEBUG: Plan 4 ajouté`)
      } else {
        console.log(`❌ DEBUG: Plan 4 rejeté`)
      }

      console.log(`🎯 DEBUG: ${possiblePlans.length} plans disponibles`)

      // Trier par score et retourner le meilleur
      possiblePlans.forEach((plan, index) => {
        const score = plan.calculateTotalScore()
        console.log(`🎯 DEBUG: Plan ${index + 1} score: ${score}`)
      })

      possiblePlans.sort((a, b) => b.totalScore - a.totalScore)

      const bestPlan = possiblePlans[0]
      if (bestPlan && bestPlan.isValid()) {
        console.log(`🧠 ${entity.name} planifie: ${bestPlan.describe()}`)
        return bestPlan
      }

      console.log(`⚠️ DEBUG: Aucun plan valide trouvé pour ${entity.name}`)
      return null

    } catch (error) {
      console.error(`❌ DEBUG: Erreur dans planCompleteTurn:`, error)
      throw error
    }
  }

  /**
   * Évalue plan : Attaquer depuis position actuelle
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan d'attaque sur place ou null
   */
  static evaluateAttackInPlace(entity, gameState) {
    console.log(`🎯 DEBUG: evaluateAttackInPlace pour ${entity.name}`)

    try {
      let currentPos = CombatUtils.getCurrentPosition(entity, gameState)
      console.log(`🎯 DEBUG: Position actuelle:`, currentPos)

      if (!currentPos) {
        console.log(`⚠️ DEBUG: Pas de position trouvée pour ${entity.name}, génération position de fallback`)
        // Générer position fallback comme dans l'ancien système
        currentPos = MovementPlanner.generateFallbackPosition(entity, gameState)
        if (!currentPos) {
          console.log(`❌ DEBUG: Impossible de générer position fallback pour ${entity.name}`)
          return null
        }
        // Sauvegarder la position générée
        const entityKey = entity.id || entity.name
        gameState.combatPositions[entityKey] = currentPos
        console.log(`✅ DEBUG: Position fallback générée:`, currentPos)
      }

      const bestAction = this.getBestActionAtPosition(entity, currentPos, gameState)
      console.log(`🎯 DEBUG: Meilleure action:`, bestAction)

      if (!bestAction) {
        console.log(`❌ DEBUG: Aucune action disponible depuis position actuelle`)
        return null
      }

      const plan = new TurnPlan()
      // Fix movement undefined pour ennemis
      const entityMovement = entity.movement || entity.speed || 6
      plan.totalMovement = entityMovement
      plan.reasoning = "Attaque depuis position actuelle"
      console.log(`🎯 DEBUG: Movement pour ${entity.name}: ${entityMovement}`)

      plan.addPhase('attack', {
        ...bestAction,
        tacticalScore: bestAction.priorityScore || 50
      })

      console.log(`✅ DEBUG: Plan attaque sur place créé`)
      return plan

    } catch (error) {
      console.error(`❌ DEBUG: Erreur dans evaluateAttackInPlace:`, error)
      return null
    }
  }

  /**
   * Évalue plan : Bouger puis attaquer
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan mouvement + attaque ou null
   */
  static evaluateMoveThenAttack(entity, gameState) {
    console.log(`🎯 DEBUG: evaluateMoveThenAttack pour ${entity.name}`)

    const currentPos = CombatUtils.getCurrentPosition(entity, gameState)
    console.log(`🎯 DEBUG: Position actuelle pour mouvement:`, currentPos)

    if (!currentPos) {
      console.log(`❌ DEBUG: Pas de position pour evaluateMoveThenAttack`)
      return null
    }

    const movement = entity.movement || entity.speed || 6

    // Rechercher meilleures positions dans la portée de mouvement
    const bestPosition = MovementPlanner.findBestTacticalPosition(entity, currentPos, movement, gameState, {
      TacticalEvaluator
    })
    if (!bestPosition) {
      console.log(`❌ DEBUG: Aucune position tactique trouvée pour mouvement`)
      return null
    }

    const bestAction = this.getBestActionAtPosition(entity, bestPosition.position, gameState)
    if (!bestAction) {
      console.log(`❌ DEBUG: Aucune action possible depuis la meilleure position trouvée`)
      return null
    }

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
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan attaque + mouvement ou null
   */
  static evaluateAttackThenMove(entity, gameState) {
    const currentPos = CombatUtils.getCurrentPosition(entity, gameState)
    const movement = entity.movement || 6

    // Vérifier si on peut attaquer depuis position actuelle
    const bestAction = this.getBestActionAtPosition(entity, currentPos, gameState)
    if (!bestAction) return null

    // Chercher position de repli
    const escapePosition = MovementPlanner.findBestEscapePosition(entity, currentPos, movement, gameState, {
      TacticalEvaluator, TargetSelector
    })
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

  /**
   * Évalue plan : Double mouvement (charge ou repli total)
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {TurnPlan|null} Plan double mouvement ou null
   */
  static evaluateDoubleMovement(entity, gameState) {
    const currentPos = CombatUtils.getCurrentPosition(entity, gameState)
    const movement = entity.movement || 6

    // Double mouvement = Action Dash
    const totalMovement = movement * 2

    if (entity.role === 'brute' || entity.role === 'skirmisher') {
      // Brute : Charge vers ennemi
      // Skirmisher : Repli complet
      const bestPosition = MovementPlanner.findBestTacticalPosition(entity, currentPos, totalMovement, gameState, {
        TacticalEvaluator
      })
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
   * Obtient la meilleure action disponible depuis une position
   * @param {Object} entity - L'entité
   * @param {Object} position - Position {x, y}
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Meilleure action ou null
   */
  static getBestActionAtPosition(entity, position, gameState) {
    console.log(`🎯 DEBUG: getBestActionAtPosition pour ${entity.name} à position`, position)

    // Simuler entity à cette position pour calculer actions
    const tempEntity = { ...entity }
    const tempGameState = { ...gameState }
    tempGameState.combatPositions = { ...gameState.combatPositions }
    tempGameState.combatPositions[entity.id || entity.name] = position

    // Utiliser getBestAction qui existe
    return this.getBestAction(tempEntity, tempGameState)
  }

  /**
   * Actions de fallback quand aiPriority échoue
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Actions de fallback
   */
  static getFallbackActions(entity, gameState) {
    const actions = []

    const targets = TargetSelector.findTargets(entity, gameState)

    // 1. ATTAQUES AVEC ARMES (système existant)
    if (entity.attacks && entity.attacks.length > 0) {
      entity.attacks.forEach(attack => {
        targets.forEach(target => {
          // VÉRIFIER LA PORTÉE avant de créer l'action
          const distance = CombatUtils.getDistanceToTarget({ target }, entity, gameState)
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
      const distance = CombatUtils.getDistanceToTarget({ target }, entity, gameState)
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

  /**
   * Action de fallback simple
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} Action de fallback ou null
   */
  static fallbackAction(entity, gameState) {
    const fallbackActions = this.getFallbackActions(entity, gameState)
    return fallbackActions.length > 0 ? fallbackActions[0] : null
  }
}

export { ActionPlanner }