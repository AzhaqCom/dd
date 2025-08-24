import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardBody } from '../../ui'

/**
 * Journal des messages de combat
 */
export const CombatLog = ({ 
  messages = [],
  maxMessages = 50,
  autoScroll = true,
  className = ''
}) => {
  const logRef = useRef(null)
  const endRef = useRef(null)

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  // Limiter le nombre de messages affichés pour les performances
  const displayedMessages = messages.slice(-maxMessages)

  const getMessageIcon = (type) => {
    switch (type) {
      case 'combat-start': return '⚔️'
      case 'initiative': return '🎲'
      case 'turn-start': return '▶️'
      case 'hit': return '💥'
      case 'critical': return '💀'
      case 'miss': return '❌'
      case 'spell': return '🔮'
      case 'victory': return '🎉'
      case 'defeat': return '💀'
      case 'enemy-hit': return '🗡️'
      case 'heal': return '💚'
      case 'error': return '⚠️'
      default: return '📝'
    }
  }

  const getMessageClass = (type) => {
    const baseClass = 'combat-log__message'
    switch (type) {
      case 'critical':
        return `${baseClass} ${baseClass}--critical`
      case 'victory':
        return `${baseClass} ${baseClass}--victory`
      case 'defeat':
        return `${baseClass} ${baseClass}--defeat`
      case 'error':
        return `${baseClass} ${baseClass}--error`
      case 'enemy-hit':
        return `${baseClass} ${baseClass}--enemy`
      case 'spell':
        return `${baseClass} ${baseClass}--spell`
      case 'heal':
        return `${baseClass} ${baseClass}--heal`
      default:
        return baseClass
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <Card className={`combat-log ${className}`}>
      <CardHeader>
        <h4>📜 Journal de Combat</h4>
        {messages.length > 0 && (
          <span className="combat-log__counter">
            {displayedMessages.length} message{displayedMessages.length > 1 ? 's' : ''}
          </span>
        )}
      </CardHeader>
      
      <CardBody>
        <div 
          ref={logRef}
          className="combat-log__content"
        >
          {displayedMessages.length === 0 ? (
            <div className="combat-log__empty">
              <p>Aucun message de combat pour le moment.</p>
            </div>
          ) : (
            <div className="combat-log__messages">
              {displayedMessages.map((message, index) => (
                <div
                  key={`${message.id || index}-${message.timestamp || Date.now()}`}
                  className={getMessageClass(message.type)}
                >
                  <span className="combat-log__icon">
                    {getMessageIcon(message.type)}
                  </span>
                  
                  <div className="combat-log__message-content">
                    <span className="combat-log__text">
                      {message.text || message.message || message}
                    </span>
                    
                    {message.timestamp && (
                      <span className="combat-log__timestamp">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Marqueur de fin pour l'auto-scroll */}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Version compacte du journal de combat
 */
export const CompactCombatLog = ({ 
  messages = [], 
  maxMessages = 20,
  showTimestamps = false 
}) => {
  const displayedMessages = messages.slice(-maxMessages)
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="combat-log combat-log--compact">
      <div className="combat-log__compact-content">
        {displayedMessages.map((message, index) => (
          <div
            key={index}
            className="combat-log__compact-message"
          >
            <span className="combat-log__compact-text">
              {message.text || message.message || message}
            </span>
            
            {showTimestamps && message.timestamp && (
              <span className="combat-log__compact-timestamp">
                {new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}

export default CombatLog