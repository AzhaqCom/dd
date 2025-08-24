import { useCombatHandlers } from './useCombatHandlers';
import { useGameHandlers } from './useGameHandlers';
import { useSceneHandlers } from './useSceneHandlers';
import { useMerchantHandlers } from './useMerchantHandlers';
import { useGameStore } from '../../stores';

/**
 * Hook principal qui combine tous les handlers de l'application
 * Simplifie l'import dans App.jsx
 */
export const useAppHandlers = () => {
  const { handleCombatVictory } = useCombatHandlers();
  
  const { 
    handleItemGain, 
    handleShortRest, 
    handleLongRest, 
    handleCastSpellOutOfCombat 
  } = useGameHandlers();
  
  const { 
    getGameStateWithCharacter, 
    handleNewChoice, 
    handleHotspotClick 
  } = useSceneHandlers();
  
  const { 
    handlePurchase, 
    handleSell 
  } = useMerchantHandlers();

  const { 
    handleSkillCheck 
  } = useGameStore();

  // Créer des versions des handlers qui incluent handleItemGain
  const handleChoiceWithItems = (choice) => handleNewChoice(choice, handleItemGain);
  const handleHotspotWithItems = (hotspot) => handleHotspotClick(hotspot, handleItemGain);
  const handlePurchaseWithItems = (purchaseResult) => handlePurchase(purchaseResult, handleItemGain);

  return {
    // Combat
    handleCombatVictory,
    
    // Items et repos
    handleItemGain,
    handleShortRest,
    handleLongRest,
    handleCastSpellOutOfCombat,
    
    // Scènes et interactions
    getGameStateWithCharacter,
    handleNewChoice: handleChoiceWithItems,
    handleHotspotClick: handleHotspotWithItems,
    handleSkillCheck,
    
    // Commerce
    handlePurchase: handlePurchaseWithItems,
    handleSell
  };
};