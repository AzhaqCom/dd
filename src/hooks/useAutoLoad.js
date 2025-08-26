import { useEffect } from 'react';
import SaveService from '../services/SaveService';
import { useGameStore, useCharacterStore } from '../stores';

/**
 * Hook pour le chargement automatique de la dernière sauvegarde au démarrage
 */
export const useAutoLoad = (options = {}) => {
  const { enabled = true, skipIfCharacterExists = true } = options;

  const gameState = useGameStore();
  const characterState = useCharacterStore();
  const setCurrentScene = useGameStore(state => state.setCurrentScene);
  const setPlayerCharacter = useCharacterStore(state => state.setPlayerCharacter);
  const setFlags = useGameStore(state => state.setFlags);
  const addCombatMessage = useGameStore(state => state.addCombatMessage);
  const setGamePhase = useGameStore(state => state.setGamePhase);

  useEffect(() => {
    if (!enabled || !SaveService.isStorageAvailable()) {
      return;
    }

    // Si un personnage existe déjà et qu'on doit l'ignorer, ne pas charger
    if (skipIfCharacterExists && characterState.playerCharacter) {

      return;
    }

    try {
      const saves = SaveService.getAllSaves();
      
      if (saves.length === 0) {
      
        return;
      }

      // Prendre la sauvegarde la plus récente (auto-save)
      const latestSave = saves.find(save => save.name.includes('Auto-save') || save.name.includes('Scène:')) || saves[0];
      
      if (!latestSave) {
     
        return;
      }

   

      // Restaurer l'état du jeu
      if (latestSave.game) {
        if (latestSave.game.currentScene) {
          setCurrentScene(latestSave.game.currentScene);
        }
        
        if (latestSave.game.gameFlags) {
          setFlags(latestSave.game.gameFlags);
        }

        if (latestSave.game.gamePhase) {
          setGamePhase(latestSave.game.gamePhase);
        }
      }

      // Restaurer l'état du personnage
      if (latestSave.character?.playerCharacter) {
        setPlayerCharacter(latestSave.character.playerCharacter);
      }

      // Message de confirmation
      addCombatMessage('📁 Partie automatiquement restaurée', 'info');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement automatique:', error);
    }
  }, []); // Exécuter seulement au montage

  return null; // Ce hook ne retourne rien
};

export default useAutoLoad;