import React from 'react'
import { Card, CardHeader, CardBody } from '../../ui'


/**
 * Carte de sélection de personnage avec preview
 */
export const CharacterSelectionCard = ({
  character,
  isSelected = false,
  onSelect,
  onPreview,
  icon,
  description,
  showStats = true,
  className = ''
}) => {
  const cardClass = [
    'character-selection-card',
    isSelected && 'character-selection-card--selected',
    className
  ].filter(Boolean).join(' ')

  const handleCardClick = (e) => {
    // Éviter de sélectionner si on clique sur un bouton
    if (e.target.closest('button')) return
    onSelect?.(character)
  }

  const getStatColor = (statValue) => {
    if (statValue >= 16) return 'stat--high'
    if (statValue >= 14) return 'stat--good'
    if (statValue >= 12) return 'stat--average'
    return 'stat--low'
  }

  const primaryStats = [
    { name: 'Force', value: character.stats.force, short: 'FOR' },
    { name: 'Dextérité', value: character.stats.dexterite, short: 'DEX' },
    { name: 'Constitution', value: character.stats.constitution, short: 'CON' },
    { name: 'Intelligence', value: character.stats.intelligence, short: 'INT' },
    { name: 'Sagesse', value: character.stats.sagesse, short: 'SAG' },
    { name: 'Charisme', value: character.stats.charisme, short: 'CHA' }
  ]

  return (
    <Card 
      className={cardClass}
      onClick={handleCardClick}
      variant={isSelected ? 'primary' : 'default'}
    >
      <CardHeader>
        <div className="character-portrait">
          <div className="character-avatar">
            {icon}
          </div>
          
          <div className="character-info">
            <h3 className="character-selection-card__name">{character.name}</h3>
            <p className="character-selection-card__class">
              {character.race} {character.class}
            </p>
            <p className="character-selection-card__level">
              Niveau {character.level}
            </p>
          </div>

        
        </div>
      </CardHeader>

      <CardBody>
      

        {/* Stats principales visibles */}
        <div className="character-stats-preview">
          <div className="stat-preview">
            <span className="main-stat__label">❤️</span>
            <span className="main-stat__value">{character.maxHP} PV</span>
          </div>
          <div className="stat-preview">
            <span className="main-stat__label">🛡️</span>
            <span className="main-stat__value">CA {character.ac}</span>
          </div>
        </div>

       

        {/* Points forts du personnage */}
        <div className="character-specialties">
          {character.class === 'Magicien' && (
            <div className="specialty">
              🔮 Sorts puissants
            </div>
          )}
          {character.class === 'Guerrier' && (
            <div className="specialty">
              ⚔️ Combat rapproché
            </div>
          )}
          {character.class === 'Roublard' && (
            <div className="specialty">
              🎯 Attaques précises
            </div>
          )}
            {character.class === 'Paladin' && (
            <div className="specialty">
              🛡️ Défense sacrée
            </div>
          )}
        </div>
      </CardBody>

   
    </Card>
  )
}

/**
 * Version compacte pour les listes
 */
export const CompactCharacterSelectionCard = ({ 
  character, 
  isSelected, 
  onSelect,
  showIcon = true 
}) => {
  const cardClass = [
    'character-selection-card',
    'character-selection-card--compact',
    isSelected && 'character-selection-card--selected'
  ].filter(Boolean).join(' ')

  return (
    <Card 
      className={cardClass}
      onClick={() => onSelect?.(character)}
      variant={isSelected ? 'primary' : 'default'}
    >
      <CardBody>
        <div className="character-selection-card__compact-content">
          {showIcon && (
            <span className="character-selection-card__compact-icon">
              {character.class === 'Magicien' ? '🧙‍♂️' : 
               character.class === 'Guerrier' ? '⚔️' : '🗡️'}
            </span>
          )}
          
          <div className="character-selection-card__compact-info">
            <strong>{character.name}</strong>
            <span>{character.class} {character.level}</span>
          </div>

          {isSelected && (
            <span className="character-selection-card__compact-check">✓</span>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default CharacterSelectionCard