/**
 * AI Profiles - Tactical intelligence for entities
 * Defines how different entity types make combat decisions
 */

export const aiProfiles = {
  // ========================================
  // COMPANION AI PROFILES
  // ========================================
  
  tank: {
    role: 'tank',
    attackPriorities: {
      // Préférer les attaques de contrôle et au contact
      melee: 100,
      ranged: 20,
      spell: 60,
      control: 150, // Sorts de contrôle prioritaires
      taunt: 200    // Abilities de provocation/tank
    },
    targetPriorities: {
      // Prioriser les ennemis les plus dangereux
      highDamage: 100,
      lowHP: 50,
      casting: 120,    // Interrompre les lanceurs de sorts
      closest: 80
    },
    positioning: {
      preferredRange: 1,      // Corps à corps
      protectAllies: true,
      blockEnemies: true,
      riskTolerance: 'high'   // Peut prendre des risques
    },
    spellPriorities: {
      'Protection': 200,
      'Soin': 150,
      'Bouclier': 180,
      'Provocation': 250
    }
  },

  healer: {
    role: 'healer',
    attackPriorities: {
      melee: 30,
      ranged: 70,
      spell: 100,
      healing: 300,    // Priorité absolue sur les soins
      support: 200
    },
    targetPriorities: {
      // Pour les soins : cibler les alliés les plus en difficulté
      lowestHpAlly: 200,
      tankAlly: 150,
      selfPreservation: 100
    },
    positioning: {
      preferredRange: 3,      // Distance de sécurité
      protectAllies: false,
      avoidMelee: true,
      riskTolerance: 'low'
    },
    healingThresholds: {
      emergency: 25,    // < 25% HP = soin d'urgence
      standard: 60,     // < 60% HP = soin normal
      preventive: 80    // < 80% HP = soin préventif
    }
  },

  dps: {
    role: 'dps',
    attackPriorities: {
      melee: 80,
      ranged: 120,
      spell: 100,
      aoe: 150,        // Dégâts de zone prioritaires
      burst: 180       // Gros burst de dégâts
    },
    targetPriorities: {
      lowHP: 200,      // Finir les ennemis affaiblis
      highValue: 150,  // Cibles importantes (mages, etc.)
      isolated: 100,   // Ennemis isolés
      closest: 60
    },
    positioning: {
      preferredRange: 4,
      flanking: true,        // Cherche les flanquements
      avoidTanks: true,
      riskTolerance: 'medium'
    }
  },

  support: {
    role: 'support',
    attackPriorities: {
      melee: 40,
      ranged: 80,
      spell: 120,
      debuff: 200,     // Affaiblir les ennemis
      buff: 180,       // Renforcer les alliés
      utility: 160
    },
    targetPriorities: {
      buffTargets: 200,    // Alliés à buffer
      debuffTargets: 150,  // Ennemis dangereux à debuff
      opportunity: 100     // Cibles d'opportunité
    },
    positioning: {
      preferredRange: 3,
      supportRole: true,
      adaptable: true,
      riskTolerance: 'medium'
    }
  },

  // ========================================
  // ENEMY AI PROFILES
  // ========================================

  skirmisher: {
    role: 'skirmisher',
    attackPriorities: {
      melee: 100,
      ranged: 60,
      hit_and_run: 150,   // Tactique de harcèlement
      mobility: 120
    },
    targetPriorities: {
      weakest: 150,       // Cibler les plus faibles
      isolated: 120,      // Alliés isolés
      casters: 100        // Interrompre les lanceurs
    },
    positioning: {
      preferredRange: 2,
      mobile: true,
      opportunistic: true,
      riskTolerance: 'medium'
    }
  },

  brute: {
    role: 'brute',
    attackPriorities: {
      melee: 200,
      heavy: 180,         // Attaques lourdes
      aoe: 120,
      intimidation: 100
    },
    targetPriorities: {
      tank: 100,          // Ignorer les tanks
      damage_dealers: 150, // Cibler les DPS
      closest: 120
    },
    positioning: {
      preferredRange: 1,
      aggressive: true,
      straightforward: true,
      riskTolerance: 'high'
    }
  },

  caster: {
    role: 'caster',
    attackPriorities: {
      spell: 200,
      ranged: 80,
      aoe: 180,
      control: 160
    },
    targetPriorities: {
      grouped: 150,       // Cibles groupées pour AoE
      priority: 120,      // Cibles prioritaires
      range: 100          // Maintenir la distance
    },
    positioning: {
      preferredRange: 6,
      backline: true,
      avoidMelee: true,
      riskTolerance: 'low'
    }
  }
}

/**
 * Gets AI profile for an entity based on its role
 * @param {Object} entity - The entity
 * @returns {Object} AI profile with priorities and behaviors
 */
export function getAIProfile(entity) {
  if (!entity || !entity.role) {
    console.warn('Entity has no role, using default AI profile')
    return aiProfiles.brute // Default fallback
  }

  const profile = aiProfiles[entity.role]
  if (!profile) {
    console.warn(`Unknown AI role: ${entity.role}, using default`)
    return aiProfiles.brute
  }

  return profile
}

/**
 * Calculates action priority based on AI profile and context
 * @param {Object} entity - The entity
 * @param {Object} action - The action to evaluate
 * @param {Object} context - Combat context (targets, positions, etc.)
 * @returns {number} Priority score (higher = better)
 */
export function calculateActionPriority(entity, action, context = {}) {
  const profile = getAIProfile(entity)
  let priority = 0

  // Base priority from action type
  if (action.actionType === 'attack') {
    priority = profile.attackPriorities[action.type] || 50
    
    // Bonus for attack subtypes
    if (action.effects) {
      if (action.effects.some(e => e.type === 'heal')) {
        priority += profile.attackPriorities.healing || 0
      }
      if (action.effects.some(e => e.type === 'control')) {
        priority += profile.attackPriorities.control || 0
      }
    }
  } 
  else if (action.actionType === 'spell') {
    priority = profile.attackPriorities.spell || 50
    
    // Spell-specific priorities
    if (profile.spellPriorities && profile.spellPriorities[action.name]) {
      priority = profile.spellPriorities[action.name]
    }
  }

  // Contextual modifiers
  if (context.targets && context.targets.length > 0) {
    const target = context.targets[0]
    
    // Target type bonuses
    if (target.currentHP < target.maxHP * 0.3) {
      priority += profile.targetPriorities?.lowHP || 0
    }
    
    if (target.type === 'player') {
      priority += profile.targetPriorities?.priority || 0
    }
  }

  // Health-based modifiers for defensive actions
  if (entity.currentHP < entity.maxHP * 0.5) {
    if (action.effects?.some(e => e.type === 'heal')) {
      priority += 100 // Boost healing when low HP
    }
  }

  return Math.max(0, priority)
}