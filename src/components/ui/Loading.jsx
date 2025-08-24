import React from 'react'
import { useUIStore, uiSelectors } from '../../stores'

/**
 * Spinner de base
 */
export const Spinner = ({ size = 'medium', className = '' }) => {
  const spinnerClass = [
    'spinner',
    `spinner--${size}`,
    className
  ].filter(Boolean).join(' ')

  return <div className={spinnerClass} />
}

/**
 * Indicateur de chargement avec message
 */
export const LoadingIndicator = ({ 
  message, 
  size = 'medium',
  showSpinner = true,
  className = '' 
}) => {
  const containerClass = [
    'loading-indicator',
    `loading-indicator--${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {showSpinner && <Spinner size={size} />}
      {message && <span className="loading-indicator__message">{message}</span>}
    </div>
  )
}

/**
 * Overlay de chargement plein écran
 */
export const LoadingOverlay = ({ 
  message = "Chargement...",
  backdrop = true,
  className = '' 
}) => {
  const overlayClass = [
    'loading-overlay',
    backdrop && 'loading-overlay--backdrop',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={overlayClass}>
      <div className="loading-overlay__content">
        <Spinner size="large" />
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  )
}

/**
 * Composant de chargement connecté au store UI
 */
export const GlobalLoading = () => {
  const loading = useUIStore(state => state.loading)
  const message = useUIStore(state => state.loadingMessage)

  if (!loading) return null

  return <LoadingOverlay message={message || "Chargement..."} />
}

/**
 * Skeleton loader pour le contenu
 */
export const Skeleton = ({ 
  variant = 'text', // 'text', 'rect', 'circle'
  width,
  height,
  lines = 1,
  className = '' 
}) => {
  const skeletonClass = [
    'skeleton',
    `skeleton--${variant}`,
    className
  ].filter(Boolean).join(' ')

  const style = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1em' : variant === 'circle' ? '40px' : '200px')
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={skeletonClass}
            style={{
              ...style,
              width: index === lines - 1 ? '60%' : style.width // Dernière ligne plus courte
            }}
          />
        ))}
      </div>
    )
  }

  return <div className={skeletonClass} style={style} />
}

/**
 * Skeleton pour les cartes de personnages
 */
export const CharacterCardSkeleton = () => (
  <div className="character-card-skeleton">
    <div className="skeleton-header">
      <Skeleton variant="circle" width="40px" height="40px" />
      <div className="skeleton-text">
        <Skeleton variant="text" width="80px" />
        <Skeleton variant="text" width="60px" />
      </div>
    </div>
    <div className="skeleton-body">
      <Skeleton variant="text" width="100px" />
      <Skeleton variant="rect" width="100%" height="8px" />
    </div>
    <div className="skeleton-footer">
      <Skeleton variant="text" width="40px" />
      <Skeleton variant="text" width="40px" />
    </div>
  </div>
)

/**
 * Hook pour gérer l'état de chargement global
 */
export const useLoading = () => {
  const setLoading = useUIStore(state => state.setLoading)
  const loading = useUIStore(state => state.loading)
  const message = useUIStore(state => state.loadingMessage)

  return {
    loading,
    message,
    startLoading: (loadingMessage) => setLoading(true, loadingMessage),
    stopLoading: () => setLoading(false),
    setLoadingMessage: (loadingMessage) => {
      if (loading) {
        setLoading(true, loadingMessage)
      }
    }
  }
}

/**
 * HOC pour wrapper un composant avec un état de chargement
 */
export const withLoading = (Component, defaultMessage = "Chargement...") => {
  return React.forwardRef((props, ref) => {
    const { loading = false, loadingMessage, ...otherProps } = props

    if (loading) {
      return <LoadingIndicator message={loadingMessage || defaultMessage} />
    }

    return <Component ref={ref} {...otherProps} />
  })
}

/**
 * Hook pour gérer le chargement asynchrone
 */
export const useAsyncLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const execute = React.useCallback(async (asyncFunction, loadingMessage) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await asyncFunction()
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = React.useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    execute,
    reset
  }
}