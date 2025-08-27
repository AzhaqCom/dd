import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useUIStore, uiSelectors } from '../../stores'
import { Button } from './Button'
import { MdClose } from 'react-icons/md'

/**
 * Composant Modal avec gestion centralisée via UIStore
 */
export const Modal = ({
  type,
  title,
  children,
  size = 'medium', // 'small', 'medium', 'large', 'fullscreen'
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  onClose
}) => {
  const activeModal = useUIStore(state => state.activeModal)
  const modalData = useUIStore(state => state.modalData)
  const closeModal = useUIStore(state => state.closeModal)
  const isMobile = useUIStore(state => state.isMobile)

  const isVisible = activeModal === type

  // Handle escape key
  useEffect(() => {
    if (!isVisible || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isVisible, closeOnEscape])

  // Handle body scroll lock
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isVisible])

  const handleClose = () => {
    onClose?.()
    closeModal()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      handleClose()
    }
  }

  if (!isVisible) return null

  const modalClass = [
    'modal',
    `modal--${size}`,
    isMobile && 'modal--mobile',
    className
  ].filter(Boolean).join(' ')

  const modalContent = (
    <div className="modal__backdrop" onClick={handleBackdropClick}>
      <div className={modalClass} role="dialog" aria-modal="true">
        {(title || showCloseButton) && (
          <div className="modal__header">
            {title && <h2 className="modal__title">{title}</h2>}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="small"
                icon={<MdClose />}
                onClick={handleClose}
                className="modal__close-button"
                aria-label="Fermer la modal"
              />
            )}
          </div>
        )}
        
        <div className="modal__content">
          {typeof children === 'function' 
            ? children({ data: modalData, onClose: handleClose })
            : children
          }
        </div>
      </div>
    </div>
  )

  // Render dans un portail pour éviter les problèmes de z-index
  return ReactDOM.createPortal(modalContent, document.body)
}

/**
 * Hook pour utiliser facilement les modales
 */
export const useModal = () => {
  const openModal = useUIStore(state => state.openModal)
  const closeModal = useUIStore(state => state.closeModal)
  const activeModal = useUIStore(state => state.activeModal)
  const modalData = useUIStore(state => state.modalData)

  return {
    openModal,
    closeModal,
    activeModal,
    modalData,
    isOpen: (modalType) => activeModal === modalType
  }
}

/**
 * Modales pré-configurées courantes
 */
