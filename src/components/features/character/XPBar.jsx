import React from 'react'
import { useCharacterStore, characterSelectors } from '../../../stores'

/**
 * Barre d'expérience avec progression vers le niveau suivant
 */
export const XPBar = ({
  currentXP = 0,
  nextLevelXP,
  progress = 0,
  level,
  showNumbers = true,
  showLevelUpIndicator = true,
  size = 'medium',
  animated = true
}) => {
  const canLevelUp = useCharacterStore(state => state.levelUpPending)
  const experienceGains = useCharacterStore(state => state.experienceGains)
  
  const hasRecentGain = experienceGains.length > 0
  const latestGain = hasRecentGain ? experienceGains[experienceGains.length - 1] : null

  const barClass = [
    'xp-bar',
    `xp-bar--${size}`,
    animated && 'xp-bar--animated',
    canLevelUp && 'xp-bar--can-level-up',
    hasRecentGain && 'xp-bar--recent-gain'
  ].filter(Boolean).join(' ')

  return (
    <div className={barClass}>
      {showNumbers && (
        <div className="xp-bar__info">
          <div className="xp-bar__current">
          
            <span className="xp-bar__value">
              ✨ XP:  {Math.max(0, Math.round(currentXP))} / {Math.max(0, Math.round(nextLevelXP))}
            </span>
          </div>
          
          
        </div>
      )}

      <div className="xp-bar__container">
        <div className="xp-bar__background">
          <div
            className="xp-bar__fill"
            style={{ 
              width: `${Math.min(100, progress)}%`,
              transition: animated ? 'width 0.5s ease-out' : 'none'
            }}
          />
          
          {/* Indicateur de gain récent */}
          {hasRecentGain && (
            <div className="xp-bar__recent-gain-indicator">
              +{latestGain.amount} XP
            </div>
          )}
        </div>

        {/* Indicateur de montée de niveau disponible */}
        {canLevelUp && showLevelUpIndicator && (
          <div className="xp-bar__level-up-indicator">
            🎯 Niveau suivant disponible !
          </div>
        )}
      </div>

      {progress >= 100 && !canLevelUp && (
        <div className="xp-bar__max-level">
          Niveau maximum atteint
        </div>
      )}
    </div>
  )
}

/**
 * Version simplifiée pour interfaces compactes
 */
export const CompactXPBar = ({ currentXP, nextLevelXP, progress }) => (
  <XPBar
    currentXP={currentXP}
    nextLevelXP={nextLevelXP}
    progress={progress}
    size="small"
    showNumbers={false}
    showLevelUpIndicator={false}
  />
)

/**
 * Indicateur circulaire de progression XP
 */
export const CircularXPIndicator = ({ 
  progress, 
  level, 
  size = 40,
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="circular-xp-indicator">
      <svg width={size} height={size}>
        <circle
          className="circular-xp-indicator__background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-xp-indicator__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      
      <div className="circular-xp-indicator__level">
        {level}
      </div>
    </div>
  )
}

export default XPBar