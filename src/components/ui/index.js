/**
 * Export centralisé des composants UI modernisés
 */

// Composants de base
export { Card, CardHeader, CardBody, CardFooter, CharacterCard } from './Card'
export { Button, ConfirmButton, ButtonGroup } from './Button'
export { ActionButton, DetailedActionButton, ActionButtonGroup } from './ActionButton'
export { Modal, useModal, ConfirmModal, InfoModal } from './Modal'
export { 
  NotificationContainer, 
  InlineNotification, 
  useNotifications 
} from './Notification'

// Composants d'affichage
export { 
  HealthBar, 
  CharacterHealthBar, 
  ResourceBars, 
  HealthIndicator 
} from './HealthBar'

// Composants de structure
export { 
  CollapsibleSection, 
  CollapsibleGroup, 
  useCollapsibleSections 
} from './CollapsibleSection'

// Journal de combat
export { 
  CombatLog, 
  MiniCombatLog, 
  useCombatLog 
} from './CombatLog'

// Composants de chargement
export {
  Spinner,
  LoadingIndicator,
  LoadingOverlay,
  GlobalLoading,
  Skeleton,
  CharacterCardSkeleton,
  useLoading,
  withLoading,
  useAsyncLoading
} from './Loading'

// Icônes
export * from './Icons'

// PARTIELLEMENT OBSOLÈTE: Nombreuses constantes non exploitées - simplifier selon l'utilisation réelle
export const UI_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium', 
  LARGE: 'large'
}

// PARTIELLEMENT OBSOLÈTE: Beaucoup de variants non utilisés - garder seulement les variants essentiels
export const UI_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  GHOST: 'ghost'
}

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}