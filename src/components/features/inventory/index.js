/**
 * Export centralisé des composants Inventory refactorisés
 */

// Composant principal
export { InventoryPanel } from './InventoryPanel'

// Composants de grille et affichage
export { InventoryGrid, CompactInventoryGrid } from './InventoryGrid'
export { InventoryItem } from './InventoryItem'

// Filtres et recherche
export { InventoryFilters, CompactInventoryFilters } from './InventoryFilters'


// Utilitaires
export { InventoryCleanup } from './InventoryCleanup'

// Utilitaires et constantes
export const ITEM_TYPES = {
  WEAPON: 'arme',
  ARMOR: 'armure',
  POTION: 'potion',
  ACCESSORY: 'accessoire',
  TOOL: 'outil',
  BOOK: 'livre',
  GEM: 'gemme',
  COMPONENT: 'composant',
  MISC: 'misc'
}

export const ITEM_RARITIES = {
  COMMON: 'commun',
  UNCOMMON: 'peu commun',
  RARE: 'rare',
  VERY_RARE: 'très rare',
  LEGENDARY: 'légendaire',
  ARTIFACT: 'artéfact'
}

export const INVENTORY_CATEGORIES = {
  ALL: 'all',
  WEAPONS: 'weapons',
  ARMOR: 'armor',
  CONSUMABLES: 'consumables',
  ACCESSORIES: 'accessories',
  MISC: 'misc'
}

export const INVENTORY_SORT_OPTIONS = {
  NAME: 'name',
  TYPE: 'type',
  WEIGHT: 'weight',
  RARITY: 'rarity'
}