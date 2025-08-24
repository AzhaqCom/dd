import { useCharacterStore, useGameStore } from '../../stores';
import { processChoice, processSceneAction, getGameStateForStory } from '../utils/sceneUtils';

/**
 * Hook personnalisé pour gérer les interactions avec les scènes
 * Gère les choix, hotspots et transitions de scènes
 */
export const useSceneHandlers = () => {
  const { 
    playerCharacter,
    addCompanion, 
    setActiveCompanions 
  } = useCharacterStore();
  
  const { 
    setCurrentScene, 
    addCombatMessage, 
    handleSkillCheck, 
    startLongRest, 
    startShortRest 
  } = useGameStore();

  /**
   * Obtient l'état du jeu avec le personnage actuel
   * Utilisé par le StoryService pour évaluer les conditions et variations
   */
  const getGameStateWithCharacter = () => {
    const gameState = getGameStateForStory();
    gameState.character = playerCharacter;
    return gameState;
  };

  /**
   * Gestionnaire de choix unifié pour toutes les scènes
   * Traite les choix via le StoryService et processChoice
   */
  const handleNewChoice = async (choice, handleItemGain) => {
    const gameState = getGameStateWithCharacter();
    const result = await processChoice(choice, gameState, {
      startLongRest,
      startShortRest,
      handleItemGain,
      addCompanion,
      setActiveCompanions,
      addCombatMessage,
      handleSkillCheck
    });

    if (result) {
      setCurrentScene(result);
    }
  };

  /**
   * Gestionnaire pour les hotspots des scènes interactives
   * Permet l'interaction avec les éléments cliquables dans les scènes
   */
  const handleHotspotClick = (hotspot, handleItemGain) => {
    if (hotspot.action) {
      const result = processSceneAction(hotspot.action, {
        startLongRest,
        startShortRest,
        handleItemGain,
        addCompanion,
        setActiveCompanions,
        addCombatMessage,
        handleSkillCheck
      });

      if (result) {
        setCurrentScene(result);
      }
    }
  };

  return {
    getGameStateWithCharacter,
    handleNewChoice,
    handleHotspotClick
  };
};