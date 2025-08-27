import React from 'react'
import { SpellItem } from './SpellItem'

/**
 * Liste de sorts moderne avec support de différents modes d'affichage
 */
export const SpellList = ({
  spells = [],
  character,
  activeTab = 'prepared',
  spellSlots = {},
  isOutOfCombat = false,
  viewMode = 'list', // list, grid, compact
  onSpellClick,
  onCastSpell,
  onPrepareSpell,
  onUnprepareSpell,
  onLearnSpell,
  preparedSpells = [],
  className = ''
}) => {
  const listClass = [
    'spell-list',
    `spell-list--${viewMode}`,
    `spell-list--${activeTab}`,
    className
  ].filter(Boolean).join(' ')

  // Grouper les sorts par niveau pour un meilleur affichage
  const spellsByLevel = spells.reduce((groups, spell) => {
    const level = spell.level === 0 ? 'Cantrips' : `Niveau ${spell.level}`
    if (!groups[level]) groups[level] = []
    groups[level].push(spell)
    return groups
  }, {})

  const sortedLevels = Object.keys(spellsByLevel).sort((a, b) => {
    if (a === 'Cantrips') return -1
    if (b === 'Cantrips') return 1
    
    const levelA = parseInt(a.replace('Niveau ', ''))
    const levelB = parseInt(b.replace('Niveau ', ''))
    return levelA - levelB
  })

  if (spells.length === 0) {
    return (
      <div className="spell-list-empty">
        <div className="spell-empty-state">
          <span className="spell-empty-icon">🔮</span>
          <p>Aucun sort à afficher</p>
        </div>
      </div>
    )
  }

  // Déterminer les actions disponibles selon l'onglet actif
  const getActionsForTab = (spell) => {
    const isAlreadyPrepared = preparedSpells.includes(spell.name);
    
    switch (activeTab) {
      case 'prepared':
        return {
          canCast: true,
          canUnprepare: true,
          canPrepare: false
        }
      case 'known':
        return {
          canCast: false,
          canUnprepare: false,
          canPrepare: !isAlreadyPrepared && spell.level>0, // Seulement si pas déjà préparé
          canLearn: false
        }
      case 'grimoire':
        return {
          canCast: false,
          canUnprepare: false,
          canPrepare: false,
          canLearn: true
        }
      case 'unprepared':
        return {
          canCast: false,
          canUnprepare: false,
          canPrepare: true
        }
      case 'cantrips':
        return {
          canCast: true,
          canUnprepare: false,
          canPrepare: false
        }
      default:
        return {
          canCast: false,
          canUnprepare: false,
          canPrepare: false
        }
    }
  }

  return (
    <div className={listClass}>
      {viewMode === 'compact' ? (
        // Mode compact : liste simple
        <div className="spell-list__compact">
          {spells.map((spell, index) => (
            <SpellItem
              key={spell.id || index}
              spell={spell}
              character={character}
              spellSlots={spellSlots}
              viewMode="compact"
              actions={getActionsForTab(spell)}
              isOutOfCombat={isOutOfCombat}
              onClick={() => onSpellClick?.(spell)}
              onCast={onCastSpell}
              onPrepare={onPrepareSpell}
              onUnprepare={onUnprepareSpell}
              onLearn={onLearnSpell}
            />
          ))}
        </div>
      ) : (
        // Mode normal : groupé par niveau
        <div className="spell-list__grouped">
          {sortedLevels.map(levelGroup => (
            <div key={levelGroup} className="spell-level-group">
              <h4 className="spell-level-group__title">
                {levelGroup}
                <span className="spell-level-group__count">
                  ({spellsByLevel[levelGroup].length})
                </span>
              </h4>
              
              <div className={`spell-level-group__content spell-level-group__content--${viewMode}`}>
                {spellsByLevel[levelGroup].map((spell, index) => (
                  <SpellItem
                    key={spell.id || index}
                    spell={spell}
                    character={character}
                    spellSlots={spellSlots}
                    viewMode={viewMode}
                    actions={getActionsForTab(spell)}
                    isOutOfCombat={isOutOfCombat}
                    onClick={() => onSpellClick?.(spell)}
                    onCast={onCastSpell}
                    onPrepare={onPrepareSpell}
                    onUnprepare={onUnprepareSpell}
                    onLearn={onLearnSpell}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Liste de sorts simplifiée pour les sélecteurs
 */
export const SimpleSpellList = ({
  spells = [],
  onSpellSelect,
  selectedSpells = [],
  maxSelection = null
}) => {
  return (
    <div className="spell-list spell-list--simple">
      {spells.map((spell, index) => {
        const isSelected = selectedSpells.some(s => s.id === spell.id)
        const canSelect = !maxSelection || selectedSpells.length < maxSelection || isSelected

        return (
          <div
            key={spell.id || index}
            className={`simple-spell-item ${isSelected ? 'simple-spell-item--selected' : ''} ${!canSelect ? 'simple-spell-item--disabled' : ''}`}
            onClick={() => canSelect && onSpellSelect?.(spell)}
          >
            <div className="simple-spell-item__header">
              <span className="simple-spell-item__name">{spell.name}</span>
              <span className="simple-spell-item__level">
                {spell.level === 0 ? 'Cantrip' : `Niv. ${spell.level}`}
              </span>
              {isSelected && (
                <span className="simple-spell-item__check">✓</span>
              )}
            </div>
            
            <p className="simple-spell-item__school">{spell.school}</p>
            
            {spell.description && (
              <p className="simple-spell-item__description">
                {spell.description.length > 100 
                  ? `${spell.description.substring(0, 100)}...`
                  : spell.description
                }
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SpellList