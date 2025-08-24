import { getModifier } from '../utils/calculations'

/**
 * Service gérant toute la logique métier des repos
 */
export class RestService {
  /**
   * Vérifie si un personnage peut prendre un repos court
   */
  canTakeShortRest(character) {
    // Un personnage peut toujours tenter un repos court
    return true
  }

  /**
   * Vérifie si un personnage peut prendre un repos long
   */
  canTakeLongRest(character) {
    // Un personnage peut prendre un repos long une fois par 24h
    // Pour simplifier, on permet toujours ici
    return true
  }

  /**
   * Calcule les bénéfices d'un repos court
   */
  getShortRestBenefits(character) {
    const benefits = {
      hitDiceRecovery: false,
      spellSlotRecovery: [],
      classFeatureRecovery: [],
      description: []
    }

    // Récupération par dépense de dés de vie
    if (character.hitDice > 0 && character.currentHP < character.maxHP) {
      benefits.hitDiceRecovery = true
      benefits.description.push('Possibilité de dépenser des dés de vie pour récupérer des PV')
    }

    // Récupération d'emplacements pour certaines classes
    if (character.class === 'Magicien' && character.level >= 1) {
      // Récupération arcanique (Wizard)
      const wizardLevel = character.level
      const recoveredSlotLevel = Math.ceil(wizardLevel / 2)
      benefits.spellSlotRecovery.push({
        level: recoveredSlotLevel,
        amount: 1,
        source: 'Récupération arcanique'
      })
      benefits.description.push(`Récupération d'un emplacement de sort de niveau ${recoveredSlotLevel} ou moins`)
    }

    // Fonctionnalités de classe qui se rechargent au repos court
    if (character.class === 'Guerrier' && character.level >= 3) {
      benefits.classFeatureRecovery.push('Action Surge')
      benefits.description.push('Récupération de l\'Action Surge')
    }

    if (character.class === 'Roublard' && character.level >= 3) {
      benefits.classFeatureRecovery.push('Cunning Action uses')
      benefits.description.push('Récupération des utilisations d\'actions spéciales')
    }

    return benefits
  }

  /**
   * Calcule les bénéfices d'un repos long
   */
  getLongRestBenefits(character) {
    const benefits = {
      fullHPRecovery: true,
      hitDiceRecovery: Math.max(1, Math.floor(character.level / 2)),
      allSpellSlotsRecovery: true,
      allClassFeaturesRecovery: true,
      description: []
    }

    benefits.description.push('Récupération complète des points de vie')
    benefits.description.push(`Récupération de ${benefits.hitDiceRecovery} dé${benefits.hitDiceRecovery > 1 ? 's' : ''} de vie`)
    
    if (character.spellcasting) {
      benefits.description.push('Récupération de tous les emplacements de sorts')
    }
    
    benefits.description.push('Récupération de toutes les capacités de classe')

    return benefits
  }

  /**
   * Calcule la guérison d'un dé de vie
   */
  calculateHitDieHealing(character) {
    const hitDieSize = character.hitDiceType || 8
    const constitutionModifier = getModifier(character.stats.constitution)
    
    // Lancer le dé de vie + modificateur de Constitution
    const roll = Math.floor(Math.random() * hitDieSize) + 1
    const healing = roll + constitutionModifier
    
    return {
      roll,
      modifier: constitutionModifier,
      total: Math.max(1, healing) // Minimum 1 PV
    }
  }

  /**
   * Applique un repos court à un personnage
   */
  applyShortRest(character) {
    const updatedCharacter = { ...character }
    const results = {
      success: true,
      message: 'Repos court terminé',
      changes: []
    }

    // Récupération de capacités spécifiques selon la classe
    if (character.class === 'Magicien' && character.level >= 1) {
      // Récupération arcanique
      const wizardLevel = character.level
      const maxSlotLevel = Math.ceil(wizardLevel / 2)
      
      // Trouver le plus haut emplacement utilisé à récupérer
      if (updatedCharacter.spellcasting?.spellSlots) {
        for (let level = maxSlotLevel; level >= 1; level--) {
          const slot = updatedCharacter.spellcasting.spellSlots[level]
          if (slot && slot.used > 0) {
            slot.used = Math.max(0, slot.used - 1)
            slot.available = slot.max - slot.used
            results.changes.push(`Récupération d'un emplacement de sort de niveau ${level}`)
            break
          }
        }
      }
    }

    // Récupération de points de sorcellerie pour Ensorceleur
    if (character.class === 'Ensorceleur' && character.sorceryPoints) {
      const maxSorceryPoints = character.level
      updatedCharacter.sorceryPoints.current = maxSorceryPoints
      results.changes.push('Récupération des points de sorcellerie')
    }

    // Récupération de l'Action Surge pour Guerrier
    if (character.class === 'Guerrier' && character.level >= 2) {
      if (updatedCharacter.classFeatures?.actionSurge) {
        updatedCharacter.classFeatures.actionSurge.used = 0
        results.changes.push('Récupération de l\'Action Surge')
      }
    }

    return {
      character: updatedCharacter,
      results
    }
  }

  /**
   * Applique un repos long à un personnage
   */
  applyLongRest(character) {
    const updatedCharacter = { ...character }
    const results = {
      success: true,
      message: 'Repos long terminé',
      changes: []
    }

    // Récupération complète des PV
    const hpRecovered = character.maxHP - character.currentHP
    updatedCharacter.currentHP = character.maxHP
    if (hpRecovered > 0) {
      results.changes.push(`${hpRecovered} points de vie récupérés`)
    }

    // Récupération des dés de vie (au moins 1, maximum la moitié du niveau)
    const hitDiceRecovered = Math.max(1, Math.floor(character.level / 2))
    const maxHitDice = character.level
    const currentHitDice = character.hitDice || 0
    const newHitDice = Math.min(maxHitDice, currentHitDice + hitDiceRecovered)
    
    if (newHitDice > currentHitDice) {
      updatedCharacter.hitDice = newHitDice
      results.changes.push(`${newHitDice - currentHitDice} dé${newHitDice - currentHitDice > 1 ? 's' : ''} de vie récupéré${newHitDice - currentHitDice > 1 ? 's' : ''}`)
    }

    // Récupération de tous les emplacements de sorts
    if (updatedCharacter.spellcasting?.spellSlots) {
      let slotsRecovered = 0
      Object.values(updatedCharacter.spellcasting.spellSlots).forEach(slot => {
        if (slot.used > 0) {
          slotsRecovered += slot.used
          slot.used = 0
          slot.available = slot.max
        }
      })
      
      if (slotsRecovered > 0) {
        results.changes.push('Tous les emplacements de sorts récupérés')
      }
    }

    // Récupération de toutes les capacités de classe
    if (updatedCharacter.classFeatures) {
      Object.values(updatedCharacter.classFeatures).forEach(feature => {
        if (feature.used !== undefined) {
          feature.used = 0
        }
      })
      results.changes.push('Toutes les capacités de classe récupérées')
    }

    // Récupération de points spéciaux (Ki, Sorcellerie, etc.)
    if (character.class === 'Moine' && updatedCharacter.ki) {
      updatedCharacter.ki.current = updatedCharacter.ki.max
      results.changes.push('Points de ki récupérés')
    }

    if (character.class === 'Ensorceleur' && updatedCharacter.sorceryPoints) {
      updatedCharacter.sorceryPoints.current = updatedCharacter.sorceryPoints.max
      results.changes.push('Points de sorcellerie récupérés')
    }

    // Récupération des sorts actifs temporaires
    if (updatedCharacter.activeSpells) {
      Object.keys(updatedCharacter.activeSpells).forEach(spellName => {
        delete updatedCharacter.activeSpells[spellName]
      })
      results.changes.push('Sorts temporaires dissipés')
    }

    return {
      character: updatedCharacter,
      results
    }
  }

  /**
   * Vérifie si un personnage a utilisé des emplacements de sorts
   */
  hasUsedSpellSlots(character) {
    if (!character.spellcasting?.spellSlots) return false
    
    return Object.values(character.spellcasting.spellSlots).some(slot => 
      slot.used > 0
    )
  }

  /**
   * Calcule le temps nécessaire pour un repos
   */
  getRestDuration(restType) {
    switch (restType) {
      case 'short':
        return {
          duration: 1, // heure
          unit: 'heure',
          description: 'Au moins 1 heure de repos léger'
        }
      case 'long':
        return {
          duration: 8, // heures
          unit: 'heures',
          description: 'Au moins 8 heures de sommeil ou de repos'
        }
      default:
        return null
    }
  }

  /**
   * Vérifie si un repos peut être interrompu
   */
  canInterruptRest(restType, timeElapsed) {
    if (restType === 'short') {
      // Un repos court peut être interrompu, mais il faut recommencer
      return timeElapsed < 60 // minutes
    }
    
    if (restType === 'long') {
      // Un repos long peut être interrompu jusqu'à 1h sans le perdre
      return timeElapsed < 60 // minutes d'activité stressante
    }
    
    return false
  }

  /**
   * Calcule les pénalités d'un repos interrompu
   */
  calculateInterruptionPenalties(restType, timeElapsed) {
    const penalties = {
      lostProgress: false,
      reducedBenefits: false,
      description: []
    }

    if (restType === 'short') {
      penalties.lostProgress = true
      penalties.description.push('Le repos court doit être recommencé')
    }

    if (restType === 'long' && timeElapsed < 480) { // moins de 8h
      penalties.reducedBenefits = true
      penalties.description.push('Bénéfices du repos long perdus')
    }

    return penalties
  }
}