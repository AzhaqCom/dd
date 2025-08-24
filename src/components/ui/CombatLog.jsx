import React, { useEffect, useRef, useMemo } from 'react'
import { useGameStore, useUIStore, gameSelectors } from '../../stores'
import { getIconForType } from './Icons'
import { Button } from './Button'
import { MdClear, MdExpandLess, MdExpandMore } from 'react-icons/md'

const CombatLogEntry = React.memo(({ entry, showTimestamp = false }) => {
  const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''
  
  return (
    <div className={`combat-log__entry combat-log__entry--${entry.type}`}>
      <div className="combat-log__entry-content">
        <span className="combat-log__entry-icon">
          {getIconForType(entry.type)}
        </span>
        <span className="combat-log__entry-message">{entry.message}</span>
      </div>
      {showTimestamp && timestamp && (
        <span className="combat-log__entry-timestamp">{timestamp}</span>
      )}
    </div>
  )
})

/**
 * Journal de combat modernisé avec intégration aux stores
 */
export const CombatLog = ({ 
  title = "Journal",
  maxEntries = 100,
  showTimestamps = false,
  showClearButton = true,
  collapsible = false,
  compact = false,
  className = '' 
}) => {
  const logRef = useRef(null)
  const combatLog = useGameStore(state => state.combatLog)
  const clearCombatLog = useGameStore(state => state.clearCombatLog)
  const autoScrollLogs = useUIStore(state => state.autoScrollLogs)
  const isCompactMode = useUIStore(state => state.compactMode)
  
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Auto-scroll si activé dans les préférences
  useEffect(() => {
    if (autoScrollLogs && logRef.current && !isCollapsed) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [combatLog, autoScrollLogs, isCollapsed])

  // Limiter le nombre d'entrées affichées pour les performances
  const displayedEntries = useMemo(() => 
    combatLog.slice(-maxEntries),
    [combatLog, maxEntries]
  )

  // Memoize les entrées du log pour éviter les re-rendus inutiles
  const logEntries = useMemo(() => 
    displayedEntries.map((entry) => (
      <CombatLogEntry
        key={entry.id || `${entry.message}-${entry.timestamp}`}
        entry={entry}
        showTimestamp={showTimestamps}
      />
    )), 
    [displayedEntries, showTimestamps]
  )

  const containerClass = [
    'combat-log',
    compact || isCompactMode ? 'combat-log--compact' : '',
    isCollapsed ? 'combat-log--collapsed' : '',
    className
  ].filter(Boolean).join(' ')

  const hasEntries = displayedEntries.length > 0

  return (
    <div className={containerClass}>
      <div className="combat-log__header">
        <div className="combat-log__title-section">
          {collapsible && (
            <button
              className="combat-log__toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <MdExpandMore /> : <MdExpandLess />}
            </button>
          )}
          <h3 className="combat-log__title">{title}</h3>
          {hasEntries && (
            <span className="combat-log__count">({displayedEntries.length})</span>
          )}
        </div>
        
        {showClearButton && hasEntries && !isCollapsed && (
          <Button
            size="small"
            variant="ghost"
            icon={<MdClear />}
            onClick={clearCombatLog}
            className="combat-log__clear-button"
            title="Vider le journal"
          >
            Vider
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <div className="combat-log__content">
          <div className="combat-log__entries" ref={logRef}>
            {hasEntries ? (
              logEntries
            ) : (
              <div className="combat-log__empty">
                <span className="combat-log__empty-icon">📝</span>
                <p className="combat-log__empty-message">En attente d'actions...</p>
              </div>
            )}
          </div>
          
          {hasEntries && !autoScrollLogs && (
            <div className="combat-log__controls">
              <Button
                size="small"
                variant="ghost"
                onClick={() => {
                  if (logRef.current) {
                    logRef.current.scrollTop = logRef.current.scrollHeight
                  }
                }}
              >
                ↓ Aller au bas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Mini journal pour les interfaces compactes
 */
export const MiniCombatLog = ({ maxEntries = 3 }) => {
  const recentMessages = useGameStore(state => state.combatLog.slice(-maxEntries))
  
  if (recentMessages.length === 0) return null

  return (
    <div className="mini-combat-log">
      {recentMessages.map((entry) => (
        <div key={entry.id} className={`mini-combat-log__entry mini-combat-log__entry--${entry.type}`}>
          {getIconForType(entry.type)}
          <span>{entry.message}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Hook pour interagir avec le journal de combat
 */
export const useCombatLog = () => {
  const addCombatMessage = useGameStore(state => state.addCombatMessage)
  const clearCombatLog = useGameStore(state => state.clearCombatLog)
  const combatLog = useGameStore(state => state.combatLog)
  const hasMessages = useGameStore(state => state.combatLog.length > 0)

  return {
    addMessage: addCombatMessage,
    clearLog: clearCombatLog,
    messages: combatLog,
    hasMessages,
    
    // Messages typés pour une utilisation plus facile
    logSuccess: (message) => addCombatMessage(message, 'success'),
    logError: (message) => addCombatMessage(message, 'error'),
    logWarning: (message) => addCombatMessage(message, 'warning'),
    logInfo: (message) => addCombatMessage(message, 'info'),
    logCombat: (message) => addCombatMessage(message, 'combat'),
    logDamage: (message) => addCombatMessage(message, 'enemy-damage'),
    logHealing: (message) => addCombatMessage(message, 'heal'),
    logSpell: (message) => addCombatMessage(message, 'spell'),
    logSkillCheck: (message) => addCombatMessage(message, 'skill-check')
  }
}

export default React.memo(CombatLog)