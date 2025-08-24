import React from 'react'
import { Card } from '../../ui'

/**
 * Composant de suivi des emplacements de sorts
 */
export const SpellSlotTracker = ({
  spellSlots = {},
  onSlotUse,
  onSlotRestore,
  showDetails = true,
  className = ''
}) => {
  const slotLevels = Object.keys(spellSlots)
    .map(level => parseInt(level))
    .sort((a, b) => a - b)

  if (slotLevels.length === 0) {
    return (
      <Card className={`spell-slot-tracker ${className}`}>
        <div className="spell-slot-tracker__empty">
          <p>Aucun emplacement de sort disponible</p>
        </div>
      </Card>
    )
  }

  // Calcul des statistiques globales
  const totalSlots = slotLevels.reduce((sum, level) => {
    const slot = spellSlots[level]
    return sum + (slot?.max || 0)
  }, 0)

  const usedSlots = slotLevels.reduce((sum, level) => {
    const slot = spellSlots[level]
    return sum + (slot?.used || 0)
  }, 0)

  const availableSlots = totalSlots - usedSlots

  return (
    <Card className={`spell-slot-tracker ${className}`}>
      <div className="spell-slot-tracker__content">
        {/* En-tête avec résumé */}
        <div className="spell-slot-tracker__header">
          <h4 className="spell-slot-tracker__title">
            🔮 Emplacements de sorts
          </h4>
          <div className="spell-slot-tracker__summary">
            <span className="slot-summary">
              {availableSlots}/{totalSlots} disponibles
            </span>
          </div>
        </div>

        {/* Grille des emplacements par niveau */}
        <div className="spell-slot-tracker__grid">
          {slotLevels.map(level => {
            const slot = spellSlots[level]
            if (!slot || slot.max === 0) return null

            const available = slot.max - (slot.used || 0)
            const usagePercentage = slot.max > 0 ? (slot.used || 0) / slot.max * 100 : 0

            return (
              <div key={level} className="spell-slot-level">
                <div className="spell-slot-level__header">
                  <h5 className="spell-slot-level__title">
                    Niveau {level}
                  </h5>
                  <span className="spell-slot-level__count">
                    {available}/{slot.max}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="spell-slot-level__progress">
                  <div className="spell-slot-progress-bar">
                    <div 
                      className="spell-slot-progress-fill"
                      style={{ 
                        width: `${100 - usagePercentage}%`,
                        backgroundColor: available > 0 ? '#4caf50' : '#f44336'
                      }}
                    />
                  </div>
                </div>

                {showDetails && (
                  <div className="spell-slot-level__details">
                    {/* Indicateurs visuels des emplacements */}
                    <div className="spell-slot-dots">
                      {Array.from({ length: slot.max }, (_, index) => (
                        <span
                          key={index}
                          className={`spell-slot-dot ${
                            index < (slot.used || 0) 
                              ? 'spell-slot-dot--used' 
                              : 'spell-slot-dot--available'
                          }`}
                          title={
                            index < (slot.used || 0)
                              ? 'Emplacement utilisé'
                              : 'Emplacement disponible'
                          }
                        >
                          {index < (slot.used || 0) ? '●' : '○'}
                        </span>
                      ))}
                    </div>

                    
                    {/* <div className="spell-slot-level__actions">
                      {available < slot.max && onSlotRestore && (
                        <button
                          type="button"
                          className="spell-slot-action spell-slot-action--restore"
                          onClick={() => onSlotRestore(level)}
                          title="Restaurer un emplacement"
                        >
                          ↻
                        </button>
                      )}
                      {available > 0 && onSlotUse && (
                        <button
                          type="button"
                          className="spell-slot-action spell-slot-action--use"
                          onClick={() => onSlotUse(level)}
                          title="Utiliser un emplacement"
                        >
                          ↓
                        </button>
                      )}
                    </div> */}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Messages d'état */}
        {usedSlots === totalSlots && (
          <div className="spell-slot-tracker__warning">
            <span className="warning-icon">⚠️</span>
            <span>Tous les emplacements de sorts ont été utilisés</span>
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Version compacte du traqueur d'emplacements
 */
export const CompactSpellSlotTracker = ({
  spellSlots = {},
  showLevelNumbers = true
}) => {
  const slotLevels = Object.keys(spellSlots)
    .map(level => parseInt(level))
    .sort((a, b) => a - b)
    .filter(level => {
      const slot = spellSlots[level]
      return slot && slot.max > 0
    })

  if (slotLevels.length === 0) return null

  return (
    <div className="spell-slot-tracker spell-slot-tracker--compact">
      {slotLevels.map(level => {
        const slot = spellSlots[level]
        const available = slot.max - (slot.used || 0)
        
        return (
          <div key={level} className="compact-spell-slot">
            {showLevelNumbers && (
              <span className="compact-spell-slot__level">{level}</span>
            )}
            <span className="compact-spell-slot__count">
              {available}/{slot.max}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default SpellSlotTracker