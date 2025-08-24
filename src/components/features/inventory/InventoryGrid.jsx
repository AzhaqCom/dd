import React from 'react'
import { InventoryItem } from './InventoryItem'

/**
 * Grille d'affichage des objets d'inventaire
 */
export const InventoryGrid = ({
  items = [],
  viewMode = 'grid',
  onItemClick,
  onItemUse,
  onItemEquip,
  onItemUnequip,
  character,
  className = ''
}) => {
  const gridClass = [
    'inventory-grid',
    `inventory-grid--${viewMode}`,
    className
  ].filter(Boolean).join(' ')

  if (items.length === 0) {
    return (
      <div className="inventory-grid-empty">
       
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <InventoryItem
          key={item.id || item.nom || item.name || index}
          item={item}
          character={character}
          viewMode={viewMode}
          onClick={() => onItemClick?.(item)}
          onUse={() => onItemUse?.(item)}
          onEquip={() => onItemEquip?.(item)}
          onUnequip={() => onItemUnequip?.(item)}
        />
      ))}
    </div>
  )
}

/**
 * Version compacte pour les inventaires limités
 */
export const CompactInventoryGrid = ({
  items = [],
  maxItems = 12,
  onItemClick,
  showOverflow = true
}) => {
  const displayedItems = items.slice(0, maxItems)
  const overflowCount = items.length - maxItems

  return (
    <div className="inventory-grid inventory-grid--compact">
      {displayedItems.map((item, index) => (
        <InventoryItem
          key={item.id || item.nom || item.name || index}
          item={item}
          viewMode="compact"
          onClick={() => onItemClick?.(item)}
        />
      ))}
      
      {showOverflow && overflowCount > 0 && (
        <div className="inventory-overflow">
          <span>+{overflowCount}</span>
        </div>
      )}
    </div>
  )
}

export default InventoryGrid