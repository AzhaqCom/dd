import React, { useState } from 'react';
import { CombatPanel } from '../features/combat';
import SceneManager from '../../services/SceneManager';

/**
 * CombatScene - Composant unifié pour les scènes de combat
 * Combine le format unifié des scènes avec le CombatPanel existant
 */
const CombatScene = ({
  scene,
  gameState,
  onChoice,
  playerCharacter,
  activeCompanions,
  combatKey,
  onCombatEnd,
  onReplayCombat,
  onCombatStateChange // Callback pour informer le parent de l'état du combat
}) => {
  // Vérifier si c'est une embuscade (combat instantané)
  const isAmbush = scene.metadata?.ambush === true || scene.content?.ambush === true;
  const [combatStarted, setCombatStarted] = useState(false);
  const [showingAmbushText, setShowingAmbushText] = useState(isAmbush);

  // Effet pour gérer l'embuscade automatique
  React.useEffect(() => {
    if (isAmbush && showingAmbushText) {
      const timer = setTimeout(() => {
        setShowingAmbushText(false);
        setCombatStarted(true);
        // Informer le parent que le combat a commencé
        onCombatStateChange?.(true);
      }, 2500); // Afficher le texte d'embuscade pendant 2.5 secondes

      return () => clearTimeout(timer);
    }
  }, [isAmbush, showingAmbushText]);

  // Obtenir les choix disponibles selon les conditions
  const availableChoices = SceneManager.getAvailableChoices(scene, gameState);

  // Obtenir le texte avec interpolation
  const sceneText = SceneManager.getSceneText(scene, gameState);

  // Gérer le démarrage du combat
  const handleStartCombat = () => {
    setCombatStarted(true);
    // Informer le parent que le combat a commencé
    onCombatStateChange?.(true);
  };

  // Trouver le choix de combat (généralement le premier ou celui sans conséquences)
  const combatChoice = availableChoices.find(choice =>
    choice.text.toLowerCase().includes('combat') ||
    choice.text.toLowerCase().includes('engager') ||
    !choice.consequences
  ) || availableChoices[0];

  // Gérer la fin du combat
  const handleCombatEndWrapper = (encounterData) => {
    // Informer le parent que le combat est terminé
    onCombatStateChange?.(false);

    // Vérifier s'il y a une configuration de victoire spécifique
    if (scene.onVictory) {
      // Créer un pseudo-choix à partir de la configuration onVictory
      const victoryChoice = {
        text: scene.onVictory.text || "Continuer l'aventure",
        next: scene.onVictory.next,
        consequences: scene.onVictory.consequences,
        // ✅ Passer la scène générée si elle existe
        generatedScene: scene.onVictory.generatedScene
      };
      
      if (onChoice) {
        onChoice(victoryChoice);
      }
    } else {
      // Fallback vers l'ancien système
      const continueChoice = availableChoices.find(choice => choice.consequences) || availableChoices.find(choice => choice.next && choice.next !== scene.id) || availableChoices[0];
      
      if (continueChoice && onChoice) {
        // Appliquer les conséquences si présentes
        onChoice(continueChoice);
      }
    }

    // Appeler le callback original si fourni
    if (onCombatEnd) {
      onCombatEnd(encounterData);
    }
  };

  // Si c'est une embuscade et qu'on affiche encore le texte, montrer juste le texte
  if (isAmbush && showingAmbushText) {
    return (
      <div className='scene-textuel-new'>
        <div className="scene-content">
          <h3 style={{ color: '#ff6b6b', fontSize: '2rem' }}>⚔️ {scene.content?.title}</h3>
          <div className="scene-text" style={{ textAlign: 'center', fontSize: '1.3rem' }}>
            {sceneText.split('\n').map((line, index) => (
              line.trim() === '' ?
                <br key={index} /> :
                <p key={index} style={{ fontWeight: 'bold', color: '#ff9999' }}>{line}</p>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
            ⏱️ Le combat commence automatiquement...
          </p>
        </div>
      </div>
    );
  }

  // Si le combat n'a pas encore commencé (combat normal), afficher l'introduction
  if (!combatStarted) {
    return (
      <div className='combat-scene'>
        <div className="scene-content">
          <h3>{scene.content?.title || scene.metadata?.title}</h3>
          <div className="scene-text">
            {sceneText.split('\n').map((line, index) => (
              line.trim() === '' ?
                <br key={index} /> :
                <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        <div className="scene-choices">
          {availableChoices.map((choice, index) => (
            <button
              key={index}
              className="choice-button"
              onClick={() => {
                // Si c'est un choix de combat, démarrer le combat
                if (choice.action?.type === 'combat' || !choice.next || choice.next === scene.id) {
                  handleStartCombat();
                } else {
                  // Sinon, navigation normale
                  onChoice(choice);
                }
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Une fois le combat démarré, afficher le CombatPanel
  const combatData = SceneManager.prepareCombatData(scene);

  // Personnaliser le texte de victoire
  const customVictoryText = scene.onVictory?.text || 
    availableChoices.find(choice => choice.consequences)?.text || 
    availableChoices.find(choice => choice.next && choice.next !== scene.id)?.text || 
    "Continuer l'aventure";

  return (

    <CombatPanel
      key={combatKey}
      playerCharacter={playerCharacter}
      activeCompanions={activeCompanions}
      encounterData={combatData}
      onCombatEnd={handleCombatEndWrapper}
      onReplayCombat={onReplayCombat}
      // Props personnalisés pour le texte de victoire
      victoryButtonText={customVictoryText}
    />

  );
};

export default CombatScene;