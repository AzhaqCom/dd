import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useCombatStore } from '../../../stores/combatStore'
import { useGameStore } from '../../../stores/gameStore'
import { CombatService } from '../../../services/CombatService'
import { Card, Button } from '../../ui'
import { CombatGrid } from './CombatGrid'
import { CombatTurnManager } from './CombatTurnManager'
import { CombatActionPanel } from './CombatActionPanel'
import { CombatLog } from '../../ui/CombatLog'

/**
 * Panneau de combat moderne utilisant Zustand
 */
export const CombatPanel = ({
  playerCharacter,
  activeCompanions = [], // Compagnons actifs
  encounterData,
  onCombatEnd,
  onReplayCombat,
  combatKey,
  victoryButtonText = "Continuer l'aventure" // Texte personnalisable du bouton de victoire
}) => {
  // Ref pour éviter les double initialisations
  const initializingRef = useRef(false)
  
  // État local pour le mode mouvement intégré
  const [isMovementMode, setIsMovementMode] = useState(false)

  // Stores
  const {
    // État du combat
    combatPhase: phase,
    currentTurnIndex,
    turnOrder,
    combatEnemies: enemies,
    combatPositions: positions,
    playerAction: selectedAction,
    actionTargets: selectedTargets,
    defeated,
    victory,
    isInitialized,

    // Actions
    initializeCombat,
    startCombat,
    setTurnPhase: setPhase,
    nextTurn,
    setPlayerAction: selectAction,
    setActionTargets,
    resetCombat,
    moveCharacter,
    
    // Nouvelles actions pour multi-actions
    resetPlayerTurnState,
    usePlayerAction,
    endPlayerTurn,
    playerTurnState
  } = useCombatStore()

  // Game store pour les messages
  const { addCombatMessage, combatLog, clearCombatLog } = useGameStore()

  // Calcul du tour actuel
  const currentTurn = turnOrder[currentTurnIndex]

  // Fonctions pour gérer les cibles (définies avant useCallback)
  const clearTargets = () => setActionTargets([])
  const selectTarget = (target) => {
    setActionTargets([...selectedTargets, target])
  }

  // Fonction utilitaire pour exécuter une action et traiter les résultats
  const executeActionAndApplyResults = useCallback((action, targets) => {
    const result = CombatService.executePlayerAction(
      playerCharacter,
      action,
      targets,
      enemies,
      positions
    )

    // Appliquer les résultats
    result.messages.forEach(message => addCombatMessage(message.text, message.type))

    // Appliquer les dégâts
    if (result.damage && result.damage.length > 0) {
      result.damage.forEach(damageData => {
        const target = enemies.find(e => e.name === damageData.targetId || e.id === damageData.targetId)
        if (target) {
          useCombatStore.getState().dealDamageToEnemy(target.name, damageData.damage)

          // Message de mort si nécessaire  
          setTimeout(() => {
            const updatedEnemy = enemies.find(e => e.name === target.name)
            if (updatedEnemy && updatedEnemy.currentHP <= 0 && target.currentHP > 0) {
              addCombatMessage(`💀 ${target.name} tombe au combat !`, 'enemy-death')
            }
          }, 100)
        }
      })
    }

    // === NOUVEAU SYSTÈME MULTI-ACTIONS ===
    // Marquer l'action comme utilisée
    usePlayerAction('action')
    
    // Nettoyer la sélection
    clearTargets()
    selectAction(null)

    // Vérifier fin de tour automatique (si mouvement aussi utilisé)
    // Note: On doit checker l'état après la mise à jour
    setTimeout(() => {
      const currentState = useCombatStore.getState()
      if (currentState.playerTurnState.actionsUsed.action && currentState.playerTurnState.actionsUsed.movement) {
        // Auto-fin de tour si les deux actions principales sont faites
        endPlayerTurn()
      }
    }, 100) // Petit délai pour que l'état se mette à jour
  }, [playerCharacter, enemies, positions, addCombatMessage, clearTargets, selectAction, usePlayerAction, endPlayerTurn])

  // Initialisation du combat
  useEffect(() => {
    if (!encounterData || !encounterData.enemies?.length) return

    // Reset pour nouveau combat (rejouer)
    if (combatKey !== undefined) {
      resetCombat()
      initializingRef.current = false // Reset du flag
      return // Ne pas initialiser après reset, App.jsx s'en charge
    }

    // Initialiser le combat pour la première fois seulement
    if (!isInitialized && !initializingRef.current) {
      initializingRef.current = true
      initializeCombat(encounterData, playerCharacter, activeCompanions)
    }
  }, [encounterData, combatKey, isInitialized, playerCharacter, activeCompanions, initializeCombat, resetCombat])

  useEffect(() => {
    // On se déclenche UNIQUEMENT quand la phase est la bonne.
    if (phase === 'initiative-display') {
      addCombatMessage('Un combat commence !', 'combat-start');
      turnOrder.forEach(element => {
        const message = `${element.name} a obtenu ${element.initiative} en initiative !`;
        addCombatMessage(message, 'initiative');
      });
    }
  }, [phase]);

  // Gestion automatique des transitions de phase selon le type de tour
  useEffect(() => {
    if (phase === 'turn' && currentTurn) {
      console.log('🎯 Phase transition - Current turn:', currentTurn)
      
      // Vérification de fin de combat AVANT de continuer
      const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
      const playerDead = !playerCharacter || playerCharacter.currentHP <= 0
      
      if (allEnemiesDead) {
        console.log('🏆 All enemies dead - Victory!')
        setPhase('victory')
        return
      } else if (playerDead) {
        console.log('💀 Player dead - Defeat!')
        setPhase('defeat')
        return
      }
      
      if (currentTurn.type === 'player') {
        // Tour du joueur : réinitialiser l'état et afficher l'interface
        console.log('🎮 Player turn starting')
        resetPlayerTurnState()
        setPhase('player-turn')
      } else if (currentTurn.type === 'enemy') {
        // Tour d'ennemi : passer à executing-turn pour déclencher l'IA
        console.log('👹 Enemy turn starting:', currentTurn.name)
        setPhase('executing-turn')
      } else if (currentTurn.type === 'companion') {
        // Tour de compagnon : passer à executing-turn pour déclencher l'IA
        console.log('🤝 Companion turn starting:', currentTurn.name)
        setPhase('executing-turn')
      }
    }
  }, [phase, currentTurn, setPhase, enemies, playerCharacter, activeCompanions]);

  // Gestion des actions de combat
  const handleActionSelect = useCallback((action) => {
    selectAction(action)
  }, [selectAction])

  const handleTargetSelect = useCallback((target) => {
    if (!selectedAction) return

    // Ajouter la cible à la liste
    const newTargets = [...selectedTargets, target]
    setActionTargets(newTargets)

    // Auto-exécution si assez de cibles
    const maxTargets = selectedAction.projectiles || 1

    if (newTargets.length >= maxTargets) {
      // Exécuter immédiatement avec les nouvelles cibles
      setTimeout(() => {
        executeActionAndApplyResults(selectedAction, newTargets)
      }, 500) // Petit délai pour que l'utilisateur voie la sélection
    }
  }, [selectedAction, selectedTargets, setActionTargets, executeActionAndApplyResults])

  const handleExecuteAction = useCallback(() => {
    if (!selectedAction || !selectedTargets.length) return
    executeActionAndApplyResults(selectedAction, selectedTargets)
  }, [selectedAction, selectedTargets, executeActionAndApplyResults])

  const handlePassTurn = () => {
    addCombatMessage(`${playerCharacter.name} passe son tour.`)
    clearTargets()
    selectAction(null)
    nextTurn()
  }

  // Nouvelle fonction : Gérer le toggle du mode mouvement
  const handleMovementToggle = useCallback(() => {
    setIsMovementMode(!isMovementMode)
  }, [isMovementMode])

  // Nouvelle fonction : Gérer le mouvement du joueur
  const handlePlayerMovement = useCallback((characterId, newPosition) => {
    if (characterId !== 'player') return
    
    // Utiliser la fonction existante du store
    moveCharacter(characterId, newPosition)
    
    // Marquer le mouvement comme utilisé
    usePlayerAction('movement')
    
    // Sortir du mode mouvement
    setIsMovementMode(false)
    
    // Vérifier fin de tour automatique si action aussi utilisée
    setTimeout(() => {
      const currentState = useCombatStore.getState()
      if (currentState.playerTurnState.actionsUsed.action && currentState.playerTurnState.actionsUsed.movement) {
        // Auto-fin de tour si les deux actions principales sont faites
        endPlayerTurn()
      }
    }, 100) // Délai pour que l'état se mette à jour
  }, [moveCharacter, usePlayerAction, endPlayerTurn])

  // Rendu conditionnel selon la phase
  const renderPhaseContent = () => {
    switch (phase) {
      case 'initializing':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>Initialisation du combat...</h3>
              <p>Préparation des combattants et jets d'initiative</p>
            </div>
          </Card>
        )

      case 'initiative-display':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>Initiative lancée !</h3>
              <p>Les jets d'initiative ont été effectués. Prêt à commencer le combat ?</p>
              <Button onClick={() => startCombat()}>
                Commencer le combat
              </Button>
            </div>
          </Card>
        )

      case 'player-turn':
        return (
          <CombatActionPanel
            playerCharacter={playerCharacter}
            selectedAction={selectedAction}
            selectedTargets={selectedTargets}
            onSelectAction={handleActionSelect}
            onClearTargets={() => setActionTargets([])} // Réinitialiser les cibles
            onExecuteAction={handleExecuteAction}
            onPassTurn={handlePassTurn}
            canMove={!playerTurnState.actionsUsed.movement}
            onMoveToggle={handleMovementToggle}
            isMovementMode={isMovementMode}
          />
        )


      case 'victory':
        return (
          <Card >
            <div className="combat-phase-content">
              <h3>🎉 Victoire !</h3>
              <p>Tous les ennemis ont été vaincus !</p>
              <Button onClick={() => {
                clearCombatLog()
                onCombatEnd?.(encounterData)
              }}>
                {victoryButtonText}
              </Button>
            </div>
          </Card>
        )

      case 'defeat':
        return (
          <Card variant="danger">
            <div className="combat-phase-content">
              <h3>💀 Défaite</h3>
              <p>Vous avez été vaincu...</p>
              <div className="combat-defeat-actions">
                <Button
                  variant="secondary"
                  onClick={onReplayCombat}
                >
                  Rejouer le combat
                </Button>
              </div>
            </div>
          </Card>
        )

      case 'enemy-turn':
      case 'companion-turn':
      case 'executing-turn':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>Tour en cours</h3>
              <p>
                {currentTurn?.type === 'enemy' && `${currentTurn.name} réfléchit...`}
                {currentTurn?.type === 'companion' && `${currentTurn.name} agit...`}
                {(!currentTurn || currentTurn.type === 'player') && 'Attendez la fin du tour en cours...'}
              </p>
            </div>
          </Card>
        )

      default:
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>Combat en cours</h3>
              <p>Phase: {phase} - Attendez...</p>
            </div>
          </Card>
        )
    }
  }

  if (!isInitialized) {
    return (
      <div className="combat-container">
        <Card>
          <div className="combat-loading">
            <h3>Chargement du combat...</h3>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="combat-container">
      {/* Gestionnaire de tours automatique */}
      <CombatTurnManager
        currentTurn={currentTurn}
        turnOrder={turnOrder}
        phase={phase}
        onPhaseChange={setPhase}
        onNextTurn={nextTurn}
      />

      <div className="combat-layout">
        {/* Grille de combat */}
        <div className="combat-grid-section">
          <CombatGrid
            playerCharacter={playerCharacter}
            activeCompanions={activeCompanions}
            enemies={enemies}
            positions={positions}
            selectedAction={selectedAction}
            selectedTargets={selectedTargets}
            currentTurn={currentTurn}
            phase={phase}
            onTargetSelect={handleTargetSelect}
            onMoveCharacter={handlePlayerMovement}
            isMovementMode={isMovementMode}
          />
        </div>

        {/* Panneau latéral */}
        <div className="combat-side-container">
          {/* Contrôles de phase */}
          <div className="combat-controls">
            {renderPhaseContent()}
          </div>

          {/* Journal de combat */}
          <div className="combat-log-section">
            <CombatLog title="Combat" maxEntries={10} showTimestamps={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CombatPanel