import { useCharacterStore, useGameStore } from '../../stores';

/**
 * Hook personnalisé pour gérer les interactions de marchand
 * Gestion des achats et ventes d'objets
 */
export const useMerchantHandlers = () => {
  const { 
    playerCharacter, 
    setPlayerCharacter 
  } = useCharacterStore();
  
  const { 
    addCombatMessage 
  } = useGameStore();

  /**
   * Gestionnaire pour les achats dans les scènes de marchand
   * Met à jour l'or et l'inventaire du joueur
   */
  const handlePurchase = (purchaseResult, handleItemGain) => {
    if (purchaseResult.success) {
      // Déduire l'or
      const newCharacter = {
        ...playerCharacter,
        gold: (playerCharacter.gold || 0) + purchaseResult.effects.gold
      };
      setPlayerCharacter(newCharacter);

      // Ajouter les items
      if (purchaseResult.effects.items) {
        handleItemGain(purchaseResult.effects.items);
      }

      addCombatMessage(purchaseResult.message, 'success');
    } else {
      addCombatMessage(purchaseResult.message, 'error');
    }
  };

  /**
   * Gestionnaire pour les ventes dans les scènes de marchand
   * Met à jour l'or et retire les items vendus
   */
  const handleSell = (sellResult) => {
    if (sellResult.success) {
      // Ajouter l'or
      const newCharacter = {
        ...playerCharacter,
        gold: (playerCharacter.gold || 0) + sellResult.effects.gold
      };
      setPlayerCharacter(newCharacter);

      // Retirer les items (logique à implémenter dans characterStore)
      if (sellResult.effects.removeItems) {
    
      }

      addCombatMessage(sellResult.message, 'success');
    } else {
      addCombatMessage(sellResult.message, 'error');
    }
  };

  return {
    handlePurchase,
    handleSell
  };
};