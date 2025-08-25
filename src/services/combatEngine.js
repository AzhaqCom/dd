/**
 * Combat Engine - Pure calculations and game rules
 * Contains only pure functions without side effects or state management
 * All orchestration logic is handled by CombatService
 */


import { rollDice, rollD20WithModifier, calculateDistance, getModifier, rollDie } from '../utils/calculations'
import { isValidGridPosition } from '../utils/validation'
import { GRID_WIDTH, GRID_HEIGHT, ENTITY_TYPES } from '../utils/constants'

export class CombatEngine {
  /**
   * Rolls a standard d20
   * @returns {number} Result between 1-20
   */
  static rollD20() {
    return Math.floor(Math.random() * 20) + 1
  }

  /**
   * Rolls damage dice from a string format
   * @param {string} damageString - Format: "1d8+2" or "2d6"
   * @returns {number} Total damage rolled
   */
  static rollDamage(damageString) {
    const match = damageString.match(/(\d+)d(\d+)(\+(\d+))?/)
    if (!match) return 0
    
    const [, numDice, dieSize, , bonus] = match
    let total = 0
    
    for (let i = 0; i < parseInt(numDice); i++) {
      total += Math.floor(Math.random() * parseInt(dieSize)) + 1
    }
    
    return total + (parseInt(bonus) || 0)
  }

  /**
   * Calculates attack bonus for a character and weapon
   * @param {Object} character - The attacking character
   * @param {Object} weapon - The weapon being used
   * @returns {number} Total attack bonus
   */
  static calculateAttackBonus(character, weapon) {
    // For enemies, use predefined attack bonus if available
    if (weapon.attackBonus !== undefined) {
      return weapon.attackBonus
    }
    
    // For player characters, calculate bonus
    const proficiencyBonus = character.level ? Math.ceil(character.level / 4) + 1 : 2
    
    if (!character.stats) {
      console.error('❌ Character.stats missing in calculateAttackBonus:', character)
      return 0
    }
    
    // Use weapon's stat, or default to STR for melee, DEX for ranged
    let stat = 'force'
    if (weapon.stat) {
      stat = weapon.stat
    } else if (weapon.category === 'ranged' || weapon.type === 'ranged' || (weapon.range && weapon.range > 1)) {
      stat = 'dexterite'
    }
    
    const statValue = character.stats[stat]
    if (statValue === undefined) {
      console.error(`❌ Stat ${stat} missing for character:`, character)
      return proficiencyBonus
    }
    
    const abilityMod = getModifier(statValue)
    return abilityMod + proficiencyBonus
  }

  /**
   * Calculates spell attack bonus
   * @param {Object} caster - The spellcaster
   * @returns {number} Spell attack bonus
   */
  static calculateSpellAttackBonus(caster) {
    const proficiencyBonus = caster.level ? Math.ceil(caster.level / 4) + 1 : 2
    
    if (!caster.spellcasting || !caster.spellcasting.ability) {
      return proficiencyBonus
    }
    
    const spellcastingAbility = caster.spellcasting.ability
    const abilityScore = caster.stats[spellcastingAbility]
    const abilityMod = getModifier(abilityScore || 10)
    
    return abilityMod + proficiencyBonus
  }

  /**
   * Calculates saving throw bonus
   * @param {Object} creature - The creature making the save
   * @param {string} saveType - Type of save (constitution, dexterite, etc.)
   * @returns {number} Save bonus
   */
  static calculateSaveBonus(creature, saveType) {
    if (!creature.stats) return 0
    
    const abilityMod = getModifier(creature.stats[saveType] || 10)
    const proficiencyBonus = creature.level ? Math.ceil(creature.level / 4) + 1 : 0
    const specialSaveBonus = creature.saveBonus?.[saveType] || 0
    
    return abilityMod + proficiencyBonus + specialSaveBonus
  }

  /**
   * Checks if a character is defeated (HP <= 0)
   * @param {Object} character - Character to check
   * @returns {boolean} True if defeated
   */
  static isDefeated(character) {
    return character.currentHP <= 0
  }

  /**
   * Checks if an attack hits based on attack roll vs AC
   * @param {number} attackRoll - The attack roll result
   * @param {number} targetAC - The target's Armor Class
   * @returns {boolean} Whether the attack hits
   */
  static doesAttackHit(attackRoll, targetAC) {
    return attackRoll >= targetAC
  }

  /**
   * Calculates initiative bonus for a character
   * @param {Object} character - Character with stats
   * @returns {number} Initiative bonus (Dex modifier)
   */
  static getInitiativeBonus(character) {
    return getModifier(character.stats?.dexterite || 10)
  }

  /**
   * Validates if a position is occupied by any character
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} positions - All character positions
   * @param {Array} entities - Array of entities (enemies, companions)
   * @param {string} excludeEntity - Entity name to exclude from check
   * @returns {boolean} True if position is occupied
   */
  static isPositionOccupied(x, y, positions, entities = [], excludeEntity = null) {
    // Check fixed positions (player)
    if (positions.player && positions.player.x === x && positions.player.y === y) {
      return true
    }

    // Check all companion positions (système multi-compagnons)
    for (const posKey in positions) {
      if (posKey !== 'player' && posKey !== excludeEntity && !posKey.endsWith('StartPos')) {
        const pos = positions[posKey]
        if (pos && pos.x === x && pos.y === y) {
          return true
        }
      }
    }

    // Check entities (only living ones block movement)
    for (const entity of entities) {
      if (entity.name !== excludeEntity && entity.currentHP > 0) {
        const entityPos = positions[entity.name]
        if (entityPos && entityPos.x === x && entityPos.y === y) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Validates if a target is in range of an action
   * @param {Object} attackerPos - Attacker position
   * @param {Object} targetPos - Target position
   * @param {Object} action - The action being performed
   * @returns {boolean} True if target is in range
   */
  static isTargetInRange(attackerPos, targetPos, action) {
    if (!attackerPos || !targetPos) return false
    
    const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y)
    const maxRange = this.getActionRange(action)
    
    return distance <= maxRange
  }

  /**
   * Gets the range of an action in grid squares
   * @param {Object} action - The action
   * @returns {number} Range in grid squares
   */
  static getActionRange(action) {
    if (action.actionType === 'spell') {
      if (typeof action.range === 'string') {
        if (action.range.includes('mètres')) {
          const meters = parseInt(action.range)
          return Math.floor(meters / 1.5) // 1.5m = 1 square
        }
        if (action.range === 'Toucher') return 1
        return 12 // Default ranged
      }
      return action.range || 12
    }

    if (action.actionType === 'weapon') {
      if (action.category === 'melee') {
        return action.range?.melee || 1
      } else if (action.category === 'ranged') {
        const rangeStr = action.range?.ranged || '80/320'
        const shortRange = parseInt(rangeStr.split('/')[0])
        return Math.floor(shortRange / 5) // Convert feet to squares
      }
      return 1
    }

    return 1
  }

  /**
   * Utility dice rolls
   */
  static rollD6() { return Math.floor(Math.random() * 6) + 1 }
  static rollD8() { return Math.floor(Math.random() * 8) + 1 }
  static rollD10() { return Math.floor(Math.random() * 10) + 1 }

  /**
   * Processes an opportunity attack
   * @param {Object} attacker - The entity making the opportunity attack
   * @param {Object} target - The target of the opportunity attack
   * @param {Object} attack - The attack being used (usually melee)
   * @returns {Object} Attack result with damage and hit status
   */
  static processOpportunityAttack(attacker, target, attack, playerCharacter = null) {
    // Calculer le bonus d'attaque
    const attackBonus = this.calculateAttackBonus(attacker, attack)
    
    // Jet d'attaque
    const attackRoll = this.rollD20() + attackBonus
    const targetAC = target.ac || 10
    
    const hit = this.doesAttackHit(attackRoll, targetAC)
    
    // Récupérer le nom correct de la cible
    let targetName = target.name || target.id
    if ((target.id === 'player' || target.type === 'player' || target.name === 'Joueur') && playerCharacter?.name) {
      targetName = playerCharacter.name
    }
    
    let result = {
      attacker: attacker.name,
      target: targetName,
      attackRoll,
      targetAC,
      hit,
      damage: 0,
      message: ""
    }
    
    if (hit) {
      const damageResult = this.calculateDamage(attack)
      result.damage = damageResult.damage
      result.message = `${attacker.name} profite d'une ouverture et frappe ${targetName} ! (${attackRoll} vs CA ${targetAC}) → ${damageResult.message}`
    } else {
      result.message = `${attacker.name} tente une attaque d'opportunité sur ${targetName} mais rate sa cible (${attackRoll} vs CA ${targetAC})`
    }
    
    return result
  }
  /**
   * Calculates damage from an attack
   * @param {Object} attack - Attack object with damage dice and bonuses
   * @returns {Object} Object containing damage amount and message
   */
  static calculateDamage(attack) {
    let totalDamage = rollDice(attack.damageDice) + (attack.damageBonus || 0)
    let message = `${totalDamage} dégâts ${attack.damageType}`

    if (attack.secondaryDamageDice) {
      const secondaryDamage = rollDice(attack.secondaryDamageDice) + (attack.secondaryDamageBonus || 0)
      totalDamage += secondaryDamage
      message += ` + ${secondaryDamage} dégâts ${attack.secondaryDamageType} (${totalDamage}dmg)`
    }

    return { damage: totalDamage, message }
  }

  /**
   * Gets valid targets within range for an attack
   * @param {Object} attacker - The attacking entity
   * @param {Object} attackerPos - Attacker's position
   * @param {Object} action - Action being performed
   * @param {Object} combatState - Current combat state
   * @returns {Array} Array of valid targets
   */
  static getTargetsInRange(attacker, attackerPos, action, combatState) {
    const { playerCharacter, activeCompanions = [], combatEnemies, combatPositions } = combatState
    const targets = []

    if (!attackerPos) return targets

    const maxRange = this.getActionRange(action)

    // Check player as target (if attacker is enemy)
    if (attacker.type === ENTITY_TYPES.ENEMY && playerCharacter?.currentHP > 0 && combatPositions.player) {
      const distance = calculateDistance(attackerPos, combatPositions.player)
      if (distance <= maxRange) {
        targets.push({
          ...playerCharacter,
          type: ENTITY_TYPES.PLAYER,
          position: combatPositions.player
        })
      }
    }

    // Check active companions as targets (if attacker is enemy)
    if (attacker.type === ENTITY_TYPES.ENEMY && activeCompanions.length > 0) {
      activeCompanions.forEach(companion => {
        if (companion?.currentHP > 0) {
          const companionPos = combatPositions[companion.id]
          if (companionPos) {
            const distance = calculateDistance(attackerPos, companionPos)
            if (distance <= maxRange) {
              targets.push({
                ...companion,
                type: ENTITY_TYPES.COMPANION,
                position: companionPos
              })
            }
          }
        }
      })
    }

    // Check enemies as targets (if attacker is player/companion)
    if ([ENTITY_TYPES.PLAYER, ENTITY_TYPES.COMPANION].includes(attacker.type)) {
      combatEnemies.forEach(enemy => {
        if (enemy.currentHP > 0) {
          const enemyPos = combatPositions[enemy.name]
          if (enemyPos) {
            const distance = calculateDistance(attackerPos, enemyPos)
            if (distance <= maxRange) {
              targets.push({
                ...enemy,
                type: ENTITY_TYPES.ENEMY,
                position: enemyPos
              })
            }
          }
        }
      })
    }

    return targets
  }

  /**
   * Calculates the best movement position for an entity
   * @param {Object} entity - The entity to move
   * @param {Object} currentPos - Current position
   * @param {Object} combatState - Combat state
   * @returns {Object|null} New position or null if no movement needed
   */
  static calculateOptimalMovement(entity, currentPos, combatState) {
    if (!currentPos || entity.currentHP <= 0) return null

    const targets = this.findPotentialTargets(entity, combatState)
    if (targets.length === 0) return null

    // Find closest target
    const closestTarget = targets.reduce((closest, target) => {
      const distance = calculateDistance(currentPos, target.position)
      return !closest || distance < closest.distance 
        ? { target, distance }
        : closest
    }, null)

    if (!closestTarget) return null

    const idealDistance = this.getIdealDistance(entity)

    // Nouveau : Pour les compagnons à distance, vérifier s'ils sont en corps à corps
    const isRangedRole = entity.role === 'caster' || entity.role === 'dps' || entity.role === 'support' || entity.role === 'healer'
    const isAdjacentToEnemy = this.isAdjacentToAnyEnemy(entity, currentPos, combatState)
    
    // Si compagnon à distance est adjacent à un ennemi, priorité = s'éloigner prudemment
    if (isRangedRole && isAdjacentToEnemy && idealDistance > 1) {
      return this.findSafeRetreatPosition(entity, currentPos, combatState, idealDistance)
    }

    // If already at ideal distance or closer, don't move
    if (closestTarget.distance <= idealDistance) return null

    // Find best position within movement range
    const maxMovement = entity.movement || 6
    let bestPosition = null
    let bestScore = -1

    for (let dx = -maxMovement; dx <= maxMovement; dx++) {
      for (let dy = -maxMovement; dy <= maxMovement; dy++) {
        const manhattanDistance = Math.abs(dx) + Math.abs(dy)
        if (manhattanDistance === 0 || manhattanDistance > maxMovement) continue

        const newPos = { x: currentPos.x + dx, y: currentPos.y + dy }

        if (!isValidGridPosition(newPos.x, newPos.y)) continue
        if (this.isPositionOccupied(newPos.x, newPos.y, combatState.combatPositions, combatState.combatEnemies, entity.name)) continue

        const distanceToTarget = calculateDistance(newPos, closestTarget.target.position)
        const distanceFromIdeal = Math.abs(distanceToTarget - idealDistance)
        const score = 100 - distanceFromIdeal - manhattanDistance * 0.1

        if (score > bestScore) {
          bestScore = score
          bestPosition = newPos
        }
      }
    }

    return bestPosition
  }

  /**
   * Finds potential targets for an entity
   * @param {Object} entity - The entity
   * @param {Object} combatState - Combat state
   * @returns {Array} Array of potential targets with positions
   */
  static findPotentialTargets(entity, combatState) {
    const { playerCharacter, combatEnemies, combatPositions, activeCompanions = [] } = combatState
    const targets = []

    if (entity.type === ENTITY_TYPES.ENEMY) {
      // Enemies target player and companions
      if (playerCharacter?.currentHP > 0 && combatPositions.player) {
        targets.push({ entity: playerCharacter, position: combatPositions.player })
      }
      
      // Ajouter tous les compagnons actifs (nouveau système)
      if (activeCompanions && activeCompanions.length > 0) {
        activeCompanions.forEach(companion => {
          if (companion && companion.currentHP > 0) {
            const companionId = companion.id || companion.name.toLowerCase()
            const companionPos = combatPositions[companionId]
            if (companionPos) {
              targets.push({ entity: companion, position: companionPos })
            }
          }
        })
      }
      
    } else {
      // Player/Companion target enemies
      combatEnemies.forEach(enemy => {
        if (enemy.currentHP > 0 && combatPositions[enemy.name]) {
          targets.push({ entity: enemy, position: combatPositions[enemy.name] })
        }
      })
    }

    return targets
  }

  /**
   * Determines ideal attack distance for an entity
   * @param {Object} entity - The entity
   * @returns {number} Ideal distance in grid squares
   */
  static getIdealDistance(entity) {
    if (!entity.attacks) return 1

    // Nouveau : Prioriser selon le rôle du compagnon
    if (entity.role) {
      switch (entity.role) {
        case 'tank':
          return 1 // Tanks restent au contact
        
        case 'healer':
        case 'support':
          // Support/healer restent à distance mais pas trop loin pour soigner
          return 3
        
        case 'dps':
          // DPS privilégient la distance s'ils ont des attaques à distance
          const hasRangedAttack = entity.attacks.some(attack => 
            attack.type === 'ranged' || (attack.range && attack.range > 1)
          )
          if (hasRangedAttack) {
            const rangedAttack = entity.attacks.find(attack => attack.type === 'ranged')
            return Math.min(5, rangedAttack?.range || 4) // Distance de sécurité
          }
          return 1 // DPS corps à corps
        
        default:
          break
      }
    }

    // Logique pour ennemis ou entités sans rôle
    const hasRangedAttack = entity.attacks.some(attack => 
      attack.type === 'ranged' || (attack.range && attack.range > 1)
    )
    const hasMeleeAttack = entity.attacks.some(attack =>
      attack.type === 'melee' || !attack.range || attack.range <= 1
    )

    if (hasMeleeAttack && !hasRangedAttack) {
      return 1 // Get adjacent for melee
    } else if (hasRangedAttack && !hasMeleeAttack) {
      const rangedAttack = entity.attacks.find(attack => attack.type === 'ranged')
      return Math.min(4, rangedAttack?.range || 4) // Stay at range
    } else {
      return 1 // Mixed, prefer melee range (ennemis par défaut)
    }
  }

  /**
   * Vérifie si une entité est adjacente à un ennemi
   */
  static isAdjacentToAnyEnemy(entity, position, combatState) {
    const enemies = entity.type === 'enemy' 
      ? [combatState.playerCharacter, ...(combatState.activeCompanions || [])]
      : combatState.combatEnemies || []

    return enemies.some(enemy => {
      if (!enemy || enemy.currentHP <= 0) return false
      
      const enemyPos = entity.type === 'enemy' 
        ? (enemy.id ? combatState.combatPositions?.[enemy.id] : combatState.combatPositions?.player)
        : combatState.combatPositions?.[enemy.name]
      
      if (!enemyPos) return false
      
      const distance = calculateDistance(position, enemyPos)
      return distance <= 1
    })
  }

  /**
   * Trouve une position de retraite sûre pour les compagnons à distance
   */
  static findSafeRetreatPosition(entity, currentPos, combatState, idealDistance) {
    const maxMovement = entity.movement || 6
    const enemies = combatState.combatEnemies || []
    let bestPosition = null
    let bestScore = -1

    for (let dx = -maxMovement; dx <= maxMovement; dx++) {
      for (let dy = -maxMovement; dy <= maxMovement; dy++) {
        const manhattanDistance = Math.abs(dx) + Math.abs(dy)
        if (manhattanDistance === 0 || manhattanDistance > maxMovement) continue

        const newPos = { x: currentPos.x + dx, y: currentPos.y + dy }
        
        // Vérifier validité de base
        if (!this.isValidPosition(newPos, combatState)) continue

        // Calculer si cette position déclencherait une attaque d'opportunité
        const wouldTriggerOA = this.wouldTriggerOpportunityAttack(currentPos, newPos, combatState)
        
        // Si la position déclencherait une AO, la pénaliser fortement
        if (wouldTriggerOA) continue

        // Calculer la distance aux ennemis depuis cette nouvelle position
        const nearestEnemyDistance = enemies.reduce((minDist, enemy) => {
          if (!enemy || enemy.currentHP <= 0) return minDist
          const enemyPos = combatState.combatPositions?.[enemy.name]
          if (!enemyPos) return minDist
          
          const dist = calculateDistance(newPos, enemyPos)
          return Math.min(minDist, dist)
        }, Infinity)

        // Score : préférer être proche de la distance idéale, loin des ennemis
        const distanceToIdeal = Math.abs(nearestEnemyDistance - idealDistance)
        const score = nearestEnemyDistance * 10 - distanceToIdeal * 5

        if (score > bestScore) {
          bestScore = score
          bestPosition = newPos
        }
      }
    }

    return bestPosition
  }

  /**
   * Vérifie si un mouvement déclencherait une attaque d'opportunité
   */
  static wouldTriggerOpportunityAttack(fromPos, toPos, combatState) {
    const enemies = combatState.combatEnemies || []
    
    return enemies.some(enemy => {
      if (!enemy || enemy.currentHP <= 0) return false
      const enemyPos = combatState.combatPositions?.[enemy.name]
      if (!enemyPos) return false
      
      const wasAdjacent = calculateDistance(fromPos, enemyPos) <= 1
      const willBeAdjacent = calculateDistance(toPos, enemyPos) <= 1
      
      // Attaque d'opportunité si on était adjacent et qu'on ne l'est plus
      return wasAdjacent && !willBeAdjacent
    })
  }

  /**
   * Calculates Area of Effect squares
   * @param {Object} center - Center position {x, y}
   * @param {Object} aoeType - AoE configuration
   * @returns {Array} Array of affected positions
   */
  static calculateAoESquares(center, aoeType) {
    const squares = []
    
    if (!center || !aoeType) return squares

    switch (aoeType.shape) {
      case 'sphere':
      case 'circle':
        const radius = aoeType.size || 1
        for (let x = center.x - radius; x <= center.x + radius; x++) {
          for (let y = center.y - radius; y <= center.y + radius; y++) {
            if (isValidGridPosition(x, y)) {
              const distance = calculateDistance(center, { x, y })
              if (distance <= radius) {
                squares.push({ x, y })
              }
            }
          }
        }
        break

      case 'cone':
        // Simplified cone - triangle shape
        const coneSize = aoeType.size || 2
        for (let i = 1; i <= coneSize; i++) {
          for (let offset = -i; offset <= i; offset++) {
            const x = center.x + i
            const y = center.y + offset
            if (isValidGridPosition(x, y)) {
              squares.push({ x, y })
            }
          }
        }
        break

      case 'line':
        const lineLength = aoeType.size || 3
        for (let i = 1; i <= lineLength; i++) {
          const x = center.x + i
          const y = center.y
          if (isValidGridPosition(x, y)) {
            squares.push({ x, y })
          }
        }
        break

      default:
        squares.push(center)
    }

    return squares
  }

  /**
   * Finds the best target for an entity based on distance and priorities
   * @param {Object} attacker - The attacking entity
   * @param {Object} attackerPos - Attacker's current position
   * @param {Object} combatState - Current combat state
   * @returns {Object|null} Best target or null
   */
  static findBestTarget(attacker, attackerPos, combatState) {
    const { playerCharacter, combatPositions, activeCompanions = [] } = combatState
    
    if (!attackerPos) {
      console.warn(`⚠️ Pas de position pour ${attacker.name}`)
      return null
    }

    const potentialTargets = []

    // Pour les ennemis : cibler joueur et compagnon
    if (attacker.type === ENTITY_TYPES.ENEMY) {
      // Ajouter le joueur si vivant
      if (playerCharacter && playerCharacter.currentHP > 0 && combatPositions.player) {
        potentialTargets.push({
          type: ENTITY_TYPES.PLAYER,
          name: playerCharacter.name,
          character: playerCharacter,
          position: combatPositions.player
        })
      }

      // Ajouter tous les compagnons actifs (nouveau système multi-compagnons)
      if (activeCompanions && activeCompanions.length > 0) {
        activeCompanions.forEach(companion => {
          if (companion && companion.currentHP > 0) {
            const companionId = companion.id || companion.name.toLowerCase()
            const companionPos = combatPositions[companionId]
            if (companionPos) {
              potentialTargets.push({
                type: ENTITY_TYPES.COMPANION,
                name: companion.name,
                character: companion,
                position: companionPos
              })
            }
          }
        })
      }
      
    }
    
    // Pour le compagnon : cibler les ennemis
    else if (attacker.type === ENTITY_TYPES.COMPANION || attacker.type === 'companion') {
      // Ajouter tous les ennemis vivants
      if (combatState.combatEnemies) {
        combatState.combatEnemies.forEach(enemy => {
          if (enemy.currentHP > 0 && combatPositions[enemy.name]) {
            potentialTargets.push({
              type: ENTITY_TYPES.ENEMY,
              name: enemy.name,
              character: enemy,
              position: combatPositions[enemy.name]
            })
          }
        })
      }
    }

    if (potentialTargets.length === 0) {

      return null
    }

    // Trouver la cible la plus proche (priorité stricte à la distance)
    let bestTarget = null
    let shortestDistance = Infinity
    potentialTargets.forEach(target => {
      const distance = calculateDistance(attackerPos, target.position)
      
      // Prioriser strictement la distance
      if (distance < shortestDistance) {
        shortestDistance = distance
        bestTarget = target
      } else if (distance === shortestDistance && target.type === ENTITY_TYPES.PLAYER) {
        // En cas d'égalité exacte, préférer le joueur
        bestTarget = target

      }
    })

    if (bestTarget) {
      bestTarget.distance = shortestDistance
    }

    return bestTarget
  }

  /**
   * Validates movement to ensure position is valid and not occupied
   * @param {Object} entity - The entity trying to move
   * @param {Object} currentPos - Current position
   * @param {Object} targetPos - Target position
   * @param {Object} combatState - Combat state
   * @returns {boolean} Whether movement is valid
   */
  static validateMovement(entity, currentPos, targetPos, combatState) {
    // Vérifier que la position cible est dans la grille
    if (!isValidGridPosition(targetPos.x, targetPos.y)) {
      console.warn(`❌ Position invalide pour ${entity.name}: (${targetPos.x}, ${targetPos.y})`)
      return false
    }

    // Vérifier que la position n'est pas occupée
    const { combatPositions, combatEnemies } = combatState
    const isOccupied = this.isPositionOccupied(
      targetPos.x, 
      targetPos.y, 
      combatPositions, 
      combatEnemies,
      entity.name // Exclure l'entité elle-même
    )

    if (isOccupied) {
      console.warn(`❌ Position occupée pour ${entity.name}: (${targetPos.x}, ${targetPos.y})`)
      return false
    }

    // Vérifier la portée de mouvement
    const distance = calculateDistance(currentPos, targetPos)
    const maxMovement = entity.movement || 6
    
    if (distance > maxMovement) {
      console.warn(`❌ Mouvement trop loin pour ${entity.name}: ${distance} > ${maxMovement}`)
      return false
    }

    return true
  }

  /**
   * Handles skill check calculations (moved from gameStore)
   * @param {string} skill - The skill being tested
   * @param {number} dc - Difficulty class
   * @param {Object} character - Character making the check
   * @returns {Object} Skill check result with roll, total, success
   */
  static handleSkillCheck(skill, dc, character) {
    const skillToStat = {
      perception: 'sagesse',
      investigation: 'intelligence', 
      athletics: 'force',
      acrobatics: 'dexterite',
      stealth: 'dexterite',
      insight: 'sagesse',
      persuasion: 'charisme',
      intimidation: 'charisme',
      deception: 'charisme',
      history: 'intelligence',
      arcana: 'intelligence',
      nature: 'intelligence',
      religion: 'intelligence',
      medicine: 'sagesse',
      survival: 'sagesse',
      'animal-handling': 'sagesse'
    }

    const statName = skillToStat[skill]
    const statValue = character.stats[statName]
    const statModifier = getModifier(statValue)
    const isProficient = character.proficiencies?.skills?.includes(skill) || false
    const proficiencyBonus = isProficient ? character.proficiencyBonus : 0
    const skillBonus = statModifier + proficiencyBonus
    
    const roll = rollD20WithModifier(skillBonus)
    const success = roll >= dc

    return {
      roll: roll - skillBonus, // Le dé brut
      skillBonus,
      total: roll,
      dc,
      success,
      skill,
      statName,
      message: `Test de ${skill} (${statName}): ${roll - skillBonus} (+${skillBonus} de bonus) = ${roll}. DD: ${dc}`
    }
  }

  /**
   * Résout une attaque complète (jet + dégâts)
   * @param {Object} attacker - L'attaquant
   * @param {Object} target - La cible
   * @param {Object} attackData - Données de l'attaque
   * @returns {Object} Résultat de l'attaque
   */
  static resolveAttack(attacker, target, attackData) {
    // Jet d'attaque
    const attackRoll = this.rollD20();
    const attackBonus = this.calculateAttackBonus(attacker, attackData);
    const totalAttackRoll = attackRoll + attackBonus;
    
    const targetAC = target.ac || 10;
    const criticalHit = attackRoll === 20;
    const success = totalAttackRoll >= targetAC || criticalHit;
    
    let damage = 0;
    let message = "";
    
    if (success) {
      // Calculer les dégâts
      const damageResult = this.calculateDamage(attackData);
      damage = damageResult.damage;
      
      if (criticalHit) {
        damage *= 2; // Double dégâts en critique
        message = `CRITIQUE ! ${attacker.name} utilise ${attackData.name} sur ${target.name} (${totalAttackRoll} vs CA ${targetAC}) → ${damage} dégâts !`;
      } else {
        message = `${attacker.name} utilise ${attackData.name} sur ${target.name} (${totalAttackRoll} vs CA ${targetAC}) → ${damage} dégâts`;
      }
    } else {
      message = `${attacker.name} manque ${target.name} avec ${attackData.name} (${totalAttackRoll} vs CA ${targetAC})`;
    }
    
    return {
      success,
      damage,
      critical: criticalHit,
      message,
      attackRoll,
      totalAttackRoll,
      targetAC
    };
  }

  /**
   * Calculates healing from a hit die during short rest
   * @param {Object} character - Character taking the rest
   * @returns {Object} Healing result with amount and updated character
   */
  static calculateHitDieHealing(character) {
    // Vérifications
    if (character.hitDice <= 0) {
      return { healing: 0, character, canHeal: false, message: "Aucun dé de vie disponible" }
    }
    if (character.currentHP >= character.maxHP) {
      return { healing: 0, character, canHeal: false, message: "PV déjà au maximum" }
    }

    // Calculer la guérison
    const hitDieSize = character.hitDiceType || 8
    const constitutionModifier = getModifier(character.stats.constitution)
    const roll = rollDie(hitDieSize)
    const healing = Math.max(1, roll + constitutionModifier)
    
    // Appliquer la guérison
    const newHP = Math.min(character.maxHP, character.currentHP + healing)
    
    const updatedCharacter = {
      ...character,
      currentHP: newHP,
      hitDice: character.hitDice - 1
    }

    return {
      healing,
      character: updatedCharacter,
      canHeal: true,
      roll,
      constitutionModifier,
      message: `Dé de vie (d${hitDieSize}): ${roll} + ${constitutionModifier} = ${healing} PV récupérés`
    }
  }
}