/**
 * SceneManager - Gestionnaire centralisé pour le nouveau système de scènes unifié
 * Remplace la logique dispersée dans App.jsx et gère le chargement à la demande
 */

import { SCENE_TYPES, PROCEDURAL_TYPES } from '../types/story';
import { StoryService } from './StoryService';
import { prologueScenes } from '../data/scenes/prologue';
import { acte1Scenes } from '../data/scenes/acte1';
import { testProceduralScenes } from '../data/scenes/test_procedural';
import { TimeService } from './TimeService';
import { useTimeStore } from '../stores/timeStore';
import { ProceduralGenerator } from './ProceduralGenerator';
// import { newScenes } from '../data/scenes_examples';

export class SceneManager {
  // Cache des scènes chargées
  static loadedScenes = new Map();
  
  // Modules de scènes chargés (pour le lazy loading futur)
  static loadedModules = new Map();
  
  // Scène d'erreur par défaut
  static ERROR_SCENE = {
    id: 'error',
    type: SCENE_TYPES.TEXT,
    content: {
      text: "Une erreur est survenue. La scène demandée n'existe pas.",
      title: "Erreur"
    },
    choices: [
      {
        text: "Retourner au menu principal",
        next: "prologue_heritage"
      }
    ]
  };

  /**
   * Récupère une scène par son ID (y compris génération procédurale)
   * @param {string} sceneId - L'identifiant de la scène
   * @param {Object} context - Contexte pour la génération procédurale
   * @param {Object} generatedScene - Scène pré-générée à stocker
   * @returns {Object|null} La scène trouvée ou générée
   */
  static getOrGenerateScene(sceneId, context = {}, generatedScene = null) {
    // Si une scène pré-générée est fournie, la stocker et la retourner
    if (generatedScene) {
      console.log('📦 Stockage de scène générée:', sceneId, generatedScene.type);
      this.loadedScenes.set(sceneId, generatedScene);
      return generatedScene;
    }
    
    // Vérifier le cache en premier - IMPORTANT pour les retours au hub !
    if (this.loadedScenes.has(sceneId)) {
      console.log('🔄 Récupération scène depuis cache:', sceneId);
      const cachedScene = this.loadedScenes.get(sceneId);
      // FORCER le retour de la scène cachée pour éviter la re-génération
      if (cachedScene) {
        return cachedScene;
      }
    }

    // Si l'ID correspond à un pattern procédural, générer la scène
    if (this.isProceduralSceneId(sceneId)) {
      const generated = this.generateProceduralScene(sceneId, context);
      // S'assurer que la scène est mise en cache immédiatement
      if (generated) {
        console.log('💾 Mise en cache immédiate de la scène générée:', sceneId);
        this.loadedScenes.set(sceneId, generated);
      }
      return generated;
    }

    // Sinon, charger depuis le système normal
    return this.loadFromNewSystem(sceneId);
  }

  /**
   * Méthode legacy pour compatibilité - utilise getOrGenerateScene
   * @param {string} sceneId - L'identifiant de la scène
   * @returns {Object|null} La scène trouvée ou null
   */
  static getScene(sceneId) {
    return this.getOrGenerateScene(sceneId);
  }


  /**
   * Charge une scène depuis le nouveau système de fichiers modulaire
   * @param {string} sceneId 
   * @returns {Object}
   */
  static loadFromNewSystem(sceneId) {
    try {
      // Charger les scènes du prologue
      if (prologueScenes[sceneId]) {
       
        const scene = prologueScenes[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }

      // Charger les scènes d'acte 1
      if (acte1Scenes[sceneId]) {
   
        const scene = acte1Scenes[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }

      // Charger les scènes de test procédural
      if (testProceduralScenes[sceneId]) {
        const scene = testProceduralScenes[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }

      // TODO: Ajouter d'autres modules de scènes ici quand ils seront migrés
      // if (villageScenes[sceneId]) return villageScenes[sceneId];
      // if (forestScenes[sceneId]) return forestScenes[sceneId];
      
      // Scène non trouvée
      console.warn(`Scène "${sceneId}" non trouvée dans le nouveau système`);
      return this.ERROR_SCENE;
    } catch (error) {
      console.error(`Erreur lors du chargement de la scène "${sceneId}":`, error);
      return this.ERROR_SCENE;
    }
  }


  /**
   * Valide qu'une scène respecte le nouveau format
   * @param {Object} scene - Scène à valider
   * @returns {Object} Résultat de validation
   */
  static validateScene(scene) {
    const errors = [];

    // Validations obligatoires
    if (!scene.id) errors.push('Scene must have an id');
    if (!scene.type) errors.push('Scene must have a type');
    if (!Object.values(SCENE_TYPES).includes(scene.type)) {
      errors.push(`Invalid scene type: ${scene.type}`);
    }
    if (!scene.content?.text) errors.push('Scene must have content.text');
    if (!scene.choices || !Array.isArray(scene.choices)) {
      errors.push('Scene must have choices array');
    }

    // Validation des choix
    scene.choices?.forEach((choice, index) => {
      if (!choice.text) errors.push(`Choice ${index} must have text`);
      if (!choice.next) errors.push(`Choice ${index} must have next`);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtient les choix disponibles pour une scène selon l'état du jeu
   * @param {Object} scene - La scène
   * @param {Object} gameState - État du jeu
   * @returns {Array} Choix disponibles
   */
  static getAvailableChoices(scene, gameState) {
    if (!scene.choices) return [];
    
    return scene.choices.filter(choice => {
      if (!choice.condition) return true;
      return StoryService.evaluateCondition(choice.condition, gameState);
    });
  }

  /**
   * Obtient le texte d'une scène avec interpolation
   * @param {Object} scene - La scène
   * @param {Object} gameState - État du jeu
   * @returns {string} Texte interpolé
   */
  static getSceneText(scene, gameState) {
    return StoryService.getSceneText(scene, gameState);
  }

  /**
   * Prépare les données de combat à partir d'une scène
   * Centralise la logique de préparation qui était dispersée dans App.jsx
   * @param {Object} scene - La scène de combat
   * @returns {Object} Données formatées pour le combat
   */
  static prepareCombatData(scene) {
    if (scene.type !== SCENE_TYPES.COMBAT) {
      throw new Error('Scene must be of type COMBAT');
    }

    // Validation des données requises
    if (!scene.enemies || !Array.isArray(scene.enemies)) {
      throw new Error('Combat scene must have enemies array');
    }

    // Préparer les données dans le format attendu par combatStore
    const combatData = {
      type: 'combat',
      enemies: scene.enemies,
      // Passer directement le tableau des positions - combatStore les gère
      enemyPositions: scene.enemyPositions || [],
      playerPosition: scene.playerPosition || null,
      companionPositions: scene.companionPositions || null,
      // Métadonnées additionnelles
      sceneId: scene.id,
      background: scene.content?.background,
      title: scene.content?.title,
      description: scene.content?.text
    };

    return combatData;
  }

  // =============================================
  // 🕐 GESTION TEMPORELLE INTÉGRÉE
  // =============================================

  /**
   * Traite la transition de scène avec progression temporelle automatique
   * @param {Object} fromScene - Scène d'origine
   * @param {Object} toScene - Scène de destination  
   * @param {Object} choice - Choix effectué par le joueur
   * @param {Object} context - Contexte additionnel
   * @returns {Object} Résultat de la transition
   */
  static processSceneTransition(fromScene, toScene, choice, context = {}) {
    const result = {
      success: true,
      timeAdvanced: 0,
      events: [],
      messages: []
    };

    try {
      // 1. Calculer le coût temporel de l'action
      const timeCost = this.calculateTransitionTimeCost(fromScene, toScene, choice, context);
      console.log(timeCost)
      if (timeCost > 0) {
        // 2. Avancer le temps dans le store
        const timeStore = useTimeStore.getState();
        const oldTime = { ...timeStore.currentTime };
        
        timeStore.advanceTimeByAction(this.getActionType(fromScene, toScene, choice), timeCost);
        
        const newTime = timeStore.currentTime;
        result.timeAdvanced = timeCost;
        
        // 3. Générer des événements temporels si nécessaire
        const timeEvents = TimeService.generateTimeEvents(oldTime, newTime, context);
        result.events = timeEvents;
        
        // 4. Messages informatifs pour le joueur
        if (timeCost >= 60) { // Plus d'une heure
          const hours = Math.floor(timeCost / 60);
          const minutes = timeCost % 60;
          let timeMessage = `Temps écoulé: ${hours}h`;
          if (minutes > 0) timeMessage += ` ${minutes}min`;
          
          result.messages.push({
            type: 'time_passage',
            text: timeMessage
          });
        }
        
        // 5. Messages d'événements temporels
        timeEvents.forEach(event => {
          if (event.message) {
            result.messages.push({
              type: 'time_event',
              text: event.message
            });
          }
        });
      }

      // 6. Vérifier les restrictions temporelles de la scène de destination
      const restrictions = this.checkTimeRestrictions(toScene, context);
      if (restrictions.length > 0) {
        result.messages.push(...restrictions.map(r => ({
          type: 'time_restriction',
          text: r
        })));
      }

    } catch (error) {
      console.error('Erreur lors du traitement temporel de la transition:', error);
      result.success = false;
    }

    return result;
  }

  /**
   * Calcule le coût temporel d'une transition de scène
   * @param {Object} fromScene - Scène d'origine
   * @param {Object} toScene - Scène de destination
   * @param {Object} choice - Choix effectué
   * @param {Object} context - Contexte additionnel
   * @returns {number} Coût en minutes
   */
  static calculateTransitionTimeCost(fromScene, toScene, choice, context) {
    // 1. Coût explicite dans les conséquences du choix
    if (choice?.consequences?.timeCost) {
      return choice.consequences.timeCost;
    }

    // 2. Coût selon le type de transition
    const transitionType = this.getTransitionType(fromScene, toScene);
    const baseCosts = {
      same_location: 5,      // Même lieu = 5 minutes
      local_move: 15,        // Déplacement local = 15 minutes
      travel: 120,           // Voyage = 2 heures
      exploration: 45,       // Exploration = 45 minutes
      combat: 30,            // Combat = 30 minutes
      dialogue: 10,          // Dialogue = 10 minutes
      rest: 0               // Repos géré séparément
    };

    let baseCost = baseCosts[transitionType] || baseCosts.local_move;

    // 3. Utiliser le TimeService pour calculs avancés
    baseCost = TimeService.calculateActionTimeCost(toScene, choice, {
      ...context,
      transitionType,
      fromScene,
      isNight: useTimeStore.getState().isNightTime()
    });

    // 4. Modificateurs contextuels
    const modifiers = this.getTimeCostModifiers(fromScene, toScene, context);
    const finalCost = Math.round(baseCost * modifiers.multiplier + modifiers.additive);

    return Math.max(0, finalCost);
  }

  /**
   * Détermine le type de transition entre deux scènes
   */
  static getTransitionType(fromScene, toScene) {
    // Même lieu
    if (fromScene?.metadata?.location === toScene?.metadata?.location) {
      return 'same_location';
    }

    // Types de scènes spécifiques
    if (toScene?.type === SCENE_TYPES.COMBAT) return 'combat';
    if (toScene?.type === SCENE_TYPES.DIALOGUE) return 'dialogue';
    if (toScene?.type?.includes('REST')) return 'rest';
    if (toScene?.type === SCENE_TYPES.INTERACTIVE) return 'exploration';

    // Voyage selon la distance (métadonnées)
    const distance = this.calculateDistance(fromScene, toScene);
    if (distance > 2) return 'travel';
    
    return 'local_move';
  }

  /**
   * Détermine le type d'action pour le système temporel
   */
  static getActionType(fromScene, toScene, choice) {
    if (toScene?.type === SCENE_TYPES.COMBAT) return 'combat';
    if (toScene?.type === SCENE_TYPES.INTERACTIVE) return 'exploration';
    if (toScene?.type === SCENE_TYPES.DIALOGUE) return 'dialogue';
    if (toScene?.type?.includes('REST')) return choice?.restType || 'rest_short';
    
    return 'scene_transition';
  }

  /**
   * Calcule une distance approximative entre deux scènes
   */
  static calculateDistance(fromScene, toScene) {
    // Simple heuristique basée sur les métadonnées
    const fromChapter = fromScene?.metadata?.chapter || 'unknown';
    const toChapter = toScene?.metadata?.chapter || 'unknown';
    
    if (fromChapter !== toChapter) return 5; // Changement de chapitre = distance max
    
    const fromLocation = fromScene?.metadata?.location || '';
    const toLocation = toScene?.metadata?.location || '';
    
    // Même lieu exact
    if (fromLocation === toLocation) return 0;
    
    // Même zone générale (même village, etc.)
    if (fromLocation.includes('Ravenscroft') && toLocation.includes('Ravenscroft')) return 1;
    
    return 3; // Distance modérée par défaut
  }

  /**
   * Obtient les modificateurs de coût temporel
   */
  static getTimeCostModifiers(fromScene, toScene, context) {
    const modifiers = {
      multiplier: 1,
      additive: 0
    };

    // Modificateur nocturne
    const isNight = context.isNight || useTimeStore.getState().isNightTime();
    if (isNight && toScene?.type === SCENE_TYPES.INTERACTIVE) {
      modifiers.multiplier *= 1.3; // +30% de temps la nuit
    }

    // Sécurité du lieu
    const safety = toScene?.metadata?.safety || 3;
    if (safety <= 1) {
      modifiers.multiplier *= 1.2; // +20% en lieu dangereux
    }

    // Fatigue du personnage (si implémentée)
    if (context.characterFatigue > 0.8) {
      modifiers.multiplier *= 1.1; // +10% si fatigué
    }

    return modifiers;
  }

  /**
   * Vérifie les restrictions temporelles d'une scène
   */
  static checkTimeRestrictions(scene, context) {
    const restrictions = [];
    const timeState = useTimeStore.getState();
    const { hour, phase } = timeState.currentTime;

    // Restrictions basées sur l'heure
    if (scene?.metadata?.timeRestrictions) {
      const timeRestrictions = scene.metadata.timeRestrictions;
      
      if (timeRestrictions.dayOnly && TimeService.isNightHour(hour)) {
        restrictions.push('Ce lieu n\'est accessible qu\'en journée');
      }
      
      if (timeRestrictions.nightOnly && TimeService.isDayHour(hour)) {
        restrictions.push('Ce lieu n\'est accessible que la nuit');
      }
    }

    // Restrictions de sécurité nocturne
    const safety = scene?.metadata?.safety || 3;
    if (safety <= 2 && TimeService.isNightHour(hour)) {
      restrictions.push('Ce lieu est particulièrement dangereux la nuit');
    }

    return restrictions;
  }

  // =============================================
  // 🎲 SYSTÈME DE GÉNÉRATION PROCÉDURALE
  // =============================================

  /**
   * Détermine si un ID de scène correspond à un pattern procédural
   * @param {string} sceneId - ID de scène à vérifier
   * @returns {boolean} True si la scène est procédurale
   */
  static isProceduralSceneId(sceneId) {
    // Exceptions: Scènes réelles qui ne doivent PAS être générées
    const realSceneExceptions = [
      'test_procedural_entry',
      'test_procedural_return',
      'continue_journey'
      // proc_combat_victory supprimé - elle est stockée dans le cache donc peut être récupérée
    ];
    
    if (realSceneExceptions.includes(sceneId)) {
      return false;
    }
    
    // Pattern: proc_[type]_[hash]_[timestamp] ou templates directs
    const proceduralPatterns = [
      'proc_',
      // Templates directs depuis templates.js (patterns exacts)
      'forest_encounter_social',
      'forest_encounter_combat', 
      'forest_encounter_discovery',
      'village_encounter_social',
      'dungeon_encounter_combat'
    ];
    
    return proceduralPatterns.some(pattern => sceneId === pattern || sceneId.startsWith('proc_'));
  }

  /**
   * Parse un ID de scène procédurale pour extraire les composants
   * @param {string} sceneId - ID procédural à parser
   * @returns {Object} Composants extraits
   */
  static parseProceduralId(sceneId) {
    if (sceneId.startsWith('proc_')) {
      // ✅ GESTION SPÉCIALE: Scènes avec noms fixes (pas de hash/timestamp)
      const specialScenes = {
        'proc_combat_victory': { 
          type: 'combat_victory', 
          biome: 'generic', 
          encounterType: 'victory',
          templateKey: 'combat_victory' // Template spécial
        }
      };
      
      if (specialScenes[sceneId]) {
        console.log(`🎯 Scène spéciale reconnue: ${sceneId}`);
        return specialScenes[sceneId];
      }
      
      const parts = sceneId.split('_');
      // Format: proc_[type]_[hash]_[timestamp] ou proc_[type]_[subtype]_[hash]_[timestamp]
      if (parts.length === 4) {
        // proc_combat_hash_timestamp
        const [prefix, type, hash, timestamp] = parts;
        return { type, hash, timestamp, biome: 'unknown', encounterType: 'social' };
      } else if (parts.length === 5) {
        // proc_random_encounter_hash_timestamp
        const [prefix, type, subtype, hash, timestamp] = parts;
        const fullType = `${type}_${subtype}`;
        return { type: fullType, hash, timestamp, biome: 'unknown', encounterType: 'social' };
      } else {
        // Fallback pour formats non standards
        const type = parts.slice(1, -2).join('_'); // Tout sauf prefix, hash et timestamp
        const hash = parts[parts.length - 2];
        const timestamp = parts[parts.length - 1];
        return { type, hash, timestamp, biome: 'unknown', encounterType: 'social' };
      }
    }
    
    // Templates directs (forest_encounter_social, village_encounter_combat, etc.)
    if (sceneId.includes('_encounter_')) {
      const parts = sceneId.split('_');
      const encounterIndex = parts.indexOf('encounter');
      const biome = parts[encounterIndex - 1];
      const encounterType = parts[encounterIndex + 1];
      return { 
        type: sceneId, // Utiliser l'ID complet comme type de template
        biome, 
        encounterType,
        templateKey: sceneId // Clé exacte pour les templates
      };
    }

    return { type: 'unknown', biome: 'generic', encounterType: 'social', templateKey: sceneId };
  }

  /**
   * Génère une scène procédurale et la met en cache
   * @param {string} sceneId - ID de la scène procédurale
   * @param {Object} context - Contexte de génération
   * @returns {Object} Scène générée
   */
  static generateProceduralScene(sceneId, context = {}) {
    try {
      const parsed = this.parseProceduralId(sceneId);
      
      // Enrichir le contexte avec des informations dérivées de l'ID
      const enrichedContext = {
        ...context,
        sceneId,
        biome: parsed.biome || context.biome || 'forest',
        encounterType: parsed.encounterType || context.encounterType || 'social',
        difficulty: context.difficulty || 'medium'
      };

      // Utiliser le template exact depuis le parsing
      const templateKey = parsed.templateKey || parsed.type || `${enrichedContext.biome}_encounter_${enrichedContext.encounterType}`;
      
      console.log('🎲 Génération procédurale:', { sceneId, templateKey, parsed, context: enrichedContext });
      
      const generated = ProceduralGenerator.generateScene(templateKey, enrichedContext);
      
      // Mettre en cache la scène générée
      this.loadedScenes.set(sceneId, generated);
      
      console.log('✅ Scène procédurale générée et mise en cache:', generated.id);
      
      return generated;
      
    } catch (error) {
      console.error(`Erreur lors de la génération de la scène "${sceneId}":`, error);
      return this.generateFallbackProceduralScene(sceneId, context);
    }
  }

  /**
   * Génère une scène procédurale de fallback en cas d'erreur
   * @param {string} sceneId - ID de la scène
   * @param {Object} context - Contexte
   * @returns {Object} Scène de fallback
   */
  static generateFallbackProceduralScene(sceneId, context) {
    return {
      id: sceneId,
      type: SCENE_TYPES.EXPLORATION,
      content: {
        text: 'Vous arrivez dans une zone inexplorée. Le paysage semble familier mais recèle peut-être des surprises.',
        title: 'Zone d\'Exploration',
        description: 'Zone générée automatiquement'
      },
      choices: [
        {
          text: '🔍 Explorer prudemment',
          next: 'continue_exploration'
        },
        {
          text: '➡️ Continuer votre route',
          next: 'continue_journey'
        }
      ],
      metadata: {
        chapter: 'procedural',
        location: context.biome || 'unknown',
        tags: ['procedural', 'fallback', 'exploration']
      }
    };
  }

  /**
   * Injecte du contenu procédural dans une scène existante
   * @param {Object} scene - Scène de base
   * @param {Array} insertionPoints - Points d'insertion du contenu
   * @returns {Object} Scène enrichie
   */
  static injectProceduralContent(scene, insertionPoints = []) {
    const enrichedScene = { ...scene };
    
    insertionPoints.forEach(point => {
      switch (point.type) {
        case 'add_choice':
          enrichedScene.choices = enrichedScene.choices || [];
          enrichedScene.choices.push(...point.choices);
          break;
          
        case 'replace_text':
          if (point.condition === 'random' && Math.random() < 0.5) {
            enrichedScene.content.text = point.newText;
          }
          break;
          
        case 'add_encounter':
          enrichedScene.proceduralEncounter = point.encounter;
          break;
      }
    });
    
    return enrichedScene;
  }

  /**
   * Génère un point d'entrée procédural depuis une scène narrative
   * @param {Object} currentScene - Scène narrative actuelle
   * @param {Object} playerContext - Contexte du joueur
   * @returns {Object|null} Scène d'entrée procédurale ou null
   */
  static generateProceduralEntry(currentScene, playerContext = {}) {
    // Seulement certains types de scènes permettent l'entrée procédurale
    const allowedTypes = [SCENE_TYPES.TEXT, SCENE_TYPES.INTERACTIVE];
    if (!allowedTypes.includes(currentScene.type)) {
      return null;
    }

    // Déterminer le biome basé sur la localisation actuelle
    const biome = this.determineBiome(currentScene);
    const difficulty = this.calculateDifficulty(playerContext);
    
    const entryContext = {
      biome,
      difficulty,
      playerLevel: playerContext.level || 1,
      fromScene: currentScene.id,
      entryType: 'narrative_branch'
    };

    const proceduralId = ProceduralGenerator.generateProceduralSceneId(
      PROCEDURAL_TYPES.CONTEXTUAL_EVENT,
      entryContext
    );

    return this.generateProceduralScene(proceduralId, entryContext);
  }

  /**
   * Détermine le biome basé sur une scène narrative
   * @param {Object} scene - Scène à analyser
   * @returns {string} Type de biome
   */
  static determineBiome(scene) {
    const location = scene.metadata?.location || '';
    const environment = scene.metadata?.environment || '';
    
    if (location.toLowerCase().includes('forest') || environment === 'forest') return 'forest';
    if (location.toLowerCase().includes('village') || environment === 'village') return 'village';
    if (location.toLowerCase().includes('dungeon') || environment === 'dungeon') return 'dungeon';
    if (location.toLowerCase().includes('cave') || environment === 'cave') return 'dungeon';
    if (location.toLowerCase().includes('mountain') || environment === 'mountain') return 'mountain';
    
    return 'wilderness'; // Biome par défaut
  }

  /**
   * Calcule la difficulté appropriée selon le contexte du joueur
   * @param {Object} playerContext - Contexte du joueur
   * @returns {string} Niveau de difficulté
   */
  static calculateDifficulty(playerContext) {
    const level = playerContext.level || 1;
    
    if (level <= 2) return 'easy';
    if (level <= 5) return 'medium';
    return 'hard';
  }

  /**
   * Nettoie le cache des scènes
   */
  static clearCache() {
    this.loadedScenes.clear();
    this.loadedModules.clear();
  }

  /**
   * Obtient des statistiques sur le cache
   * @returns {Object} Statistiques
   */
  static getCacheStats() {
    return {
      loadedScenesCount: this.loadedScenes.size,
      loadedModulesCount: this.loadedModules.size,
      memoryUsage: this.loadedScenes.size * 50 // Estimation approximative en kB
    };
  }
}

export default SceneManager;