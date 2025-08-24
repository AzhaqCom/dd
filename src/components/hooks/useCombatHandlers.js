import { useCombatStore, useCharacterStore, useGameStore } from '../../stores';
import SceneManager from '../../services/SceneManager';

/**
 * Hook personnalisé pour gérer les événements liés au combat
 * Extrait la logique métier d'App.jsx pour une meilleure organisation
 */
export const useCombatHandlers = () => {
  const { 
    resetCombat 
  } = useCombatStore();
  
  const { 
    addExperience, 
    getActiveCompanions 
  } = useCharacterStore();
  
  const { 
    currentScene, 
    setCurrentScene, 
    addCombatMessage 
  } = useGameStore();

  /**
   * Gestionnaire de victoire en combat
   * Gère l'XP, les récompenses et la transition vers la scène suivante
   */
  const handleCombatVictory = () => {
    // 1. Récupérer l'XP gagné depuis le combat
    const { totalXpGained, combatEnemies } = useCombatStore.getState();
    const xpGained = totalXpGained || combatEnemies.reduce((total, enemy) => total + (enemy.xp || 0), 0);

    // 2. Donner l'expérience au joueur
    if (xpGained > 0) {
      addExperience(xpGained, 'player');
      addCombatMessage(`Vous gagnez ${xpGained} points d'expérience !`, 'victory');

      // Donner l'XP aux compagnons actifs
      const activeCompanions = getActiveCompanions();
      activeCompanions.forEach(companion => {
        addCombatMessage(`${companion.name} gagne aussi ${xpGained} points d'expérience !`, 'victory');
      });
    }

    // 3. Récupérer la scène suivante depuis la scène de combat actuelle
    const currentSceneData = SceneManager.getScene(currentScene);
    const nextAction = currentSceneData?.choices?.[0]?.next || 'introduction';

    // 4. Réinitialiser l'état du combat
    resetCombat();
    addCombatMessage('Combat terminé ! Victoire !', 'victory');

    // 5. Naviguer vers la scène suivante après victoire
    if (nextAction) {
      setCurrentScene(nextAction);
    } else {
      console.warn("Aucune scène suivante n'est définie après le combat.");
      setCurrentScene('fin_du_jeu');
    }
  };

  return {
    handleCombatVictory
  };
};