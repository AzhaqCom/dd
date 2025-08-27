import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Modern feature components
import {
    CharacterSheet,
    CharacterSelection,
    CompanionParty
} from './components/features/character';

import { CombatLog } from './components/ui/CombatLog';
import {InventoryPanel} from './components/features/inventory';


// New UI Components
import StatusCorner from './components/ui/StatusCorner';
import GameHotbar from './components/ui/GameHotbar';
import FloatingPanel, { FloatingPanelManager } from './components/ui/FloatingPanel';
import RestPanelDirect from './components/ui/RestPanelDirect';
import SpellPanelDirect from './components/ui/SpellPanelDirect';


// New scene components
import DialogueScene from './components/game/DialogueScene';
import InteractiveScene from './components/game/InteractiveScene';
import MerchantScene from './components/game/MerchantScene';
import RestScene from './components/game/RestScene';
import CombatScene from './components/game/CombatScene';
import HubScene from './components/game/HubScene';

// Custom hooks for logic extraction
import { useAppHandlers } from './components/hooks/useAppHandlers';
import { useAutoSave } from './hooks/useAutoSave';
import { useAutoLoad } from './hooks/useAutoLoad';


// Zustand stores
import {
    useGameStore,
    useCharacterStore,
    useCombatStore,
    useUIStore,
} from './stores';
import { useTimeStore } from './stores/timeStore';

// Utils
import {
    createVirtualRestScene,
    getContainerClasses
} from './components/utils/sceneRendering';
import { StoryService } from './services/StoryService';
import SceneManager from './services/SceneManager';
import { SCENE_TYPES } from './types/story';
import './App.css';
import './responsive.css'; // CSS responsive non-invasif
import './styles/new-layout.css'; // Nouveau layout full-width

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="error-boundary">
            <h2>Quelque chose s'est mal passé :</h2>
            <pre>{error.message}</pre>
            <button onClick={resetErrorBoundary}>Réessayer</button>
        </div>
    );
}

function App() {
    // Zustand stores
    const {
        gamePhase,
        currentScene,
        isShortResting,
        isLongResting,
        nextSceneAfterRest,
        combatKey,
        setGamePhase,
        setCurrentScene,
        addCombatMessage,

    } = useGameStore();

    const {
        playerCharacter,
        setPlayerCharacter,
        getActiveCompanions,
    } = useCharacterStore();

    const {
        initializeCombat,
        resetCombat,
        incrementCombatKey
    } = useCombatStore();

    const {
        showError
    } = useUIStore();

    // State pour la gestion du CombatLog dans les scènes de combat
    const [combatActive, setCombatActive] = React.useState(false);
    
    // State pour la sidebar mobile (responsive)
    const [isMobileSidebarVisible, setIsMobileSidebarVisible] = React.useState(false);

    // State pour la nouvelle UI (floating panels)
    const [floatingPanels, setFloatingPanels] = React.useState([]);
    const [useNewUI, setUseNewUI] = React.useState(true); // Toggle pour tester la nouvelle UI
    
    // Hook pour l'auto-save
    const { manualSave, getAutoSaveStatus } = useAutoSave({
        enabled: false, // 🚫 DÉSACTIVÉ pour développement
        showNotification: true,
        saveOnSceneChange: true,
        saveOnFlagChange: true
    });

    // Hook pour l'auto-load au démarrage
    useAutoLoad({
        enabled: false, // 🚫 DÉSACTIVÉ pour développement
        skipIfCharacterExists: false // Permettre le chargement même avec un personnage
    });

    // Réinitialiser le state du combat quand on change de scène
    React.useEffect(() => {
        setCombatActive(false);
        setIsMobileSidebarVisible(false); // Fermer sidebar mobile lors du changement de scène
    }, [currentScene]);

    // Use custom hooks for handlers
    const {
        handleCombatVictory,
        handleCastSpellOutOfCombat,
        getGameStateWithCharacter,
        handleNewChoice,
        handleHotspotClick,
        handlePurchase,
        handleSell
    } = useAppHandlers();

    // Character selection handler
    const handleCharacterSelect = (selectedCharacter) => {
        // Ajouter de l'or de départ si pas défini
        const characterWithGold = {
            ...selectedCharacter,
            gold: selectedCharacter.gold || 100 // Or de départ par défaut
        };

        setPlayerCharacter(characterWithGold);
        setGamePhase('game');
        addCombatMessage('La fortune sourit aux audacieux')
    };

    // Floating panel handlers
    const openFloatingPanel = (panelType, size = 'medium', position = { x: 'center', y: 'center' }) => {
        // Vérifier si un panel de ce type existe déjà
        const existingPanel = floatingPanels.find(panel => panel.type === panelType);
        
        if (existingPanel) {
            // Si existe, le fermer (toggle behavior)
            closeFloatingPanel(existingPanel.id);
            return;
        }
        
        // Sinon, créer un nouveau panel
        const panelId = `${panelType}-${Date.now()}`;
        
        const newPanel = {
            id: panelId,
            type: panelType,
            title: getPanelTitle(panelType),
            isOpen: true,
            size,
            position,
            children: getPanelContent(panelType),
            zIndex: 200 + floatingPanels.length, // Z-index incrémental
            isFocused: true // Nouveau panel est focusé par défaut
        };

        // Défocuser les autres panels et ajouter le nouveau
        setFloatingPanels(prev => [
            ...prev.map(panel => ({ ...panel, isFocused: false })),
            newPanel
        ]);
    };

    const closeFloatingPanel = (panelId) => {
        setFloatingPanels(prev => prev.filter(panel => panel.id !== panelId));
    };

    const closeAllPanels = () => {
        setFloatingPanels([]);
    };

    // Fonction pour mettre un panel au premier plan (focus)
    const focusPanel = (panelId) => {
        setFloatingPanels(prev => {
            const maxZ = Math.max(...prev.map(p => p.zIndex || 200), 200);
            return prev.map(panel => 
                panel.id === panelId 
                    ? { ...panel, zIndex: maxZ + 1, isFocused: true }
                    : { ...panel, isFocused: false }
            );
        });
    };

    // Helper functions for panels
    const getPanelTitle = (type) => {
        const titles = {
            character: 'Fiche de Personnage',
            inventory: 'Inventaire',
            spells: 'Sorts et Magie',
            companions: 'Compagnons',
            journal: 'Journal d\'Aventure',
            rest: 'Options de Repos'
        };
        return titles[type] || 'Panel';
    };

    const getPanelContent = (type) => {
        switch(type) {
            case 'character':
                return <CharacterSheet character={playerCharacter} variant="interactive" />;
            case 'inventory':
                return <InventoryPanel />;
            case 'spells':
                return (
                    <SpellPanelDirect 
                        onClose={() => closeFloatingPanel('spells')}
                        onCastSpell={handleCastSpellOutOfCombat}
                    />
                );
            case 'companions':
                return <CompanionParty companions={getActiveCompanions()} variant="detailed" showRoles={true} />;
            case 'journal':
                return <CombatLog title="Journal d'Aventure" compact={false} />;
            case 'rest':
                // Interface simple et directe pour les repos
                return (
                    <RestPanelDirect 
                        onRestChoice={handleDirectRestChoice}
                        onClose={() => closeFloatingPanel('rest')}
                    />
                );
            default:
                return <div>Contenu du panel {type}</div>;
        }
    };

    const handleRestAction = () => {
        // Ouvrir le panel de repos direct
        openFloatingPanel('rest', 'medium');
    };

    const handleDirectRestChoice = async (restType) => {
        const { shortRestPlayer, longRestPlayer } = useCharacterStore.getState();
        const timeStore = useTimeStore.getState();
        
        try {
            // Effectuer le repos selon le type
            if (restType === 'short') {
                shortRestPlayer();
                addCombatMessage('💤 Repos court effectué ! Points de vie partiellement récupérés.', 'rest');
            } else {
                longRestPlayer();
                addCombatMessage('🛌 Repos long effectué ! Récupération complète !', 'rest');
            }
            
            // Avancer le temps
            timeStore.performRest(restType);
            
            return true;
        } catch (error) {
            console.error('Erreur lors du repos:', error);
            addCombatMessage('❌ Erreur lors du repos', 'error');
            return false;
        }
    };



    // Error boundary wrapper
    if (gamePhase === 'character-selection') {
        return (
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <CharacterSelection onCharacterSelect={handleCharacterSelect} />
            </ErrorBoundary>
        );
    }

    // Show loading if character is being set up
    if (!playerCharacter) {
        return (
            <div className="game-container">
                <div className="main-content">
                    <p>Chargement de ton personnage...</p>
                </div>
            </div>
        );
    }

    // Determine UI layout based on game state
    const { container: containerClass, mainContent: mainContentClass, sidebar: sidebarClass } = getContainerClasses(currentScene);

    // ===== SYSTÈME DE RENDU UNIFIÉ DES SCÈNES =====

    const renderNewSceneFormat = (scene) => {
        const gameState = getGameStateWithCharacter();

        // Vérifier si la scène doit être affichée selon ses conditions
        if (!StoryService.shouldShowScene(scene, gameState)) {
            return <p>Cette scène n'est pas disponible actuellement.</p>;
        }

        // === DISPATCH SELON LE TYPE DE SCÈNE ===
        switch (scene.type) {
            case SCENE_TYPES.DIALOGUE:
                return (
                    <div className='scene-dialogue'>
                        <DialogueScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.INTERACTIVE:
                return (
                    <div className='scene-interactive'>
                        <InteractiveScene
                            scene={scene}
                            gameState={gameState}
                            onHotspotClick={handleHotspotClick}
                            onChoice={handleNewChoice}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.MERCHANT:
                return (
                    <div className='scene-merchant'>
                        <MerchantScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                            onPurchase={handlePurchase}
                            onSell={handleSell}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.REST_LONG:
                return (
                    <div className='scene-rest-long'>
                        <RestScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.REST_SHORT:
                return (
                    <div className='scene-rest-short'>
                        <RestScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.REST_CHOICE:
                return (
                    <div className='scene-rest-choice'>
                        <RestScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );

            case SCENE_TYPES.COMBAT:
                return (
                    <div className='scene-combat'>
                        <CombatScene
                            scene={scene}
                            gameState={gameState}
                            onChoice={handleNewChoice}
                            playerCharacter={playerCharacter}
                            activeCompanions={getActiveCompanions()}
                            combatKey={combatKey}
                            onCombatStateChange={setCombatActive}
                            onCombatEnd={() => {
                                handleCombatVictory();
                                if (scene.onVictory?.next) {
                                    setCurrentScene(scene.onVictory.next);
                                }
                            }}
                            onReplayCombat={() => {
                                // Restaurer les PV du joueur et du compagnon pour replay
                                if (playerCharacter) {
                                    setPlayerCharacter({
                                        ...playerCharacter,
                                        currentHP: playerCharacter.maxHP
                                    });
                                }

                                // Restaurer les HP des compagnons actifs
                                const activeCompanions = getActiveCompanions()
                                activeCompanions.forEach(companion => {
                                    // La restauration sera gérée par le système multi-compagnons
                                })

                                // Réinitialiser complètement le combat
                                resetCombat();
                                incrementCombatKey();
                                addCombatMessage('🔄 Combat réinitialisé !', 'info');

                                // Attendre un tick pour que les changements soient appliqués
                                setTimeout(() => {
                                    const restoredPlayer = { ...playerCharacter, currentHP: playerCharacter.maxHP };
                                    const restoredCompanions = getActiveCompanions().map(companion => ({
                                        ...companion,
                                        currentHP: companion.maxHP
                                    }));

                                    initializeCombat(scene, restoredPlayer, restoredCompanions);
                                }, 100);
                            }}
                        />
                       
                        {/* Afficher le CombatLog seulement quand le combat n'est pas actif */}
                        {!combatActive && <CombatLog title="Journal" compact={true} />}
                    </div>
                );
            case SCENE_TYPES.HUB:
                return (
                    <div className='scene-hub'>
                        <HubScene
                            scene={scene}
                            onChoice={handleNewChoice}
                            onAction={(action) => {
                                console.log('🎬 Action de hub:', action);
                                // Gérer les actions spécifiques au hub
                            }}
                        />
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );
            case 'error':
                // === GESTION DES ERREURS ===
                return (
                    <div className="scene-error">
                        <h3>⚠️ Scène introuvable</h3>
                        <p>{scene.content.text}</p>
                        <button onClick={() => setCurrentScene('introduction')}>Retour au début</button>
                    </div>
                );

            case SCENE_TYPES.TEXT:
            default:
                // === RENDU DES SCÈNES TEXTUELLES ===
                // Format unifié pour toutes les scènes textuelles
                return (
                    <div className='scene-textuel-new'>
                        <div className="scene-content">
                            <h3>{scene.content?.title || scene.metadata?.title}</h3>
                            <div className="scene-text">
                                {SceneManager.getSceneText(scene, gameState).split('\n').map((line, index) => (
                                    line.trim() === '' ?
                                        <br key={index} /> :
                                        <p key={index}>{line}</p>
                                ))}
                            </div>
                        </div>
                        <div className="scene-choices">
                            {SceneManager.getAvailableChoices(scene, gameState).map((choice, index) => (
                                <button
                                    key={index}
                                    className="choice-button"
                                    onClick={() => handleNewChoice(choice)}
                                >
                                    {choice.text}
                                </button>
                            ))}
                        </div>
                        <CombatLog title="Journal" compact={true} />
                    </div>
                );
        }
    };

    /**
     * Obtient la scène à rendre selon le contexte actuel
     * Gère les états spéciaux (repos) et les scènes normales
     */
    const getCurrentSceneToRender = () => {
        // === GESTION DES REPOS ===
        if (isLongResting) {
            return createVirtualRestScene('long', nextSceneAfterRest);
        }

        if (isShortResting) {
            return createVirtualRestScene('short', nextSceneAfterRest);
        }


        // === NOUVEAU SYSTÈME UNIFIÉ ===
        const sceneData = SceneManager.getScene(currentScene);
        if (sceneData) {
            return sceneData;
        }

        // === SCÈNE NON TROUVÉE (ne devrait plus arriver avec le SceneManager) ===
        return SceneManager.ERROR_SCENE;
    };
    // Determine which panels to show based on character class and abilities
    const shouldShowSpellcasting = playerCharacter?.spellcasting;
    const shouldShowSpecialAbilities = playerCharacter?.specialAbilities;

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className={`game-container-fullwidth ${currentScene?.type === SCENE_TYPES.COMBAT ? 'combat-mode' : ''}`}>
                    {/* ✅ NOUVEAU: Status Corner - Stats vitales avec système temporel intégré */}
                    <StatusCorner 
                        character={playerCharacter}
                        gameFlags={{}} // TODO: Ajouter gameFlags
                    />

                    {/* ✅ NOUVEAU: Hotbar - Actions rapides avec système temporel intégré */}
                    <GameHotbar
                        character={playerCharacter}
                        onPanelOpen={openFloatingPanel}
                        onRestAction={handleRestAction}
                        gameFlags={{}} // TODO: Ajouter gameFlags
                        inventory={{ items: playerCharacter?.inventory || [], count: playerCharacter?.inventory?.length || 0 }}
                        companions={getActiveCompanions()}
                        spellSlots={playerCharacter?.spellSlots || {}}
                    />

                    {/* Contenu principal full width */}
                    <div className="main-content-fullwidth">
                        {renderNewSceneFormat(getCurrentSceneToRender())}
                    </div>

                    {/* Floating Panels System */}
                    <FloatingPanelManager 
                        panels={floatingPanels}
                        onClosePanel={closeFloatingPanel}
                        onFocusPanel={focusPanel}
                    />

               </div>

        </ErrorBoundary>
    );
}

export default App;
