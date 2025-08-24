import React, { useState } from 'react'
import { useGameStore, useCharacterStore } from '../../../stores'
import { characterTemplates } from '../../../data/characterTemplates'
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Button,
  Modal,
  useModal

} from '../../ui'
import { CharacterSelectionCard } from './CharacterSelectionCard'
import { CompactCharacterSheet } from './CharacterSheet'

/**
 * Écran de sélection de personnage modernisé
 */
export const CharacterSelection = ({ onCharacterSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  const setGamePhase = useGameStore(state => state.setGamePhase)
  const setPlayerCharacter = useCharacterStore(state => state.setPlayerCharacter)
  
  const { openModal, closeModal } = useModal()

  // Personnages disponibles (peut être étendu dynamiquement)
  const availableCharacters = [
    characterTemplates.wizard,
    characterTemplates.warrior, 
    characterTemplates.rogue,
    characterTemplates.paladin
  ].filter(Boolean) // Filtrer les personnages undefined

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character)
  }

  const handlePreviewCharacter = (character) => {
    openModal('character-preview', character)
  }

  const handleConfirmSelection = async () => {
    if (!selectedCharacter) return

    setIsConfirming(true)
    
    try {
      // Simuler un délai de chargement pour l'expérience utilisateur
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Initialiser le personnage dans le store
      setPlayerCharacter(selectedCharacter)
      
      // Callback externe si fourni
      onCharacterSelect?.(selectedCharacter)
      
      // Changer de phase de jeu
      setGamePhase('game')
    } catch (error) {
      console.error('Erreur lors de la sélection du personnage:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const getCharacterDescription = (character) => {
    const descriptions = {
      'Magicien': "Maître des arcanes, ce personnage utilise des sorts puissants pour vaincre ses ennemis. Fragile mais redoutable à distance, il excelle dans le contrôle du champ de bataille.",
      'Guerrier': "Combattant expérimenté, ce héros excelle au corps-à-corps avec ses armes. Robuste et polyvalent au combat, il peut encaisser et infliger de lourds dégâts.",
      'Roublard': "Expert en furtivité, ce personnage frappe avec précision et évite les coups. Agile et mortel par surprise, il excelle dans les situations qui demandent de la finesse.",
      'Paladin': "Chevalier sacré, ce héros allie force et foi. Capable de soigner ses alliés et de frapper avec puissance, il est un pilier de défense et de soutien.",
    }
    
    return descriptions[character.class] || "Un aventurier prêt à affronter tous les défis."
  }

  const getClassIcon = (characterClass) => {
    const icons = {
      'Magicien': '🧙‍♂️',
      'Guerrier': '⚔️',
      'Roublard': '🗡️',
      'Paladin': '🛡️'
    }
    
    return icons[characterClass] || '🗡️'
  }

  return (
    <div className="character-selection-screen">
      <div className="selection-header">
        <h1 className="character-selection__title">
          ✨ Choisis ton Héros ✨
        </h1>
        <p className="character-selection__subtitle">
          Sélectionne le personnage avec lequel tu veux vivre cette aventure épique !
        </p>
      </div>

      <div className="character-grid">
        {availableCharacters.map((character, index) => (
          <CharacterSelectionCard
            key={`${character.name}-${index}`}
            character={character}
            isSelected={selectedCharacter?.name === character.name}
            onSelect={() => handleCharacterSelect(character)}
            onPreview={() => handlePreviewCharacter(character)}
            icon={getClassIcon(character.class)}
            description={getCharacterDescription(character)}
          />
        ))}
      </div>

      {selectedCharacter && (
        
          <Card className="character-details">
            <CardHeader>
              <h3>
                {getClassIcon(selectedCharacter.class)} {selectedCharacter.name}
              </h3>
              <p>{selectedCharacter.level}e niveau {selectedCharacter.race} {selectedCharacter.class}</p>
            </CardHeader>
            
            <CardBody>
              <p className="character-selection__description">
                {getCharacterDescription(selectedCharacter)}
              </p>
              
              {/* Mini aperçu des stats */}
              <div className="character-stats-preview">
                <div className="stat-preview">
                  <span className="quick-stat__label">❤️ PV </span>
                  <span className="quick-stat__value">{selectedCharacter.maxHP}</span>
                </div>
                <div className="stat-preview">
                  <span className="quick-stat__label">🛡️ CA </span>
                  <span className="quick-stat__value">{selectedCharacter.ac}</span>
                </div>
                <div className="stat-preview">
                  <span className="quick-stat__label">⚡ Initiative </span>
                  <span className="quick-stat__value">
                     + {Math.floor((selectedCharacter.stats.dexterite - 10) / 2)}
                  </span>
                </div>
              </div>
              
            </CardBody>
            
            <CardFooter>
              <div className="character-selection__actions">
                
                
                <Button
                  variant="primary"
                  onClick={handleConfirmSelection}
                  loading={isConfirming}
                  disabled={!selectedCharacter}
                  size="large"
                >
                  {isConfirming ? 'Préparation...' : '🚀 Commencer l\'aventure !'}
                </Button>
              </div>
            </CardFooter>
          </Card>
     
      )}

      {!selectedCharacter && (
        <div className="character-selection__help">
          <Card variant="ghost" className="character-selection__help-card">
            <CardBody>
              <p>
                👆 Clique sur un personnage pour le sélectionner, ou sur "Voir les détails" 
                pour examiner ses caractéristiques complètes.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal de prévisualisation */}
      <Modal type="character-preview" size="large" title="Aperçu du personnage">
        {({ data: character, onClose }) => (
          <div className="character-preview-modal">
            {character && (
              <>
                <div className="character-preview-modal__header">
                  <h2>
                    {getClassIcon(character.class)} {character.name}
                  </h2>
                  <p>{character.level}e niveau {character.race} {character.class}</p>
                </div>
                
                <div className="character-preview-modal__content">
                  <div className="character-preview-modal__description">
                    <p>{getCharacterDescription(character)}</p>
                  </div>
                  
                  <div className="character-preview-modal__sheet">
                    <CompactCharacterSheet characterData={character} />
                  </div>
                </div>
                
                <div className="character-preview-modal__actions">
                  <Button variant="secondary" onClick={onClose}>
                    Fermer
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedCharacter(character)
                      onClose()
                    }}
                  >
                    Choisir ce personnage
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CharacterSelection