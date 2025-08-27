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


export default XPBar