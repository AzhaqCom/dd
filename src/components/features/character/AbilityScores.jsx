import React from 'react'
import { getModifier } from '../../../utils/calculations'
import { StatBlock, StatGroup } from './StatBlock'

/**
 * Composant pour une caractéristique individuelle
 */
const AbilityScore = React.memo(({ 
  statName, 
  score, 
  hasSaveProficiency = false,
  proficiencyBonus = 0,
  onClick,
  showSaveBonus = false,
  compact = false 
}) => {
  const modifier = getModifier(score)
  const saveBonus = modifier + (hasSaveProficiency ? proficiencyBonus : 0)
  
  const statDisplayNames = {
    force: 'FOR',
    dexterite: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    sagesse: 'SAG',
    charisme: 'CHA'
  }

  const fullNames = {
    force: 'Force',
    dexterite: 'Dextérité',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    sagesse: 'Sagesse',
    charisme: 'Charisme'
  }

  const displayName = compact 
    ? statDisplayNames[statName] || statName.toUpperCase()
    : fullNames[statName] || statName

  const tooltip = `${fullNames[statName]}: ${score} (${modifier >= 0 ? '+' : ''}${modifier})${
    showSaveBonus ? `\nJet de sauvegarde: ${saveBonus >= 0 ? '+' : ''}${saveBonus}` : ''
  }`

  return (
    <div className={`ability-score ${compact ? 'ability-score--compact' : ''}`}>
      <StatBlock
        label={displayName}
        value={score}
        modifier={modifier}
        tooltip={tooltip}
        variant={hasSaveProficiency ? 'highlighted' : 'default'}
        onClick={onClick}
        size={compact ? 'small' : 'medium'}
        showModifier={true}
      />
      
      {showSaveBonus && (
        <div className={`ability-score__save ${hasSaveProficiency ? 'ability-score__save--proficient' : ''}`}>
          <span className="ability-score__save-label">JdS:</span>
          <span className="ability-score__save-value">
            {saveBonus >= 0 ? '+' : ''}{saveBonus}
          </span>
        </div>
      )}
    </div>
  )
})

/**
 * Grille des six caractéristiques principales
 */
export const AbilityScores = ({ 
  stats, 
  saves = [],
  proficiencyBonus = 2,
  onStatClick,
  layout = 'grid', // 'grid', 'horizontal', 'vertical'
  compact = false,
  showSaveBonuses = false
}) => {
  const containerClass = [
    'ability-scores',
    `ability-scores--${layout}`,
    compact && 'ability-scores--compact'
  ].filter(Boolean).join(' ')

  const abilityOrder = ['force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme']

  return (
    <div className={containerClass}>
      <StatGroup layout={layout === 'grid' ? 'grid' : layout}>
        {abilityOrder.map(statName => (
          <AbilityScore
            key={statName}
            statName={statName}
            score={stats[statName] || 10}
            hasSaveProficiency={saves.includes(statName)}
            proficiencyBonus={proficiencyBonus}
            onClick={() => onStatClick?.(statName)}
            showSaveBonus={showSaveBonuses}
            compact={compact}
          />
        ))}
      </StatGroup>
    </div>
  )
}

/**
 * Version compacte pour les interfaces restreintes
 */
export const CompactAbilityScores = ({ stats, saves, proficiencyBonus }) => (
  <AbilityScores
    stats={stats}
    saves={saves}
    proficiencyBonus={proficiencyBonus}
    layout="horizontal"
    compact={true}
    showSaveBonuses={false}
  />
)

/**
 * Affichage des jets de sauvegarde séparément
 */
export const SavingThrows = ({ 
  stats, 
  saves = [], 
  proficiencyBonus = 2,
  layout = 'horizontal' 
}) => {
  const savingThrowBonuses = Object.entries(stats).map(([statName, score]) => {
    const modifier = getModifier(score)
    const hasProficiency = saves.includes(statName)
    const bonus = modifier + (hasProficiency ? proficiencyBonus : 0)

    return {
      statName,
      bonus,
      hasProficiency,
      modifier
    }
  })

  const statDisplayNames = {
    force: 'Force',
    dexterite: 'Dextérité', 
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    sagesse: 'Sagesse',
    charisme: 'Charisme'
  }

  return (
    <div className="saving-throws">
      <h4 className="saving-throws__title">Jets de sauvegarde</h4>
      <StatGroup layout={layout}>
        {savingThrowBonuses.map(({ statName, bonus, hasProficiency }) => (
          <StatBlock
            key={statName}
            label={statDisplayNames[statName]}
            value={`${bonus >= 0 ? '+' : ''}${bonus}`}
            variant={hasProficiency ? 'highlighted' : 'default'}
            size="small"
            tooltip={`Jet de sauvegarde de ${statDisplayNames[statName]}${
              hasProficiency ? ' (maîtrisé)' : ''
            }`}
          />
        ))}
      </StatGroup>
    </div>
  )
}

export default AbilityScores