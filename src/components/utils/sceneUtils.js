import { companions } from '../../data/companions';
import { useCharacterStore, useGameStore } from '../../stores';
import { StoryService } from '../../services/StoryService';
import { SceneManager } from '../../services/SceneManager';
import { SCENE_TYPES, ACTION_TYPES } from '../../types/story';

/**
 * Processes scene actions and returns the appropriate result
 * @param {Object|string} action - The action to process
 * @param {Object} handlers - Object containing handler functions
 * @returns {Object|string} The processed action result
 */
export const processSceneAction = (action, handlers) => {
    if (typeof action === 'string') {
        return action;
    }

    if (typeof action === 'object') {
        // Gestion du nouveau format avec next
        if (action.next) {
            // Traiter l'action puis retourner la scène suivante
            processActionEffects(action, handlers);
            return action.next;
        }

        switch (action.type) {
            case 'combat':
                return { 
                    ...action,
                    enemies: action.enemies,
                    enemyPositions: action.enemyPositions,
                    next: action.next,
                };
            case 'longRest':
                handlers.startLongRest(action.next);
                return null;
            case 'shortRest':
                handlers.startShortRest(action.next);
                return null;
            case 'items':
                handlers.handleItemGain(action.item);
                return action.next;
            case 'ally':
                return processAllyAction(action, handlers);
            case 'skillCheck':
                return processSkillCheckAction(action, handlers);
            case 'setFlag':
                return processSetFlagAction(action, handlers);
            case 'changeReputation':
                return processReputationAction(action, handlers);
            case 'openShop':
                // Pour les actions de boutique, on retourne l'action telle quelle
                // Le composant parent gérera l'ouverture de la boutique
                return action;
            case 'openSellInterface':
                return action;
            case 'scene_transition':
                // Simple transition vers une autre scène
                return action.next;
            default:
                console.warn("Type d'action inconnu :", action.type);
                return null;
        }
    }

    return null;
};

/**
 * Traite les effets d'une action (conséquences)
 */
const processActionEffects = (action, handlers) => {
    const gameStore = useGameStore.getState();
    
    // Appliquer les conséquences via le store
    if (action.consequences) {
        gameStore.applyConsequences(action.consequences);
    }
    
    // Actions spécifiques selon le type
    switch (action.type) {
        case 'item':
            if (action.item) {
                handlers.handleItemGain(action.item);
            }
            break;
        case 'ally':
            if (action.ally) {
                processAllyAction(action, handlers);
            }
            break;
        default:
            break;
    }
};

/**
 * Traite l'ajout d'un allié
 */
const processAllyAction = (action, handlers) => {
    const companionToAdd = companions[action.ally];
    if (companionToAdd) {
        // Nouveau système multi-compagnons
        const companionWithId = { 
            ...companionToAdd, 
            id: action.ally.toLowerCase() 
        };
        
        // Ajouter au nouveau système
        if (handlers.addCompanion) {
            handlers.addCompanion(companionWithId);
            
            // Mettre à jour les compagnons actifs
            const currentStore = useCharacterStore.getState();
            const newActiveCompanions = [...currentStore.activeCompanions, companionWithId.id];
            handlers.setActiveCompanions(newActiveCompanions);
        }
        
        
        // Ajouter aux flags du jeu
        const gameStore = useGameStore.getState();
        gameStore.addToList('companions', action.ally);
        
        handlers.addCombatMessage(`${companionToAdd.name} te rejoint dans ton aventure !`, 'upgrade');
        
        return action.next;
    } else {
        console.error(`Compagnon '${action.ally}' introuvable.`);
        return null;
    }
};

/**
 * Traite un test de compétence
 */
const processSkillCheckAction = (action, handlers) => {
    // Récupérer le personnage actuel depuis le store
    const playerCharacter = useCharacterStore.getState().playerCharacter;
    if (!playerCharacter) {
        console.error('Aucun personnage joueur trouvé pour le test de compétence');
        return null;
    }
    
    // Appeler directement handleSkillCheck avec les paramètres simples
    // handleSkillCheck gère automatiquement la navigation vers success/failure
    handlers.handleSkillCheck(
        action.skill,
        action.dc,
        action.onSuccess,
        action.onPartialSuccess || null,
        action.onFailure,
        playerCharacter
    );
    
    // Return null car handleSkillCheck s'occupe de la navigation
    return null;
};

/**
 * Traite la modification d'un flag
 */
const processSetFlagAction = (action, handlers) => {
    const gameStore = useGameStore.getState();
    
    if (action.flags) {
        gameStore.setFlags(action.flags);
    } else if (action.flag && action.value !== undefined) {
        gameStore.setFlag(action.flag, action.value);
    }
    
    return action.next;
};

/**
 * Traite un changement de réputation
 */
const processReputationAction = (action, handlers) => {
    const gameStore = useGameStore.getState();
    
    if (typeof action.change === 'number') {
        gameStore.updateReputation(action.change);
        handlers.addCombatMessage(`Réputation ${action.change > 0 ? 'augmentée' : 'diminuée'} de ${Math.abs(action.change)}`, 'info');
    }
    
    return action.next;
};

/**
 * Traite un choix avec le nouveau système unifié
 * @param {Object} choice - Le choix sélectionné
 * @param {Object} gameState - L'état actuel du jeu
 * @param {Object} handlers - Les handlers disponibles
 * @returns {Promise<string>} L'ID de la prochaine scène
 */
export const processChoice = async (choice, gameState, handlers) => {
    // Appliquer les conséquences si présentes
    if (choice.consequences) {
        const gameStore = useGameStore.getState();
        const characterStore = useCharacterStore.getState();
        
        // Appliquer les conséquences via gameStore (flags, reputation, items, companions, etc.)
        await gameStore.applyConsequences(choice.consequences);
        
        // === GESTION SPÉCIALE : EXPÉRIENCE ===
        if (choice.consequences.experience && typeof choice.consequences.experience === 'number') {
            const xpGained = choice.consequences.experience;
            
            // Ajouter XP au joueur
            characterStore.addExperience(xpGained);
            handlers.addCombatMessage(`Tu gagnes ${xpGained} points d'expérience !`, 'experience');
            
            // Ajouter XP aux compagnons actifs
            const activeCompanions = characterStore.getActiveCompanions();
            activeCompanions.forEach(companion => {
                characterStore.addExperience(xpGained, companion.id);
                handlers.addCombatMessage(`${companion.name} gagne aussi ${xpGained} points d'expérience !`, 'experience');
            });
        }
    }
    
    // === GESTION DES ACTIONS ===
    if (choice.action) {
        const actionResult = processSceneAction(choice.action, handlers);
        if (actionResult) {
            return actionResult;
        }
    }
    
    // === GESTION TEMPORELLE ===
    // Traiter la transition temporelle si une scène suivante est définie
    if (choice.next) {
        const gameStore = useGameStore.getState();
        const currentScene = SceneManager.getScene(gameStore.currentScene);
        
        // Si une scène générée est fournie dans le choix, l'utiliser
        let nextScene;
        if (choice.generatedScene) {
            console.log('📦 Utilisation de scène générée:', choice.generatedScene.id);
            nextScene = SceneManager.getOrGenerateScene(choice.next, gameState, choice.generatedScene);
        } else {
            nextScene = SceneManager.getScene(choice.next);
        }
        
        if (currentScene && nextScene) {
            // Appliquer la progression temporelle
            const transitionResult = SceneManager.processSceneTransition(
                currentScene, 
                nextScene, 
                choice, 
                { gameState }
            );
            
            // Afficher les messages temporels s'il y en a
            if (transitionResult.messages && transitionResult.messages.length > 0) {
                transitionResult.messages.forEach(message => {
                    handlers.addCombatMessage(message.text, message.type);
                });
            }
        }
    }
    
    // Retourner la scène suivante
    return choice.next;
};

/**
 * Obtient l'état du jeu pour le StoryService
 * @returns {Object} L'état du jeu formaté pour StoryService
 */
export const getGameStateForStory = () => {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    
    return {
        flags: gameStore.gameFlags,
        character: characterStore.playerCharacter,
        currentScene: gameStore.currentScene
    };
};

