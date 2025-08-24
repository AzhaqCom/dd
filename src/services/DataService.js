/**
 * Service centralisé pour l'accès aux données de jeu
 * Évite les imports mixtes statiques/dynamiques pour optimiser le bundle
 */

import { items } from '../data/items'
import { weapons } from '../data/weapons'

export class DataService {
  /**
   * Trouve un item par son ID dans items.js ou weapons.js
   * @param {string} itemId - ID de l'item à chercher
   * @returns {Object|null} Les données de l'item ou null si non trouvé
   */
  static findItemById(itemId) {
    // Chercher d'abord dans items.js (consommables)
    let itemData = items[itemId]

    // Si pas trouvé dans items.js, chercher dans weapons.js
    if (!itemData) {
      itemData = weapons[itemId]
    }

    return itemData || null
  }

  /**
   * Trouve plusieurs items par leurs IDs
   * @param {Array<string>} itemIds - Liste des IDs à chercher
   * @returns {Array<Object>} Liste des items trouvés (sans les nulls)
   */
  static findItemsByIds(itemIds) {
    return itemIds
      .map(id => this.findItemById(id))
      .filter(Boolean)
  }

  /**
   * Récupère tous les items disponibles
   * @returns {Object} Objet combiné items + weapons
   */
  static getAllItems() {
    return { ...items, ...weapons }
  }

  /**
   * Récupère uniquement les items consommables
   * @returns {Object} Items de items.js uniquement
   */
  static getConsumableItems() {
    return items
  }

  /**
   * Récupère uniquement les armes
   * @returns {Object} Items de weapons.js uniquement
   */
  static getWeapons() {
    return weapons
  }

  /**
   * Vérifie si un item existe
   * @param {string} itemId - ID de l'item
   * @returns {boolean} True si l'item existe
   */
  static itemExists(itemId) {
    return !!this.findItemById(itemId)
  }

  /**
   * Filtre les items par type
   * @param {string} type - Type d'item à filtrer
   * @returns {Array<Object>} Liste des items du type demandé
   */
  static getItemsByType(type) {
    const allItems = this.getAllItems()
    return Object.values(allItems).filter(item => item.type === type)
  }

  /**
   * Traite l'ajout d'items à l'inventaire via callback
   * Évite l'import circulaire gameStore <-> characterStore
   * @param {Array<string>} itemIds - IDs des items à ajouter
   * @param {Function} addItemCallback - Fonction pour ajouter l'item à l'inventaire
   * @param {Function} messageCallback - Fonction pour ajouter un message
   */
  static processItemRewards(itemIds, addItemCallback, messageCallback) {
    itemIds.forEach(itemId => {
      const itemData = this.findItemById(itemId)

      if (itemData) {
        const itemToAdd = {
          ...itemData,
          id: itemId
        }
        
        addItemCallback(itemToAdd)
        messageCallback(`📦 Objet obtenu : ${itemData.name || itemData.nom || itemId}`)
      } else {
        console.error(`❌ Item non trouvé dans items.js ou weapons.js : ${itemId}`)
      }
    })
  }
}