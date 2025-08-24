/**
 * Export centralisé des composants Rest refactorisés
 */

// Anciens composants Rest supprimés - remplacés par RestScene dans components/game/
// RestPanel, ShortRestManager, LongRestManager, RestTypeSelector ne sont plus nécessaires

// Utilitaires et constantes
export const REST_TYPES = {
  SHORT: 'short',
  LONG: 'long'
}

export const REST_DURATION = {
  SHORT_REST: 60, // minutes
  LONG_REST: 480 // minutes (8 heures)
}

export const REST_BENEFITS = {
  SHORT_REST: {
    HIT_DICE_HEALING: 'hit_dice_healing',
    CLASS_FEATURES: 'class_features',
    SPELL_RECOVERY: 'spell_recovery' // Pour certaines classes
  },
  LONG_REST: {
    FULL_HP_RECOVERY: 'full_hp_recovery',
    HIT_DICE_RECOVERY: 'hit_dice_recovery',
    ALL_SPELL_SLOTS: 'all_spell_slots',
    ALL_CLASS_FEATURES: 'all_class_features',
    SPELL_PREPARATION: 'spell_preparation'
  }
}

export const HIT_DIE_TYPES = {
  D6: 6,
  D8: 8,
  D10: 10,
  D12: 12
}

// Calculs utilitaires
export const calculateHitDiceRecovery = (characterLevel) => {
  return Math.max(1, Math.floor(characterLevel / 2))
}

export const calculateMaxHitDice = (characterLevel) => {
  return characterLevel
}