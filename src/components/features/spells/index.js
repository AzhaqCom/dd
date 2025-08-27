/**
 * Export centralisé des composants Spells refactorisés
 */

// Composants de gestion des sorts
export { SpellList, SimpleSpellList } from './SpellList'
export { SpellItem } from './SpellItem'
export { SpellSlotTracker, CompactSpellSlotTracker } from './SpellSlotTracker'

// Filtres et recherche
export { SpellFilters, CompactSpellFilters } from './SpellFilters'


// Utilitaires et constantes
export const SPELL_SCHOOLS = {
  ABJURATION: 'Abjuration',
  CONJURATION: 'Invocation',
  DIVINATION: 'Divination', 
  ENCHANTMENT: 'Enchantement',
  EVOCATION: 'Évocation',
  ILLUSION: 'Illusion',
  NECROMANCY: 'Nécromancie',
  TRANSMUTATION: 'Transmutation'
}

export const SPELL_LEVELS = {
  CANTRIP: 0,
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6,
  LEVEL_7: 7,
  LEVEL_8: 8,
  LEVEL_9: 9
}

export const SPELL_COMPONENTS = {
  VERBAL: 'V',
  SOMATIC: 'S',
  MATERIAL: 'M'
}

export const CASTING_TIMES = {
  ACTION: '1 action',
  BONUS_ACTION: '1 action bonus',
  REACTION: '1 réaction',
  MINUTE: '1 minute',
  TEN_MINUTES: '10 minutes',
  HOUR: '1 heure',
  EIGHT_HOURS: '8 heures'
}

export const SPELL_RANGES = {
  SELF: 'Personnel',
  TOUCH: 'Contact',
  FEET_30: '9 mètres',
  FEET_60: '18 mètres',
  FEET_90: '27 mètres',
  FEET_120: '36 mètres',
  FEET_150: '45 mètres',
  MILE: '1,5 kilomètre',
  SIGHT: 'À vue',
  UNLIMITED: 'Illimitée'
}

export const SPELL_DURATIONS = {
  INSTANTANEOUS: 'Instantané',
  CONCENTRATION_1_MINUTE: 'Concentration, jusqu\'à 1 minute',
  CONCENTRATION_10_MINUTES: 'Concentration, jusqu\'à 10 minutes',
  CONCENTRATION_1_HOUR: 'Concentration, jusqu\'à 1 heure',
  MINUTE_1: '1 minute',
  MINUTES_10: '10 minutes',
  HOUR_1: '1 heure',
  HOURS_8: '8 heures',
  DAY_1: '24 heures',
  DAYS_7: '7 jours',
  PERMANENT: 'Permanent'
}