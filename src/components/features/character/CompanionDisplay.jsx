import React from 'react'
import { Card, CardHeader, CardBody, HealthBar } from '../../ui'
import { HeartIcon } from '../../ui/Icons'

/**
 * Affichage compact d'un compagnon avec ses statistiques essentielles
 */
export const CompanionDisplay = ({ 
  companion,
  variant = 'default', // 'default', 'compact', 'detailed'
  className = '',
  showActions = false,
  showRole = false, // Nouveau: afficher le rôle du compagnon
  onAction // Callback pour les actions sur le compagnon
}) => {
  if (!companion) {
    return null
  }

  const displayClass = [
    'companion-display',
    `companion-display--${variant}`,
    className
  ].filter(Boolean).join(' ')

  const hpPercentage = companion.maxHP > 0 
    ? Math.max(0, (companion.currentHP / companion.maxHP) * 100) 
    : 0

  const isAlive = companion.currentHP > 0
  const isHealthy = hpPercentage > 75
  const isWounded = hpPercentage <= 25 && hpPercentage > 0

  // Icons pour les rôles
  const getRoleIcon = (role) => {
    switch (role) {
      case 'tank': return '🛡️'
      case 'healer': return '❤️'
      case 'dps': return '⚔️'
      default: return '🤝'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'tank': return 'Tank'
      case 'healer': return 'Soigneur'
      case 'dps': return 'DPS'
      default: return 'Compagnon'
    }
  }

  return (
    <Card className={displayClass}>
      <CardHeader>
        <h4>
          {showRole && companion.role && (
            <span className="companion-role-icon" title={getRoleLabel(companion.role)}>
              {getRoleIcon(companion.role)}
            </span>
          )}
          {showRole ? getRoleLabel(companion.role) : 'Compagnon'}
        </h4>
      </CardHeader>
      
      <CardBody>
        <div className="companion-card">
          {companion.image && (
            <div className="companion-image-container">
              <img
                src={companion.image}
                alt={companion.name}
                className="companion-image"
              />
            </div>
          )}
          
          <div className="companion-info">
            <div className="companion-header">
              <span className="companion-name">{companion.name}</span>
              {variant !== 'compact' && (
                <span className="companion-ac">CA: {companion.ac}</span>
              )}
            </div>
            
            <div className="companion-health">
              <div className="companion-hp-display">
                <HeartIcon className={`hp-icon ${!isAlive ? 'hp-icon--dead' : ''}`} />
                <span className={`hp-text ${!isAlive ? 'hp-text--dead' : ''}`}>
                  {Math.max(0, companion.currentHP)} / {companion.maxHP} PV
                </span>
              </div>
              
              <HealthBar 
                current={companion.currentHP}
                max={companion.maxHP}
                size={variant === 'compact' ? 'small' : 'medium'}
                animated
                showPercentage={variant === 'detailed'}
              />
            </div>
            
            {variant === 'detailed' && (
              <div className="companion-details">
                <div className="companion-stats">
                  
                  <span>Vitesse: {companion.speed || 30} ft</span>
                </div>
                
                {companion.attacks && companion.attacks.length > 0 && (
                  <div className="companion-attacks">
                    <h5>Attaques:</h5>
                    {companion.attacks.map((attack, index) => (
                      <div key={index} className="attack-info">
                        <span className="attack-name">{attack.name}</span>
                        <span className="attack-damage">({attack.damage})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {showActions && isAlive && (
              <div className="companion-actions">
                <button 
                  className="action-button action-button--heal"
                  onClick={() => onAction?.('heal', companion)}
                  disabled={companion.currentHP >= companion.maxHP}
                >
                  Soigner
                </button>
                <button 
                  className="action-button action-button--rest"
                  onClick={() => onAction?.('rest', companion)}
                >
                  Repos
                </button>
              </div>
            )}
            
            {!isAlive && (
              <div className="companion-status companion-status--dead">
                <span>💀 Inconscient</span>
                {showActions && (
                  <button 
                    className="action-button action-button--revive"
                    onClick={() => onAction?.('revive', companion)}
                  >
                    Ranimer
                  </button>
                )}
              </div>
            )}
            
            {isWounded && isAlive && (
              <div className="companion-status companion-status--wounded">
                <span>⚠️ Gravement blessé</span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Version compacte pour les interfaces restreintes
 */
export const CompactCompanionDisplay = ({ companion, ...props }) => (
  <CompanionDisplay 
    companion={companion} 
    variant="compact" 
    {...props} 
  />
)

/**
 * Version détaillée avec plus d'informations
 */
export const DetailedCompanionDisplay = ({ companion, ...props }) => (
  <CompanionDisplay 
    companion={companion} 
    variant="detailed" 
    {...props} 
  />
)

/**
 * Version interactive avec actions possibles
 */
export const InteractiveCompanionDisplay = ({ companion, onAction, ...props }) => (
  <CompanionDisplay 
    companion={companion} 
    showActions={true}
    onAction={onAction}
    {...props} 
  />
)

/**
 * Composant pour afficher plusieurs compagnons ensemble
 */
export const CompanionParty = ({ 
  companions = [], 
  variant = "default",
  showRoles = true,
  layout = "grid", // "grid", "list", "compact"
  className = "",
  onCompanionAction
}) => {
  if (!companions || companions.length === 0) {
    return (
      <div className="companion-party companion-party--empty">
        <p>Aucun compagnon actif</p>
      </div>
    )
  }

  const partyClass = [
    'companion-party',
    `companion-party--${layout}`,
    `companion-party--${variant}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={partyClass}>
      {layout !== "compact" && (
        <div className="companion-party__header">
          <h3>Compagnons ({companions.length}/3)</h3>
        </div>
      )}
      
      <div className="companion-party__grid">
        {companions.map((companion, index) => (
          <CompanionDisplay
            key={companion.id || companion.name || index}
            companion={companion}
            variant={variant}
            showRole={showRoles}
            showActions={variant === "interactive"}
            onAction={(action, comp) => onCompanionAction?.(action, comp)}
          />
        ))}
      </div>
      
      {companions.length < 3 && variant === "management" && (
        <div className="companion-party__add-slot">
          <div className="companion-add-button">
            <span>+ Recruter un compagnon</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Version compacte pour l'interface de combat
 */
export const CompactCompanionParty = ({ companions, ...props }) => (
  <CompanionParty 
    companions={companions}
    variant="compact"
    layout="compact"
    {...props} 
  />
)

/**
 * Version de gestion avec actions
 */
export const InteractiveCompanionParty = ({ companions, onCompanionAction, ...props }) => (
  <CompanionParty 
    companions={companions}
    variant="interactive"
    onCompanionAction={onCompanionAction}
    {...props} 
  />
)

export default CompanionDisplay