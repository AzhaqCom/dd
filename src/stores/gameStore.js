import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { spells } from '../data/spells'
import { spellSlotsByLevel } from '../data/character'
import { DataService } from '../services/DataService'
import { CombatEngine } from '../services/combatEngine'
import { GameUtils } from '../utils/GameUtils'
import { initialGameFlags, GameFlagsHelpers } from '../data/gameFlags'
import { companions } from '../data/companions'
import { useCharacterStore } from './characterStore'

// Store principal pour la gestion de l'état global du jeu
export const useGameStore = create(
  devtools(
    (set, get) => ({
      // État initial
      gamePhase: 'game', // 'character-selection' en prod, 'game' en dev
      currentScene: 'prologue_heritage',
      sceneHistory: [],
      combatLog: [],
      isShortResting: false,
      isLongResting: false,
      nextSceneAfterRest: null,
      combatKey: 0,
      gameMessages: [],

      // Nouveau système de flags narratifs
      gameFlags: GameFlagsHelpers.getInitialFlags(),

      // Actions de base
      setGamePhase: (phase) => set({ gamePhase: phase }),

      setCurrentScene: (scene) => set((state) => ({
        currentScene: scene,
        sceneHistory: [...state.sceneHistory, state.currentScene]
      })),

      goToPreviousScene: () => set((state) => {
        if (state.sceneHistory.length > 0) {
          const previousScene = state.sceneHistory[state.sceneHistory.length - 1]
          return {
            currentScene: previousScene,
            sceneHistory: state.sceneHistory.slice(0, -1)
          }
        }
        return state
      }),

      // Gestion des messages
      addCombatMessage: (message, type = 'default') => set((state) => ({
        combatLog: [...state.combatLog, {
          id: GameUtils.generateId('msg'),
          message,
          type,
          timestamp: new Date()
        }]
      })),

      clearCombatLog: () => set({ combatLog: [] }),

      addGameMessage: (message, type = 'info') => set((state) => ({
        gameMessages: [...state.gameMessages, {
          id: GameUtils.generateId('game-msg'),
          message,
          type,
          timestamp: new Date()
        }]
      })),

      clearGameMessages: () => set({ gameMessages: [] }),

      // Gestion des repos
      startShortRest: (nextScene) => set({
        isShortResting: true,
        nextSceneAfterRest: nextScene
      }),

      endShortRest: () => set((state) => ({
        isShortResting: false,
        currentScene: state.nextSceneAfterRest,
        nextSceneAfterRest: null
      })),

      startLongRest: (nextScene) => set({
        isLongResting: true,
        nextSceneAfterRest: nextScene
      }),

      endLongRest: () => set((state) => ({
        isLongResting: false,
        currentScene: state.nextSceneAfterRest,
        nextSceneAfterRest: null
      })),

      // Gestion du combat
      incrementCombatKey: () => set((state) => ({
        combatKey: state.combatKey + 1
      })),

      // Gestion des tests de compétences (délègue vers CombatEngine)
      handleSkillCheck: (skill, dc, onSuccess, onPartialSuccess, onFailure, character) => {
        const { addCombatMessage, setCurrentScene } = get()

        // Utiliser CombatEngine pour les calculs
        const result = CombatEngine.handleSkillCheck(skill, dc, character)

        addCombatMessage(result.message, 'skill-check')

        let nextScene = onFailure
        if (result.success) {
          nextScene = onSuccess
          addCombatMessage("✅ Réussite !", 'success')
        } else if (result.total >= (dc - 5) && onPartialSuccess) {
          nextScene = onPartialSuccess
          addCombatMessage("⚠️ Réussite partielle", 'partial')
        } else {
          nextScene = onFailure
          addCombatMessage("❌ Échec", 'failure')
        }

        setCurrentScene(nextScene)
      },

      // Utilitaires pour les sorts
      updateSpellSlotsForLevel: (character) => {
        if (!character.spellcasting) return character

        const newSpellSlots = get().getSpellSlotsForLevel(character.level, character.class)
        const newKnownSpells = get().getKnownSpells(character.level, character.class)

        return {
          ...character,
          spellcasting: {
            ...character.spellcasting,
            spellSlots: newSpellSlots,
            knownSpells: newKnownSpells
          }
        }
      },

      // OBSOLÈTE: Logique déplacée vers CharacterManager.getSpellSlotsForLevel() - garder pour compatibilité temporaire
      getSpellSlotsForLevel: (level, characterClass) => {
        let effectiveLevel = level

        switch (characterClass) {
          case 'Magicien':
            // Full caster
            break
          case 'Paladin':
          case 'Rôdeur':
            // Half caster
            effectiveLevel = Math.max(0, Math.floor((level - 1) / 2))
            break
          case 'Guerrier':
            // Eldritch Knight
            if (level >= 3) {
              effectiveLevel = Math.max(0, Math.floor((level - 2) / 3))
            } else {
              return {}
            }
            break
          case 'Roublard':
            // Arcane Trickster
            if (level >= 3) {
              effectiveLevel = Math.max(0, Math.floor((level - 2) / 3))
            } else {
              return {}
            }
            break
          default:
            return {}
        }

        const slots = spellSlotsByLevel[effectiveLevel]
        if (!slots) return {}

        const newSlots = {}
        for (const spellLevel in slots) {
          newSlots[spellLevel] = { total: slots[spellLevel], used: 0 }
        }
        return newSlots
      },

      // OBSOLÈTE: Logique déplacée vers CharacterManager.getKnownSpells() - garder pour compatibilité temporaire
      getKnownSpells: (level, characterClass) => {
        const slots = get().getSpellSlotsForLevel(level, characterClass)
        const maxSpellLevel = slots ? Math.max(...Object.keys(slots).map(Number)) : 0

        // Filter spells by class
        const availableSpells = Object.values(spells).filter(spell => {
          switch (characterClass) {
            case 'Magicien':
              return true
            case 'Guerrier': // Eldritch Knight
              return spell.school === 'Abjuration' || spell.school === 'Évocation' || spell.level === 0
            case 'Roublard': // Arcane Trickster
              return spell.school === 'Enchantement' || spell.school === 'Illusion' || spell.level === 0
            default:
              return false
          }
        })

        const cantrips = availableSpells
          .filter(spell => spell.level === 0)
          .map(spell => spell.name)
        const leveledSpells = availableSpells
          .filter(spell => spell.level > 0 && spell.level <= maxSpellLevel)
          .map(spell => spell.name)

        return [...cantrips, ...leveledSpells]
      },

      // === NOUVELLES ACTIONS POUR LES FLAGS ===

      // Gestion des flags narratifs
      setFlag: (flagName, value) => set((state) => ({
        gameFlags: GameFlagsHelpers.setFlag(state.gameFlags, flagName, value)
      })),

      setFlags: (flagUpdates) => set((state) => ({
        gameFlags: GameFlagsHelpers.setFlags(state.gameFlags, flagUpdates)
      })),

      getFlag: (flagName, defaultValue = false) => {
        const state = get()
        return GameFlagsHelpers.getFlag(state.gameFlags, flagName, defaultValue)
      },

      // Gestion des listes
      addToList: (listName, item) => set((state) => ({
        gameFlags: GameFlagsHelpers.addToList(state.gameFlags, listName, item)
      })),

      removeFromList: (listName, item) => set((state) => ({
        gameFlags: GameFlagsHelpers.removeFromList(state.gameFlags, listName, item)
      })),

      // Gestion des relations avec les PNJ
      updateNpcRelation: (npcId, change) => set((state) => {
        const newFlags = GameFlagsHelpers.updateNpcRelation(state.gameFlags, npcId, change)
        return { gameFlags: newFlags }
      }),

      getNpcRelation: (npcId) => {
        const state = get()
        return GameFlagsHelpers.getNpcRelation(state.gameFlags, npcId)
      },

      getNpcRelationStatus: (npcId) => {
        const state = get()
        return GameFlagsHelpers.getNpcRelationStatus(state.gameFlags, npcId)
      },

      // Gestion de la réputation
      updateReputation: (change) => set((state) => ({
        gameFlags: GameFlagsHelpers.updateReputation(state.gameFlags, change)
      })),


      updateFactionReputation: (factionId, change) => {
        set(state => ({
          gameFlags: {
            ...state.gameFlags,
            factionReputation: {
              ...state.gameFlags.factionReputation,
              [factionId]: (state.gameFlags.factionReputation[factionId] || 0) + change
            }
          }
        }))
      },

      // Gestion des choix majeurs
      addMajorChoice: (choiceId, description, sceneId = null) => set((state) => {
        const currentSceneId = sceneId || state.currentScene
        const newFlags = GameFlagsHelpers.addMajorChoice(
          state.gameFlags,
          choiceId,
          description,
          currentSceneId
        )
        return { gameFlags: newFlags }
      }),

      // Gestion des lieux et quêtes
      visitLocation: (locationId) => set((state) => ({
        gameFlags: GameFlagsHelpers.visitLocation(state.gameFlags, locationId)
      })),

      completeQuest: (questId) => set((state) => ({
        gameFlags: GameFlagsHelpers.completeQuest(state.gameFlags, questId)
      })),

      isQuestCompleted: (questId) => {
        const state = get()
        return GameFlagsHelpers.isQuestCompleted(state.gameFlags, questId)
      },

      // Obtenir l'état complet du jeu pour les conditions
      getGameState: () => {
        const state = get()
        return {
          flags: state.gameFlags,
          character: null, // Sera fourni par characterStore
          currentScene: state.currentScene
        }
      },

      // Méthode pour appliquer des conséquences d'actions
      applyConsequences: (consequences) => {
        if (!consequences) return

        const { setFlags, updateReputation, addToList, updateNpcRelation, addMajorChoice, visitLocation, updateFactionReputation } = get()

        // Appliquer les flags
        if (consequences.flags) {
          setFlags(consequences.flags)
        }
        if (consequences.factionReputation) {
          Object.entries(consequences.factionReputation).forEach(([factionId, change]) => {
            updateFactionReputation(factionId, change)
          })
        }
        // Appliquer le changement de réputation
        if (typeof consequences.reputation === 'number') {
          updateReputation(consequences.reputation)
        }

        // Visiter un lieu
        if (consequences.visitLocation) {
          visitLocation(consequences.visitLocation)
        }

        // Ajouter des items à l'inventaire via characterStore
        if (consequences.items && Array.isArray(consequences.items)) {
          try {
            // Import statique maintenant que la dépendance circulaire est résolue
            const { addItemToInventory } = useCharacterStore.getState()
            const { addCombatMessage } = get()

            // Utiliser DataService pour traiter les récompenses d'items
            DataService.processItemRewards(
              consequences.items,
              addItemToInventory,
              addCombatMessage
            )
          } catch (error) {
            console.error('Erreur lors de l\'ajout d\'items:', error)
          }
        }

        // Ajouter des compagnons de manière asynchrone mais attendue
        if (consequences.companions && Array.isArray(consequences.companions)) {
          try {
            // Import statique maintenant que la dépendance circulaire est résolue
            const { addCompanion, setActiveCompanions } = useCharacterStore.getState()
            const { addCombatMessage } = get()
            consequences.companions.forEach(companionId => {
              // Ajouter aux flags du jeu
              addToList('companions', companionId)

              // Ajouter au store des personnages pour qu'il apparaisse réellement
              const companionData = companions[companionId]
              if (companionData) {
                const companionWithId = {
                  ...companionData,
                  id: companionId.toLowerCase()
                }
                addCompanion(companionWithId)

                // Mettre à jour les compagnons actifs
                const currentStore = useCharacterStore.getState()
                const newActiveCompanions = [...(currentStore.activeCompanions || []), companionWithId.id]
                setActiveCompanions(newActiveCompanions)


                addCombatMessage(
                  `${companionData.name} te rejoint dans ton aventure !`,
                  'upgrade'
                )
              } else {
                console.error(`❌ Compagnon '${companionId}' introuvable dans companions.js`)
              }
            })
          } catch (error) {
            console.error('Erreur lors du recrutement du compagnon:', error)
          }
        }

        // Mettre à jour les relations PNJ
        if (consequences.npcRelations) {
          Object.entries(consequences.npcRelations).forEach(([npcId, change]) => {
            updateNpcRelation(npcId, change)
          })
        }

        // Ajouter à l'historique des choix majeurs
        if (consequences.majorChoice) {
          addMajorChoice(
            consequences.majorChoice.id,
            consequences.majorChoice.description,
            consequences.majorChoice.sceneId
          )
        }
      },

      // Debug des flags
      debugFlags: () => {
        const state = get()
        GameFlagsHelpers.debugFlags(state.gameFlags)
      }
    }),
    { name: 'game-store' }
  )
)

// Sélecteurs optimisés
export const gameSelectors = {
  isInCombat: (state) => false, // Plus de combats en tant que scènes - utiliser combatStore à la place

  isResting: (state) =>
    state.isShortResting || state.isLongResting,

  canProgress: (state) =>
    !state.isShortResting && !state.isLongResting,

  getCurrentPhase: (state) => state.gamePhase,

  // Utiliser directement combatLog, le composant gérera le slicing avec useMemo
  getCombatLog: (state) => state.combatLog,

  hasMessages: (state) => state.combatLog.length > 0,

  // Nouveaux sélecteurs pour les flags
  getGameFlags: (state) => state.gameFlags,

  getFlag: (state, flagName, defaultValue = false) =>
    GameFlagsHelpers.getFlag(state.gameFlags, flagName, defaultValue),

  getReputation: (state) => state.gameFlags.reputation || 0,

  getFactionReputation: (factionId) =>
    get().gameFlags.factionReputation?.[factionId] || 0,

  getCompanions: (state) => state.gameFlags.companions || [],

  getNpcRelation: (state, npcId) =>
    GameFlagsHelpers.getNpcRelation(state.gameFlags, npcId),

  isQuestCompleted: (state, questId) =>
    GameFlagsHelpers.isQuestCompleted(state.gameFlags, questId),

  hasVisitedLocation: (state, locationId) =>
    (state.gameFlags.visitedLocations || []).includes(locationId),

  // Sélecteur pour obtenir l'état complet du jeu (pour StoryService)
  getGameStateForStory: (state, character = null) => ({
    flags: state.gameFlags,
    character: character,
    currentScene: state.currentScene
  })
}