import React from 'react'
import { Button, ButtonGroup } from '../../ui'

/**
 * Composant de filtrage pour les sorts
 */
export const SpellFilters = ({
  filters = {},
  onFilterChange,
  activeTab = 'prepared',
  availableSpells = [], // Nouveaux prop pour les sorts disponibles
  className = ''
}) => {
  const handleSearchChange = (e) => {
    onFilterChange?.({ searchTerm: e.target.value })
  }

  const handleSchoolChange = (school) => {
    onFilterChange?.({ school })
  }

  const handleLevelChange = (level) => {
    onFilterChange?.({ level })
  }

  const toggleCastableOnly = () => {
    onFilterChange?.({ castableOnly: !filters.castableOnly })
  }

  const clearFilters = () => {
    onFilterChange?.({
      school: 'all',
      level: 'all', 
      searchTerm: '',
      castableOnly: false
    })
  }

  // Toutes les écoles possibles avec leurs icônes
  const allSchools = [
    { value: 'all', label: 'Toutes les écoles', icon: '🎓' },
    { value: 'Abjuration', label: 'Abjuration', icon: '🛡️' },
    { value: 'Invocation', label: 'Invocation', icon: '👹' },
    { value: 'Divination', label: 'Divination', icon: '👁️' },
    { value: 'Enchantement', label: 'Enchantement', icon: '🧠' },
    { value: 'Évocation', label: 'Évocation', icon: '🔥' },
    { value: 'Illusion', label: 'Illusion', icon: '🌟' },
    { value: 'Nécromancie', label: 'Nécromancie', icon: '💀' },
    { value: 'Transmutation', label: 'Transmutation', icon: '🔄' }
  ]

  const allLevels = [
    { value: 'all', label: 'Tous niveaux' },
    { value: '0', label: 'Tours de magie' },
    { value: '1', label: 'Niveau 1' },
    { value: '2', label: 'Niveau 2' },
    { value: '3', label: 'Niveau 3' },
    { value: '4', label: 'Niveau 4' },
    { value: '5', label: 'Niveau 5' },
    { value: '6', label: 'Niveau 6' },
    { value: '7', label: 'Niveau 7' },
    { value: '8', label: 'Niveau 8' },
    { value: '9', label: 'Niveau 9' }
  ]

  // Générer les écoles disponibles dynamiquement
  const availableSchools = React.useMemo(() => {
    const usedSchools = new Set(['all']) // Toujours inclure "Toutes"
    availableSpells.forEach(spell => {
      if (spell.school) {
        usedSchools.add(spell.school)
      }
    })
    return allSchools.filter(school => usedSchools.has(school.value))
  }, [availableSpells])

  // Générer les niveaux disponibles dynamiquement  
  const availableLevels = React.useMemo(() => {
    const usedLevels = new Set(['all']) // Toujours inclure "Tous niveaux"
    availableSpells.forEach(spell => {
      usedLevels.add(spell.level.toString())
    })
    return allLevels.filter(level => usedLevels.has(level.value))
  }, [availableSpells])

  return (
    <div className={`spell-filters ${className}`}>
      {/* Barre de recherche */}
      <div className="spell-filters__search">
        <div className="search-input-group">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un sort..."
            value={filters.searchTerm || ''}
            onChange={handleSearchChange}
            className="search-input"
          />
          {filters.searchTerm && (
            <button
              type="button"
              className="search-clear"
              onClick={() => onFilterChange?.({ searchTerm: '' })}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="spell-filters__controls">
        {/* Filtres par école de magie */}
        <div className="spell-filters__section">
          <h5 className="spell-filters__label">École de magie</h5>
          <div className="spell-filters__school-grid">
            {availableSchools.map(school => (
              <Button
                key={school.value}
                variant={filters.school === school.value ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleSchoolChange(school.value)}
                className="school-filter-button"
                title={school.label}
              >
                <span className="button-icon">{school.icon}</span>
                {school.value === 'all' ? 'Toutes' : school.value}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtres par niveau */}
        <div className="spell-filters__section">
          <h5 className="spell-filters__label">Niveau de sort</h5>
          <ButtonGroup className="spell-filters__level-buttons">
            {availableLevels.slice(0, 6).map(level => (
              <Button
                key={level.value}
                variant={filters.level === level.value ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleLevelChange(level.value)}
              >
                {level.value === 'all' ? 'Tous' : 
                 level.value === '0' ? 'CT' : level.value}
              </Button>
            ))}
          </ButtonGroup>
          
          {/* Niveaux hauts */}
          {availableLevels.length > 6 && (
            <ButtonGroup className="spell-filters__level-buttons spell-filters__level-buttons--high">
              {availableLevels.slice(6).map(level => (
                <Button
                  key={level.value}
                  variant={filters.level === level.value ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => handleLevelChange(level.value)}
                >
                  {level.value}
                </Button>
              ))}
            </ButtonGroup>
          )}
        </div>

        {/* Options spéciales */}
        <div className="spell-filters__section">
          <h5 className="spell-filters__label">Options</h5>
          <div className="spell-filters__options">
            {activeTab === 'prepared' && (
              <Button
                variant={filters.castableOnly ? 'primary' : 'ghost'}
                size="small"
                onClick={toggleCastableOnly}
              >
                {filters.castableOnly ? '✓' : '○'} Lançables uniquement
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="spell-filters__actions">
          <Button
            variant="ghost"
            size="small"
            onClick={clearFilters}
            disabled={
              filters.school === 'all' && 
              filters.level === 'all' && 
              !filters.searchTerm &&
              !filters.castableOnly
            }
          >
            🗑️ Effacer
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Version compacte des filtres de sorts
 */
export const CompactSpellFilters = ({
  filters = {},
  onFilterChange,
  showSearch = true,
  showSchools = true,
  showLevels = false
}) => {
  return (
    <div className="spell-filters spell-filters--compact">
      {showSearch && (
        <div className="spell-filters__search">
          <input
            type="text"
            placeholder="Recherche..."
            value={filters.searchTerm || ''}
            onChange={(e) => onFilterChange?.({ searchTerm: e.target.value })}
            className="search-input search-input--compact"
          />
        </div>
      )}
      
      {showSchools && (
        <div className="spell-filters__quick-schools">
          <Button
            variant={filters.school === 'all' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ school: 'all' })}
          >
            Toutes
          </Button>
          <Button
            variant={filters.school === 'Évocation' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ school: 'Évocation' })}
          >
            🔥
          </Button>
          <Button
            variant={filters.school === 'Abjuration' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ school: 'Abjuration' })}
          >
            🛡️
          </Button>
          <Button
            variant={filters.school === 'Enchantement' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ school: 'Enchantement' })}
          >
            🧠
          </Button>
        </div>
      )}

      {showLevels && (
        <div className="spell-filters__quick-levels">
          <Button
            variant={filters.level === 'all' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ level: 'all' })}
          >
            Tous
          </Button>
          <Button
            variant={filters.level === '0' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => onFilterChange?.({ level: '0' })}
          >
            CT
          </Button>
          {[1, 2, 3, 4, 5].map(level => (
            <Button
              key={level}
              variant={filters.level === level.toString() ? 'primary' : 'ghost'}
              size="small"
              onClick={() => onFilterChange?.({ level: level.toString() })}
            >
              {level}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SpellFilters