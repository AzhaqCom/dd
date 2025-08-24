/**
 * Factory pour la création d'ennemis dans les combats
 * Sépare la logique de création de la logique de combat
 */

import { enemyTemplates } from '../data/enemies';

export class EnemyFactory {
  /**
   * Crée les ennemis à partir des données de rencontre
   * @param {Object} encounterData - Données de la rencontre
   * @returns {Array} Liste des ennemis créés
   */
  static createEnemiesFromEncounter(encounterData) {
    if (!encounterData?.enemies?.length) {
      throw new Error('Aucun ennemi défini dans la rencontre');
    }

    return encounterData.enemies.flatMap((encounter, encounterIndex) => {
      const template = enemyTemplates[encounter.type];
      
      if (!template) {
        console.error(`Template non trouvé pour: ${encounter.type}`);
        return [];
      }

      return Array(encounter.count)
        .fill(null)
        .map((_, index) => this.createEnemyFromTemplate(template, encounter, encounterIndex, index));
    });
  }

  /**
   * Crée un ennemi individuel à partir d'un template
   * @param {Object} template - Template de l'ennemi
   * @param {Object} encounter - Données de rencontre
   * @param {number} encounterIndex - Index de la rencontre
   * @param {number} index - Index de l'ennemi dans le groupe
   * @returns {Object} Ennemi créé
   */
  static createEnemyFromTemplate(template, encounter, encounterIndex, index) {
    return {
      ...template,
      id: `${encounter.type}_${encounterIndex}_${index}`,
      name: encounter.count > 1 ? `${template.name} ${index + 1}` : template.name,
      type: 'enemy',
      currentHP: template.currentHP ?? template.maxHP ?? 10,
      maxHP: template.maxHP ?? 10,
      ac: template.ac ?? 10,
      stats: { ...template.stats },
      attacks: [...(template.attacks || [])],
      image: template.image || '',
      isAlive: true
    };
  }

  /**
   * Valide les données d'une rencontre
   * @param {Object} encounterData - Données à valider
   * @returns {boolean} True si valide
   */
  static validateEncounterData(encounterData) {
    if (!encounterData || !Array.isArray(encounterData.enemies)) {
      return false;
    }

    return encounterData.enemies.every(encounter => {
      return encounter.type && 
             typeof encounter.count === 'number' && 
             encounter.count > 0 &&
             enemyTemplates[encounter.type];
    });
  }

  /**
   * Calcule la difficulté estimée d'une rencontre
   * @param {Object} encounterData - Données de la rencontre
   * @returns {number} Difficulté estimée
   */
  static calculateEncounterDifficulty(encounterData) {
    if (!this.validateEncounterData(encounterData)) {
      return 0;
    }

    return encounterData.enemies.reduce((total, encounter) => {
      const template = enemyTemplates[encounter.type];
      const enemyDifficulty = (template.maxHP || 10) + (template.ac || 10);
      return total + (enemyDifficulty * encounter.count);
    }, 0);
  }
}

export default EnemyFactory;