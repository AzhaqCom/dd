import React, { useEffect, useCallback, useMemo } from 'react'
import { useCombatStore } from '../../../stores/combatStore'
import { useGameStore } from '../../../stores/gameStore'
import { useCharacterStore } from '../../../stores/characterStore'
import { CombatService } from '../../../services/CombatService'
import { CombatEngine } from '../../../services/combatEngine'
import { calculateDistance } from '../../../utils/calculations'
import { getEntityPositionKey, getDnDDistance, formatMovementMessage } from '../../../utils/combatUtils'

/**
 * Gestionnaire automatique des tours de combat - Version refactorisée
 * Architecture claire avec séparation des responsabilités
 */
export const CombatTurnManager = ({
  currentTurn,
  turnOrder,
  phase,
  onPhaseChange,
  onNextTurn
}) => {
  // Store hooks
  const { 
    combatEnemies: enemies, 
    combatPositions: positions, 
    dealDamageToEnemy, 
    updateEnemyPosition,
    setDamageCallbacks,
    setCombatMessageCallback 
  } = useCombatStore()
  
  const { addCombatMessage } = useGameStore()
  const { takeDamagePlayer, takeDamageCompanionById, playerCharacter, getActiveCompanions } = useCharacterStore()
  
  // Note: CombatService is now static, no instance needed

  // Configuration des callbacks de dégâts et messages
  useEffect(() => {
    setDamageCallbacks(takeDamagePlayer, takeDamageCompanionById)
    setCombatMessageCallback(addCombatMessage)
  }, [setDamageCallbacks, takeDamagePlayer, takeDamageCompanionById, setCombatMessageCallback, addCombatMessage])

  /**
   * GESTION DES MOUVEMENTS
   * Calcule et exécute le mouvement optimal pour une entité
   */
  const handleMovement = useCallback((entity, gameState) => {
    // Utiliser l'utilitaire pour obtenir la clé de position
    const positionKey = getEntityPositionKey(entity)
    const currentPos = gameState.combatPositions[positionKey]
    
    if (!currentPos) {
   
      return { moved: false, newPosition: currentPos }
    }

    // Utiliser CombatEngine pour calculer le mouvement optimal
    const optimalPosition = CombatEngine.calculateOptimalMovement(entity, currentPos, gameState)
    
    if (!optimalPosition) {
     
      return { moved: false, newPosition: currentPos }
    }

    // Valider le mouvement avec le service
    const isValidMove = CombatService.executeEntityMovement(
      entity, 
      currentPos, 
      optimalPosition, 
      gameState, 
      addCombatMessage
    )

    if (isValidMove) {
      // Appliquer le mouvement (gérer les différents types)
      updateEnemyPosition(positionKey, optimalPosition)
      
      const distance = getDnDDistance(currentPos, optimalPosition)
      addCombatMessage(formatMovementMessage(entity.name, distance))
      
   
      return { moved: true, newPosition: optimalPosition }
    } else {
    
      return { moved: false, newPosition: currentPos }
    }
  }, [updateEnemyPosition, addCombatMessage])

  /**
   * GESTION DU CIBLAGE
   * Trouve la meilleure cible pour une entité
   */
  const getTarget = useCallback((entity, gameState) => {
    // Utiliser l'utilitaire pour obtenir la clé de position
    const positionKey = getEntityPositionKey(entity)
    const currentPos = gameState.combatPositions[positionKey]
    
    // Utiliser CombatEngine pour trouver la meilleure cible
    const activeCompanions = getActiveCompanions()
    const target = CombatEngine.findBestTarget(entity, currentPos, {
      ...gameState,
      playerCharacter,
      activeCompanions: activeCompanions
    })

    if (!target) {

      addCombatMessage(`${entity.name} ne trouve aucune cible.`)
    }

    return target
  }, [playerCharacter, addCombatMessage, getActiveCompanions])

  /**
   * Applique les dégâts à une cible selon son type
   */
  const applyDamageToTarget = useCallback((target, damage) => {
    if (target.type === 'player') {
      takeDamagePlayer(damage)
    } else if (target.type === 'companion') {
      takeDamageCompanionById(target.character.id, damage)
    } else if (target.type === 'enemy') {
      dealDamageToEnemy(target.name, damage)
      
      // Vérifier si l'ennemi est mort
      setTimeout(() => {
       
        const enemyAfter = enemies.find(e => e.name === target.name)
        if (enemyAfter && enemyAfter.currentHP <= 0) {
          addCombatMessage(`💀 ${target.name} tombe au combat !`, 'enemy-death')
        }
      }, 100)
    }
  }, [takeDamagePlayer, takeDamageCompanionById, dealDamageToEnemy, addCombatMessage, enemies])

  /**
   * Sélectionne le meilleur attackSet selon la distance
   */
  const selectAttackSet = useCallback((attackSets, distance) => {
    // Filtrer les sets qui ont au moins une attaque à portée
    const viableSets = attackSets.filter(set => 
      set.attacks.some(attack => {
        const attackRange = attack.range || 1
        return distance <= attackRange
      })
    )

    if (viableSets.length === 0) return null

    // Prioriser selon la distance et le type d'attaque
    const meleeSets = viableSets.filter(set => 
      set.attacks.some(attack => attack.type === 'melee' && distance <= (attack.range || 1))
    )
    
    const rangedSets = viableSets.filter(set => 
      set.attacks.some(attack => attack.type === 'ranged' && distance <= (attack.range || 6))
    )

    // Si le joueur est proche (distance <= 1), privilégier le mêlée
    if (distance <= 1 && meleeSets.length > 0) {
      return meleeSets[0] // Prendre le premier set de mêlée disponible
    }
    
    // Sinon, privilégier la distance si disponible
    if (rangedSets.length > 0) {
      return rangedSets[0] // Prendre le premier set à distance disponible
    }
    
    // Sinon prendre le premier set viable
    return viableSets[0]
  }, [])

  /**
   * Exécute une attaque simple traditionnelle
   */
  const executeSingleAttack = useCallback((attacker, target, gameState, distance) => {
    // Choisir une attaque appropriée
    const availableAttacks = attacker.attacks || [{
      name: "Attaque de base",
      damageDice: "1d6",
      damageBonus: 0,
      range: 1
    }]

    // Filtrer les attaques viables selon la distance
    const viableAttacks = availableAttacks.filter(attack => {
      const attackRange = attack.range || 1
      return distance <= attackRange
    })

    if (viableAttacks.length === 0) {
      addCombatMessage(`${attacker.name} est trop loin pour attaquer.`)
      return false
    }

    // Choisir une attaque au hasard parmi les viables
    const attack = viableAttacks[Math.floor(Math.random() * viableAttacks.length)]

    // Exécuter l'attaque via le service
    const result = CombatService.executeEntityAttack(attacker, attack, target, addCombatMessage)

    if (result.success) {
      applyDamageToTarget(target, result.damage)
    }

    return result.success
  }, [addCombatMessage, applyDamageToTarget])

  /**
   * Exécute plusieurs attaques d'un attackSet
   */
  const executeMultipleAttacks = useCallback((attacker, target, gameState, distance) => {
    // Sélectionner intelligemment un attackSet selon la distance
    const selectedSet = selectAttackSet(attacker.attackSets, distance)
    
    if (!selectedSet) {
      addCombatMessage(`${attacker.name} ne peut pas attaquer à cette distance.`)
      return false
    }
    addCombatMessage(`${attacker.name} lance ${selectedSet.name}.`)

    let overallSuccess = false
    let attackCount = 0

    // Exécuter toutes les attaques du set sélectionné
    for (const attack of selectedSet.attacks) {
      // Vérifier si la cible est encore vivante avant chaque attaque
      if (target.character.currentHP <= 0) {
        break
      }

      attackCount++
      const result = CombatService.executeEntityAttack(attacker, attack, target, addCombatMessage)

      if (result.success) {
        overallSuccess = true
        applyDamageToTarget(target, result.damage)
        
        // Petit délai entre les attaques multiples pour la lisibilité
        if (attackCount < selectedSet.attacks.length) {
          setTimeout(() => {}, 200)
        }
      }
    }

    return overallSuccess
  }, [addCombatMessage, selectAttackSet, applyDamageToTarget])

  /**
   * GESTION DES ATTAQUES
   * Exécute une ou plusieurs attaques et applique les dégâts
   */
  const executeAttack = useCallback((attacker, target, gameState) => {
    if (!target || !target.character) {
      return false
    }

    // Vérifier que la cible est toujours vivante
    if (target.character.currentHP <= 0) {
      addCombatMessage(`${attacker.name} réalise que ${target.name} est déjà tombé au combat.`)
      return false
    }

    // Calculer la distance à la cible (gérer les différents types)
    const attackerPosKey = attacker.type === 'companion' ? (attacker.id || 'companion') : attacker.name
    const attackerPos = gameState.combatPositions[attackerPosKey]
    const distance = calculateDistance(attackerPos, target.position)

    // Gérer les attaques multiples (attackSets) ou simples (attacks)
    if (attacker.attackSets && attacker.attackSets.length > 0) {
      return executeMultipleAttacks(attacker, target, gameState, distance)
    } else {
      return executeSingleAttack(attacker, target, gameState, distance)
    }
  }, [executeMultipleAttacks, executeSingleAttack, addCombatMessage])

  /**
   * EXECUTION DU TOUR D'ENNEMI
   * NOUVEAU: Utilise le système unifié avec EntityAI_Hybrid
   */
  const handleEnemyTurn = useCallback((enemy) => {
    console.log(`🔴 SimpleTurn: ${enemy.name}`)
    
    // Vérifier que l'ennemi est vivant
    const enemyCharacter = enemies.find(e => e.name === enemy.name)
    if (!enemyCharacter || enemyCharacter.currentHP <= 0) {
      setTimeout(() => {
        setIsExecuting(false)
        onNextTurn()
      }, 200)
      return
    }
    
    // NOUVEAU SYSTÈME SIMPLE
    const activeCompanions = getActiveCompanions()
    const gameState = {
      playerCharacter,
      activeCompanions,
      combatEnemies: enemies,
      combatPositions: positions
    }
    
    const { executeUnifiedEntityTurn } = useCombatStore.getState()
    
    // Le système unifié gère tout : IA sophistiquée + exécution robuste + nextTurn
    executeUnifiedEntityTurn(enemyCharacter, gameState, () => {
      setIsExecuting(false)
      onNextTurn()
    })

  }, [enemies, getActiveCompanions, playerCharacter, onNextTurn, positions])

  /**
   * EXECUTION DU TOUR DE COMPAGNON  
   * NOUVEAU: Utilise le système unifié avec EntityAI_Hybrid
   */
  const handleCompanionTurn = useCallback((companionTurn) => {
    console.log(`🟢 SimpleTurn: ${companionTurn.name}`)
    
    const activeCompanions = getActiveCompanions()
    
    // Récupérer le bon personnage compagnon
    const actualCompanion = companionTurn.character || activeCompanions.find(c => c.id === companionTurn.id || c.name === companionTurn.name)
    
    if (!actualCompanion || actualCompanion.currentHP <= 0) {
      addCombatMessage(`${companionTurn.name} est trop blessé pour agir.`)
      setTimeout(() => {
        setIsExecuting(false)
        onNextTurn()
      }, 500)
      return
    }
    
    // NOUVEAU SYSTÈME SIMPLE
    const gameState = {
      playerCharacter,
      activeCompanions,
      combatEnemies: enemies,
      combatPositions: positions
    }
    
    const { executeUnifiedEntityTurn } = useCombatStore.getState()
    
    // Le système unifié gère tout : IA sophistiquée + exécution robuste + nextTurn
    executeUnifiedEntityTurn(actualCompanion, gameState, () => {
      setIsExecuting(false)
      onNextTurn()
    })

  }, [getActiveCompanions, playerCharacter, onNextTurn, addCombatMessage, enemies, positions])

  // Protection contre les re-exécutions multiples
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [lastExecutedTurn, setLastExecutedTurn] = React.useState(null)

  /**
   * GESTIONNAIRE PRINCIPAL DES TOURS
   * Détermine quel type de tour exécuter
   */
  useEffect(() => {
    
    if (phase !== 'executing-turn' || !currentTurn || isExecuting) return

    // Éviter les re-exécutions du même tour exact
    // Utiliser le turnCounter et currentTurnIndex pour créer un identifiant unique de tour
    const { turnCounter, currentTurnIndex } = useCombatStore.getState()
    const currentTurnKey = `${currentTurn.name}-${currentTurn.type}-${turnCounter}-${currentTurnIndex}`
    
    if (lastExecutedTurn === currentTurnKey) {
      // Protection silencieuse - normal en mode dev React
      return
    }


    setIsExecuting(true)
    setLastExecutedTurn(currentTurnKey)

    // VÉRIFICATION GLOBALE de fin de combat avant d'exécuter le tour
    const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
    const playerDead = !playerCharacter || playerCharacter.currentHP <= 0
    
    if (allEnemiesDead) {
      setIsExecuting(false)
      onPhaseChange('victory')
      return
    } else if (playerDead) {
      setIsExecuting(false)
      onPhaseChange('defeat')
      return
    }

    // VÉRIFICATION PRIORITAIRE: Skip les entités mortes
    const isEntityDead = () => {
      if (currentTurn.type === 'player') {
        const isDead = !playerCharacter || playerCharacter.currentHP <= 0
        return isDead
      } else if (currentTurn.type === 'companion') {
        // Nouveau système : vérifier dans activeCompanions
        const activeCompanions = getActiveCompanions()
        const companion = activeCompanions.find(c => 
          (c.id && c.id === currentTurn.id) || 
          (c.name && c.name === currentTurn.name)
        )
        
        const isDead = !companion || companion.currentHP <= 0
        return isDead
      } else if (currentTurn.type === 'enemy') {
        const enemy = enemies.find(e => e.name === currentTurn.name)
        const isDead = !enemy || enemy.currentHP <= 0
        return isDead
      }
      return false
    }

    if (isEntityDead()) {
      setIsExecuting(false)
      
      // Vérifier les conditions de fin de combat avant de passer au tour suivant
      const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
      const playerDead = !playerCharacter || playerCharacter.currentHP <= 0
      
      if (allEnemiesDead) {
        onPhaseChange('victory')
        return
      } else if (playerDead) {
        onPhaseChange('defeat')
        return
      }
      
      onNextTurn()
      return
    }

    const executeWithCleanup = (executionFunction) => {
      try {
        executionFunction()
      } catch (error) {
        setIsExecuting(false)
        onNextTurn()
      }
    }

    switch (currentTurn.type) {
      case 'enemy':
        executeWithCleanup(() => {
          handleEnemyTurn(currentTurn)
          setTimeout(() => setIsExecuting(false), 800) // Safety timeout
        })
        break
        
      case 'companion':
        executeWithCleanup(() => {
          handleCompanionTurn(currentTurn)
          setTimeout(() => setIsExecuting(false), 800) // Safety timeout
        })
        break
        
      case 'player':
        // Vérifier si le joueur peut encore agir
        if (playerCharacter && playerCharacter.currentHP > 0) {
          setIsExecuting(false)
          
          // Vérifier la victoire après le tour du joueur (case où il vient de tuer le dernier ennemi)
          setTimeout(() => {
            const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
            if (allEnemiesDead) {
              onPhaseChange('victory')
            }
          }, 100) // Court délai pour que les dégâts soient appliqués
        } else {
          setIsExecuting(false)
          onPhaseChange('defeat')
        }
        break
        
      default:
        setIsExecuting(false)
        onNextTurn()
    }
  }, [phase, currentTurn, isExecuting, lastExecutedTurn, handleEnemyTurn, handleCompanionTurn, onNextTurn, onPhaseChange, playerCharacter, enemies])

  // Ce composant est invisible, il ne rend rien
  return null
}

export default CombatTurnManager