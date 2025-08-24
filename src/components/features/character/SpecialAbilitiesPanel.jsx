import React from 'react'
import { Card, CardHeader, CardBody } from '../../ui'

/**
 * Panneau d'affichage des capacités spéciales d'un personnage
 */
export const SpecialAbilitiesPanel = ({ 
  character,
  variant = 'default', // 'default', 'compact', 'interactive'
  className = '',
  onAbilityUse // Callback pour utiliser une capacité
}) => {
  if (!character?.specialAbilities || Object.keys(character.specialAbilities).length === 0) {
    return null
  }

  const panelClass = [
    'special-abilities-panel',
    `special-abilities-panel--${variant}`,
    className
  ].filter(Boolean).join(' ')

  const handleAbilityUse = (abilityKey, ability) => {
    if (onAbilityUse && ability.uses && ability.uses.current > 0) {
      onAbilityUse(abilityKey, ability)
    }
  }

  return (
    <Card className={panelClass}>
      <CardHeader>
        <h4>Capacités Spéciales</h4>
      </CardHeader>
      
      <CardBody>
        <div className="abilities-list">
          {Object.entries(character.specialAbilities).map(([key, ability]) => (
            <div key={key} className="ability-item">
              <div className="ability-header">
                <h5 className="ability-name">{ability.name}</h5>
                {ability.level && (
                  <span className="ability-level">Niveau {ability.level}</span>
                )}
              </div>
              
              <p className="ability-description">{ability.description}</p>
              
              {ability.damage && (
                <div className="ability-stats">
                  <span className="ability-damage">
                    Dégâts: {ability.damage}
                  </span>
                </div>
              )}
              
              {ability.uses && (
                <div className="ability-uses">
                  <span className="ability-uses-text">
                    Utilisations: {ability.uses.current || 0}/{ability.uses.max}
                  </span>
                  {variant === 'interactive' && ability.uses.current > 0 && (
                    <button 
                      className="ability-use-button"
                      onClick={() => handleAbilityUse(key, ability)}
                      title={`Utiliser ${ability.name}`}
                    >
                      Utiliser
                    </button>
                  )}
                </div>
              )}
              
              {ability.skills && (
                <div className="ability-skills">
                  <span className="ability-skills-text">
                    Compétences affectées: {ability.skills.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Version compacte pour les espaces restreints
 */
export const CompactSpecialAbilitiesPanel = ({ character, ...props }) => (
  <SpecialAbilitiesPanel 
    character={character} 
    variant="compact" 
    {...props} 
  />
)

/**
 * Version interactive avec possibilité d'utiliser les capacités
 */
export const InteractiveSpecialAbilitiesPanel = ({ character, onAbilityUse, ...props }) => (
  <SpecialAbilitiesPanel 
    character={character} 
    variant="interactive" 
    onAbilityUse={onAbilityUse}
    {...props} 
  />
)

export default SpecialAbilitiesPanel