import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useCharacterStore } from '../../stores/characterStore';
import { SceneManager } from '../../services/SceneManager';
import { ProceduralGenerator } from '../../services/ProceduralGenerator';
import './HubScene.css';

/**
 * Composant pour le rendu des scènes de hub interactif
 */
export const HubScene = ({ scene, onChoice, onAction }) => {
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [explorationState, setExplorationState] = useState('exploring');
  const [discoveredElements, setDiscoveredElements] = useState([]);
  const [originalHubId, setOriginalHubId] = useState(scene.id); // Mémoriser l'ID du hub d'origine
  const { playerCharacter } = useCharacterStore();
  const { addCombatMessage, setFlag } = useGameStore();

  // Extraire les données d'exploration de la scène
  const explorationData = scene.exploration || {};
  const { encounters = [], npcs = [], rewards = [], biome = 'unknown' } = explorationData;

  useEffect(() => {
    console.log('🎲 HubScene montée:', { 
      sceneId: scene.id, 
      biome, 
      explorationData,
      sceneComplete: scene
    });

    // Si on revient d'un combat avec un choix "return_to_hub", rester dans le hub
    if (scene.id === 'return_to_hub' || scene.choices?.some(choice => choice.next === 'return_to_hub')) {
      console.log('🔄 Signal de retour au hub détecté, maintien de l\'état');
      // On reste dans l'état d'exploration actuel
    }
  }, [scene.id]);

  const handleExploreAction = () => {
    console.log('🔍 Action d\'exploration déclenchée');
    
    // Générer directement du contenu procédural selon le type d'exploration
    const explorationTypes = ['combat', 'dialogue', 'discovery'];
    const selectedType = ProceduralGenerator.selectRandom(explorationTypes);
    
    console.log(`🎲 Type d'exploration sélectionné: ${selectedType}`);
    
    let generatedContent;
    
    if (selectedType === 'combat') {
      generatedContent = ProceduralGenerator.generateCombatScene('random_encounter', {
        biome: biome,
        difficulty: 'medium',
        playerLevel: playerCharacter?.level || 1,
        currentHubId: scene.id // Passer l'ID du hub actuel (procédural)
      });
    } else if (selectedType === 'dialogue') {
      generatedContent = ProceduralGenerator.generateDialogueScene('random_meeting', {
        biome: biome
      });
    } else {
      generatedContent = ProceduralGenerator.generateTextScene('exploration_result', {
        biome: biome,
        location: scene.id
      });
    }
    
    console.log('✨ Contenu procédural généré:', generatedContent);
    
    // Si c'est un combat, lancer la scène directement
    if (selectedType === 'combat') {
      onChoice({ 
        text: 'Lancer l\'exploration de combat', 
        next: generatedContent.id,
        generatedScene: generatedContent
      });
    } else {
      // Sinon, afficher dans l'interface d'encounter
      setCurrentEncounter({
        content: generatedContent.content,
        choices: generatedContent.choices,
        npc: generatedContent.npc
      });
      setExplorationState('encounter');
    }
    
    // Ajouter à la liste des éléments découverts
    setDiscoveredElements(prev => [...prev, {
      type: selectedType,
      data: generatedContent,
      timestamp: Date.now()
    }]);
  };

  const handleEncounterResolution = (result) => {
    console.log('✅ Résolution de rencontre:', result);
    
    // Appliquer les résultats (XP, items, etc.)
    if (result.experience) {
      console.log(`💫 +${result.experience} XP gagné !`);
      addCombatMessage(`💫 +${result.experience} XP gagné !`, 'experience');
      setFlag('lastExplorationReward', `${result.experience} XP`);
    }
    
    if (result.items) {
      console.log('🎁 Items obtenus:', result.items);
      addCombatMessage(`🎁 Trouvé: ${result.items.join(', ')}`, 'reward');
      setFlag('lastItemsFound', result.items.join(', '));
    }
    
    // Ajouter l'événement aux découvertes si c'est significatif
    if (result.experience || result.items) {
      setDiscoveredElements(prev => [...prev, {
        type: result.experience ? 'reward' : 'discovery',
        data: {
          experience: result.experience,
          items: result.items,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }]);
    }
    
    // Retourner à l'exploration
    setCurrentEncounter(null);
    setExplorationState('exploring');
  };

  const handleNPCInteraction = (npc) => {
    console.log('💬 Interaction avec PNJ:', npc);
    
    // Générer un dialogue simple
    setCurrentEncounter({
      content: {
        title: `Conversation avec ${npc?.name || 'un inconnu'}`,
        text: `${npc?.name || 'L\'inconnu'} vous regarde. "${npc?.defaultDialogue || 'Bonjour, voyageur. Que puis-je faire pour vous ?'}"`
      },
      choices: [
        { text: 'Demander des informations sur la région', action: 'ask_info' },
        { text: 'Proposer un échange', action: 'trade' },
        { text: 'Saluer et partir', action: 'leave' }
      ]
    });
    
    setExplorationState('dialogue');
  };

  const handleContinueJourney = () => {
    console.log('➡️ Continuer le voyage');
    // Retourner à la narration principale
    onChoice({ text: 'Continuer', next: 'continue_journey' });
  };

  // Fonction spéciale pour gérer les retours au hub depuis d'autres scènes
  const handleReturnToHub = () => {
    console.log('🔄 Retour au hub d\'origine:', originalHubId);
    // Rediriger vers la scène hub d'origine
    onChoice({ text: 'Retour au hub', next: originalHubId });
  };

  // Rendu des différents états d'exploration
  const renderExplorationInterface = () => (
    <div className="exploration-interface">
      <div className="exploration-header">
        <h3>🗺️ {scene.content?.title || 'Zone d\'Exploration'}</h3>
        <div className="biome-indicator">
          <span className="biome-badge">{getBiomeIcon(biome)} {biome}</span>
        </div>
      </div>

      <div className="exploration-description">
        <p>{scene.content?.text}</p>
      </div>

      <div className="exploration-actions">
        <div className="action-grid">
          <button 
            className="exploration-btn explore"
            onClick={handleExploreAction}
            disabled={explorationState !== 'exploring'}
          >
            🔍 Explorer la zone
          </button>

          {npcs.length > 0 && (
            <button 
              className="exploration-btn npc"
              onClick={() => handleNPCInteraction(npcs[0])}
            >
              💬 Approcher {npcs[0]?.name || 'quelqu\'un'}
            </button>
          )}

          {encounters.length > 0 && (
            <button 
              className="exploration-btn encounter"
              onClick={() => {
                console.log('⚔️ Enquête sur les traces déclenchée');
                setCurrentEncounter({
                  content: {
                    title: 'Traces Suspectes',
                    text: 'En examinant attentivement les traces, vous découvrez...'
                  },
                  choices: [
                    { text: 'Suivre les traces', action: 'follow_tracks' },
                    { text: 'Retourner à l\'exploration', action: 'back' }
                  ]
                });
                setExplorationState('encounter');
              }}
            >
              ⚔️ Enquêter sur les traces
            </button>
          )}

          <button 
            className="exploration-btn continue"
            onClick={handleContinueJourney}
          >
            ➡️ Continuer son chemin
          </button>
        </div>
      </div>

      {discoveredElements.length > 0 && (
        <div className="discovered-elements">
          <h4>🏛️ Découvertes</h4>
          <div className="discoveries-list">
            {discoveredElements.map((element, index) => (
              <div key={index} className="discovery-item">
                <span className="discovery-type">{getDiscoveryIcon(element.type)}</span>
                <span className="discovery-description">
                  {element.data?.content?.title || 'Élément découvert'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEncounter = () => (
    <div className="encounter-view">
      <div className="encounter-header">
        <h3>⚡ Rencontre</h3>
        <button 
          className="back-btn"
          onClick={() => handleEncounterResolution({})}
        >
          ← Retour à l'exploration
        </button>
      </div>

      <div className="encounter-content">
        <h4>{currentEncounter?.content?.title}</h4>
        <p>{currentEncounter?.content?.text}</p>

        <div className="encounter-choices">
          {currentEncounter?.choices?.map((choice, index) => (
            <button
              key={index}
              className="choice-btn"
              onClick={() => {
                console.log('🎬 Choix sélectionné:', choice);
                
                // Actions spécifiques selon le choix
                if (choice.action === 'back' || choice.action === 'leave') {
                  handleEncounterResolution({});
                } else if (choice.action === 'follow_tracks') {
                  // Nouvelle rencontre basée sur le choix
                  setCurrentEncounter({
                    content: {
                      title: 'En Suivant les Traces',
                      text: 'Les traces vous mènent à une clairière où des bandits ont établi un camp...'
                    },
                    choices: [
                      { text: 'Attaquer par surprise', action: 'attack' },
                      { text: 'Observer discrètement', action: 'observe' },
                      { text: 'Faire demi-tour', action: 'back' }
                    ]
                  });
                } else if (choice.action === 'ask_info') {
                  // Générer une scène de dialogue procédurale
                  console.log('💬 Génération procédurale du dialogue informatif');
                  
                  const dialogueScene = ProceduralGenerator.generateDialogueScene('info_request', {
                    biome: biome,
                    npc: currentEncounter.npc || { name: 'Inconnu', role: 'local' }
                  });
                  
                  setCurrentEncounter({
                    content: dialogueScene.content,
                    choices: dialogueScene.choices
                  });
                } else if (choice.action === 'attack') {
                  // Générer une scène de combat procédurale !
                  console.log('⚔️ Génération procédurale du combat contre les bandits !');
                  
                  const combatScene = ProceduralGenerator.generateCombatScene('bandit_ambush', {
                    biome: biome,
                    difficulty: 'medium',
                    surprise: true,
                    playerLevel: playerCharacter?.level || 1,
                    currentHubId: scene.id // Passer l'ID du hub actuel (procédural)
                  });
                  
                  console.log('✨ Scène de combat générée:', combatScene);
                  
                  // Utiliser onChoice pour lancer la scène de combat générée
                  onChoice({ 
                    text: 'Lancer le combat', 
                    next: combatScene.id,
                    generatedScene: combatScene // Passer la scène générée
                  });
                  
                } else if (choice.action === 'observe') {
                  // Action d'observation
                  setCurrentEncounter({
                    content: {
                      title: 'Observation Discrète',
                      text: 'Vous observez le camp depuis les buissons. Vous comptez 3 bandits autour d\'un feu. L\'un d\'eux semble porter une bourse bien remplie...'
                    },
                    choices: [
                      { text: 'Attaquer maintenant', action: 'attack' },
                      { text: 'Attendre la nuit', action: 'wait_night' },
                      { text: 'Partir discrètement', action: 'back' }
                    ]
                  });
                  
                } else {
                  // Résolution générique
                  const mockResult = {
                    experience: 25,
                    items: ['souvenir_exploration']
                  };
                  handleEncounterResolution(mockResult);
                }
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Rendu principal selon l'état
  return (
    <div className="exploration-scene">
      {explorationState === 'exploring' && renderExplorationInterface()}
      {explorationState === 'encounter' && currentEncounter && renderEncounter()}
      
      {explorationState === 'dialogue' && currentEncounter && renderEncounter()}
    </div>
  );
};

// Utilitaires d'affichage
const getBiomeIcon = (biome) => {
  const icons = {
    forest: '🌲',
    village: '🏘️',
    dungeon: '🏰',
    mountain: '⛰️',
    wilderness: '🌿',
    unknown: '❓'
  };
  return icons[biome] || icons.unknown;
};

const getDiscoveryIcon = (type) => {
  const icons = {
    encounter: '⚔️',
    npc: '👤',
    treasure: '💎',
    secret: '🔍'
  };
  return icons[type] || '✨';
};

export default HubScene;