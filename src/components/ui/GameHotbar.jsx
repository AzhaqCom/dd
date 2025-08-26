import React, { useState, useMemo } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { TimeService } from '../../services/TimeService';
import './GameHotbar.css';

/**
 * GameHotbar - Barre d'actions principale à droite de l'écran
 * Style Crusader Kings 3 avec icônes + stats rapides + notifications
 */
const GameHotbar = ({ 
  character, 
  onPanelOpen, 
  onRestAction,
  gameFlags = {},
  inventory = {},
  companions = [],
  spellSlots = {},
}) => {
  // ✅ NOUVEAU: Connexion au système temporel avec sélecteurs optimisés
  const day = useTimeStore(state => state.currentTime.day);
  const hour = useTimeStore(state => state.currentTime.hour);
  const minute = useTimeStore(state => state.currentTime.minute);
  const phase = useTimeStore(state => state.currentTime.phase);
  
  const formattedTime = useMemo(() => {
    return TimeService.formatTime({ day, hour, minute, phase });
  }, [day, hour, minute, phase]);
  
  const [hoveredButton, setHoveredButton] = useState(null);

  if (!character) return null;

  // Calculs pour les stats rapides
  const inventoryCount = inventory.items?.length || 0;
  const inventoryCapacity = character.carryingCapacity || 20;
  const slotLevels = Object.keys(spellSlots)
    .map(level => parseInt(level))
    .sort((a, b) => a - b)
      // Calcul des statistiques globales
  const totalSlots = slotLevels.reduce((sum, level) => {
    const slot = spellSlots[level]
    return sum + (slot?.max || 0)
  }, 0)

  const usedSlots = slotLevels.reduce((sum, level) => {
    const slot = spellSlots[level]
    return sum + (slot?.used || 0)
  }, 0)

  const availableSlots = totalSlots - usedSlots


  const activeCompanions = companions.filter(c => c.isActive).length;
  const maxCompanions = 4; // Limite arbitraire

  // Notifications
  const notifications = {
    character: character.canLevelUp || false,
    inventory: inventoryCount >= inventoryCapacity,
    spells: character.spellcasting && availableSlots === 0,
    companions: companions.some(c => c.needsAttention),
    journal: gameFlags.hasUnreadEntries || false,
    rest: character.currentHP < character.maxHP * 0.5 // HP bas = repos suggéré
  };

  // Configuration des boutons
  const hotbarButtons = [
    {
      id: 'character',
      icon: '⚔️',
      label: 'Personnage',
      quickStat: `Niv.${character.level}`,
      hotkey: 'C',
      notification: notifications.character,
      action: () => onPanelOpen('character')
    },
    {
      id: 'inventory',
      icon: '🎒',
      label: 'Inventaire',
      quickStat: `${inventoryCount}/${inventoryCapacity}`,
      hotkey: 'I',
      notification: notifications.inventory,
      action: () => onPanelOpen('inventory')
    },
    ...(character.spellcasting ? [{
      id: 'spells',
      icon: '✨',
      label: 'Sorts',
      quickStat: `${availableSlots}/${totalSlots}`,
      hotkey: 'S',
      notification: notifications.spells,
      action: () => onPanelOpen('spells')
    }] : []),
    {
      id: 'companions',
      icon: '👥',
      label: 'Compagnons',
      quickStat: `${activeCompanions}`,
      hotkey: 'P',
      notification: notifications.companions,
      action: () => onPanelOpen('companions')
    },
    {
      id: 'journal',
      icon: '📖',
      label: 'Journal',
      quickStat: '',
      hotkey: 'J',
      notification: notifications.journal,
      action: () => onPanelOpen('journal')
    },
    {
      id: 'rest',
      icon: '💤',
      label: 'Repos',
      quickStat: formattedTime ? formattedTime.period : '',
      hotkey: 'R',
      notification: notifications.rest,
      action: () => onRestAction ? onRestAction() : onPanelOpen('rest')
    }
  ];

  const handleButtonClick = (button, event) => {
    // Empêcher la propagation pour éviter les conflits
    event.stopPropagation();
    
    if (button.action) {
      button.action();
    }
  };

  const handleKeyPress = React.useCallback((event) => {
    const pressedKey = event.key.toLowerCase();
    const button = hotbarButtons.find(btn => btn.hotkey.toLowerCase() === pressedKey);
    
    if (button && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      button.action();
    }
  }, [hotbarButtons]);

  // Écouter les touches clavier
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="game-hotbar">
      <div className="hotbar-content">
        {hotbarButtons.map((button) => (
          <div
            key={button.id}
            className={`hotbar-button ${button.notification ? 'has-notification' : ''}`}
            onClick={(e) => handleButtonClick(button, e)}
            onMouseEnter={() => setHoveredButton(button.id)}
            onMouseLeave={() => setHoveredButton(null)}
            title={`${button.label} (${button.hotkey})`}
          >
            {/* Notification badge */}
            {button.notification && (
              <div className="notification-badge" />
            )}
            
            {/* Icône principale */}
            <div className="button-icon">
              {button.icon}
            </div>
            
            {/* Stat rapide */}
            {button.quickStat && (
              <div className="button-stat">
                {button.quickStat}
              </div>
            )}
            
            {/* Label au survol */}
            {hoveredButton === button.id && (
              <div className="button-tooltip">
                <div className="tooltip-label">{button.label}</div>
                <div className="tooltip-hotkey">Touche: {button.hotkey}</div>
              </div>
            )}
            
            {/* Hotkey indicator */}
            <div className="button-hotkey">
              {button.hotkey}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer avec raccourcis */}
      {/* <div className="hotbar-footer">
        <div className="hotbar-help">
          <span className="help-text">Utilisez les touches ou cliquez</span>
        </div>
      </div> */}
    </div>
  );
};

export default GameHotbar;