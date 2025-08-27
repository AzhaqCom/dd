/**
 * Scènes de test pour la génération procédurale
 * Ces scènes permettent de valider le système procédural depuis le jeu
 */

import { SCENE_TYPES, PROCEDURAL_TYPES } from '../../types/story.js';

export const testProceduralScenes = {
  // Scène d'entrée pour tester la génération procédurale
  test_procedural_entry: {
    id: 'test_procedural_entry',
    type: SCENE_TYPES.TEXT,
    content: {
      title: '🎲 Test de Génération Procédurale',
      text: `Vous vous tenez à la lisière d'une zone de test mystérieuse. 
      
      Cette zone utilise la génération procédurale pour créer du contenu dynamique basé sur des templates et votre niveau.
      
      Différents biomes et types de rencontres sont disponibles pour validation du système.`
    },
    choices: [
      {
        text: '🌲 Tester une forêt procédurale (social)',
        next: 'forest_encounter_social'       // Template direct existant
      }

    ],
    metadata: {
      chapter: 'test',
      location: 'test_zone',
      tags: ['procedural', 'test', 'dev'],
      environment: 'test'
    }
  },

  // Scène pour revenir après test
  test_procedural_return: {
    id: 'test_procedural_return',
    type: SCENE_TYPES.TEXT,
    content: {
      title: '✅ Test Terminé',
      text: 'Vous avez terminé le test de génération procédurale. Les logs de la console contiennent des informations détaillées sur la génération.'
    },
    choices: [
      {
        text: '🔄 Faire un autre test',
        next: 'test_procedural_entry'
      },
      {
        text: '↩️ Retour au prologue',
        next: 'prologue_heritage'
      }
    ],
    metadata: {
      chapter: 'test',
      location: 'test_zone',
      tags: ['procedural', 'test', 'return']
    }
  },

  // Scène de continuation universelle pour les tests
  continue_journey: {
    id: 'continue_journey',
    type: SCENE_TYPES.TEXT,
    content: {
      title: '🛤️ Continuation du Voyage',
      text: 'Vous continuez votre périple, enrichi par cette expérience procédurale.'
    },
    choices: [
      {
        text: '🔄 Nouveau test procédural',
        next: 'test_procedural_entry'
      },
      {
        text: '✅ Terminer les tests',
        next: 'test_procedural_return'
      }
    ],
    metadata: {
      chapter: 'test',
      location: 'journey',
      tags: ['procedural', 'continuation']
    }
  },

  // ✅ TOUTES LES SCÈNES D'ACTION SONT MAINTENANT GÉNÉRÉES PROCÉDURALEMENT
  // Plus besoin de scènes manuelles - ProceduralGenerator s'occupe de tout !
};

export default testProceduralScenes;