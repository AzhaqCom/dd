import { useCharacterStore, useGameStore, useUIStore } from '../../stores';
import { items } from '../../data/items';
import { weapons } from '../../data/weapons';

/**
 * Hook personnalisé pour gérer les actions de jeu générales
 * Gestion des items, repos, sorts hors combat, etc.
 */
export const useGameHandlers = () => {
  const { 
    addItemToInventory, 
    castSpellPlayer, 
    shortRestPlayer, 
    longRestAll 
  } = useCharacterStore();
  
  const { 
    addCombatMessage, 
    endShortRest, 
    endLongRest 
  } = useGameStore();
  
  const { 
    showError 
  } = useUIStore();

  /**
   * Gestionnaire pour obtenir des objets
   * Supporte les items individuels ou les tableaux d'items
   */
  const handleItemGain = (itemIdOrArray) => {
    const itemIds = Array.isArray(itemIdOrArray) ? itemIdOrArray : [itemIdOrArray];

    itemIds.forEach(itemId => {
      // Chercher d'abord dans items.js (consommables)
      let itemData = items[itemId];

      // Si pas trouvé dans items.js, chercher dans weapons.js
      if (!itemData) {
        itemData = weapons[itemId];
      }

      if (itemData) {
        const itemToAdd = {
          ...itemData,
          id: itemId
        };
        addItemToInventory(itemToAdd);
    
        addCombatMessage(`Objet obtenu : ${itemData.name}`, 'item');
      } else {
        console.error(`❌ Item non trouvé dans items.js ou weapons.js : ${itemId}`);
      }
    });
  };

  /**
   * Gestionnaire pour les repos courts
   */
  const handleShortRest = () => {
    shortRestPlayer();
    endShortRest();
  };

  /**
   * Gestionnaire pour les repos longs
   */
  const handleLongRest = () => {
    longRestAll();
    endLongRest();
    addCombatMessage('Repos long terminé - PV et sorts restaurés', 'rest');
  };

  /**
   * Gestionnaire pour lancer des sorts hors combat
   */
  const handleCastSpellOutOfCombat = (spell, level = null) => {
    try {
      const options = level ? { spellLevel: level } : {};
      castSpellPlayer(spell, options);
      addCombatMessage(`Sort lancé : ${spell.name}`, 'spell');
    } catch (error) {
      console.error('Erreur lors du lancement du sort:', error);
      showError(`Impossible de lancer le sort : ${error.message}`);
    }
  };

  return {
    handleItemGain,
    handleShortRest,
    handleLongRest,
    handleCastSpellOutOfCombat
  };
};