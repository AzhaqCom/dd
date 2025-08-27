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


