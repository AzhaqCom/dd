/**
 * Utilitaires pour la gestion universelle des entités (joueur, compagnons, ennemis)
 * Système d'ID uniforme pour éviter les collisions de positions
 */

/**
 * Génère un ID unique pour une entité selon son type
 * @param {string} type - 'player', 'companion', 'enemy'
 * @param {string} templateKey - Clé du template (wizard, tyrion, ombre, etc.)
 * @param {number} instance - Numéro d'instance (pour ennemis multiples)
 * @returns {string} ID unique
 */
export function generateEntityId(type, templateKey, instance = 0) {
  switch (type) {
    case 'player':
      return `player_${templateKey}` // "player_wizard"
    case 'companion':
      return `companion_${templateKey}` // "companion_tyrion"  
    case 'enemy':
      return `enemy_${templateKey}_${instance}` // "enemy_ombre_0"
    default:
      throw new Error(`Type d'entité inconnu: ${type}`)
  }
}

/**
 * Obtient la clé de position standardisée pour une entité
 * @param {Object} entity - L'entité (player, companion, enemy)
 * @returns {string} Clé unique pour les positions
 */
export function getEntityPositionKey(entity) {
  // Priorité à l'ID s'il existe (nouveau système)
  if (entity.id) {
    return entity.id
  }
  
  // Fallback pour compatibilité (ancien système)
  if (entity.type === 'player') {
    return 'player'
  }
  
  // Dernière chance : utiliser le name
  return entity.name
}

/**
 * Crée une entité avec son ID unique
 * @param {string} type - Type d'entité
 * @param {string} templateKey - Clé du template 
 * @param {Object} template - Template de base
 * @param {number} instance - Numéro d'instance
 * @returns {Object} Entité avec ID
 */
export function createEntityWithId(type, templateKey, template, instance = 0) {
  return {
    ...template,
    id: generateEntityId(type, templateKey, instance),
    type: type,
    templateKey: templateKey,
    instance: instance
  }
}

/**
 * Parse un ID d'entité pour extraire ses composants
 * @param {string} entityId - ID à parser ("player_wizard", "enemy_ombre_0")
 * @returns {Object} {type, templateKey, instance}
 */
export function parseEntityId(entityId) {
  const parts = entityId.split('_')
  
  if (parts.length < 2) {
    return { type: 'unknown', templateKey: entityId, instance: 0 }
  }
  
  const type = parts[0]
  
  if (type === 'enemy' && parts.length >= 3) {
    const instance = parseInt(parts[parts.length - 1]) || 0
    const templateKey = parts.slice(1, -1).join('_')
    return { type, templateKey, instance }
  }
  
  const templateKey = parts.slice(1).join('_')
  return { type, templateKey, instance: 0 }
}

/**
 * Trouve une entité par son ID dans une liste
 * @param {Array} entities - Liste d'entités
 * @param {string} entityId - ID recherché
 * @returns {Object|null} Entité trouvée ou null
 */
export function findEntityById(entities, entityId) {
  return entities.find(entity => 
    getEntityPositionKey(entity) === entityId || 
    entity.id === entityId ||
    entity.name === entityId
  ) || null
}

/**
 * Debug : Affiche les clés de toutes les entités
 * @param {Array} entities - Liste d'entités
 * @param {string} context - Contexte pour le debug
 */
export function debugEntityKeys(entities, context = '') {

 
}