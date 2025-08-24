import React, { useState, useCallback } from 'react'

/**
 * Grille de combat tactique
 */
export const CombatGrid = ({
  playerCharacter,
  activeCompanions = [], // Compagnons actifs
  enemies,
  positions,
  selectedAction,
  selectedTargets,
  currentTurn,
  phase,
  onTargetSelect,
  onMoveCharacter
}) => {

  const GRID_WIDTH = 8
  const GRID_HEIGHT = 6
  const MOVEMENT_RANGE = 6 // cases

  const [hoveredCell, setHoveredCell] = useState(null)
  const [highlightedCells, setHighlightedCells] = useState([])

  // Obtenir le combattant à une position donnée
  const getCombatantAtPosition = useCallback((x, y) => {
    // Vérifier le joueur
    if (positions.player?.x === x && positions.player?.y === y) {
      return { ...playerCharacter, id: 'player', type: 'player' }
    }

    // Vérifier les compagnons actifs
    if (activeCompanions && activeCompanions.length > 0) {
      for (const companion of activeCompanions) {
        const companionId = companion.id || companion.name.toLowerCase()
        const companionPos = positions[companionId]
        if (companionPos?.x === x && companionPos?.y === y) {
          return { ...companion, id: companionId, type: 'companion' }
        }
      }
    }
    
    // Plus besoin de vérification de compatibilité

    // Vérifier les ennemis
    for (const enemy of enemies) {
      const enemyPos = positions[enemy.name] // Utiliser enemy.name au lieu de enemy.id
      if (enemyPos?.x === x && enemyPos?.y === y && enemy.currentHP > 0) {
        return enemy
      }
    }

    return null
  }, [positions, playerCharacter, activeCompanions, enemies])


  const getHealthColor = (currentHP, maxHP) => {
    const ratio = currentHP / maxHP

    if (ratio > 0.6) return "#4caf50" // vert
    if (ratio > 0.3) return "#ff9800" // orange
    return "#f44336" // rouge
  }

  // Calculer la distance Manhattan entre deux points
  const getManhattanDistance = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }

  // Vérifier si une case est dans la portée de mouvement
  const isValidMovementTarget = (x, y) => {
    if (phase !== 'player-movement') return false

    const playerPos = positions.player
    const playerStartPos = positions.playerStartPos || playerPos // Position de début de tour
    if (!playerPos || !playerStartPos) return false

    // Calculer le mouvement total si on va à cette case
    const moveDistance = getManhattanDistance(playerStartPos.x, playerStartPos.y, x, y)

    // Vérifier que la case n'est pas occupée et qu'elle est dans la portée de mouvement
    return moveDistance <= MOVEMENT_RANGE && !getCombatantAtPosition(x, y)
  }

  // Vérifier si une case est une cible valide pour l'action sélectionnée
  const isValidActionTarget = (x, y) => {
    if (!selectedAction || phase !== 'player-turn') return false

    const combatant = getCombatantAtPosition(x, y)

    // Pour les attaques, cibler les ennemis vivants
    if (selectedAction.type === 'attack') {
      return combatant?.type === 'enemy' && combatant.currentHP > 0
    }

    // Pour les sorts avec zone d'effet, toute case valide
    if (selectedAction.areaOfEffect) {
      return true
    }

    // Pour les autres sorts, cibler selon le type
    if (selectedAction.type === 'spell') {
      // TODO: Gérer les sorts de soin vs dégâts
      return combatant?.type === 'enemy' && combatant.currentHP > 0
    }

    return false
  }

  // Calculer les cases affectées par une zone d'effet
  const getAoEAffectedCells = useCallback((centerX, centerY, aoeData) => {
    const cells = []

    switch (aoeData.shape) {
      case 'sphere': {
        const radius = Math.floor(aoeData.radius / 5) // Convertir pieds en cases
        for (let x = 0; x < GRID_WIDTH; x++) {
          for (let y = 0; y < GRID_HEIGHT; y++) {
            const distance = Math.sqrt(
              Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            )
            if (distance <= radius) {
              cells.push({ x, y })
            }
          }
        }
        break
      }
      case 'cube': {
        const size = Math.floor(aoeData.size / 5) // Convertir pieds en cases
        for (let x = centerX; x < Math.min(centerX + size, GRID_WIDTH); x++) {
          for (let y = centerY; y < Math.min(centerY + size, GRID_HEIGHT); y++) {
            if (x >= 0 && y >= 0) {
              cells.push({ x, y })
            }
          }
        }
        break
      }
      case 'line': {
        // TODO: Implémenter les lignes
        break
      }
    }

    return cells
  }, [])

  // Gérer le survol des cases
  const handleCellHover = (x, y) => {
    setHoveredCell({ x, y })

    // Afficher la preview de zone d'effet
    if (selectedAction?.areaOfEffect && phase === 'player-turn') {
      const affectedCells = getAoEAffectedCells(x, y, selectedAction.areaOfEffect)
      setHighlightedCells(affectedCells)
    } else {
      setHighlightedCells([])
    }
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
    setHighlightedCells([])
  }

  // Gérer les clics sur les cases
  const handleCellClick = (x, y) => {
    if (phase === 'player-movement') {
      if (isValidMovementTarget(x, y)) {
        onMoveCharacter?.('player', { x, y })
      }
      return
    }

    if (phase === 'player-turn' && selectedAction) {
      if (selectedAction.areaOfEffect) {
        // Ciblage de zone
        onTargetSelect?.({ x, y, isPosition: true })
      } else {
        // Ciblage de combattant
        const combatant = getCombatantAtPosition(x, y)
        if (combatant && isValidActionTarget(x, y)) {
          onTargetSelect?.(combatant)
        }
      }
    }
  }

  // Obtenir les classes CSS pour une case
  const getCellClasses = (x, y) => {
    const classes = ['combat-grid__cell']
    const combatant = getCombatantAtPosition(x, y)

    // Case occupée
    if (combatant) {
      classes.push('combat-grid__cell--occupied')
      classes.push(`combat-grid__cell--${combatant.type}`)

      // Combattant actuel
      if (currentTurn < positions.turnOrder?.length) {
        const currentCombatant = positions.turnOrder[currentTurn]
        if (currentCombatant?.id === combatant.id) {
          classes.push('combat-grid__cell--current-turn')
        }
      }

      // Cible sélectionnée
      if (selectedTargets.some(target => target.id === combatant.id)) {
        classes.push('combat-grid__cell--selected-target')
      }
    }

    // Case survolée
    if (hoveredCell?.x === x && hoveredCell?.y === y) {
      classes.push('combat-grid__cell--hovered')
    }

    // Case dans la zone d'effet
    if (highlightedCells.some(cell => cell.x === x && cell.y === y)) {
      classes.push('combat-grid__cell--aoe-highlight')
    }

    // Cases de mouvement valides
    if (isValidMovementTarget(x, y)) {
      classes.push('combat-grid__cell--valid-movement')
    }

    // Cases de ciblage valides
    if (isValidActionTarget(x, y)) {
      classes.push('combat-grid__cell--valid-target')
    }

    return classes.join(' ')
  }

  // Obtenir l'icône d'un combattant
  const getCombatantIcon = (combatant) => {
    switch (combatant.type) {
      case 'player':
        return '🧙‍♂️'
      case 'companion':
        return '🐺'
      case 'enemy':
        // return combatant.image || '👹'
        return '👹'

      default:
        return '❓'
    }
  }

  // Rendre une case de la grille
  const renderCell = (x, y) => {
    const combatant = getCombatantAtPosition(x, y)
    const cellKey = `${x}-${y}`

    return (
      <div
        key={cellKey}
        className={getCellClasses(x, y)}
        onMouseEnter={() => handleCellHover(x, y)}
        onMouseLeave={handleCellLeave}
        onClick={() => handleCellClick(x, y)}
        title={combatant ? `${combatant.name} (${combatant.currentHP}/${combatant.maxHP} PV)` : `Case (${x}, ${y})`}
      >
        {/* Coordonnées de la case (debug) */}
        <span className="combat-grid__coordinates">
          {x},{y}
        </span>

        {/* Combattant */}
        {combatant && (
          <div className="combat-grid__combatant">
            {combatant.image ? (
              <img src={combatant.image} alt={combatant.name} className="combat-grid__combatant-image" />
            ) : (
              <span className="combat-grid__combatant-icon">
                {getCombatantIcon(combatant)}
              </span>
            )}
            <span className="combat-grid__combatant-name">
              {combatant.name}
            </span>
            <span className="combat-grid__combatant-ac">
              CA{combatant.ac}
            </span>
            <span className="combat-gird-health">{combatant.currentHP}/{combatant.maxHP}❤️</span>
            <div className="combat-grid__health-bar w-95">
              <div
                className="combat-grid__health-fill"
                style={{
                  width: `${(combatant.currentHP / combatant.maxHP) * 100}%`,
                  backgroundColor: getHealthColor(combatant.currentHP, combatant.maxHP),
                }}
              />
            </div>
          </div>
        )}

        {/* Indicateur de case valide */}
        {isValidMovementTarget(x, y) && (
          <div className="combat-grid__movement-indicator">🏃</div>
        )}

        {isValidActionTarget(x, y) && !combatant && (
          <div className="combat-grid__target-indicator">🎯</div>
        )}
      </div>
    )
  }

  return (
    <div className="combat-grid">
      {/* En-tête avec informations */}
      {/* Grille principale */}
      <div
        className="combat-grid__container"
        style={{
          gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`
        }}
      >
        {Array.from({ length: GRID_HEIGHT }, (_, y) =>
          Array.from({ length: GRID_WIDTH }, (_, x) => renderCell(x, y))
        )}
      </div>


    </div>
  )
}

export default CombatGrid