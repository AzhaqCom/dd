/**
 * Utilitaires pour le rendu des scènes - Refactorisation d'App.jsx
 * Gère le rendu des différents types de scènes au nouveau format uniquement
 */

import { SCENE_TYPES } from '../../types/story';

/**
 * Crée une scène de repos virtuelle pour l'intégration dans le nouveau système
 */
export const createVirtualRestScene = (restType, nextScene) => {
    if (restType === 'choice') {
        // Créer une scène de choix de repos
        return {
            id: 'virtual_rest_choice',
            type: SCENE_TYPES.REST_CHOICE,
            content: {
                title: '🏕️ Options de Repos',
                text: 'Choisissez votre type de repos selon vos besoins et la sécurité du lieu.',
            },
            metadata: {
                chapter: 'system',
                location: 'Repos temporaire',
                environment: 'virtual',
                safety: 3, // Sécurité moyenne par défaut
                restAvailability: {
                    short: true,
                    long: true,
                    restrictions: []
                }
            },
            choices: [
                {
                    text: '💤 Repos Court (1h)',
                    description: 'Récupère une partie des points de vie via les dés de vie',
                    restType: 'short',
                    next: nextScene
                },
                {
                    text: '🛌 Repos Long (8h)',
                    description: 'Récupération complète des points de vie, sorts et dés de vie',
                    restType: 'long', 
                    next: nextScene
                }
            ]
        };
    } else {
        // Repos spécifique (legacy)
        const sceneType = restType === 'long' ? SCENE_TYPES.REST_LONG : SCENE_TYPES.REST_SHORT;
        
        return {
            metadata: { 
                type: sceneType, 
                title: restType === 'long' ? "Repos long" : "Repos court" 
            },
            choices: { next: nextScene }
        };
    }
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