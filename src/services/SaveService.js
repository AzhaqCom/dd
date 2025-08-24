/**
 * Service de sauvegarde pour le jeu RPG
 * Gère la persistance des données de jeu en localStorage
 */

export class SaveService {
  static SAVE_KEY = 'rpg_save_data';
  static MAX_SAVES = 3; // Nombre maximum de sauvegardes

  /**
   * Sauvegarde l'état actuel du jeu
   */
  static saveGame(gameState, characterState, saveName = 'Auto-save') {
    try {
      const saveData = {
        id: Date.now(),
        name: saveName,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        
        // État du jeu
        game: {
          currentScene: gameState.currentScene,
          gamePhase: gameState.gamePhase,
          gameFlags: gameState.gameFlags,
          sceneHistory: gameState.sceneHistory.slice(-10), // Garder seulement les 10 dernières scènes
          combatLog: [], // Ne pas sauver le log de combat (trop volumineux)
        },
        
        // État du personnage
        character: {
          playerCharacter: characterState.playerCharacter,
          activeCompanions: characterState.activeCompanions,
          companionList: characterState.companionList,
        }
      };

      // Récupérer les sauvegardes existantes
      const existingSaves = this.getAllSaves();
      
      // Ajouter la nouvelle sauvegarde
      const updatedSaves = [saveData, ...existingSaves.slice(0, this.MAX_SAVES - 1)];
      
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(updatedSaves));
      
      return {
        success: true,
        saveId: saveData.id,
        message: `Partie sauvegardée : ${saveName}`
      };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return {
        success: false,
        message: 'Erreur lors de la sauvegarde'
      };
    }
  }

  /**
   * Charge une sauvegarde spécifique
   */
  static loadGame(saveId) {
    try {
      const saves = this.getAllSaves();
      const saveData = saves.find(save => save.id === saveId);
      
      if (!saveData) {
        throw new Error('Sauvegarde introuvable');
      }
      
      return {
        success: true,
        data: saveData,
        message: `Partie chargée : ${saveData.name}`
      };
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return {
        success: false,
        message: 'Erreur lors du chargement'
      };
    }
  }

  /**
   * Récupère toutes les sauvegardes
   */
  static getAllSaves() {
    try {
      const savesData = localStorage.getItem(this.SAVE_KEY);
      return savesData ? JSON.parse(savesData) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des sauvegardes:', error);
      return [];
    }
  }

  /**
   * Supprime une sauvegarde
   */
  static deleteSave(saveId) {
    try {
      const saves = this.getAllSaves();
      const updatedSaves = saves.filter(save => save.id !== saveId);
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(updatedSaves));
      
      return {
        success: true,
        message: 'Sauvegarde supprimée'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression'
      };
    }
  }

  /**
   * Vérifie si le localStorage est disponible
   */
  static isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère des informations sur l'espace de stockage
   */
  static getStorageInfo() {
    if (!this.isStorageAvailable()) {
      return { available: false };
    }

    try {
      const saves = this.getAllSaves();
      const totalSize = JSON.stringify(saves).length;
      
      return {
        available: true,
        savesCount: saves.length,
        totalSize: totalSize,
        maxSaves: this.MAX_SAVES
      };
    } catch {
      return { available: false };
    }
  }

  /**
   * Formate la date de sauvegarde pour l'affichage
   */
  static formatSaveDate(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

export default SaveService;