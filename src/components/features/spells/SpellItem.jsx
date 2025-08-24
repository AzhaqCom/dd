import React, { useState } from 'react'
import { Card, Button, ButtonGroup } from '../../ui'
import { SpellServiceUnified } from '../../../services/SpellServiceUnified'

/**
 * Composant d'affichage d'un sort individuel
 */
export const SpellItem = ({
  spell,
  character,
  spellSlots = {},
  viewMode = 'list', // list, grid, compact
  actions = {},
  isOutOfCombat = false,
  onClick,
  onCast,
  onPrepare,
  onUnprepare,
  className = ''
}) => {
  const [showCastingOptions, setShowCastingOptions] = useState(false)

  // Classes CSS
  const itemClass = [
    'spell-item',
    `spell-item--${viewMode}`,
    `spell-item--level-${spell.level}`,
    `spell-item--${spell.school?.toLowerCase().replace(/\s+/g, '-')}`,
    className
  ].filter(Boolean).join(' ')

  // Obtenir l'icône du sort selon l'école
  const getSpellIcon = () => {
    switch (spell.school) {
      case 'Évocation':
        return '🔥'
      case 'Abjuration':
        return '🛡️'
      case 'Enchantement':
        return '🧠'
      case 'Illusion':
        return '🌟'
      case 'Divination':
        return '👁️'
      case 'Invocation':
        return '👹'
      case 'Nécromancie':
        return '💀'
      case 'Transmutation':
        return '🔄'
      default:
        return '✨'
    }
  }

  // Vérifier si le sort peut être lancé
  const canBeCast = () => {
    if (!actions.canCast) return false

    // Si on est hors combat, vérifier si le sort peut être lancé hors combat
    if (isOutOfCombat && spell.castableOutOfCombat !== true) {
      return false
    }

    // Vérifier si le sort est déjà actif (pour les sorts avec durée)
    if (isOutOfCombat && spell.castableOutOfCombat === true) {
      const spellService = new SpellServiceUnified ()
      if (spellService.isSpellActive(spell.id, character)) {
        return false // Sort déjà actif, ne pas permettre de le lancer à nouveau
      }
    }

    // Les cantrips peuvent toujours être lancés (si castable hors combat et pas déjà actif)
    if (spell.level === 0) return true

    // Vérifier les emplacements disponibles
    for (let level = spell.level; level <= 9; level++) {
      const slot = spellSlots[level]
      if (slot && slot.available > 0) return true
    }

    return false
  }

  // Obtenir les niveaux de lancement disponibles
  const getAvailableCastingLevels = () => {
    if (spell.level === 0) return []

    const levels = []
    for (let level = spell.level; level <= 9; level++) {
      const slot = spellSlots[level]
      if (slot && slot.available > 0) {
        levels.push(level)
      }
    }
    return levels
  }

  // Gestionnaires d'événements
  const handleCast = (castingLevel = null) => {
    onCast?.(spell, castingLevel)
    setShowCastingOptions(false)
  }

  const handleCastClick = () => {
    const availableLevels = getAvailableCastingLevels()

    if (spell.level === 0 || availableLevels.length <= 1) {
      // Lancement direct pour les cantrips ou s'il n'y a qu'un niveau disponible
      handleCast(availableLevels[0] || spell.level)
    } else {
      // Montrer les options de niveau
      setShowCastingOptions(true)
    }
  }

  // Rendu pour le mode compact
  const renderCompactMode = () => (
    <div className={itemClass} onClick={onClick}>
      <div className="spell-item__compact-content">
        <span className="spell-item__icon">{getSpellIcon()}</span>

        <div className="spell-item__compact-info">
          <span className="spell-item__name">{spell.name}</span>
          <span className="spell-item__level">
            {spell.level === 0 ? 'Cantrip' : `Niv. ${spell.level}`}
          </span>
        </div>

        {actions.canCast && canBeCast() && (
          <Button
            size="small"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation()
              handleCastClick()
            }}
          >
            Lancer
          </Button>
        )}
      </div>
    </div>
  )

  // Rendu pour le mode grille
  const renderGridMode = () => (
    <Card className={itemClass} onClick={onClick}>
      <div className="spell-item__grid-content">
        <div className="spell-item__header">
          {getSpellIcon()}{spell.name}
          <div className="spell-item__title">
            <h4 className="spell-item__name">{spell.name}</h4>
            <div className="spell-item__meta">
              <span className="spell-item__level">
                {spell.level === 0 ? 'Cantrip' : `Niveau ${spell.level}`}
              </span>
              <span className="spell-item__school">{spell.school}</span>
            </div>
          </div>
        </div>

        <div className="spell-item__description">
          <p>
            {spell.description?.length > 80
              ? `${spell.description.substring(0, 80)}...`
              : spell.description
            }
          </p>
        </div>

        <div className="spell-item__properties">
          {spell.castingTime && (
            <span className="spell-property">
              ⏱️ {spell.castingTime}
            </span>
          )}
          {spell.range && (
            <span className="spell-property">
              📏 {spell.range}
            </span>
          )}
          {spell.duration && (
            <span className="spell-property">
              ⏳ {spell.duration}
            </span>
          )}
        </div>

        <div className="spell-item__actions">
          {renderActions()}
        </div>
      </div>
    </Card>
  )

  // Rendu pour le mode liste
  const renderListMode = () => (
    <div className={itemClass} onClick={onClick}>
      <div className="spell-item__list-content">

        <div className="spell-item__list-header">
          {getSpellIcon()} <h4 className="spell-item__name">{spell.name}</h4>
          <span className="spell-item__level">
            {spell.level === 0 ? 'Cantrip' : `Niveau ${spell.level}`}
          </span>
          <span className="spell-item__school">{spell.school}</span>
          <div className="spell-item__list-properties">
            {spell.castingTime && (
              <span>⏱️ {spell.castingTime}</span>
            )}
            {spell.range && (
              <span>📏 {spell.range}</span>
            )}
            {spell.duration && (
              <span>⏳ {spell.duration}</span>
            )}
            {spell.components && (
              <span>🧪 {spell.components.join(', ')}</span>
            )}
          </div>
        </div>
        <div className="spell-item__list-info">


          {spell.description && (
            <p className="spell-item__list-description">
              {spell.description}
            </p>
          )}
        </div>
        <div className="spell-item__list-actions">
          {renderActions()}
        </div>
      </div>
    </div>
  )

  // Rendu des actions
  const renderActions = () => (
    <div className="spell-item__action-buttons">
      {showCastingOptions ? (
        <div className="spell-casting-options">
          <span className="casting-options-label">Lancer au niveau:</span>
          <ButtonGroup>
            {getAvailableCastingLevels().map(level => (
              <Button
                key={level}
                size="small"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCast(level)
                }}
              >
                {level}
              </Button>
            ))}
          </ButtonGroup>
          <Button
            size="small"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setShowCastingOptions(false)
            }}
          >
            Annuler
          </Button>
        </div>
      ) : (
        <>
          {actions.canCast && canBeCast() && (
            <Button
              size="small"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                handleCastClick()
              }}
            >
              🔮 Lancer
            </Button>
          )}

          {actions.canPrepare && (
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                onPrepare?.(spell)
              }}
            >
              📋 Préparer
            </Button>
          )}

          {actions.canUnprepare && (
            <Button
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onUnprepare?.(spell)
              }}
            >
              ❌ Retirer
            </Button>
          )}
        </>
      )}
    </div>
  )

  // Rendu selon le mode
  switch (viewMode) {
    case 'compact':
      return renderCompactMode()
    case 'grid':
      return renderGridMode()
    case 'list':
    default:
      return renderListMode()
  }
}

export default SpellItem