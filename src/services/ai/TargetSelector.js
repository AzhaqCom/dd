import { CombatUtils } from './CombatUtils'

/**
 * Gestion de la sélection de cibles pour l'IA tactique
 */
class TargetSelector {

  /**
   * Trouve les cibles ennemies pour une entité
   * @param {Object} entity - L'entité qui cherche des cibles
   * @param {Object} gameState - État du jeu
   * @returns {Array} Liste des cibles
   */
  static findTargets(entity, gameState) {
    if (entity.type === 'companion') {
      const enemies = gameState.combatEnemies || []
      return enemies
    } else {
      // Enemy targets player and companions
      const targets = []


      if (gameState.playerCharacter) {
        targets.push(gameState.playerCharacter)

      }
      if (gameState.activeCompanions) {
        targets.push(...gameState.activeCompanions)
        gameState.activeCompanions.forEach(c => console.log(`✅ DEBUG: Compagnon ajouté:`, c.name))
      }

      return targets
    }
  }

  /**
   * Trouve l'allié le plus blessé
   * @param {Object} entity - L'entité qui cherche
   * @param {Object} gameState - État du jeu
   * @returns {Object|null} L'allié le plus blessé
   */
  static findMostWoundedAlly(entity, gameState) {
    const allies = this.getAllies(entity, gameState)
    return allies.reduce((mostWounded, ally) => {
      const allyHP = ally.currentHP / ally.maxHP
      const mostWoundedHP = mostWounded ? mostWounded.currentHP / mostWounded.maxHP : 1
      return allyHP < mostWoundedHP ? ally : mostWounded
    }, null)
  }

  /**
   * Trouve tous les alliés blessés nécessitant des soins
   * @param {Object} entity - L'entité qui cherche
   * @param {Object} gameState - État du jeu
   * @returns {Array} Liste des alliés blessés triés par priorité
   */
  static findWoundedAllies(entity, gameState) {
    const allies = this.getAllies(entity, gameState)
    
    // ✅ AMÉLIORATION: Seuil intelligent pour les soins
    return allies.filter(ally => {
      const healthPercent = ally.currentHP / ally.maxHP
      
      // Différents seuils selon la gravité
      if (healthPercent <= 0.25) {
        // Critique: Toujours soigner
        return true
      } else if (healthPercent <= 0.6) {
        // Modéré: Soigner si on a des sorts à bas niveau
        return true
      } else if (healthPercent <= 0.8) {
        // Léger: Soigner seulement si surplus de spell slots
        const spellSlots = entity.spellcasting?.spellSlots
        if (spellSlots) {
          const totalSlots = Object.values(spellSlots).reduce((sum, slot) => sum + (slot?.max || 0), 0)
          const usedSlots = Object.values(spellSlots).reduce((sum, slot) => sum + (slot?.used || 0), 0)
          const availablePercent = totalSlots > 0 ? (totalSlots - usedSlots) / totalSlots : 0
          
          // Soigner seulement si plus de 70% des sorts disponibles
          return availablePercent > 0.7
        }
        return false
      }
      
      // HP > 80%: Ne pas soigner (évite le gaspillage)
      return false
    })
    .sort((a, b) => {
      // Trier par urgence: les plus blessés en premier
      const aPercent = a.currentHP / a.maxHP
      const bPercent = b.currentHP / b.maxHP
      return aPercent - bPercent
    })
  }

  /**
   * Trouve tous les alliés d'une entité
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Liste des alliés
   */
  static getAllies(entity, gameState) {
    const allies = []
    
    if (entity.type === 'companion') {
      // For companions: player + other companions are allies
      if (gameState.playerCharacter) {
        allies.push(gameState.playerCharacter)
      }
      if (gameState.activeCompanions) {
        gameState.activeCompanions.forEach(companion => {
          if (companion.id !== entity.id && companion.name !== entity.name) {
            allies.push(companion)
          }
        })
      }
    }
    
    return allies
  }

  /**
   * Trouve les cibles à portée de mêlée
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Cibles en mêlée
   */
  static findTargetsInMeleeRange(entity, gameState) {

    const allTargets = this.findTargets(entity, gameState)

    
    const meleeTargets = allTargets.filter(target => {
      const distance = CombatUtils.getDistanceToTarget({target}, entity, gameState)
      return distance <= 1
    })
    

    return meleeTargets
  }

  /**
   * Trouve les cibles à portée d'attaque à distance
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Cibles à distance
   */
  static findTargetsInRange(entity, gameState) {
    return this.findTargets(entity, gameState).filter(target => {
      const distance = CombatUtils.getDistanceToTarget({target}, entity, gameState)
      return distance <= 6 // Standard ranged
    })
  }

  /**
   * Trouve les cibles isolées pour attaques hit-and-run
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Cibles isolées
   */
  static findIsolatedTargets(entity, gameState) {
    // Simplified: just return all targets for hit-and-run
    return this.findTargets(entity, gameState)
  }

  /**
   * Trouve les cibles groupées pour sorts AoE
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Cibles groupées
   */
  static findGroupedTargets(entity, gameState) {
    const targets = this.findTargets(entity, gameState)
    if (targets.length < 2) return targets
    
    // Logique simple : retourner toutes les cibles si elles sont proches
    // TODO: Améliorer avec calcul de distance réelle
    return targets
  }

  /**
   * Trouve les cibles fortes à debuff/contrôler
   * @param {Object} entity - L'entité
   * @param {Object} gameState - État du jeu
   * @returns {Array} Cibles fortes triées par priorité
   */
  static findStrongTargets(entity, gameState) {
    const targets = this.findTargets(entity, gameState)
    
    // Prioriser les cibles avec plus de HP ou CA élevée
    return targets.sort((a, b) => {
      const aStrength = (a.currentHP || a.maxHP || 0) + (a.ac || 0)
      const bStrength = (b.currentHP || b.maxHP || 0) + (b.ac || 0)
      return bStrength - aStrength
    })
  }
}

export { TargetSelector }