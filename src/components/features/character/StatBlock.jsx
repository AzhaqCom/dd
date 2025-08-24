import React from 'react'
import { useUIStore } from '../../../stores'

/**
 * Bloc de statistique avec label et valeur
 */
export const StatBlock = ({
  label,
  value,
  modifier,
  tooltip,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'highlighted', 'positive', 'negative'
  showModifier = false,
  onClick,
  className = ''
}) => {
  const showTooltips = useUIStore(state => state.showTooltips)
  const isCompactMode = useUIStore(state => state.compactMode)

  const blockClass = [
    'stat-block',
    `stat-block--${size}`,
    `stat-block--${variant}`,
    isCompactMode && 'stat-block--compact',
    onClick && 'stat-block--clickable',
    className
  ].filter(Boolean).join(' ')

  const displayModifier = modifier !== undefined ? modifier : 
    (typeof value === 'number' && showModifier) ? Math.floor((value - 10) / 2) : null

  const content = (
    <div className={blockClass} onClick={onClick}>
      <div className="stat-block__label">{label}</div>
      <div className="stat-block__value">
        {value} 
        {displayModifier !== null && (
          <span className="stat-block__modifier">
            ({displayModifier >= 0 ? '+' : ''}{displayModifier})
          </span>
        )}
      </div>
      
    </div>
  )

  // Wrapper avec tooltip si fourni
  if (tooltip && showTooltips) {
    return (
      <div className="stat-block-wrapper" title={tooltip}>
        {content}
      </div>
    )
  }

  return content
}

/**
 * Groupe de stats avec layout flexible
 */
export const StatGroup = ({
  children,
  layout = 'horizontal', // 'horizontal', 'vertical', 'grid'
  spacing = 'medium', // 'small', 'medium', 'large'
  className = ''
}) => {
  const groupClass = [
    'stat-group',
    `stat-group--${layout}`,
    `stat-group--spacing-${spacing}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={groupClass}>
      {children}
    </div>
  )
}

/**
 * Stat avec comparaison (avant/après)
 */
export const ComparativeStat = ({
  label,
  currentValue,
  newValue,
  showDifference = true
}) => {
  const difference = newValue - currentValue
  const isPositive = difference > 0
  const isNegative = difference < 0

  return (
    <div className="comparative-stat">
      <div className="comparative-stat__label">{label}</div>
      <div className="comparative-stat__values">
        <span className="comparative-stat__current">{currentValue}</span>
        <span className="comparative-stat__arrow">→</span>
        <span className={`comparative-stat__new ${
          isPositive ? 'comparative-stat__new--positive' : 
          isNegative ? 'comparative-stat__new--negative' : ''
        }`}>
          {newValue}
        </span>
      </div>
      
      {showDifference && difference !== 0 && (
        <div className={`comparative-stat__difference ${
          isPositive ? 'comparative-stat__difference--positive' : 'comparative-stat__difference--negative'
        }`}>
          ({isPositive ? '+' : ''}{difference})
        </div>
      )}
    </div>
  )
}

/**
 * Stat avec barre de progression
 */
export const ProgressStat = ({
  label,
  current,
  max,
  showNumbers = true,
  variant = 'default'
}) => {
  const percentage = max > 0 ? (current / max) * 100 : 0

  return (
    <div className={`progress-stat progress-stat--${variant}`}>
      <div className="progress-stat__header">
        <span className="progress-stat__label">{label}</span>
        {showNumbers && (
          <span className="progress-stat__numbers">
            {current}/{max}
          </span>
        )}
      </div>
      
      <div className="progress-stat__bar">
        <div
          className="progress-stat__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default StatBlock