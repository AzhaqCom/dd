import React from 'react'
import { useUIStore } from '../../stores'

/**
 * Composant Button réutilisable avec différentes variantes
 */
export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // 'left', 'right'
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const isCompactMode = useUIStore(state => state.compactMode)
  
  const baseClass = 'btn'
  const variantClass = `btn--${variant}`
  const sizeClass = `btn--${size}`
  const compactClass = isCompactMode ? 'btn--compact' : ''
  const disabledClass = disabled ? 'btn--disabled' : ''
  const loadingClass = loading ? 'btn--loading' : ''
  const fullWidthClass = fullWidth ? 'btn--full-width' : ''

  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    compactClass,
    disabledClass,
    loadingClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ')

  const handleClick = (e) => {
    if (disabled || loading) return
    onClick?.(e)
  }

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      <span className="btn__content">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </button>
  )
}

/**
 * Bouton de confirmation avec variante danger
 */
export const ConfirmButton = ({ children, onConfirm, confirmText = "Confirmer ?", ...props }) => {
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleClick = () => {
    if (showConfirm) {
      onConfirm?.()
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
      // Auto-hide after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <Button
      {...props}
      variant={showConfirm ? 'danger' : props.variant || 'secondary'}
      onClick={handleClick}
    >
      {showConfirm ? confirmText : children}
    </Button>
  )
}

/**
 * Groupe de boutons avec espacement cohérent
 */
export const ButtonGroup = ({ 
  children, 
  variant = 'horizontal', // 'horizontal', 'vertical'
  spacing = 'medium', // 'small', 'medium', 'large'
  className = '' 
}) => {
  const groupClass = [
    'btn-group',
    `btn-group--${variant}`,
    `btn-group--spacing-${spacing}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={groupClass}>
      {children}
    </div>
  )
}