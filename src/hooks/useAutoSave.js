import { useEffect, useRef } from 'react';
import { useGameStore, useCharacterStore } from '../stores';
import SaveService from '../services/SaveService';

/**
 * Hook pour la sauvegarde automatique du jeu
 * Se déclenche lors des changements de scène importants
 */
export const useAutoSave = (options = {}) => {
  const {
    enabled = true,           // Activer/désactiver l'auto-save
    delay = 1000,            // Délai avant sauvegarde (en ms)
    showNotification = true,  // Afficher notification de sauvegarde
    saveOnSceneChange = true, // Sauver à chaque changement de scène
    saveOnFlagChange = true   // Sauver lors de changements de flags importants
  } = options;

  const saveTimeoutRef = useRef(null);
  const lastSaveRef = useRef(null);

  // États des stores
  const gameState = useGameStore();
  const characterState = useCharacterStore();
  
  // Actions pour notifications
  const addCombatMessage = useGameStore(state => state.addCombatMessage);

  /**
   * Effectue une sauvegarde avec délai (debounce)
   */
  const performAutoSave = (reason = 'Auto-save') => {
    if (!enabled || !SaveService.isStorageAvailable()) {
    
      return;
    }

    // Vérifier qu'on a un personnage et une scène valide
    if (!characterState.playerCharacter || !gameState.currentScene) {
    
      return;
    }

    // Éviter les sauvegardes trop fréquentes
    const now = Date.now();
    if (lastSaveRef.current && (now - lastSaveRef.current) < 3000) {
    
      return; // Minimum 3 secondes entre les sauvegardes
    }

    // Annuler la sauvegarde précédente si elle est en attente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programmer la sauvegarde avec délai
    saveTimeoutRef.current = setTimeout(() => {
      try {
    
        const result = SaveService.saveGame(gameState, characterState, reason);
        
        if (result.success) {
          lastSaveRef.current = now;
          
          if (showNotification) {
            addCombatMessage('💾 Partie sauvegardée automatiquement', 'info');
          }
          
       
        } else {
          console.warn('❌ Échec auto-save:', result.message);
        }
      } catch (error) {
        console.error('❌ Erreur auto-save:', error);
      }
    }, delay);
  };

  // Auto-save lors du changement de scène
  useEffect(() => {
    if (saveOnSceneChange && gameState.currentScene) {
      // Debug pour voir si ça se déclenche
     
      performAutoSave(`Scène: ${gameState.currentScene}`);
    }
  }, [gameState.currentScene, saveOnSceneChange]);

  // Auto-save lors de changements importants des flags
  useEffect(() => {
    if (saveOnFlagChange && gameState.gameFlags) {
      // Sauvegarder seulement si des flags "importants" changent
      const importantFlags = [
        'alliance_kael',
        'reputation',
        'companions',
        'completedQuests',
        'majorChoices'
      ];
      
      const hasImportantChanges = importantFlags.some(flag => 
        gameState.gameFlags[flag] !== undefined
      );
      
      if (hasImportantChanges) {
        performAutoSave('Progression importante');
      }
    }
  }, [gameState.gameFlags, saveOnFlagChange]);

  // Auto-save périodique (toutes les 5 minutes)
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      performAutoSave('Sauvegarde périodique');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [enabled]);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save lors de la fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled && SaveService.isStorageAvailable()) {
        // Sauvegarde synchrone avant fermeture
        SaveService.saveGame(gameState, characterState, 'Fermeture du jeu');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, gameState, characterState]);

  /**
   * Sauvegarde manuelle
   */
  const manualSave = (saveName = 'Sauvegarde manuelle') => {
    return SaveService.saveGame(gameState, characterState, saveName);
  };

  /**
   * Informations sur l'état de l'auto-save
   */
  const getAutoSaveStatus = () => {
    return {
      enabled,
      storageAvailable: SaveService.isStorageAvailable(),
      lastSave: lastSaveRef.current,
      storageInfo: SaveService.getStorageInfo()
    };
  };

  return {
    manualSave,
    getAutoSaveStatus,
    performAutoSave
  };
};

export default useAutoSave;