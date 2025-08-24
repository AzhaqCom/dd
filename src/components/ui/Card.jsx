import React from 'react';

/**
 * Composant Card réutilisable avec différentes variantes
 */
export const Card = ({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = '',
  onClick,
  disabled = false,
  ...props 
}) => {
  const baseClass = 'card';
  const variantClass = `card--${variant}`;
  const sizeClass = `card--${size}`;
  const disabledClass = disabled ? 'card--disabled' : '';
  const clickableClass = onClick ? 'card--clickable' : '';
  
  const cardClass = [
    baseClass,
    variantClass,
    sizeClass,
    disabledClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClass}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Composant CardHeader
 */
export const CardHeader = ({ children, className = '' }) => (
  <div className={`card__header ${className}`}>
    {children}
  </div>
);

/**
 * Composant CardBody
 */
export const CardBody = ({ children, className = '' }) => (
  <div className={`card__body ${className}`}>
    {children}
  </div>
);

/**
 * Composant CardFooter
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`card__footer ${className}`}>
    {children}
  </div>
);

/**
 * Composant CharacterCard spécialisé
 */
export const CharacterCard = ({ 
  character, 
  isCurrentTurn = false, 
  isSelected = false,
  isTargetable = true,
  onClick,
  showImage = false,
  compact = false
}) => {
  const variant = character.type === 'player' ? 'player' : 
                 character.type === 'companion' ? 'companion' : 'enemy';
  
  const className = [
    isCurrentTurn && 'character-card--current-turn',
    isSelected && 'character-card--selected',
    !isTargetable && 'character-card--not-targetable',
    compact && 'character-card--compact'
  ].filter(Boolean).join(' ');

  const hpPercentage = character.maxHP > 0 
    ? Math.max(0, (character.currentHP / character.maxHP) * 100) 
    : 0;

  return (
    <Card 
      variant={variant}
      size={compact ? 'small' : 'medium'}
      className={`character-card ${className}`}
      onClick={onClick}
      disabled={!isTargetable}
    >
      <CardHeader>
        {showImage && character.image && (
          <img
            src={character.image}
            alt={character.name}
            className="character-card__image"
          />
        )}
        <div className="character-card__name">{character.name}</div>
        {character.class && (
          <div className="character-card__class">{character.class}</div>
        )}
      </CardHeader>
      
      <CardBody>
        <div className="character-card__hp">
          <span>❤️ {Math.max(0, character.currentHP)} PV</span>
        </div>
        <div className="character-card__hp-bar">
          <div
            className="character-card__hp-bar-fill"
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </CardBody>
    
    </Card>
  );
};