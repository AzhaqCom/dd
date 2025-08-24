import React from 'react'
import { useUIStore, uiSelectors } from '../../stores'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'

/**
 * Section pliable intégrée au store UI pour la persistance
 */
export const CollapsibleSection = ({ 
  id, // Identifiant unique pour la persistance
  title, 
  children, 
  defaultExpanded = true,
  persistState = true,
  showIcon = true,
  headerLevel = 4,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggle // Callback optionnel après toggle
}) => {
  const isCollapsed = useUIStore(state => 
    persistState ? state.collapsedSections.has(id) : false
  )
  const toggleSection = useUIStore(state => state.toggleSection)
  const animationsEnabled = useUIStore(state => state.combatAnimationsEnabled)

  // Si on ne persiste pas l'état, utiliser un state local
  const [localCollapsed, setLocalCollapsed] = React.useState(!defaultExpanded)
  
  const isExpanded = persistState ? !isCollapsed : !localCollapsed

  const handleToggle = () => {
    if (persistState && id) {
      toggleSection(id)
    } else {
      setLocalCollapsed(!localCollapsed)
    }
    onToggle?.(isExpanded)
  }

  const sectionClass = [
    'collapsible-section',
    isExpanded && 'collapsible-section--expanded',
    animationsEnabled && 'collapsible-section--animated',
    className
  ].filter(Boolean).join(' ')

  const headerClass = [
    'collapsible-section__header',
    `collapsible-section__header--h${headerLevel}`,
    headerClassName
  ].filter(Boolean).join(' ')

  const contentClass = [
    'collapsible-section__content',
    contentClassName
  ].filter(Boolean).join(' ')

  const HeaderTag = `h${headerLevel}`

  return (
    <div className={sectionClass}>
      <HeaderTag
        className={headerClass}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        aria-expanded={isExpanded}
        aria-controls={id ? `${id}-content` : undefined}
      >
        <span className="collapsible-section__title">{title}</span>
        {showIcon && (
          <span className="collapsible-section__icon">
            {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
          </span>
        )}
      </HeaderTag>
      
      {isExpanded && (
        <div 
          className={contentClass}
          id={id ? `${id}-content` : undefined}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Groupe de sections pliables avec accordéon optionnel
 */
export const CollapsibleGroup = ({
  children,
  accordion = false, // Si true, une seule section peut être ouverte à la fois
  className = ''
}) => {
  const [openSection, setOpenSection] = React.useState(null)

  const groupClass = [
    'collapsible-group',
    accordion && 'collapsible-group--accordion',
    className
  ].filter(Boolean).join(' ')

  if (!accordion) {
    return <div className={groupClass}>{children}</div>
  }

  // Mode accordéon : gérer l'ouverture exclusive
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === CollapsibleSection) {
      const sectionId = child.props.id || `section-${index}`
      const isOpen = openSection === sectionId
      
      return React.cloneElement(child, {
        ...child.props,
        persistState: false, // Désactiver la persistance en mode accordéon
        defaultExpanded: isOpen,
        onToggle: (wasExpanded) => {
          if (!wasExpanded) {
            setOpenSection(sectionId)
          } else {
            setOpenSection(null)
          }
          child.props.onToggle?.(wasExpanded)
        }
      })
    }
    return child
  })

  return <div className={groupClass}>{childrenWithProps}</div>
}

/**
 * Hook pour contrôler les sections pliables
 */
export const useCollapsibleSections = () => {
  const collapseSection = useUIStore(state => state.collapseSection)
  const expandSection = useUIStore(state => state.expandSection)
  const toggleSection = useUIStore(state => state.toggleSection)
  const collapsedSections = useUIStore(state => state.collapsedSections)

  return {
    collapseSection,
    expandSection,
    toggleSection,
    isCollapsed: (sectionId) => collapsedSections.has(sectionId),
    isExpanded: (sectionId) => !collapsedSections.has(sectionId),
    
    // Utilitaires
    collapseAll: (sectionIds) => {
      sectionIds.forEach(id => collapseSection(id))
    },
    expandAll: (sectionIds) => {
      sectionIds.forEach(id => expandSection(id))
    }
  }
}