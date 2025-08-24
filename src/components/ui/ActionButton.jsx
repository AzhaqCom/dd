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

/**
 * Bouton d'action avec icône et description
 */
export const DetailedActionButton = ({
  icon,
  title,
  description,
  shortcut,
  cost,
  disabled = false,
  selected = false,
  onClick,
  className = ''
}) => {
  return (
    <ActionButton
      selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`action-button--detailed ${className}`}
    >
      <div className="action-button__content">
        {icon && (
          <div className="action-button__icon">
            {icon}
          </div>
        )}
        
        <div className="action-button__details">
          <div className="action-button__title">{title}</div>
          {description && (
            <div className="action-button__description">{description}</div>
          )}
          
          <div className="action-button__meta">
            {cost && (
              <span className="action-button__cost">{cost}</span>
            )}
            {shortcut && (
              <span className="action-button__shortcut">{shortcut}</span>
            )}
          </div>
        </div>
      </div>
    </ActionButton>
  )
}

/**
 * Groupe de boutons d'action
 */
export const ActionButtonGroup = ({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  className = ''
}) => {
  const groupClass = [
    'action-button-group',
    `action-button-group--${orientation}`,
    `action-button-group--${spacing}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={groupClass}>
      {children}
    </div>
  )
}

export default ActionButton