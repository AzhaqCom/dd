import { spells } from '../../data/spells'

/**
 * Repository pour la gestion des actions disponibles (attaques, sorts, etc.)
 */
class ActionRepository {

  /**
   * Obtient les attaques de mêlée d'une entité
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des attaques de mêlée
   */
  static getMeleeAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'melee') || []
  }

  /**
   * Obtient les attaques à distance d'une entité
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des attaques à distance
   */
  static getRangedAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'ranged') || []
  }

  /**
   * Obtient toutes les attaques rapides d'une entité
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des attaques rapides
   */
  static getQuickAttacks(entity) {
    return entity.attacks?.filter(attack => attack.type === 'melee' || attack.type === 'ranged') || []
  }

  /**
   * Obtient les sorts de soins d'une entité
   * @param {Object} entity - L'entité
   * @param {Object} targetAlly - Allié cible (optionnel pour optimisation)
   * @returns {Array} Liste des sorts de soin
   */
  static getHealingSpells(entity, targetAlly = null) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter doublons avec Set
    const allSpells = [
      ...new Set([
        ...(entity.spellcasting.knownSpells || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.cantrips || [])
      ])
    ]
    
    const healingSpells = allSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.healing || // Propriété healing directe
        spell.name?.toLowerCase().includes('soin') || // Nom contient "soin"
        spell.targetType === 'ally' && spell.name?.toLowerCase().includes('heal') // Anglais
      ))

    // ✅ AMÉLIORATION: Trier les sorts par efficacité selon la cible
    if (targetAlly) {
      const targetHealthPercent = targetAlly.currentHP / targetAlly.maxHP
      const missingHP = targetAlly.maxHP - targetAlly.currentHP
      
      return healingSpells.sort((a, b) => {
        // Prioriser selon l'urgence et l'efficacité
        let scoreA = 0
        let scoreB = 0
        
        // Bonus pour les cantrips si peu de dégâts (économise les spell slots)
        if (missingHP <= 10) {
          if (a.level === 0) scoreA += 30
          if (b.level === 0) scoreB += 30
        }
        
        // Bonus pour les sorts puissants si dégâts importants
        if (targetHealthPercent < 0.3) {
          scoreA += (a.level || 0) * 10
          scoreB += (b.level || 0) * 10
        }
        
        // Malus pour les sorts trop puissants sur cibles avec beaucoup de HP
        if (targetHealthPercent > 0.6) {
          if ((a.level || 0) > 1) scoreA -= 20
          if ((b.level || 0) > 1) scoreB -= 20
        }
        
        return scoreB - scoreA
      })
    }
    
    return healingSpells
  }

  /**
   * Obtient les sorts de buff d'une entité
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des sorts de buff
   */
  static getBuffSpells(entity) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter les doublons en utilisant Set
    const availableSpells = [
      ...new Set([
        ...(entity.spellcasting.cantrips || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.knownSpells || [])
      ])
    ]
    
    console.log(`🔍 ${entity.name} évalue ${availableSpells.length} sorts pour buffs:`, availableSpells)
    
    const buffSpells = availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) {
          console.warn(`❌ Sort "${spellName}" introuvable dans spells.js`)
          return null
        }
        return { id: spellName, ...spell, name: spellName }
      })
      .filter(spell => spell && this.isBuffSpell(spell))
    
    console.log(`✅ ${entity.name} sorts de buff détectés:`, buffSpells.map(s => s.name))
    return buffSpells
  }

  /**
   * Obtient les sorts de support d'une entité
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des sorts de support
   */
  static getSupportSpells(entity) {
    if (!entity.spellcasting) return []
    
    // ✅ CORRECTION: Éviter doublons avec Set
    const availableSpells = [
      ...new Set([
        ...(entity.spellcasting.cantrips || []),
        ...(entity.spellcasting.preparedSpells || []),
        ...(entity.spellcasting.knownSpells || [])
      ])
    ]
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        // ❌ CORRECTION: Exclure les sorts de soin de ranged_support
        // Les sorts de soin sont gérés dans le cas 'heal' uniquement
        
        // Sorts de protection/buff sur alliés (mais PAS de soin)
        (spell.targetType === 'ally' && !spell.damage && !spell.healing && !spell.name?.toLowerCase().includes('soin')) ||
        
        // Sorts utilitaires non offensifs (détection, etc.)
        (spell.school === 'Divination' && !spell.damage) ||
        (spell.school === 'Transmutation' && spell.targetType === 'ally' && !spell.healing) ||
        
        // Sorts défensifs spécifiques
        spell.name?.toLowerCase().includes('protection') ||
        spell.name?.toLowerCase().includes('bouclier') ||
        spell.name?.toLowerCase().includes('détection')
      ))
  }

  /**
   * Obtient les sorts offensifs à distance
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des sorts offensifs
   */
  static getOffensiveSpells(entity) {
    if (!entity.spellcasting) return []
    
    // Obtenir sorts préparés et cantrips
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    const offensiveSpells = availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) {
          return null
        }
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.damage || // Sorts de dégâts
        spell.name?.toLowerCase().includes('trait') ||
        spell.name?.toLowerCase().includes('projectile') ||
        spell.school === 'Évocation'
      ))
    
    return offensiveSpells
  }

  /**
   * Obtient les sorts de zone d'effet
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des sorts AoE
   */
  static getAoESpells(entity) {
    if (!entity.spellcasting) return []
    
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.areaOfEffect || 
        spell.isAreaEffect ||
        spell.name?.toLowerCase().includes('boule') ||
        spell.name?.toLowerCase().includes('explosion')
      ))
  }

  /**
   * Obtient les sorts de contrôle/affaiblissement
   * @param {Object} entity - L'entité
   * @returns {Array} Liste des sorts de debuff
   */
  static getDebuffSpells(entity) {
    if (!entity.spellcasting) return []
    
    const availableSpells = [
      ...(entity.spellcasting.cantrips || []),
      ...(entity.spellcasting.preparedSpells || []),
      ...(entity.spellcasting.knownSpells || [])
    ]
    
    return availableSpells
      .map(spellName => {
        const spell = spells[spellName]
        if (!spell) return null
        return { ...spell, name: spellName }
      })
      .filter(spell => spell && (
        spell.effect === 'restrained' ||
        spell.name?.toLowerCase().includes('toile') ||
        spell.name?.toLowerCase().includes('entrave') ||
        spell.school === 'Enchantement' ||
        spell.school === 'Invocation'
      ))
  }

  /**
   * Détermine si un sort est un buff basé sur ses propriétés
   * @param {Object} spell - Le sort à analyser  
   * @returns {boolean} True si c'est un sort de buff
   */
  static isBuffSpell(spell) {
    // Si le sort a une propriété 'buff', c'est un buff !
    return !!spell.buff
  }
}

export { ActionRepository }