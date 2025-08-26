import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CombatEngine } from '../services/combatEngine';
import { CombatService } from '../services/CombatService';
import { CombatEffects } from '../services/combatEffects';
import { calculateDistance } from '../utils/calculations';
import { isValidGridPosition } from '../utils/validation';
import { GRID_WIDTH, GRID_HEIGHT } from '../utils/constants';
import { EnemyFactory } from '../services/EnemyFactory';
import { CombatAI } from '../services/CombatAI';

// Store pour la gestion de l'état du combat
export const useCombatStore = create(
  devtools(
    (set, get) => ({
      // ... (état existant : isActive, combatEnemies, turnOrder, etc.)
      isActive: false,
      isInitialized: false,
      combatPhase: 'idle', 
      combatKey: 0,
      encounterData: null,
      combatEnemies: [],
      turnOrder: [],
      currentTurnIndex: 0,
      turnCounter: 0,
      combatPositions: {}, 
      showMovementFor: null,
      showTargetingFor: null,
      hasMovedThisTurn: false,
      playerAction: null,
      actionTargets: [],
      selectedAoESquares: [],
      aoeCenter: null,
      defeated: false,
      victory: false,
      totalXpGained: 0,

      // === SYSTÈME D'ACTIONS MULTIPLES JOUEUR ===
      playerTurnState: {
        actionsUsed: {
          movement: false,
          action: false,
          bonusAction: false
        },
        remainingMovement: 6, // cases par défaut
        canEndTurn: false
      },

      // === NOUVEAU SYSTÈME SIMPLE ===

      /**
       * SYSTÈME UNIFIÉ : Utilise CombatAI qui fusionne IA sophistiquée + exécution robuste
       * - IA: EntityAI_Hybrid (priorités, rôles, scoring intelligent)
       * - Exécution: Logique robuste + SpellServiceUnified  
       * - Architecture: Propre et maintenable
       */
      executeUnifiedEntityTurn: (entity, gameState, onNextTurn) => {

        
        const onMessage = (message, type) => {
          get().addCombatMessageToGameStore(message, type);
        };

        const onDamage = (targetId, damage) => {

          
          // Le joueur peut être identifié par 'player' ou son nom
          const playerCharacter = gameState.playerCharacter;
          const isPlayer = targetId === 'player' || (playerCharacter && targetId === playerCharacter.name);
          
          if (isPlayer) {
            if (damage > 0) {

              get().dealDamageToPlayer(damage);
              // Message géré par CombatAI.applyResults avec format unifié
            } else {
              const healing = Math.abs(damage);
              const currentHP = playerCharacter.currentHP;
              const maxHP = playerCharacter.maxHP;
              const actualHealing = Math.min(healing, maxHP - currentHP);
              

              
              if (actualHealing > 0) {
                get().dealDamageToPlayer(-actualHealing); // Soins = dégâts négatifs
                // Message géré par CombatAI.applyResults avec format unifié
              }
              // Pas de message si pas de soins effectifs
            }
          } else {
            // Vérifier si c'est un compagnon
            const companion = gameState.activeCompanions?.find(c => c.name === targetId || c.id === targetId);
            
            if (companion) {
              if (damage > 0) {

                get().dealDamageToCompanionById(companion.id, damage);
                get().addCombatMessageToGameStore(`${targetId} subit ${damage} dégâts !`, 'damage');
              } else {
                const healing = Math.abs(damage);
                const currentHP = companion.currentHP;
                const maxHP = companion.maxHP;
                const actualHealing = Math.min(healing, maxHP - currentHP);
                

                
                if (actualHealing > 0) {
                  get().healCompanionById(companion.id, actualHealing);
                  get().addCombatMessageToGameStore(`${targetId} récupère ${actualHealing} HP !`, 'healing');
                } else {
                  get().addCombatMessageToGameStore(`${targetId} est déjà en pleine forme.`, 'info');
                }
              }
            } else {
              // C'est un ennemi
              if (damage > 0) {

                get().dealDamageToEnemy(targetId, damage);
                get().addCombatMessageToGameStore(`${targetId} subit ${damage} dégâts !`, 'damage');
              } else {
                // Soins sur ennemi (rare mais possible)
                get().dealDamageToEnemy(targetId, damage);
                get().addCombatMessageToGameStore(`${targetId} récupère ${Math.abs(damage)} HP.`, 'healing');
              }
            }
          }
        };

        // CombatAI unifié : IA sophistiquée + exécution robuste + nextTurn
        CombatAI.executeEntityTurn(entity, gameState, onMessage, onDamage, onNextTurn);
      },

      /**
       * Applique les résultats d'une action (dégâts, soins, etc.) à l'état.
       * Centralise la modification de l'état de combat.
       */
      applyActionResults: (result) => {


        // Appliquer les dégâts
        if (result.damage && result.damage.length > 0) {
          result.damage.forEach(dmg => {

            if (dmg.targetId === 'player') {
              get().dealDamageToPlayer(dmg.damage);
            } else {
              // Pour les ennemis et compagnons
              get().dealDamageToEnemy(dmg.targetId, dmg.damage);
            }
          });
        }

        // Appliquer les soins
        if (result.healing && result.healing.length > 0) {
          result.healing.forEach(heal => {

            if (heal.targetId === 'player') {
              // Pour le joueur, les soins sont des dégâts négatifs
              get().dealDamageToPlayer(-heal.amount);
            } else {
              // Pour les compagnons, utiliser la fonction dédiée avec des dégâts négatifs
              get().dealDamageToCompanionById(heal.targetId, -heal.amount);
            }
          });
        }

        // Ajouter les messages de combat
        if (result.messages && result.messages.length > 0) {
          result.messages.forEach(msg => {
            const messageText = typeof msg === 'string' ? msg : msg.text;
            const messageType = typeof msg === 'string' ? 'default' : (msg.type || 'default');
            get().addCombatMessageToGameStore(messageText, messageType);
          });
        }

        // Appliquer les effets (buffs, debuffs)
        if (result.effects && result.effects.length > 0) {
          result.effects.forEach(effect => {

            
            // Trouver la cible de l'effet
            const target = get().findEntityById(effect.targetId);
            if (!target) {
              console.warn(`⚠️ Cible non trouvée pour effet: ${effect.targetId}`);
              return;
            }
            
            // Appliquer l'effet selon son type
            if (effect.type === 'buff') {
              get().applyBuffToTarget(target, effect);
            } else if (effect.type === 'debuff') {
              get().applyDebuffToTarget(target, effect);
            } else {
              console.warn(`⚠️ Type d'effet non supporté: ${effect.type}`);
            }
          });
        }

        // Vérifier la fin du combat après l'action
        get().checkCombatEnd();
      },

      // ... (autres actions existantes : initializeCombat, nextTurn, dealDamageTo..., etc.)
      
      // === MÉTHODES HÉRITÉES (MAINTENUES POUR COMPATIBILITÉ SI BESOIN) ===

      /**
       * @deprecated Utiliser executeUnifiedEntityTurn à la place
       */
      executeEnemyTurn: (enemyName, playerCharacter, activeCompanions = []) => {
        console.warn('⚠️ executeEnemyTurn is deprecated, use executeUnifiedEntityTurn');
        const { combatEnemies, combatPositions } = get();
        const enemy = combatEnemies.find(e => e.name === enemyName);
        if (!enemy || enemy.currentHP <= 0) {
          return;
        }

        const gameState = { playerCharacter, activeCompanions, combatEnemies, combatPositions };
        // Redirection vers le nouveau système
        get().executeUnifiedEntityTurn(enemy, gameState, () => get().nextTurn());
      },

      /**
       * @deprecated Utiliser executeUnifiedEntityTurn à la place
       */
      executeCompanionTurnById: (companionId, companion, activeCompanions, playerCharacter) => {
        console.warn('⚠️ executeCompanionTurnById is deprecated, use executeUnifiedEntityTurn');
        if (!companion || companion.currentHP <= 0) {
          return;
        }

        const { combatPositions, combatEnemies } = get();
        const gameState = { playerCharacter, activeCompanions, combatEnemies, combatPositions };
        // Redirection vers le nouveau système
        get().executeUnifiedEntityTurn(companion, gameState, () => get().nextTurn());
      },

      // Le reste du store reste identique...
      initializeCombat: (encounterData, playerCharacter, activeCompanions = []) => set((state) => {
        const enemyInstances = EnemyFactory.createEnemiesFromEncounter(encounterData)
        const sortedOrder = CombatService.rollInitiative(playerCharacter, activeCompanions, enemyInstances)

        sortedOrder.forEach((combatant, index) => {

        })
        const positions = get().calculateInitialPositions(
          enemyInstances,
          activeCompanions,
          encounterData.enemyPositions,
          encounterData.playerPosition,    
          encounterData.companionPositions 
        )
        positions.playerStartPos = { ...positions.player }
        if (activeCompanions && activeCompanions.length > 0) {
          activeCompanions.forEach(companion => {
            const companionId = companion.id || companion.name.toLowerCase()
            if (positions[companionId]) {
              positions[`${companionId}StartPos`] = { ...positions[companionId] }
            }
          })
        }
        return {
          ...state,
          isActive: true,
          isInitialized: true,
          combatPhase: 'initiative-display',
          encounterData,
          combatEnemies: enemyInstances,
          turnOrder: sortedOrder,
          currentTurnIndex: 0,
          turnCounter: 1,
          combatPositions: positions,
          hasMovedThisTurn: false,
          defeated: false,
          victory: false,
          totalXpGained: 0
        }
      }),

      calculateInitialPositions: (enemies, activeCompanions = [], customEnemyPositions = {}, customPlayerPosition = null, customCompanionPositions = null) => {
        const positions = {
          player: customPlayerPosition || { x: 0, y: 5 } 
        }
        if (activeCompanions && activeCompanions.length > 0) {
          activeCompanions.forEach((companion, index) => {
            const companionId = companion.id || companion.name.toLowerCase()
            if (customCompanionPositions && customCompanionPositions[companionId]) {
              positions[companionId] = customCompanionPositions[companionId]
            } else if (customCompanionPositions && Array.isArray(customCompanionPositions) && customCompanionPositions[index]) {
              positions[companionId] = customCompanionPositions[index]
            } else {
              const playerPos = positions.player
              positions[companionId] = {
                x: playerPos.x + 1 + index,
                y: playerPos.y - Math.floor(index / 2) 
              }
            }
          })
        }
        enemies.forEach((enemy, index) => {
          if (customEnemyPositions && typeof customEnemyPositions === 'object') {
            if (Array.isArray(customEnemyPositions)) {
              if (customEnemyPositions[index]) {
                positions[enemy.name] = customEnemyPositions[index]
              } else {
                const baseX = Math.min(6, GRID_WIDTH - 2)
                const baseY = Math.min(index, GRID_HEIGHT - 1)
                positions[enemy.name] = { x: baseX + (index % 2), y: baseY }
              }
            } else if (customEnemyPositions[enemy.name]) {
              positions[enemy.name] = customEnemyPositions[enemy.name]
            } else {
              const baseX = Math.min(6, GRID_WIDTH - 2)
              const baseY = Math.min(index, GRID_HEIGHT - 1)
              positions[enemy.name] = { x: baseX + (index % 2), y: baseY }
            }
          } else {
            const baseX = Math.min(6, GRID_WIDTH - 2)
            const baseY = Math.min(index, GRID_HEIGHT - 1)
            positions[enemy.name] = { x: baseX + (index % 2), y: baseY }
          }
        })
        return positions
      },

      resetCombat: () => set({
        isActive: false,
        isInitialized: false,
        combatPhase: 'idle',
        encounterData: null,
        combatEnemies: [],
        turnOrder: [],
        currentTurnIndex: 0,
        turnCounter: 0,
        combatPositions: {},
        showMovementFor: null,
        showTargetingFor: null,
        hasMovedThisTurn: false,
        playerAction: null,
        actionTargets: [],
        selectedAoESquares: [],
        aoeCenter: null,
        defeated: false,
        victory: false,
        totalXpGained: 0,
        playerTurnState: {
          actionsUsed: {
            movement: false,
            action: false,
            bonusAction: false
          },
          remainingMovement: 6,
          canEndTurn: false
        }
      }),
      startCombat: () => set({ combatPhase: 'turn' }),

      nextTurn: () => set((state) => {
        let nextIndex = state.currentTurnIndex + 1
        if (nextIndex >= state.turnOrder.length) {
          nextIndex = 0
          state.turnCounter++
        }
        const maxLoops = state.turnOrder.length
        let loopCount = 0
        while (nextIndex !== state.currentTurnIndex && loopCount < maxLoops) {
          const currentTurnData = state.turnOrder[nextIndex]
          let shouldSkip = false
          if (currentTurnData.type === 'enemy') {
            const enemy = state.combatEnemies.find(e => e.name === currentTurnData.name)
            if (!enemy || enemy.currentHP <= 0) {
              shouldSkip = true
            }
          } else if (currentTurnData.type === 'companion') {
          }

          if (shouldSkip) {
            nextIndex++
            loopCount++
            if (nextIndex >= state.turnOrder.length) {
              nextIndex = 0
              state.turnCounter++
            }
            continue
          }
          break
        }
        const newCombatant = state.turnOrder[nextIndex]
        let effectMessages = []

        if (newCombatant?.type === 'enemy') {
          const enemy = state.combatEnemies.find(e => e.name === newCombatant.name)
          if (enemy) {
            effectMessages = CombatEffects.processStartOfTurnEffects(enemy)
          }
        }
        const newPositions = { ...state.combatPositions }

        if (newCombatant?.type === 'player') {
          newPositions.playerStartPos = { ...state.combatPositions.player }
        } else if (newCombatant?.type === 'companion') {
          const companionId = newCombatant.id || newCombatant.name.toLowerCase()
          const companionPos = state.combatPositions[companionId]
          if (companionPos) {
            newPositions[`${companionId}StartPos`] = { ...companionPos }
          }
        }
        if (effectMessages.length > 0) {

        }

        return {
          currentTurnIndex: nextIndex,
          turnCounter: state.turnCounter,
          combatPhase: 'turn',
          hasMovedThisTurn: false,
          showMovementFor: null,
          showTargetingFor: null,
          playerAction: null,
          actionTargets: [],
          combatPositions: newPositions
        }
      }),

      setTurnPhase: (phase) => set({ combatPhase: phase }),

      getCurrentTurn: () => {
        const { turnOrder, currentTurnIndex } = get()
        return turnOrder[currentTurnIndex]
      },
      moveCharacter: (characterId, newPosition) => set((state) => {
        if (!isValidGridPosition(newPosition.x, newPosition.y)) return state

        const isOccupied = CombatEngine.isPositionOccupied(
          newPosition.x,
          newPosition.y,
          state.combatPositions,
          state.combatEnemies,
          characterId
        )

        if (isOccupied) return state
        const oldPosition = state.combatPositions[characterId]
        const opportunityAttacks = get().checkOpportunityAttacks(characterId, oldPosition, newPosition)
        if (opportunityAttacks.length > 0) {
          get().executeOpportunityAttacks(opportunityAttacks)
        }

        return {
          combatPositions: {
            ...state.combatPositions,
            [characterId]: newPosition
          },
          hasMovedThisTurn: characterId === 'player' ? true : state.hasMovedThisTurn
        }
      }),

      checkOpportunityAttacks: (movingCharacterId, fromPosition, toPosition) => {
        const state = get()
        const { combatPositions, combatEnemies } = state
        const attacks = []

        if (!fromPosition || !toPosition) return attacks
        const movingEntityType = get().getEntityType(movingCharacterId)
        const movingEntity = get().getEntityById(movingCharacterId)

        if (!movingEntity) return attacks
        const potentialAttackers = get().getAllPotentialAttackers(movingCharacterId, movingEntityType)

        potentialAttackers.forEach(attacker => {
          if (attacker.entity.currentHP <= 0) return
          const attackerPosition = combatPositions[attacker.positionKey]
          if (!attackerPosition) return

          const wasInRange = calculateDistance(fromPosition, attackerPosition) <= 1
          const stillInRange = calculateDistance(toPosition, attackerPosition) <= 1
          if (wasInRange && !stillInRange) {
            const meleeAttack = attacker.entity.attacks?.find(attack =>
              attack.type === 'melee' || attack.range <= 1
            ) || {
              name: "Attaque de base",
              type: "melee",
              range: 1,
              damageDice: "1d4",
              damageBonus: 0,
              damageType: "contondant"
            }

            attacks.push({
              attacker: attacker.entity,
              attackerType: attacker.type,
              attackerPositionKey: attacker.positionKey,
              target: movingEntity,
              targetType: movingEntityType,
              targetId: movingCharacterId,
              attack: meleeAttack,
              position: attackerPosition
            })
          }
        })

        return attacks
      },

      updateEnemyPosition: (enemyName, position) => set((state) => ({
        combatPositions: {
          ...state.combatPositions,
          [enemyName]: position
        }
      })),
      getEntityType: (entityId) => {
        if (entityId === 'player') return 'player'

        const { combatEnemies } = get()
        const isEnemy = combatEnemies.some(enemy => enemy.name === entityId)
        if (isEnemy) return 'enemy'
        return 'companion'
      },

      getEntityById: (entityId) => {
        const state = get()

        if (entityId === 'player') {
          return { name: 'Joueur', currentHP: 1 }
        }
        const enemy = state.combatEnemies.find(e => e.name === entityId)
        if (enemy) return enemy
        return { id: entityId, name: entityId, currentHP: 1 }
      },

      getAllPotentialAttackers: (movingEntityId, movingEntityType) => {
        const state = get()
        const attackers = []

        if (movingEntityType === 'enemy') {
          attackers.push({
            entity: { name: 'Joueur', currentHP: 1 }, 
            type: 'player',
            positionKey: 'player'
          })
          Object.keys(state.combatPositions).forEach(key => {
            if (key !== 'player' && key !== movingEntityId &&
              !key.endsWith('StartPos') &&
              !state.combatEnemies.some(e => e.name === key)) {
              attackers.push({
                entity: { id: key, name: key, currentHP: 1 }, 
                type: 'companion',
                positionKey: key
              })
            }
          })

        } else {
          state.combatEnemies.forEach(enemy => {
            if (enemy.name !== movingEntityId) {
              attackers.push({
                entity: enemy,
                type: 'enemy',
                positionKey: enemy.name
              })
            }
          })
        }

        return attackers
      },

      executeOpportunityAttacks: (opportunityAttacks) => {


        opportunityAttacks.forEach((oa, index) => {

          
          // Récupérer le playerCharacter pour les noms corrects
          const playerTurn = get().turnOrder.find(t => t.type === 'player')
          const playerCharacter = playerTurn ? { name: playerTurn.name } : null
          
          const attackResult = CombatEngine.processOpportunityAttack(oa.attacker, oa.target, oa.attack, playerCharacter)


          const messageType = attackResult.hit ? 'opportunity-hit' : 'opportunity-miss'
          get().addCombatMessageToGameStore(attackResult.message, messageType)
          if (attackResult.hit && attackResult.damage > 0) {
            if (oa.targetType === 'player') {
              get().dealDamageToPlayer(attackResult.damage)

            } else if (oa.targetType === 'companion') {
              get().dealDamageToCompanionById(oa.targetId, attackResult.damage)

            } else if (oa.targetType === 'enemy') {
              get().dealDamageToEnemy(oa.targetId, attackResult.damage)
            }
          }
        })
        if (opportunityAttacks.length > 0) {
          get().checkCombatEnd()
        }
      },
      processSpellEffects: () => {
        const state = get();
        state.spellEffects.forEach(effect => {
          if (effect.duration > 0) {
            effect.onTick?.(state);
            set(state => ({
              spellEffects: state.spellEffects.map(e =>
                e.id === effect.id ? { ...e, duration: e.duration - 1 } : e
              )
            }));
          } else {
            state.removeSpellEffect(effect.targetId, effect.id);
          }
        });
      },
      setPlayerAction: (action) => set({ playerAction: action }),

      setActionTargets: (targets) => set({ actionTargets: targets }),

      setShowMovementFor: (characterId) => set({ showMovementFor: characterId }),

      setShowTargetingFor: (characterId) => set({ showTargetingFor: characterId }),

      setSelectedAoESquares: (squares) => set({ selectedAoESquares: squares }),

      setAoECenter: (center) => set({ aoeCenter: center }),

      executeAction: () => {
        const {
          playerAction,
          actionTargets,
          turnOrder,
          currentTurnIndex,
          combatPositions,
          combatEnemies
        } = get()

        if (!playerAction || actionTargets.length === 0) return

        const currentTurn = turnOrder[currentTurnIndex]
        const attackerPosition = combatPositions[currentTurn.name.toLowerCase()]
        const result = CombatService.executePlayerAction(
          currentTurn.character,
          playerAction,
          actionTargets,
          combatEnemies,
          combatPositions
        )
        get().applyActionResults(result)
      },
      _onPlayerDamage: null,
      _onCompanionDamageById: null, 
      setDamageCallbacks: (onPlayerDamage, onCompanionDamageById) => set({
        _onPlayerDamage: onPlayerDamage,
        _onCompanionDamageById: onCompanionDamageById
      }),

      dealDamageToPlayer: (damage) => {
        const { _onPlayerDamage } = get()
        if (_onPlayerDamage) {
          _onPlayerDamage(damage)
        } else {
          console.warn('Player damage callback not set')
        }
      },
      dealDamageToCompanion: (damage) => {
        console.warn('dealDamageToCompanion is deprecated, use dealDamageToCompanionById')
      },

      dealDamageToCompanionById: (companionId, damage) => {
        const { _onCompanionDamageById } = get()
        if (_onCompanionDamageById) {
          _onCompanionDamageById(companionId, damage)
        } else {
          console.warn('Companion damage by ID callback not set')
        }
      },

      dealDamageToEnemy: (enemyName, damage) => set((state) => {
        const enemyIndex = state.combatEnemies.findIndex(e => e.name === enemyName)
        if (enemyIndex === -1) return state

        const newEnemies = [...state.combatEnemies]
        newEnemies[enemyIndex] = {
          ...newEnemies[enemyIndex],
          currentHP: Math.max(0, newEnemies[enemyIndex].currentHP - damage)
        }

        return { combatEnemies: newEnemies }
      }),
      checkCombatEnd: () => {
        const { combatEnemies } = get()
        const aliveEnemies = combatEnemies.filter(enemy => enemy.currentHP > 0)
        if (aliveEnemies.length === 0) {
          get().handleVictory()
          return
        }
      },

      handleVictory: () => {
        const { combatEnemies } = get()
        const totalXP = combatEnemies.reduce((total, enemy) => {
          return total + (enemy.xp || 0)
        }, 0)

        set((state) => ({
          victory: true,
          combatPhase: 'end',
          isActive: false,
          totalXpGained: totalXP
        }))
      },

      handleDefeat: () => set({
        defeated: true,
        combatPhase: 'end',
        isActive: false
      }),

      endCombat: (victory) => set({
        [victory ? 'victory' : 'defeated']: true,
        combatPhase: 'end',
        isActive: false
      }),
      _onCombatMessage: null,
      setCombatMessageCallback: (callback) => set({
        _onCombatMessage: callback
      }),
      addCombatMessageToGameStore: (message, type = 'default') => {
        const { _onCombatMessage } = get()
        if (_onCombatMessage) {
          _onCombatMessage(message, type)
        } else {
          console.warn('⚠️ Combat message callback non configuré:', message)
        }
      },
      addSpellEffect: (targetId, effect) => set(state => ({
        spellEffects: [...state.spellEffects, { targetId, ...effect }]
      })),

      removeSpellEffect: (targetId, effectId) => set(state => ({
        spellEffects: state.spellEffects.filter(
          e => !(e.targetId === targetId && e.id === effectId)
        )
      })),
      incrementCombatKey: () => set((state) => ({
        combatKey: state.combatKey + 1
      })),

      getValidMovementSquares: (characterId, movementRange = 6) => {
        const { combatPositions, combatEnemies } = get()
        const currentPos = combatPositions[characterId]
        if (!currentPos) return []

        const validSquares = []

        for (let x = 0; x < GRID_WIDTH; x++) {
          for (let y = 0; y < GRID_HEIGHT; y++) {
            const distance = calculateDistance(currentPos, { x, y })

            if (distance <= movementRange &&
              !CombatEngine.isPositionOccupied(x, y, combatPositions, combatEnemies, characterId)) {
              validSquares.push({ x, y })
            }
          }
        }

        return validSquares
      },

      getValidTargetSquares: (action, attackerPosition) => {
        const { combatPositions, combatEnemies } = get()

        return CombatEngine.getTargetsInRange(
          { type: 'player' }, 
          attackerPosition,
          action,
          { combatPositions, combatEnemies }
        ).map(target => combatPositions[target.name])
      },

      // === MÉTHODES POUR SYSTÈME DE BUFFS ===

      /**
       * Trouve une entité par son ID dans tous les conteneurs
       */
      findEntityById: (entityId) => {
        const state = get();
        
        // Chercher dans le joueur
        if (state.playerCharacter && (state.playerCharacter.id === entityId || state.playerCharacter.name === entityId)) {
          return state.playerCharacter;
        }
        
        // Chercher dans les compagnons
        const companion = state.activeCompanions?.find(c => c.id === entityId || c.name === entityId);
        if (companion) return companion;
        
        // Chercher dans les ennemis
        const enemy = state.combatEnemies?.find(e => e.id === entityId || e.name === entityId);
        if (enemy) return enemy;
        
        console.warn(`⚠️ Entité non trouvée: ${entityId}`);
        return null;
      },

      /**
       * Applique un buff à une cible
       */
      applyBuffToTarget: (target, effect) => {

        
        // Importer CombatEffects
        import('../services/combatEffects.js').then(({ CombatEffects }) => {
          const buffConfig = effect.buffType;
          const duration = effect.duration || buffConfig.duration || 600;
          
          // Convertir le buff du sort en effet CombatEffects
          let effectType = 'blessed'; // Par défaut
          
          if (buffConfig.acBonus) {
            // Créer un effet personnalisé pour CA
            CombatEffects.applyEffect(target, 'mage_armor', duration, effect.source);
            get().addCombatMessageToGameStore(`${target.name} gagne +${buffConfig.acBonus} CA`, 'buff');
            
          } else if (buffConfig.attackBonus || buffConfig.saveBonus) {
            // Bénédiction
            CombatEffects.applyEffect(target, 'blessed', duration, effect.source);
            get().addCombatMessageToGameStore(`${target.name} est béni`, 'buff');
            
          } else if (buffConfig.maxHPBonus) {
            // Aide - augmenter HP max
            target.maxHP = (target.maxHP || 0) + buffConfig.maxHPBonus;
            target.currentHP = (target.currentHP || 0) + buffConfig.maxHPBonus;
            get().addCombatMessageToGameStore(`${target.name} gagne ${buffConfig.maxHPBonus} PV max`, 'buff');
            
          } else if (buffConfig.protection) {
            // Sanctuaire
            CombatEffects.applyEffect(target, 'sanctuary', duration, effect.source);
            get().addCombatMessageToGameStore(`${target.name} est protégé par un sanctuaire`, 'buff');
          }
          

          
          // Mettre à jour l'affichage
          get().incrementCombatKey();
          
        }).catch(error => {
          console.error('❌ Erreur import CombatEffects:', error);
        });
      },

      /**
       * Applique un debuff à une cible
       */
      applyDebuffToTarget: (target, effect) => {

        
        import('../services/combatEffects.js').then(({ CombatEffects }) => {
          const debuffConfig = effect.debuffType;
          const duration = effect.duration || debuffConfig.duration || 600;
          
          // Types de debuffs courants
          if (debuffConfig.poisoned) {
            CombatEffects.applyEffect(target, 'poisoned', duration, effect.source);
          } else if (debuffConfig.stunned) {
            CombatEffects.applyEffect(target, 'stunned', duration, effect.source);
          } else if (debuffConfig.paralyzed) {
            CombatEffects.applyEffect(target, 'paralyzed', duration, effect.source);
          }
          

          get().incrementCombatKey();
        });
      },

      // === ACTIONS POUR SYSTÈME MULTI-ACTIONS JOUEUR ===

      /**
       * Réinitialise l'état du tour joueur (appelé au début de chaque tour)
       */
      resetPlayerTurnState: () => set((state) => {
        const playerCharacter = state.turnOrder.find(t => t.type === 'player')
        const movement = playerCharacter?.movement || 6
        
        return {
          playerTurnState: {
            actionsUsed: {
              movement: false,
              action: false,
              bonusAction: false
            },
            remainingMovement: movement,
            canEndTurn: false
          }
        }
      }),

      /**
       * Marque une action comme utilisée
       */
      usePlayerAction: (actionType) => set((state) => {
        const newActionsUsed = { ...state.playerTurnState.actionsUsed }
        newActionsUsed[actionType] = true
        
        // Vérifier si on peut terminer le tour (au moins une action faite)
        const hasUsedAnyAction = newActionsUsed.action || newActionsUsed.movement || newActionsUsed.bonusAction
        
        return {
          playerTurnState: {
            ...state.playerTurnState,
            actionsUsed: newActionsUsed,
            canEndTurn: hasUsedAnyAction
          }
        }
      }),

      /**
       * Met à jour le mouvement restant
       */
      updatePlayerMovement: (usedMovement) => set((state) => ({
        playerTurnState: {
          ...state.playerTurnState,
          remainingMovement: Math.max(0, state.playerTurnState.remainingMovement - usedMovement)
        }
      })),

      /**
       * Force la fin du tour du joueur
       */
      endPlayerTurn: () => {
        const { nextTurn, resetPlayerTurnState } = get()
        resetPlayerTurnState()
        nextTurn()
      }
    }),
    { name: 'combat-store' }
  )
);

// ... (sélecteurs existants)
export const combatSelectors = {
  isInCombat: (state) => state.isActive,

  getCurrentPhase: (state) => state.combatPhase,

  getCurrentTurnData: (state) =>
    state.turnOrder[state.currentTurnIndex],

  isPlayerTurn: (state) => {
    const currentTurn = state.turnOrder[state.currentTurnIndex]
    return currentTurn?.type === 'player'
  },

  isCompanionTurn: (state) => {
    const currentTurn = state.turnOrder[state.currentTurnIndex]
    return currentTurn?.type === 'companion'
  },

  isEnemyTurn: (state) => {
    const currentTurn = state.turnOrder[state.currentTurnIndex]
    return currentTurn?.type === 'enemy'
  },

  getAliveEnemies: (state) =>
    state.combatEnemies.filter(enemy => enemy.currentHP > 0),

  getDeadEnemies: (state) =>
    state.combatEnemies.filter(enemy => enemy.currentHP <= 0),

  getTurnOrder: (state) => state.turnOrder,

  getCombatPositions: (state) => state.combatPositions,

  hasMovedThisTurn: (state) => state.hasMovedThisTurn,

  canEndTurn: (state) => {
    const currentTurn = state.turnOrder[state.currentTurnIndex]
    if (currentTurn?.type === 'player') {
      return state.playerAction && state.actionTargets.length > 0
    }
    return true // AI turns auto-complete
  },

  getCombatResults: (state) => ({
    victory: state.victory,
    defeated: state.defeated,
    isEnded: state.victory || state.defeated
  })
}


export const useCombat = () => useCombatStore(state => state)
export const useCombatActions = () => useCombatStore(state => state)
export const useCombatSelector = (selector) => useCombatStore(selector)


