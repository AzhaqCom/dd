import React, { useEffect } from 'react'
import { useUIStore, uiSelectors } from '../../stores'
import { MdClose, MdCheck, MdError, MdWarning, MdInfo } from 'react-icons/md'

const NotificationIcon = ({ type }) => {
  const iconMap = {
    success: <MdCheck className="notification__icon notification__icon--success" />,
    error: <MdError className="notification__icon notification__icon--error" />,
    warning: <MdWarning className="notification__icon notification__icon--warning" />,
    info: <MdInfo className="notification__icon notification__icon--info" />
  }
  
  return iconMap[type] || iconMap.info
}

const NotificationItem = ({ notification, onRemove }) => {
  const { id, type, message, duration, persistent } = notification

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id)
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [id, duration, persistent, onRemove])

  const notificationClass = [
    'notification',
    `notification--${type}`,
    'notification--slide-in'
  ].join(' ')

  return (
    <div className={notificationClass}>
      <div className="notification__content">
        <NotificationIcon type={type} />
        <span className="notification__message">{message}</span>
      </div>
      
      <button
        className="notification__close"
        onClick={() => onRemove(id)}
        aria-label="Fermer la notification"
      >
        <MdClose />
      </button>
    </div>
  )
}

/**
 * Conteneur de notifications avec positionnement fixe
 */
export const NotificationContainer = ({ 
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
  maxNotifications = 5 
}) => {
  const notifications = useUIStore(state => state.notifications)
  const removeNotification = useUIStore(state => state.removeNotification)
  const isMobile = useUIStore(state => state.isMobile)

  // Limiter le nombre de notifications affichées
  const visibleNotifications = notifications.slice(-maxNotifications)

  if (visibleNotifications.length === 0) return null

  const containerClass = [
    'notification-container',
    `notification-container--${position}`,
    isMobile && 'notification-container--mobile'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {visibleNotifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  )
}

/**
 * Hook pour afficher des notifications facilement
 */
export const useNotifications = () => {
  const showSuccess = useUIStore(state => state.showSuccess)
  const showError = useUIStore(state => state.showError)
  const showWarning = useUIStore(state => state.showWarning)
  const showInfo = useUIStore(state => state.showInfo)
  const clearNotifications = useUIStore(state => state.clearNotifications)

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotifications,
    
    // Méthodes de convenance
    notifySuccess: (message) => showSuccess(message),
    notifyError: (message) => showError(message),
    notifyWarning: (message) => showWarning(message),
    notifyInfo: (message) => showInfo(message),
    
    // Notifications persistantes
    persistentSuccess: (message) => showSuccess(message, { persistent: true }),
    persistentError: (message) => showError(message, { persistent: true }),
    persistentWarning: (message) => showWarning(message, { persistent: true }),
    persistentInfo: (message) => showInfo(message, { persistent: true })
  }
}

/**
 * Composant pour afficher des notifications inline (non fixes)
 */
export const InlineNotification = ({ 
  type = 'info', 
  message, 
  onDismiss,
  dismissible = true,
  className = '' 
}) => {
  const notificationClass = [
    'inline-notification',
    `inline-notification--${type}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={notificationClass}>
      <div className="inline-notification__content">
        <NotificationIcon type={type} />
        <span className="inline-notification__message">{message}</span>
      </div>
      
      {dismissible && onDismiss && (
        <button
          className="inline-notification__close"
          onClick={onDismiss}
          aria-label="Fermer la notification"
        >
          <MdClose />
        </button>
      )}
    </div>
  )
}