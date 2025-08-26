import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { CharacterManager } from '../services/characterManager';
import { SpellServiceUnified } from '../services/SpellServiceUnified.js';
import { CombatEngine } from '../services/combatEngine';
import { GameUtils } from '../utils/GameUtils';
import { items } from '../data/items';
import { weapons } from '../data/weapons';
import { characterTemplates } from '../data/characterTemplates';
import { CombatEffects } from '../services/combatEffects.js';
// Store pour la gestion des personnages (joueur et compagnon)
// Helper pour synchroniser playerCharacter et selectedCharacter
const syncCharacter = (updates) => {
  if (updates.playerCharacter) {
    updates.selectedCharacter = updates.playerCharacter;
  }
  return updates;
};

export const useCharacterStore = create(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // État des personnages
        playerCharacter: characterTemplates.wizard, // null en prod, characterTemplates.wizard en dev
        playerCompanions: [], // Nouveau: Array de tous les compagnons (max 3)
        activeCompanions: [], // Compagnons actuellement déployés en mission/combat
        selectedCharacter: null, // OBSOLÈTE: Alias pour playerCharacter pour compatibilité avec les composants - utiliser playerCharacter directement

        // États temporaires
        activeEffects: [],
        temporaryModifiers: {},

        // Progression
        experienceGains: [],
        levelUpPending: false,
        levelUpData: null,

        // === ACTIONS DE BASE ===

        // Définir le personnage joueur
        setPlayerCharacter: (character) => set(syncCharacter({
          playerCharacter: character ? GameUtils.deepClone(character) : null
        })),


        // === GESTION MULTIPLE DES COMPAGNONS ===

        // Ajouter un compagnon (max 3)
        addCompanion: (companionData) => set((state) => {
          if (state.playerCompanions.length >= 3) {
            console.warn('Maximum 3 compagnons autorisés');
            return state;
          }

          const companion = GameUtils.deepClone(companionData);
          companion.id = companion.id || companion.name || GameUtils.generateId('companion');

          return {
            playerCompanions: [...state.playerCompanions, companion]
          };
        }),

        // Retirer un compagnon
        removeCompanion: (companionId) => set((state) => ({
          playerCompanions: state.playerCompanions.filter(c => c.id !== companionId),
          activeCompanions: state.activeCompanions.filter(id => id !== companionId)
        })),

        // Définir les compagnons actifs (ceux qui participent aux missions)
        setActiveCompanions: (companionIds) => set((state) => {
          // Vérifier que tous les IDs existent
          const validIds = companionIds.filter(id =>
            state.playerCompanions.some(c => c.id === id)
          );
          return { activeCompanions: validIds };
        }),

        // Obtenir un compagnon par ID
        getCompanion: (companionId) => {
          const { playerCompanions } = get();
          return playerCompanions.find(c => c.id === companionId);
        },

        // Obtenir les compagnons actifs
        getActiveCompanions: () => {
          const { playerCompanions, activeCompanions } = get();
          return activeCompanions.map(id =>
            playerCompanions.find(c => c.id === id)
          ).filter(Boolean);
        },

        // Mise à jour générique d'un personnage
        updatePlayerCharacter: (updates) => set((state) => ({
          playerCharacter: state.playerCharacter
            ? { ...state.playerCharacter, ...updates }
            : null
        })),


        // Mettre à jour un compagnon par ID
        updateCompanion: (companionId, updates) => set((state) => ({
          playerCompanions: state.playerCompanions.map(companion =>
            companion.id === companionId
              ? { ...companion, ...updates }
              : companion
          )
        })),

        // === GESTION DES DÉGÂTS ET SOINS ===

        takeDamagePlayer: (damage) => set((state) => {
          if (!state.playerCharacter) return state;

          const updatedCharacter = CharacterManager.takeDamage(state.playerCharacter, damage);
          return syncCharacter({ playerCharacter: updatedCharacter });
        }),


        // Dégâts à un compagnon par ID
        takeDamageCompanionById: (companionId, damage) => set((state) => {
          const companion = state.playerCompanions.find(c => c.id === companionId);
          if (!companion) return state;

          const updatedCompanion = CharacterManager.takeDamage(companion, damage);

          return {
            playerCompanions: state.playerCompanions.map(c =>
              c.id === companionId ? updatedCompanion : c
            )
          };
        }),

        healPlayer: (healing) => set((state) => {
          if (!state.playerCharacter) return state;

          const updatedCharacter = CharacterManager.heal(state.playerCharacter, healing);
          return syncCharacter({ playerCharacter: updatedCharacter });
        }),


        // Soigner un compagnon par ID
        healCompanionById: (companionId, healing) => set((state) => {
          const companion = state.playerCompanions.find(c => c.id === companionId);
          if (!companion) return state;

          const updatedCompanion = CharacterManager.heal(companion, healing);

          return {
            playerCompanions: state.playerCompanions.map(c =>
              c.id === companionId ? updatedCompanion : c
            )
          };
        }),

        // === GESTION DES REPOS ===

        shortRestPlayer: (hitDiceSpent = 0) => set((state) => {
          if (!state.playerCharacter) return state;

          const updatedCharacter = CharacterManager.shortRest(state.playerCharacter, hitDiceSpent);
          return syncCharacter({ playerCharacter: updatedCharacter });
        }),

        longRestPlayer: () => set((state) => {
          if (!state.playerCharacter) return state;

          const updatedCharacter = CharacterManager.longRest(state.playerCharacter);
          return syncCharacter({ playerCharacter: updatedCharacter });
        }),


        // Repos long pour un compagnon par ID
        longRestCompanionById: (companionId) => set((state) => {
          const companion = state.playerCompanions.find(c => c.id === companionId);
          if (!companion) return state;

          const updatedCompanion = CharacterManager.longRest(companion);

          return {
            playerCompanions: state.playerCompanions.map(c =>
              c.id === companionId ? updatedCompanion : c
            )
          };
        }),

        // Repos complet (joueur + tous les compagnons)
        longRestAll: () => {
          const { longRestPlayer, playerCompanions } = get();
          longRestPlayer();

          // Repos pour tous les compagnons
          playerCompanions.forEach(companion => {
            get().longRestCompanionById(companion.id);
          });
        },

        // Dépenser un dé de vie pendant un repos court
        spendHitDie: (targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;

          // Utiliser CombatEngine pour les calculs de guérison
          const healingResult = CombatEngine.calculateHitDieHealing(character);

          if (!healingResult.canHeal) {
            return state; // Aucune guérison possible
          }

          const updatedCharacter = healingResult.character;

          return syncCharacter({ playerCharacter: updatedCharacter });
        }),

        // === GESTION DE L'EXPÉRIENCE ET NIVEAUX ===

        addExperience: (xp, targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;
          const updatedCharacter = CharacterManager.addExperience(character, xp);
          const newState = { ...state };

          // Vérifier si montée de niveau
          if (updatedCharacter.level > character.level) {
            newState.levelUpPending = true;
            newState.levelUpData = {
              character: targetCharacter,
              oldLevel: character.level,
              newLevel: updatedCharacter.level,
              hpGained: updatedCharacter.maxHP - character.maxHP
            };
          }

          // Enregistrer le gain d'XP
          newState.experienceGains = [
            ...state.experienceGains,
            {
              id: GameUtils.generateId('xp'),
              amount: xp,
              target: targetCharacter,
              timestamp: new Date()
            }
          ];

          newState.playerCharacter = updatedCharacter;
          // Synchroniser selectedCharacter
          newState.selectedCharacter = updatedCharacter;

          return newState;
        }),

        confirmLevelUp: () => set((state) => ({
          levelUpPending: false,
          levelUpData: null
        })),

        // === GESTION DES SORTS ===

        /**
         * Lance un sort avec le système unifié (combat/exploration)
         * @param {Object|string} spell - Le sort à lancer
         * @param {Object} options - Options de lancement
         * @returns {Object} Résultat du lancement
         */
        castSpellPlayer: (spell, options = {}) => {
          const state = get();
          if (!state.playerCharacter) {
            return { success: false, messages: ['Aucun personnage joueur'] };
          }

          // ✅ NOUVEAU: Injection de la méthode d'application d'effet
          const spellService = new SpellServiceUnified({
            applyEffect: get().applyEffectToPlayer,  // Injection de dépendance
            combatStore: null,  // Non utilisé en exploration
            gameStore: null     // Pour les effets environnementaux si nécessaire
          });

          const spellOptions = { 
            ...options, 
            context: options.context || 'exploration'
          };

          // Délégation complète au service unifié
          return spellService.castSpell(
            state.playerCharacter, 
            spell, 
            [], 
            spellOptions
          );
        },

        // Appliquer un effet de buff sur le joueur (pour exploration)
        applyBuffToPlayer: (effect) => {
          set((state) => {
            // Tu dois t'assurer que le personnage existe avant de continuer
            if (!state.playerCharacter) {
              console.error("Erreur: playerCharacter est null.");
              return state;
            }

            // Créer une copie de l'objet personnage
            const updatedCharacter = { ...state.playerCharacter };

            // Appliquer l'effet. Ta méthode applyEffect dans CombatEffects est correcte,
            // car elle modifie l'objet en place (comme une 'mutation').
            // C'est pourquoi on lui passe la copie updatedCharacter.
            CombatEffects.applyEffect(updatedCharacter, effect.type, effect.duration, effect.source);

            // Recalculer la CA après l'ajout de l'effet
            // Ici, tu dois passer l'objet mis à jour
            const newAC = CombatEffects.calculateTotalAC(updatedCharacter);

            // Mettre à jour la propriété ac de la copie
            updatedCharacter.ac = newAC;

            return {
              ...state,
              playerCharacter: updatedCharacter,
              selectedCharacter: updatedCharacter,
            };
          });
        },

        // =============================================
        // 🧪 NOUVELLE MÉTHODE UNIFIÉE (Refactorisation)
        // =============================================

        /**
         * Point d'entrée unique pour tous les effets
         * Remplace applyBuffToPlayer avec une approche immutable
         * @param {Object} effectData - Objet d'effet complet préparé par les services
         * @param {string} effectData.type - Type d'effet (doit exister dans CombatEffects.EFFECT_TYPES)
         * @param {number} effectData.duration - Durée en secondes
         * @param {string} effectData.source - Source de l'effet
         * @param {Object} [effectData.properties] - Propriétés spécifiques à l'effet
         */
        applyEffectToPlayer: (effectData) => {
          set((state) => {
            if (!state.playerCharacter) {
              console.error('applyEffectToPlayer: Aucun personnage joueur');
              return state;
            }
            
            try {
              // Délégation complète à la fonction pure
              const updatedCharacter = CombatEffects.applyEffectPure(
                state.playerCharacter,
                effectData
              );
              
              return {
                ...state,
                playerCharacter: updatedCharacter,
                selectedCharacter: updatedCharacter
              };
            } catch (error) {
              console.error('Erreur lors de l\'application de l\'effet:', error);
              return state; // Pas de changement en cas d'erreur
            }
          });
        },

        // =============================================
        // 🚫 MÉTHODE DÉPRÉCIÉE (À supprimer après migration)
        // =============================================

        /**
         * @deprecated Utiliser applyEffectToPlayer à la place
         * Cette méthode utilise l'ancienne approche avec mutations
         */
        applyBuffToPlayer: (effect) => {
          console.warn('applyBuffToPlayer est déprécié. Utiliser applyEffectToPlayer avec la nouvelle structure.');
          
          // Conversion vers le nouveau format pour compatibilité temporaire
          const effectData = {
            type: effect.type || 'blessed', // Fallback pour les anciens "buff"
            duration: effect.duration || 3600,
            source: effect.source || 'unknown',
            properties: effect.properties || {}
          };
          
          // Déléguer à la nouvelle méthode
          get().applyEffectToPlayer(effectData);
        },

        consumeSpellSlot: (spellLevel, targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;

          const updatedCharacter = CharacterManager.consumeSpellSlot(character, spellLevel);

          return syncCharacter({ playerCharacter: updatedCharacter });
        }),

        prepareSpell: (spellName, targetCharacter = 'player') => {
          const state = get();
          const character = state.playerCharacter;

          if (!character) {
            return { success: false, message: `Aucun personnage ${targetCharacter} trouvé` };
          }

          const maxPrepared = CharacterManager.getMaxPreparedSpells(character);
          const preparedSpells = character.spellcasting?.preparedSpells || [];

          if (preparedSpells.length >= maxPrepared) {
            return { success: false, message: `Limite de sorts préparés atteinte (${maxPrepared})` };
          }

          if (preparedSpells.includes(spellName)) {
            return { success: false, message: `${spellName} est déjà préparé` };
          }

          const updatedCharacter = {
            ...character,
            spellcasting: {
              ...character.spellcasting,
              preparedSpells: [...preparedSpells, spellName]
            }
          };

          set(syncCharacter({ playerCharacter: updatedCharacter }));

          return { success: true, message: `${spellName} préparé avec succès` };
        },

        unprepareSpell: (spellName, targetCharacter = 'player') => {
          const state = get();
          const character = state.playerCharacter;

          if (!character) {
            return { success: false, message: `Aucun personnage ${targetCharacter} trouvé` };
          }

          const preparedSpells = character.spellcasting?.preparedSpells || [];

          if (!preparedSpells.includes(spellName)) {
            return { success: false, message: `${spellName} n'est pas préparé.` };
          }

          const updatedCharacter = {
            ...character,
            spellcasting: {
              ...character.spellcasting,
              preparedSpells: preparedSpells.filter(s => s !== spellName)
            }
          };

          set(syncCharacter({ playerCharacter: updatedCharacter }));

          return { success: true, message: `${spellName} retiré des sorts préparés` };
        },

        // === GESTION DE L'ÉQUIPEMENT ===

        equipItem: (itemId, targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;

          // Chercher l'objet dans l'inventaire OU dans weapons.js
          let item = character.inventory?.find(invItem =>
            (invItem.id || invItem.name || invItem.nom) === itemId
          );

          // Si pas trouvé dans l'inventaire, chercher dans weapons.js
          if (!item) {
            const weaponData = weapons[itemId];
            if (weaponData) {
              item = { ...weaponData, id: itemId };
            }
          }

          if (!item) return state;

          // Vérifier si l'objet peut être équipé
          const itemType = item.type;
          if (!['weapon', 'arme', 'armor', 'armure', 'accessory', 'accessoire'].includes(itemType)) {
            return state;
          }

          // Initialiser l'équipement si nécessaire
          const currentEquipment = character.equipment || {};
          let newEquipment = { ...currentEquipment };

          // Déterminer le slot d'équipement
          let slot = null;
          if (itemType === 'weapon' || itemType === 'arme') {
            slot = 'mainHand';
          } else if (itemType === 'armor' || itemType === 'armure') {
            slot = 'body';
          } else if (itemType === 'accessory' || itemType === 'accessoire') {
            slot = 'accessory';
          }

          if (!slot) return state;

          // Déséquiper l'objet actuel si il y en a un
          if (newEquipment[slot]) {
            // Si l'ancien objet était dans l'inventaire, le remettre
            const oldEquipmentId = newEquipment[slot];
            const wasInInventory = character.inventory?.some(invItem =>
              (invItem.id || invItem.name || invItem.nom) === oldEquipmentId
            );

            let newInventory = [...(character.inventory || [])];
            if (wasInInventory) {
              // Récupérer les données complètes de l'ancien objet
              const oldWeaponData = weapons[oldEquipmentId];
              if (oldWeaponData) {
                newInventory.push({ ...oldWeaponData, id: oldEquipmentId });
              }
            }

            // Équiper le nouvel objet (stocker seulement l'ID)
            newEquipment[slot] = itemId;

            // Retirer le nouvel objet de l'inventaire s'il y était
            newInventory = newInventory.filter(invItem =>
              (invItem.id || invItem.name || invItem.nom) !== itemId
            );

            const updates = {
              inventory: newInventory,
              equipment: newEquipment
            };

            return syncCharacter({ playerCharacter: { ...character, ...updates } });
          } else {
            // Équiper directement (stocker seulement l'ID)
            newEquipment[slot] = itemId;

            // Retirer de l'inventaire s'il y était
            const newInventory = character.inventory ? character.inventory.filter(invItem =>
              (invItem.id || invItem.name || invItem.nom) !== itemId
            ) : [];

            const updates = {
              inventory: newInventory,
              equipment: newEquipment
            };

            return syncCharacter({ playerCharacter: { ...character, ...updates } });
          }
        }),

        unequipItem: (itemId, targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character || !character.equipment) return state;

          // Chercher l'objet équipé (maintenant ce sont des IDs)
          const equipment = character.equipment;
          let foundSlot = null;

          for (const [slot, equippedId] of Object.entries(equipment)) {
            if (equippedId === itemId) {
              foundSlot = slot;
              break;
            }
          }

          if (!foundSlot) return state;

          // Retirer de l'équipement
          const newEquipment = { ...equipment };
          delete newEquipment[foundSlot];

          // Remettre dans l'inventaire avec les données complètes
          const weaponData = weapons[itemId];
          const newInventory = [...(character.inventory || [])];

          if (weaponData) {
            newInventory.push({ ...weaponData, id: itemId });
          }

          const updates = {
            inventory: newInventory,
            equipment: newEquipment
          };

          return syncCharacter({ playerCharacter: { ...character, ...updates } });
        }),

        // === GESTION DE L'INVENTAIRE ===

        addItemToInventory: (item, targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;

          const currentInventory = character.inventory || [];

          // Identifier l'objet par son nom/type pour le groupement
          const itemKey = item.id || item.name || item.nom;
          const quantityToAdd = item.quantity || 1;

          // Chercher si l'objet existe déjà dans l'inventaire
          const existingItemIndex = currentInventory.findIndex(invItem => {
            const invItemKey = invItem.id || invItem.name || invItem.nom;
            return invItemKey === itemKey;
          });

          let newInventory;

          if (existingItemIndex >= 0) {
            // L'objet existe déjà, on augmente sa quantité
            newInventory = [...currentInventory];
            newInventory[existingItemIndex] = {
              ...newInventory[existingItemIndex],
              quantity: (newInventory[existingItemIndex].quantity || 1) + quantityToAdd
            };
          } else {
            // Nouvel objet, on l'ajoute à l'inventaire
            newInventory = [...currentInventory, {
              ...item,
              id: item.id || item.name || item.nom || GameUtils.generateId('item'),
              quantity: quantityToAdd
            }];
          }

          const updates = { inventory: newInventory };

          return syncCharacter({ playerCharacter: { ...character, ...updates } });
        }),

        removeItemFromInventory: (itemId, targetCharacter = 'player', quantityToRemove = 1) => set((state) => {
          const character = state.playerCharacter;
          if (!character) return state;

          const currentInventory = character.inventory || [];
          const itemIndex = currentInventory.findIndex(item =>
            (item.id || item.name || item.nom) === itemId
          );

          if (itemIndex === -1) return state; // Objet non trouvé

          let newInventory = [...currentInventory];
          const item = newInventory[itemIndex];
          const currentQuantity = item.quantity || 1;

          if (currentQuantity <= quantityToRemove) {
            // Supprimer complètement l'objet si la quantité à retirer est >= à la quantité actuelle
            newInventory.splice(itemIndex, 1);
          } else {
            // Réduire la quantité
            newInventory[itemIndex] = {
              ...item,
              quantity: currentQuantity - quantityToRemove
            };
          }

          const updates = { inventory: newInventory };

          return syncCharacter({ playerCharacter: { ...character, ...updates } });
        }),

        useItem: (itemId, targetCharacter = 'player') => {
          // Cette fonction retourne des informations pour que le composant puisse afficher le bon message
          const character = get().playerCharacter;
          if (!character) return { success: false, message: 'Personnage non trouvé' };

          // D'abord chercher l'item dans l'inventaire du personnage
          const item = character.inventory.find(i => (i.id || i.name || i.nom) === itemId);
          if (!item) return { success: false, message: 'Objet non trouvé dans l\'inventaire' };

          // Chercher la définition de l'objet dans data/items.js
          const itemData = items[itemId] || items[item.id] || items[item.name] || items[item.nom];

          if (itemData && itemData.use) {
            try {
              // Calculer l'effet avant de modifier le personnage
              const oldHP = character.currentHP;

              // Utiliser la fonction use de l'objet
              const updatedCharacter = itemData.use(character);

              // Calculer la différence pour les potions de soin
              const healAmount = updatedCharacter.currentHP - oldHP;

              // Mettre à jour le personnage
              set({
                playerCharacter: updatedCharacter,
                selectedCharacter: updatedCharacter
              });

              // Retirer UNE SEULE unité de l'objet s'il est consommable
              if (itemData.type === 'consumable') {
                get().removeItemFromInventory(itemId, targetCharacter, 1);
              }

              // Retourner le message pour affichage avec le healAmount calculé
              const message = typeof itemData.message === 'function' ? itemData.message(healAmount) : itemData.message;
              return { success: true, message, item: itemData };

            } catch (error) {
              console.error('Erreur lors de l\'utilisation de l\'objet:', error);
              return { success: false, message: `Erreur: ${error.message}` };
            }
          } else {
            // Fallback vers l'ancien système avec effects
            if (item.effects) {
              let updatedCharacter = { ...character };
              let message = `${item.name || item.nom} utilisé`;

              item.effects.forEach(effect => {
                switch (effect.type) {
                  case 'heal':
                    const healAmount = effect.value;
                    updatedCharacter.currentHP = Math.min(character.maxHP, character.currentHP + healAmount);
                    message = `Vous récupérez ${healAmount} PV`;
                    break;
                  default:
                    console.warn(`Unknown item effect type: ${effect.type}`);
                }
              });

              // Mettre à jour le personnage
              set({
                playerCharacter: updatedCharacter,
                selectedCharacter: updatedCharacter
              });

              // Retirer UNE SEULE unité de l'objet s'il est consommable
              if (item.consumable || item.type === 'consumable') {
                get().removeItemFromInventory(itemId, targetCharacter, 1);
              }

              return { success: true, message };
            }

            return { success: false, message: 'Cet objet ne peut pas être utilisé' };
          }
        },

        // === GESTION DES EFFETS TEMPORAIRES ===

        addEffect: (effect) => set((state) => ({
          activeEffects: [...state.activeEffects, {
            ...effect,
            id: effect.id || GameUtils.generateId('effect'),
            startTime: new Date()
          }]
        })),

        removeEffect: (effectId) => set((state) => ({
          activeEffects: state.activeEffects.filter(effect => effect.id !== effectId)
        })),

        clearExpiredEffects: () => set((state) => {
          const now = new Date();
          return {
            activeEffects: state.activeEffects.filter(effect => {
              if (!effect.duration) return true; // Permanent effects
              const elapsed = now - effect.startTime;
              return elapsed < effect.duration;
            })
          };
        }),

        // === UTILITAIRES ===

        // Nettoyer les doublons dans l'inventaire en regroupant par nom/id
        consolidateInventory: (targetCharacter = 'player') => set((state) => {
          const character = state.playerCharacter;
          if (!character || !character.inventory) return state;

          const consolidatedInventory = [];
          const itemMap = new Map();

          // Regrouper les objets par nom/id
          character.inventory.forEach(item => {
            const itemKey = item.id || item.name || item.nom;
            if (itemMap.has(itemKey)) {
              // Augmenter la quantité de l'objet existant
              const existingItem = itemMap.get(itemKey);
              existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            } else {
              // Nouveau type d'objet
              itemMap.set(itemKey, {
                ...item,
                quantity: item.quantity || 1
              });
            }
          });

          // Convertir la Map en array
          itemMap.forEach(item => consolidatedInventory.push(item));

          const updates = { inventory: consolidatedInventory };

          return syncCharacter({ playerCharacter: { ...character, ...updates } });
        }),

        resetCharacters: () => set({
          playerCharacter: null,
          playerCompanions: [],
          activeCompanions: [],
          activeEffects: [],
          temporaryModifiers: {},
          experienceGains: [],
          levelUpPending: false,
          levelUpData: null
        }),

        clearExperienceGains: () => set({ experienceGains: [] })
      }),
      { name: 'character-store' }
    )
  )
);

// Sélecteurs optimisés
export const characterSelectors = {
  getPlayerCharacter: (state) => state.playerCharacter,

  // Nouveaux sélecteurs pour compagnons multiples
  getAllCompanions: (state) => state.playerCompanions,

  getActiveCompanions: (state) =>
    state.activeCompanions.map(id =>
      state.playerCompanions.find(c => c.id === id)
    ).filter(Boolean),

  getCompanionById: (state, companionId) =>
    state.playerCompanions.find(c => c.id === companionId),

  getCompanionsByRole: (state, role) =>
    state.playerCompanions.filter(c => c.role === role),

  hasCompanions: (state) => state.playerCompanions.length > 0,

  hasActiveCompanions: (state) => state.activeCompanions.length > 0,

  isPlayerAlive: (state) => state.playerCharacter?.currentHP > 0,

  isCompanionAliveById: (state, companionId) => {
    const companion = state.playerCompanions.find(c => c.id === companionId);
    return companion?.currentHP > 0;
  },

  getPlayerHPPercentage: (state) =>
    state.playerCharacter
      ? Math.round((state.playerCharacter.currentHP / state.playerCharacter.maxHP) * 100)
      : 0,

  canLevelUp: (state) => state.levelUpPending,

  getActiveEffects: (state) => state.activeEffects,

  hasActiveEffects: (state) => state.activeEffects.length > 0,

  getRecentExperienceGains: (state, count = 5) =>
    state.experienceGains.slice(-count),

  canCastSpells: (state) => state.playerCharacter?.spellcasting !== undefined,

  getAvailableSpellSlots: (state) =>
    state.playerCharacter?.spellcasting?.slotsRemaining || {},

  getPreparedSpells: (state) =>
    state.playerCharacter?.spellcasting?.preparedSpells || [],

  getInventoryItems: (state) => state.playerCharacter?.inventory || [],

  hasItem: (state, itemId) =>
    state.playerCharacter?.inventory?.some(item => item.id === itemId) || false
};

// Hook personnalisé pour un accès facile
export const useCharacter = () => useCharacterStore(state => state);
export const useCharacterActions = () => useCharacterStore(state => state);
export const useCharacterSelector = (selector) => useCharacterStore(selector);
