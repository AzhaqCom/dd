/**
 * Utilitaires pour le combat - Fonctions communes extraites des composants
 */

/**
 * Obtient la clé de position pour une entité dans le combat
 * @param {Object} entity - Entité (joueur, compagnon, ennemi)
 * @returns {string} Clé de position
 */
export const getEntityPositionKey = (entity) => {
  if (entity.type === 'player') {
    return 'player';
  }
  
  if (entity.type === 'companion') {
    return entity.id || 'companion';
  }
  
  // Pour les ennemis et autres
  return entity.name;
};

/**
 * Calcule la distance D&D entre deux positions (diagonales = 1 case)
 * @param {Object} pos1 - Position 1 {x, y}
 * @param {Object} pos2 - Position 2 {x, y}
 * @returns {number} Distance en cases
 */
export const getDnDDistance = (pos1, pos2) => {
  return Math.max(Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y));
};

/**
 * Vérifie si une entité peut agir (vivante et consciente)
 * @param {Object} entity - Entité à vérifier
 * @returns {boolean} True si peut agir
 */
export const canEntityAct = (entity) => {
  if (!entity) return false;
  
  // Vérifier si l'entité est vivante
  if (entity.currentHP <= 0) return false;
  
  // Vérifier si l'entité n'est pas inconsciente
  if (entity.conditions?.includes('unconscious')) return false;
  
  return true;
};

/**
 * Formate un message de mouvement pour le combat log
 * @param {string} entityName - Nom de l'entité
 * @param {number} distance - Distance parcourue
 * @returns {string} Message formaté
 */
export const formatMovementMessage = (entityName, distance) => {
  if (distance === 0) {
    return `${entityName} reste en position.`;
  }
  
  const unit = distance === 1 ? 'case' : 'cases';
  return `${entityName} se déplace de ${distance} ${unit}.`;
};

export default {
  getEntityPositionKey,
  getDnDDistance,
  canEntityAct,
  formatMovementMessage
};