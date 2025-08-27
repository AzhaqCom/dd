import React from 'react'
import { Button } from './Button'

/**
 * Bouton d'action spécialisé pour le combat et les interactions
 */
export const ActionButton = ({
  children,
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  selected = false,
  cooldown = false,
  onClick,
  className = '',
  ...props
}) => {
  const actionButtonClass = [
    'action-button',
    selected && 'action-button--selected',
    cooldown && 'action-button--cooldown',
    className
  ].filter(Boolean).join(' ')

  return (
    <Button
      variant={selected ? 'primary' : variant}
      size={size}
      disabled={disabled || cooldown}
      onClick={onClick}
      className={actionButtonClass}
      {...props}
    >
      {children}
      {cooldown && (
        <div className="action-button__cooldown-overlay">
          <span className="action-button__cooldown-text">⏱️</span>
        </div>
      )}
    </Button>
  )
}


export default ActionButton