/**
 * SceneManager - Gestionnaire centralisé pour le nouveau système de scènes unifié
 * Remplace la logique dispersée dans App.jsx et gère le chargement à la demande
 */

import { SCENE_TYPES } from '../types/story';
import { StoryService } from './StoryService';
import { prologueScenes } from '../data/scenes/prologue';
import { acte1Scenes } from '../data/scenes/acte1';
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
        next: "introduction"
      }
    ]
  };

  /**
   * Récupère une scène par son ID
   * @param {string} sceneId - L'identifiant de la scène
   * @returns {Object|null} La scène trouvée ou null
   */
  static getScene(sceneId) {
    // Vérifier le cache en premier
    if (this.loadedScenes.has(sceneId)) {
      return this.loadedScenes.get(sceneId);
    }

    // Charger depuis le nouveau système modulaire
    return this.loadFromNewSystem(sceneId);
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

      // Charger les scènes de test
      if (acte1Scenes[sceneId]) {
   
        const scene = acte1Scenes[sceneId];
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