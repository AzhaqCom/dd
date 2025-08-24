/**
 * Service de gestion des effets de combat (buff/debuff/conditions)
 */
export class CombatEffects {
  
  /**
   * Définitions des effets disponibles
   */
  static EFFECT_TYPES = {
    // États altérés
    restrained: {
      name: "Entravé",
      icon: "🕸️",
      description: "Vitesse réduite à 0, désavantage aux attaques et Dextérité",
      mechanics: {
        speedMultiplier: 0,
        attackDisadvantage: true,
        dexterityDisadvantage: true,
        canMove: false
      }
    },
    
    poisoned: {
      name: "Empoisonné", 
      icon: "☠️",
      description: "Désavantage aux jets d'attaque et de caractéristique",
      mechanics: {
        attackDisadvantage: true,
        abilityDisadvantage: true
      }
    },
    
    stunned: {
      name: "Étourdi",
      icon: "😵",
      description: "Incapacité totale, échec automatique Force/Dextérité",
      mechanics: {
        incapacitated: true,
        canMove: false,
        canAct: false,
        autoFailStrDex: true
      }
    },
    
    paralyzed: {
      name: "Paralysé",
      icon: "🧊",
      description: "Incapacité, échec auto Force/Dextérité, coups critiques au contact",
      mechanics: {
        incapacitated: true,
        canMove: false,
        canAct: false,
        autoFailStrDex: true,
        vulnerableToMelee: true
      }
    },
    
    // Buffs
    blessed: {
      name: "Béni",
      icon: "✨",
      description: "+1d4 aux jets d'attaque et de sauvegarde",
      mechanics: {
        attackBonus: "1d4",
        saveBonus: "1d4"
      }
    },
    
    mage_armor: {
      name: "Armure du Mage",
      icon: "🛡️",
      description: "CA devient 13 + Dex",
      mechanics: {
        setAC: 13 // Force CA à 13 + Dex
      }
    },
    
    sanctuary: {
      name: "Sanctuaire",
      icon: "🏛️",
      description: "Protection contre les attaques directes",
      mechanics: {
        protectedFromAttacks: true
      }
    },
    
    aid: {
      name: "Aide",
      icon: "💪",
      description: "PV maximum augmentés",
      mechanics: {
        maxHPBonus: 5
      }
    },
    
    shield: {
      name: "Bouclier",
      icon: "🛡️",
      description: "+5 CA jusqu'au prochain tour",
      mechanics: {
        acBonus: 5
      }
    },
    
    haste: {
      name: "Accéléré",
      icon: "⚡",
      description: "Vitesse doublée, +1 action, +2 CA",
      mechanics: {
        speedMultiplier: 2,
        extraAction: true,
        acBonus: 2
      }
    },
    
    // Autres conditions
    frightened: {
      name: "Effrayé",
      icon: "😨",
      description: "Désavantage si la source est visible, ne peut s'approcher",
      mechanics: {
        conditionalDisadvantage: true,
        cannotApproachSource: true
      }
    },
    
    charmed: {
      name: "Charmé",
      icon: "💕",
      description: "Ne peut attaquer le charmeur, avantage aux interactions sociales",
      mechanics: {
        cannotAttackSource: true,
        socialAdvantage: true
      }
    }
  }

  /**
   * Applique un effet à une créature
   */
  static applyEffect(target, effectType, duration = 1, source = null, intensity = 1) {
    if (!CombatEffects.EFFECT_TYPES[effectType]) {
      console.warn(`Effet inconnu: ${effectType}`)
      return null
    }

    const effect = {
      id: CombatEffects.generateEffectId(),
      type: effectType,
      source: source,
      duration: duration,
      intensity: intensity,
      turnsRemaining: duration,
      startTurn: Date.now(),
      ...CombatEffects.EFFECT_TYPES[effectType]
    }

    // Initialiser les effets si nécessaire
    if (!target.activeEffects) {
      target.activeEffects = []
    }

    // Vérifier si l'effet existe déjà (stack ou remplace)
    const existingIndex = target.activeEffects.findIndex(e => e.type === effectType)
    
    if (existingIndex !== -1) {
      // Remplacer par la plus longue durée
      if (duration > target.activeEffects[existingIndex].turnsRemaining) {
        target.activeEffects[existingIndex] = effect
      }
    } else {
      // Nouvel effet
      target.activeEffects.push(effect)
    }

    return effect
  }

  /**
   * Retire un effet spécifique
   */
  static removeEffect(target, effectId) {
    if (!target.activeEffects) return false

    const index = target.activeEffects.findIndex(e => e.id === effectId)
    if (index !== -1) {
      target.activeEffects.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Retire tous les effets d'un type donné
   */
  static removeEffectsByType(target, effectType) {
    if (!target.activeEffects) return 0

    const initialLength = target.activeEffects.length
    target.activeEffects = target.activeEffects.filter(e => e.type !== effectType)
    return initialLength - target.activeEffects.length
  }

  /**
   * Décrément la durée des effets et retire ceux expirés
   */
  static updateEffectDurations(target) {
    if (!target.activeEffects) return []

    const expiredEffects = []
    
    target.activeEffects = target.activeEffects.filter(effect => {
      effect.turnsRemaining--
      
      if (effect.turnsRemaining <= 0) {
        expiredEffects.push(effect)
        return false
      }
      return true
    })

    return expiredEffects
  }

  /**
   * Vérifie si une créature a un effet spécifique
   */
  static hasEffect(target, effectType) {
    return target.activeEffects?.some(e => e.type === effectType) || false
  }

  /**
   * Récupère tous les effets d'un type
   */
  static getEffectsByType(target, effectType) {
    return target.activeEffects?.filter(e => e.type === effectType) || []
  }

  /**
   * Calcule la CA totale avec les bonus d'effets
   */
  static calculateTotalAC(target) {
    const baseAC = target.ac || 10;
    
    if (!target.activeEffects || target.activeEffects.length === 0) {
      return baseAC;
    }
    
    // Chercher les effets setAC (priorité sur les bonus)
    let finalAC = baseAC;
    let hasSetAC = false;
    
    target.activeEffects.forEach(effect => {
      if (effect.mechanics?.setAC) {
        const dexMod = this.getModifier(target.stats?.dexterite || 10);
        const setACValue = effect.mechanics.setAC + dexMod;
        if (setACValue > finalAC || !hasSetAC) {
          finalAC = setACValue;
          hasSetAC = true;
        }
      }
    });
    
    // Ajouter les bonus AC si pas de setAC
    if (!hasSetAC) {
      const effectModifiers = this.calculateEffectModifiers(target);
      finalAC += (effectModifiers.acBonus || 0);
    }
    
    return finalAC;
  }
  
  /**
   * Calcule le modificateur d'une caractéristique
   */
  static getModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Calcule les modificateurs totaux dus aux effets
   */
  static calculateEffectModifiers(target) {
    if (!target.activeEffects) return {}

    const modifiers = {
      speedMultiplier: 1,
      attackBonus: 0,
      attackDisadvantage: false,
      acBonus: 0,
      canMove: true,
      canAct: true,
      incapacitated: false
    }

    target.activeEffects.forEach(effect => {
      const mechanics = effect.mechanics || {}
      
      // Multiplicateurs
      if (mechanics.speedMultiplier !== undefined) {
        modifiers.speedMultiplier *= mechanics.speedMultiplier
      }
      
      // Additions
      if (mechanics.acBonus) modifiers.acBonus += mechanics.acBonus
      
      // Booleans (OR logic - un seul suffit)
      if (mechanics.attackDisadvantage) modifiers.attackDisadvantage = true
      if (mechanics.canMove === false) modifiers.canMove = false
      if (mechanics.canAct === false) modifiers.canAct = false
      if (mechanics.incapacitated) modifiers.incapacitated = true
    })

    return modifiers
  }

  /**
   * Génère un ID unique pour un effet
   */
  static generateEffectId() {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Obtient la description formatée des effets actifs
   */
  static getActiveEffectsDescription(target) {
    if (!target.activeEffects || target.activeEffects.length === 0) {
      return []
    }

    return target.activeEffects.map(effect => ({
      id: effect.id,
      name: effect.name,
      icon: effect.icon,
      description: effect.description,
      turnsRemaining: effect.turnsRemaining,
      source: effect.source
    }))
  }

  /**
   * Vérifie si une action est autorisée selon les effets
   */
  static canPerformAction(target, actionType) {
    const modifiers = CombatEffects.calculateEffectModifiers(target)
    
    switch (actionType) {
      case 'move':
        return modifiers.canMove
      case 'attack':
      case 'spell':
      case 'action':
        return modifiers.canAct && !modifiers.incapacitated
      default:
        return true
    }
  }

  /**
   * Applique les effets de début de tour
   */
  static processStartOfTurnEffects(target) {
    if (!target.activeEffects) return []

    const messages = []
    
    target.activeEffects.forEach(effect => {
      // Dégâts périodiques (poison, feu, etc.)
      if (effect.mechanics?.periodicDamage) {
        const damage = CombatEffects.rollDamage(effect.mechanics.periodicDamage)
        messages.push({
          text: `${effect.icon} ${target.name} subit ${damage} dégâts de ${effect.type}`,
          type: 'periodic-damage',
          damage: damage
        })
      }
      
      // Guérison périodique
      if (effect.mechanics?.periodicHealing) {
        const healing = CombatEffects.rollDamage(effect.mechanics.periodicHealing)
        messages.push({
          text: `${effect.icon} ${target.name} récupère ${healing} PV`,
          type: 'periodic-healing',
          healing: healing
        })
      }
    })

    // Décrémenter la durée et retirer les effets expirés
    const expiredEffects = CombatEffects.updateEffectDurations(target)
    expiredEffects.forEach(effect => {
      messages.push({
        text: `${effect.icon} L'effet ${effect.name} sur ${target.name} se dissipe`,
        type: 'effect-expired'
      })
    })

    return messages
  }

  /**
   * Utilitaire pour lancer des dés (dégâts périodiques, etc.)
   */
  static rollDamage(diceString) {
    const match = diceString.match(/(\d+)d(\d+)(\+(\d+))?/)
    if (!match) return 0
    
    const [, numDice, dieSize, , bonus] = match
    let total = 0
    
    for (let i = 0; i < parseInt(numDice); i++) {
      total += Math.floor(Math.random() * parseInt(dieSize)) + 1
    }
    
    return total + (parseInt(bonus) || 0)
  }
}