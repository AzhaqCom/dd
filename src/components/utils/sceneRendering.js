/**
 * Utilitaires pour le rendu des scènes - Refactorisation d'App.jsx
 * Gère le rendu des différents types de scènes au nouveau format uniquement
 */

import { SCENE_TYPES } from '../../types/story';

/**
 * Crée une scène de repos virtuelle pour l'intégration dans le nouveau système
 */
export const createVirtualRestScene = (restType, nextScene) => {
    const sceneType = restType === 'long' ? SCENE_TYPES.REST_LONG : SCENE_TYPES.REST_SHORT;
    
    return {
        metadata: { 
            type: sceneType, 
            title: restType === 'long' ? "Repos long" : "Repos court" 
        },
        choices: { next: nextScene }
    };
};


/**
 * Détermine les classes CSS pour les différents conteneurs selon l'état du jeu
 */
export const getContainerClasses = (currentScene) => {
    // currentScene est maintenant toujours une string (ID de scène)
    // Les classes de combat sont gérées directement par les composants de combat
    return {
        container: 'game-container',
        mainContent: 'main-content',
        sidebar: 'sidebar'
    };
};