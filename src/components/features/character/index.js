/**
 * Export centralisé des composants Character refactorisés
 */

// Composants principaux
export { CharacterSheet, CompactCharacterSheet } from './CharacterSheet'
export { CharacterSelection } from './CharacterSelection'
export { CharacterSelectionCard, CompactCharacterSelectionCard } from './CharacterSelectionCard'

// Composants de statistiques
export { StatBlock, StatGroup, ComparativeStat, ProgressStat } from './StatBlock'
export { AbilityScores, CompactAbilityScores, SavingThrows } from './AbilityScores'
export { SkillsList, ProficientSkillsList, useSkillBonus } from './SkillsList'

// Barres de progression
export { XPBar, CompactXPBar } from './XPBar'

// Capacités spéciales
export { SpecialAbilitiesPanel, CompactSpecialAbilitiesPanel, InteractiveSpecialAbilitiesPanel } from './SpecialAbilitiesPanel'

// Compagnons
export { 
    CompanionDisplay, 
    CompactCompanionDisplay, 
    DetailedCompanionDisplay, 
    InteractiveCompanionDisplay,
    CompanionParty,
    CompactCompanionParty,
    InteractiveCompanionParty
} from './CompanionDisplay'

// Utilitaires et constants
export const CHARACTER_CLASSES = {
  WIZARD: 'Magicien',
  WARRIOR: 'Guerrier',
  ROGUE: 'Roublard'
}

export const ABILITY_NAMES = {
  force: 'Force',
  dexterite: 'Dextérité',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  sagesse: 'Sagesse',
  charisme: 'Charisme'
}

export const SKILL_CATEGORIES = {
  PHYSICAL: ['acrobaties', 'athletisme', 'discretion', 'escamotage'],
  MENTAL: ['arcanes', 'histoire', 'investigation', 'nature', 'religion'],
  SOCIAL: ['intimidation', 'persuasion', 'representation', 'tromperie'],
  WISDOM: ['dressage', 'intuition', 'medecine', 'perception', 'survie']
}