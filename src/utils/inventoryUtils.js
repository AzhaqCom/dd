/**
 * Utilitaires pour la gestion de l'inventaire
 */

/**
 * Détermine si un objet peut être empilé/regroupé avec d'autres du même type
 * @param {Object} item - L'objet à vérifier
 * @returns {boolean} - True si l'objet peut être empilé
 */
export const isStackableItem = (item) => {
  // Les objets consommables peuvent généralement être empilés
  if (item.type === 'consumable' || item.type === 'potion') {
    return true
  }
  
  // Les gemmes, composants et matériaux peuvent être empilés
  if (item.type === 'gemme' || item.type === 'composant' || item.type === 'material') {
    return true
  }
  
  // Les munitions peuvent être empilées
  if (item.type === 'ammunition' || item.type === 'munition') {
    return true
  }
  
  // Les objets uniques ne peuvent pas être empilés (équipement, armes uniques, etc.)
  if (item.unique === true || item.rarity === 'légendaire' || item.rarity === 'artéfact') {
    return false
  }
  
  // Les armes et armures génériques peuvent parfois être empilées
  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'arme' || item.type === 'armure') {
    // Seulement si elles n'ont pas de propriétés spéciales ou d'enchantements
    return !item.enchanted && !item.magical && !item.special
  }
  
  // Par défaut, ne pas empiler les objets non identifiés
  return false
}

/**
 * Génère une clé unique pour identifier des objets similaires
 * @param {Object} item - L'objet
 * @returns {string} - Clé unique pour le groupement
 */
export const getItemStackKey = (item) => {
  // Pour les objets avec un ID spécifique, utiliser l'ID
  if (item.id && typeof item.id === 'string') {
    return item.id
  }
  
  // Pour les objets avec un nom, utiliser le nom
  if (item.name || item.nom) {
    return item.name || item.nom
  }
  
  // Fallback: générer une clé basée sur les propriétés importantes
  const keyParts = [
    item.type || 'misc',
    item.rarity || 'commun'
  ]
  
  return keyParts.join('_')
}

/**
 * Consolide un tableau d'objets en regroupant les objets similaires
 * @param {Array} items - Tableau d'objets à consolider
 * @returns {Array} - Tableau consolidé avec quantités
 */
export const consolidateItems = (items) => {
  if (!Array.isArray(items)) return []
  
  const itemMap = new Map()
  
  items.forEach(item => {
    const stackKey = getItemStackKey(item)
    
    if (isStackableItem(item) && itemMap.has(stackKey)) {
      // Augmenter la quantité de l'objet existant
      const existingItem = itemMap.get(stackKey)
      existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1)
    } else {
      // Ajouter comme nouvel objet (ou objet non empilable)
      itemMap.set(stackKey, {
        ...item,
        quantity: item.quantity || 1
      })
    }
  })
  
  return Array.from(itemMap.values())
}

/**
 * Ajoute un objet à un inventaire en gérant automatiquement les quantités
 * @param {Array} inventory - Inventaire actuel
 * @param {Object} itemToAdd - Objet à ajouter
 * @param {number} quantity - Quantité à ajouter (défaut: 1)
 * @returns {Array} - Nouvel inventaire
 */
export const addItemToInventory = (inventory, itemToAdd, quantity = 1) => {
  if (!Array.isArray(inventory)) inventory = []
  
  const stackKey = getItemStackKey(itemToAdd)
  const newInventory = [...inventory]
  
  if (isStackableItem(itemToAdd)) {
    // Chercher si l'objet existe déjà
    const existingIndex = newInventory.findIndex(item => 
      getItemStackKey(item) === stackKey
    )
    
    if (existingIndex >= 0) {
      // Augmenter la quantité
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        quantity: (newInventory[existingIndex].quantity || 1) + quantity
      }
      return newInventory
    }
  }
  
  // Ajouter comme nouvel objet
  newInventory.push({
    ...itemToAdd,
    quantity: quantity
  })
  
  return newInventory
}

/**
 * Retire un objet d'un inventaire en gérant les quantités
 * @param {Array} inventory - Inventaire actuel
 * @param {string} itemKey - Clé de l'objet à retirer
 * @param {number} quantity - Quantité à retirer (défaut: 1)
 * @returns {Array} - Nouvel inventaire
 */
export const removeItemFromInventory = (inventory, itemKey, quantity = 1) => {
  if (!Array.isArray(inventory)) return []
  
  const newInventory = [...inventory]
  const itemIndex = newInventory.findIndex(item => 
    getItemStackKey(item) === itemKey || item.id === itemKey || item.name === itemKey || item.nom === itemKey
  )
  
  if (itemIndex === -1) return newInventory // Objet non trouvé
  
  const item = newInventory[itemIndex]
  const currentQuantity = item.quantity || 1
  
  if (currentQuantity <= quantity) {
    // Supprimer complètement l'objet
    newInventory.splice(itemIndex, 1)
  } else {
    // Réduire la quantité
    newInventory[itemIndex] = {
      ...item,
      quantity: currentQuantity - quantity
    }
  }
  
  return newInventory
}