import React from 'react'
import { Card, CardHeader, CardBody, CardFooter, Button } from '../../ui'
import { ActionButton } from '../../ui/ActionButton'
import { weapons } from '../../../data/weapons'
import { spells } from '../../../data/spells'
import { useCombatStore } from '../../../stores/combatStore'

/**
 * Panneau d'actions de combat pour le joueur
 */
export const CombatActionPanel = ({
  playerCharacter,
  selectedAction,
  selectedTargets,
  onSelectAction,
  onClearTargets, // Nouveau prop pour vider les cibles
  onPassTurn,
  canMove = true,
  onMoveToggle,
  isMovementMode = false // Nouveau : mode mouvement intégré
}) => {
  // État du tour multi-actions
  const playerTurnState = useCombatStore(state => state.playerTurnState)
  const endPlayerTurn = useCombatStore(state => state.endPlayerTurn)
  // Actions d'attaque disponibles - depuis l'équipement moderne ET le système legacy
  const getEquippedWeapons = () => {
    const equippedWeapons = []
    
    // Nouveau système d'équipement (maintenant stocke des IDs)
    if (playerCharacter.equipment?.mainHand) {
      const weaponId = playerCharacter.equipment.mainHand
      const weaponData = weapons[weaponId]
      if (weaponData) {
        equippedWeapons.push({ ...weaponData, id: weaponId })
      }
    }
    
    // Système legacy
    const legacyWeapons = (playerCharacter.weapons || [])
      .map(weaponId => weapons[weaponId])
      .filter(weapon => weapon)
      .map(weapon => ({ ...weapon, id: weapon.id }))
    
    equippedWeapons.push(...legacyWeapons)
    
    return equippedWeapons
  }

  const equippedWeapons = getEquippedWeapons()
  const attackActions = equippedWeapons.length > 0 
    ? equippedWeapons.map(weapon => ({
        id: `attack_${weapon.id || weapon.name}`,
        type: 'attack',
        name: weapon.name,
        description: `Attaque avec ${weapon.name}`,
        damage: typeof weapon.damage === 'object' 
          ? `${weapon.damage.dice}${weapon.damage.bonus > 0 ? `+${weapon.damage.bonus}` : ''}`
          : weapon.damage,
        damageType: weapon.damageType,
        range: weapon.category === 'ranged' ? weapon.range?.ranged : (weapon.range?.melee || 1),
        stat: weapon.stat,
        icon: weapon.category === 'ranged' ? '🏹' : '⚔️'
      }))
    : [
        // Attaque à mains nues par défaut
        {
          id: 'attack_unarmed',
          type: 'attack',
          name: 'Attaque à mains nues',
          description: 'Attaque de base sans arme',
          damage: '1d4',
          damageType: 'contondant',
          range: 1,
          stat: 'force',
          icon: '👊'
        }
      ]

  // Actions de sort disponibles (cantrips et sorts préparés avec emplacements)
  const spellActions = []
  
  if (playerCharacter.spellcasting) {
    // Ajouter les cantrips (niveau 0, utilisables à volonté)
    const cantrips = (playerCharacter.spellcasting.cantrips || []).map(spellName => {
      // Récupérer les données du sort depuis spells.js
      const spellData = spells[spellName] || {}
      
      return {
        id: `cantrip_${spellName}`,
        type: 'spell',
        name: spellName,
        description: `Cantrip: ${spellName}`,
        level: 0,
        range: spellData.range || 60,
        projectiles: spellData.projectiles || 1,
        damage: spellData.damage,
        requiresAttackRoll: spellData.requiresAttackRoll,
        icon: '✨'
      }
    })
    
    // Ajouter les sorts préparés (si l'on a des emplacements)
    const preparedSpells = (playerCharacter.spellcasting.preparedSpells || [])
      .filter(spellName => {
        // Récupérer les données du sort pour vérifier son niveau
        const spellData = spells[spellName] || {}
        const spellLevel = spellData.level || 1
        
        // Vérifier qu'on a des emplacements disponibles pour ce sort
        const spellSlots = playerCharacter.spellcasting.spellSlots || {}
        
        // Chercher un emplacement disponible du niveau du sort ou plus élevé
        for (let level = spellLevel; level <= 9; level++) {
          const slot = spellSlots[level]
          if (slot && slot.available > 0) {
            return true
          }
        }
        return false
      })
      .map(spellName => {
        // Récupérer les données du sort depuis spells.js
        const spellData = spells[spellName] || {}
        return {
          id: `spell_${spellName}`,
          type: 'spell',
          name: spellName,
          description: `Sort: ${spellName}`,
          level: spellData.level || 1,
          range: spellData.range || 30,
          projectiles: spellData.projectiles || 1,
          damage: spellData.damage,
          requiresAttackRoll: spellData.requiresAttackRoll,
          icon: '🔮'
        }
      })
    
    spellActions.push(...cantrips, ...preparedSpells)
  }

  const allActions = [...attackActions, ...spellActions]

  const renderActionButton = (action) => (
      <ActionButton
        key={action.id}
        variant={selectedAction?.id === action.id ? 'primary' : 'secondary'}
        onClick={() => onSelectAction(action)}
        disabled={selectedAction && selectedAction.id !== action.id}
      >
        <div className="action-button__content">
          <span className="action-button__icon">{action.icon}</span>
          <div className="action-button__details">
            <span className="action-button__name">{action.name}</span>
            {action.damage && (
              <span className="action-button__damage">
                Dégâts: {typeof action.damage === 'string' 
                  ? action.damage 
                  : `${action.damage.dice}${action.damage.bonus > 0 ? `+${action.damage.bonus}` : ''}`
                }
              </span>
            )}
            {action.level > 0 && (
              <span className="action-button__level">Niveau {action.level}</span>
            )}
          </div>
        </div>
      </ActionButton>
  )

  const canExecute = selectedAction && selectedTargets.length > 0
  const maxTargets = selectedAction?.projectiles || 1
  const needsMoreTargets = selectedTargets.length < maxTargets

  return (
    <Card className="combat-action-panel">
      <CardHeader>
        <h3>🎯 Actions de {playerCharacter.name}</h3>
        <div className="combat-action-panel__status">
          {/* Indicateurs d'état du tour */}
          <div className="player-turn-status">
            <span className={`action-status ${playerTurnState.actionsUsed.action ? 'used' : 'available'}`}>
              ⚔️ Action {playerTurnState.actionsUsed.action ? '✅' : '◯'}
            </span>
            <span className={`action-status ${playerTurnState.actionsUsed.movement ? 'used' : 'available'}`}>
              🏃 Mouvement {playerTurnState.actionsUsed.movement ? '✅' : '◯'} ({playerTurnState.remainingMovement} cases)
            </span>
          </div>
          
          {selectedAction && (
            <span className="selected-action">
              {selectedAction.name} sélectionné
              {needsMoreTargets && (
                <span className="target-count">
                  ({selectedTargets.length}/{maxTargets} cibles)
                </span>
              )}
            </span>
          )}
        </div>
      </CardHeader>

      <CardBody>


        {/* Actions de mouvement */}
        <div className="combat-action-section">
          <h4>Mouvement {playerTurnState.actionsUsed.movement ? '(Utilisé)' : ''}</h4>
          {canMove && !playerTurnState.actionsUsed.movement ? (
            <ActionButton
              variant={isMovementMode ? "primary" : "ghost"}
              onClick={onMoveToggle}
              disabled={!!selectedAction}
            >
              <div className="action-button__content">
                <span className="action-button__icon">🏃</span>
                <span className="action-button__name">
                  {isMovementMode ? "Annuler mouvement" : "Se déplacer"}
                </span>
              </div>
            </ActionButton>
          ) : (
            <div className="action-disabled">
              {playerTurnState.actionsUsed.movement 
                ? `Mouvement utilisé (${6 - playerTurnState.remainingMovement} cases)`
                : "Mouvement non disponible"
              }
            </div>
          )}
          
          {isMovementMode && (
            <div className="movement-instructions">
              <p>💡 Cliquez sur une case pour vous déplacer (max {playerTurnState.remainingMovement} cases)</p>
            </div>
          )}
        </div>

        {/* Actions d'attaque */}
        {attackActions.length > 0 && (
          <div className="combat-action-section">
            <h4>Attaques {playerTurnState.actionsUsed.action ? '(Utilisée)' : ''}</h4>
            <div className="combat-actions-grid">
              {attackActions.map(action => renderActionButton({
                ...action,
                disabled: playerTurnState.actionsUsed.action
              }))}
            </div>
          </div>
        )}

        {/* Actions de sort */}
        {spellActions.length > 0 && (
          <div className="combat-action-section">
            <h4>Sorts {playerTurnState.actionsUsed.action ? '(Utilisée)' : ''}</h4>
            <div className="combat-actions-grid">
              {spellActions.map(action => renderActionButton({
                ...action,
                disabled: playerTurnState.actionsUsed.action
              }))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {selectedAction && (
          <div className="combat-action-instructions">
            <p>
              {selectedAction.areaOfEffect
                && "Cliquez sur une case pour cibler la zone d'effet"
                
                }
            </p>
          </div>
        )}

        {/* Cibles sélectionnées */}
      
      </CardBody>

      <CardFooter>
        <div className="combat-action-panel__controls">
          {selectedAction && (
            <Button
              variant="ghost"
              onClick={() => {
                onSelectAction(null);
                onClearTargets?.(); // Réinitialiser les cibles sélectionnées
              }}
            >
              Annuler
            </Button>
          )}

          {/* Nouveau système : Terminer le tour quand prêt */}
          {playerTurnState.canEndTurn ? (
            <Button
              variant="primary"
              onClick={endPlayerTurn}
              className="end-turn-button"
            >
              Terminer le tour
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={endPlayerTurn}
              title="Vous pouvez passer le tour même sans avoir fait d'actions"
            >
              Passer le tour
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default CombatActionPanel