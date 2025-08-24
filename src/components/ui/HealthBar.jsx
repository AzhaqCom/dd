import React from 'react'
import { useUIStore } from '../../stores'
import { SpellServiceUnified } from '../../services/SpellServiceUnified'

/**
 * Barre de santé réutilisable avec animations et états
 */
export const HealthBar = ({
  current,
  max,
  label,
  showNumbers = true,
  showPercentage = false,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'health', // 'health', 'mana', 'energy'
  animated = true,
  className = ''
}) => {
  const showHealthBars = useUIStore(state => state.showHealthBars)
  const animationsEnabled = useUIStore(state => state.combatAnimationsEnabled)

  if (!showHealthBars) return null

  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const actualCurrent = Math.max(0, current)

  // Déterminer la couleur basée sur le pourcentage
  let colorClass = ''
  if (percentage > 75) colorClass = 'health-bar--high'
  else if (percentage > 50) colorClass = 'health-bar--medium'
  else if (percentage > 25) colorClass = 'health-bar--low'
  else colorClass = 'health-bar--critical'

  const containerClass = [
    'health-bar',
    `health-bar--${size}`,
    `health-bar--${variant}`,
    'flex flex--column flex--center',
    colorClass,
    animated && animationsEnabled && 'health-bar--animated',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {label && (
        <div className="health-bar__label">
          <span className="health-bar__label-text">{label} </span>
          {showNumbers && (
            <span className="health-bar__numbers">
              {actualCurrent}/{max}
              {showPercentage && ` (${Math.round(percentage)}%)`}
            </span>
          )}
        </div>
      )}

      <div className="health-bar__container">
        <div className="health-bar__background">
          <div
            className="health-bar__fill"
            style={{
              width: `${percentage}%`,
              transition: animated && animationsEnabled ? 'width 0.3s ease-out' : 'none'
            }}
          />
        </div>

        {/* Affichage des nombres au centre si pas de label */}
        {!label && showNumbers && (
          <div className="health-bar__overlay">
            <span className="health-bar__overlay-text">
              {actualCurrent}/{max}
              {showPercentage && ` (${Math.round(percentage)}%)`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Barre de santé spécialisée pour les personnages
 */
export const CharacterHealthBar = ({ character, size = 'medium', showLabel = true }) => {
  if (!character) return null

  const label = showLabel ? `❤️ ${character.name}` : null

  return (
    <HealthBar
      current={character.currentHP}
      max={character.maxHP}
      label={label}
      size={size}
      variant="health"
      showNumbers={true}
    />
  )
}

/**
 * Barre d'emplacements de sorts
 */
const SpellSlotsBar = ({ character }) => {
  if (!character?.spellcasting) return null
  
  const spellService = new SpellServiceUnified()
  const spellSlots = spellService.getSpellSlots(character)
  
  if (!spellSlots || Object.keys(spellSlots).length === 0) return null
  
  const totalSlots = Object.values(spellSlots).reduce((sum, slot) => 
    sum + (slot?.max || 0), 0
  )
  
  const usedSlots = Object.values(spellSlots).reduce((sum, slot) => 
    sum + (slot?.used || 0), 0
  )
  
  const availableSlots = totalSlots - usedSlots
  
  return totalSlots > 0 ? (
    <HealthBar
      current={availableSlots}
      max={totalSlots}
      label="✨ Emplacements de sorts"
      variant="mana"
      showNumbers={true}
      size="small"
    />
  ) : null
}

/**
 * Barre de ressources multiples (HP, MP, etc.)
 */
export const ResourceBars = ({ character, characterStats, layout = 'vertical' }) => {
  if (!character) return null

  const containerClass = [
    'resource-bars',
    `resource-bars--${layout}`
  ].join(' ')

  return (
    <div className={containerClass}>
      <HealthBar
        current={character.currentHP}
        max={character.maxHP}
        label="❤️ Points de vie"
        variant="health"
        showNumbers={true}
      />

      {character.hitDice && (
        <HealthBar
          current={character.hitDice}
          max={character.level}
          label="🎲 Dés de vie"
          variant="energy"
          showNumbers={true}
          size="small"
        />
      )}

      <SpellSlotsBar character={character} />
    </div>
  )
}

/**
      * Indicateur de santé simple (juste une couleur)
      */
export const HealthIndicator = ({
  current,
  max,
  size = 'small',
  shape = 'circle' // 'circle', 'square'
}) => {
  const percentage = max > 0 ? (current / max) * 100 : 0

  let colorClass = ''
  if (percentage > 75) colorClass = 'health-indicator--high'
  else if (percentage > 50) colorClass = 'health-indicator--medium'
  else if (percentage > 25) colorClass = 'health-indicator--low'
  else if (percentage > 0) colorClass = 'health-indicator--critical'
  else colorClass = 'health-indicator--dead'

  const indicatorClass = [
    'health-indicator',
    `health-indicator--${size}`,
    `health-indicator--${shape}`,
    colorClass
  ].join(' ')

  return <div className={indicatorClass} title={`${current}/${max} PV`} />
}