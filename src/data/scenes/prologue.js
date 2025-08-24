/**
 * Scènes du Prologue - Nouveau format unifié
 * Première partie de l'aventure : Arrivée à Ravenscroft et découverte de l'héritage
 */

import { SCENE_TYPES } from '../../types/story';
import village from '../../assets/village-ravenscroft.jpg';
import tavernier from '../../assets/tom-aubergiste.jpg';
import tunnel from '../../assets/tunnels.jpg';
import carte from '../../assets/map-raven.jpg';
export const prologueScenes = {

  // ================================
  // PHASE 1 : ARRIVÉE À RAVENSCROFT
  // ================================

  "prologue_heritage": {
    id: 'prologue_heritage',
    type: SCENE_TYPES.TEXT,
    content: {
      title: '🗡️ L\'Héritage Maudit',
      text: `La lettre du notaire était arrivée un matin brumeux, portant le sceau de la famille que vous pensiez éteinte. "Vous êtes l'héritier légitime du domaine de Ravenscroft, dans les Terres de Vethkar", écrivait-il d'une plume tremblante.\nAprès des jours de voyage à travers des terres de plus en plus désolées, vous apercevez enfin les toits ardoisés du petit village. L'air porte une étrange lourdeur, et les corbeaux semblent plus nombreux qu'ils ne devraient.\nLes villageois vous regardent avec une méfiance palpable. Votre nom de famille provoque des murmures nerveux et des signes de protection. Vous comprenez rapidement que votre héritage n'est pas qu'une simple propriété... c'est un fardeau que porte votre lignée depuis des générations.\n**Vous êtes les derniers Gardiens de la Lame Éternelle.**`,

    },
    choices: [
      {
        text: 'Explorer le village',
        next: 'prologue_arrivee_village',
        consequences: { items: ["arccheat"] }
      }
    ]
  },

  "prologue_arrivee_village": {
    id: 'prologue_arrivee_village',
    type: SCENE_TYPES.INTERACTIVE,
    content: {
      title: 'Ravenscroft - Place du Village',
      text: `Le village de Ravenscroft s'étend devant vous, ses maisons de pierre sombre serrées autour d'une place centrale où trône un puits ancien. L'atmosphère est lourde de secrets non dits. Les villageois vaquent à leurs occupations en évitant votre regard. Vous pouvez explorer différents lieux pour rassembler des informations sur votre héritage et la mystérieuse Lame Éternelle.`,
      background: village
    },
    hotspots: [
      {
        id: 'taverne',
        coordinates: { x: 465, y: 318, width: 40, height: 64 },
        text: 'La Lanterne Vacillante',
        action: { type: 'scene_transition', next: 'prologue_taverne_entree', message: 'La taverne locale, cœur des ragots et rumeurs' }
      },
      {
        id: 'forge',
        coordinates: { x: 106, y: 396, width: 70, height: 100 },
        text: 'Forge de Maître Durgan',
        action: { type: 'scene_transition', next: 'prologue_forge_visite', message: 'La forge du village, où résonnent encore les échos du passé' }
      },
      {
        id: 'fermes',
        coordinates: { x: 800, y: 41, width: 91, height: 69 },
        text: 'Fermes Périphériques',
        action: { type: 'scene_transition', next: 'prologue_fermes_attaque', message: 'Les exploitations en bordure du village, récemment attaquées' }
      },
      {
        id: 'tunnels',
        coordinates: { x: 150, y: 0, width: 120, height: 85 },
        text: 'Entrée des Anciens Tunnels',
        action: { type: 'scene_transition', next: 'prologue_tunnels_decouverte', message: 'Des escaliers de pierre menant vers les profondeurs' }
      }
    ]
  },

  // ======================================
  // PHASE 2 : INVESTIGATION DES HOTSPOTS
  // ======================================

  // BRANCHE TAVERNE
  "prologue_taverne_entree": {
    id: 'prologue_taverne_entree',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'La Lanterne Vacillante',
      description: `La taverne baigne dans une atmosphère enfumée. Le tavernier, un homme bedonnant aux yeux méfiants, essuie machinalement un verre en vous observant. Quelques villageois interrompent leurs conversations pour vous dévisager.`,
      text: "Alors... vous seriez de la famille maudite ?",
      portrait: tavernier,
      speaker: 'tavernier',
    },
    metadata: {
      location: 'La Lanterne Vacillante - Ravenscroft',
    },

    choices: [
      {
        text: 'Je suis l\'héritier légitime de ce domaine.',
        next: 'prologue_taverne_villageois',
        consequences: { factionReputation: { ravenscroft: -5 } }
      },
      {
        text: 'Je préfère écouter ce que vous avez à dire.',
        next: 'prologue_taverne_villageois',
        consequences: { factionReputation: { ravenscroft: 5 } }
      },
      {
        text: 'Que pouvez-vous m\'offrir comme services ?',
        next: 'prologue_taverne_commerce'
      }


    ]
  },

  "prologue_taverne_villageois": {
    id: 'prologue_taverne_villageois',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Conversations de Taverne',
      description: `Les langues se délient peu à peu dans la taverne enfumée. Les villageois parlent à voix basse des attaques récentes et de la malédiction qui frappe la région.`,
      text: `Depuis que la Lame a disparu, les ombres se réveillent la nuit... Mon cousin a vu sa ferme attaquée il y a trois jours.`,
      speaker: 'villageois',
    },
    metadata: {
      location: 'La Lanterne Vacillante - Ravenscroft',
    },
    choices: [
      {
        text: 'Racontez-moi ces attaques en détail.',
        next: 'prologue_kael_apparition',
        consequences: { flags: { ombres_attacks: true } }
      },
      {
        text: 'Où était conservée cette Lame Éternelle ?',
        next: 'prologue_kael_apparition',
        consequences: { flags: { sanctuaire_location: true } }
      }
    ]
  },

  prologue_taverne_commerce: {
    id: 'prologue_taverne_commerce',
    type: SCENE_TYPES.MERCHANT,
    content: {
      title: 'Services de la Taverne',
      text: `Le tavernier propose ses services avec réticence. Les prix semblent gonflés, mais vous êtes nouveau dans la région.`
    },
    merchant: {
      name: 'Tavernier de la Lanterne',
      attitude: 'méfiant',
      items: [
        {
          id: 'chambre_nuit',
          name: 'Chambre pour la nuit',
          description: 'Un lit propre et un repas chaud',
          price: 25,
          type: 'service',
          effects: { health: 20, stamina: 50 }
        },
        {
          id: 'informations_locales',
          name: 'Informations sur la région',
          description: 'Le tavernier accepte de partager ce qu\'il sait... contre compensation',
          price: 50,
          type: 'service',
          effects: { flags: { region_map: true } }
        },
        {
          id: 'rations_voyage',
          name: 'Rations de voyage',
          description: 'Provisions pour plusieurs jours',
          price: 15,
          type: 'consumable',
          quantity: 3
        }
      ]
    },
    choices: [
      {
        text: 'Parler avec les autres clients',
        next: 'prologue_taverne_villageois'
      },
      {
        text: 'Quitter la taverne',
        next: 'prologue_arrivee_village'
      }
    ]
  },

  // BRANCHE FORGE
  "prologue_forge_visite": {
    id: 'prologue_forge_visite',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Forge de Maître Durgan',
      description: `La forge résonne de coups de marteau réguliers. Maître Durgan, un nain aux bras épais couverts de suie, vous accueille d'un grognement. Son regard s'attarde sur votre équipement avec l'œil expert d'un artisan.`,
      text: `Alors, l'héritier revient... J'ai connu votre grand-père. Un homme bien, lui. Il venait souvent ici pour entretenir... certaines choses.`,
      speaker: 'durgan',
    },
    metadata: {
      location: 'Forge de Maître Durgan - Ravenscroft',
    },
    choices: [
      {
        text: 'Quelles choses entretenait-il ici ?',
        next: 'prologue_forge_tunnels'
      },
      {
        text: 'Pourriez-vous examiner mon équipement ?',
        next: 'prologue_forge_equipement'
      },
      {
        text: 'Que savez-vous de la Lame Éternelle ?',
        next: 'prologue_forge_tunnels',
        consequences: { flags: { lame_histoire: true } }
      }
    ]
  },

  "prologue_forge_tunnels": {
    id: 'prologue_forge_tunnels',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Secrets de la Forge',
      description: `Durgan baisse la voix et jette des regards autour de lui avant de parler. L'ambiance de la forge semble soudain plus lourde.`,
      text: `Les tunnels sous le village... ils mènent au sanctuaire de votre famille. Votre grand-père m'avait donné une clé, au cas où. Mais attention, gamin... ces tunnels ne sont plus sûrs depuis des années.`,
      speaker: 'durgan',
    },
    metadata: {
      location: 'Forge de Maître Durgan - Ravenscroft',
    },
    choices: [
      {
        text: 'Donnez-moi cette clé.',
        next: 'prologue_kael_apparition',
        consequences: {
          items: { cle_sanctuaire: 1 },
          flags: { tunnel_access: true }
        }
      },
      {
        text: 'Que voulez-vous dire par "plus sûrs" ?',
        next: 'prologue_kael_apparition',
        consequences: { flags: { tunnel_danger: true } }
      }
    ]
  },

  prologue_forge_equipement: {
    id: 'prologue_forge_equipement',
    type: SCENE_TYPES.MERCHANT,
    content: {
      title: 'Équipement de Durgan',
      text: "Le forgeron examine votre matériel avec attention. Son atelier regorge d'armes et d'armures de qualité."
    },
    shop: {
      currency: 'gold',
      reputation_discount: {}, // tu peux mettre par exemple { blacksmith: 10 } si tu veux un bonus de réputation
      inventory: [
        {
          id: 'epee_renforcee',
          name: 'Épée Renforcée',
          description: 'Une lame bien équilibrée, forgée avec soin',
          price: 200,
          stock:1,
          type: 'weapon',
          damage:{ dice: '1d8', bonus: 2 }
        },
        {
          id: 'armure_cuir_cloute',
          name: 'Armure de Cuir Clouté',
          description: 'Protection légère mais efficace',
          price: 150,
          type: 'armor',
          stats: { defense: 8, agility: -1 }
        },
        {
          id: 'reparation_equipement',
          name: "Réparation d'équipement",
          description: 'Durgan remet en état votre matériel',
          price: 30,
          type: 'service',
          effects: { repair_all: true }
        },
        {
          id: 'lanterne_forge',
          name: 'Lanterne de Forge',
          description: 'Éclaire les tunnels les plus sombres',
          price: 40,
          type: 'tool',
          effects: { light_radius: 10 }
        }
      ]
    },
    choices: [
      {
        text: 'Acheter de l\'équipement',
        action: {
          type: 'openShop',
        }

      },

      {
        text: 'Lui parler des tunnels',
        next: 'prologue_forge_tunnels'
      },
      {
        text: 'Quitter la forge',
        next: 'prologue_arrivee_village'
      }
    ],
    metadata: {
      chapter: 'Prologue',
      location: 'Forge de Durgan',
      tags: ['shop', 'equipment'],
      character: 'Maître Durgan'
    }
  }
  ,

  // BRANCHE FERMES
  prologue_fermes_attaque: {
    id: 'prologue_fermes_attaque',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Fermes Dévastées',
      text: `En vous approchant des fermes périphériques, l'air devient plus lourd. Des traces de lutte sont visibles : clôtures brisées, animaux disparus, et cette étrange brume noirâtre qui semble s'accrocher au sol. La ferme la plus proche montre des signes d'attaque récente. Les volets sont arrachés, et d'étranges marques sombres maculent les murs de pierre. Un fermier épuisé tente de réparer sa barrière avec des planches de fortune.`
    },
    choices: [
      {
        text: 'Approcher le fermier pour l\'aider',
        next: 'prologue_combat_ombres',
        consequences: { factionReputation: { fermiers: 10 }, companions: ["rhingann"] }
      },
      {
        text: 'Examiner les traces d\'attaque',
        next: 'prologue_combat_ombres',
        consequences: { flags: { ombres_traces: true } }
      },
      {
        text: 'Retourner au village',
        next: 'prologue_arrivee_village'
      }
    ]
  },

  prologue_combat_ombres: {
    id: 'prologue_combat_ombres',
    type: SCENE_TYPES.COMBAT,
    content: {
      title: 'Attaque des Ombres',
      text: `Soudain, la brume noirâtre se condense et prend forme. Trois silhouettes sombres aux yeux rougeoyants émergent, leurs griffes acérées tendues vers vous !`,
      ambush: false
    },
    enemies: [
      { type: 'gobelin', count: 2 }
    ],
    enemyPositions: [
      { x: 2, y: 1 },
      { x: 4, y: 2 },
      // { x: 1, y: 4 }
    ],
    choices: [
      {
        text: 'Se défendre contre les ombres',
      },
    ],
    playerPosition: { x: 6, y: 3 },
    onVictory: {
      text: 'Continuer après le combat',
      next: 'prologue_kael_apparition',
      consequences: {
        experience: 150,
        items: { essence_ombre: 3 },
        flags: { ombres_weakness: true }
      }
    }
  },

  // BRANCHE TUNNELS
  prologue_tunnels_decouverte: {
    id: 'prologue_tunnels_decouverte',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'L\'Entrée des Anciens Tunnels',
      text: `Des marches de pierre ancestrale descendent dans l'obscurité. L'entrée du tunnel est partiellement dissimulée par des ronces et des pierres éboulées, mais un passage reste praticable. L'air qui remonte des profondeurs porte une odeur de renfermé et quelque chose d'autre... une essence magique résiduelle qui fait frissonner votre peau. Des symboles runiques à demi-effacés ornent l'encadrement de pierre.`
    },
    choices: [
      {
        text: 'Descendre dans les tunnels',
        next: 'prologue_tunnels_exploration',
        condition: 'items.lanterne_forge > 0',
        conditionText: 'Nécessite une source de lumière'
      },
      {
        text: 'Examiner les runes de l\'entrée',
        next: 'prologue_tunnels_exploration',
        consequences: { flags: { runes_gardiens: true } }
      },
      {
        text: 'Revenir au village chercher de l\'équipement',
        next: 'prologue_arrivee_village'
      }
    ]
  },

  prologue_tunnels_exploration: {
    id: 'prologue_tunnels_exploration',
    type: SCENE_TYPES.INTERACTIVE,
    content: {
      title: 'Tunnels Souterrains',
      text: `Les tunnels s'étendent dans plusieurs directions. Votre lumière révèle des passages taillés avec précision, témoins d'un savoir-faire ancien. Des embranchements mènent vers différentes sections du réseau souterrain.`,
      background: tunnel
    },
    hotspots: [
      {
        id: 'sanctuaire_direction',
        coordinates: { x: 433, y: 214, width: 100, height: 132 },
        text: 'Passage vers le Sanctuaire',
        condition: 'items.cle_sanctuaire > 0',
        action: {
          type: 'scene_transition',
          next: 'prologue_kael_apparition',
          message: 'Un tunnel principal orné de symboles familiaux (Passage verrouillé - nécessite une clé)'
        }
      },
      {
        id: 'cryptes_anciennes',
        coordinates: { x: 127, y: 200, width: 96, height: 151 },
        text: 'Cryptes Familiales',
        action: {
          type: 'scene_transition',
          next: 'prologue_kael_apparition',
          message: 'Des sépultures de vos ancêtres Gardiens',
          consequences: { flags: { ancetres_gardiens: true } }
        }
      },
      {
        id: 'salle_armes',
        coordinates: { x: 732, y: 200, width: 96, height: 151 },
        text: 'Ancienne Salle d\'Armes',
        action: {
          type: 'scene_transition',
          next: 'prologue_kael_apparition',
          message: 'Un arsenal abandonné mais peut-être pas vide',
          consequences: {
            items: { epee_gardien_ancienne: 1 },
            flags: { armement_gardiens: true }
          }
        }
      }
    ]
  },

  // ========================================
  // PHASE 3 : RENCONTRE AVEC KAEL (CONVERGENCE)
  // ========================================

  prologue_kael_apparition: {
    id: 'prologue_kael_apparition',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'L\'Apparition du Rôdeur',
      text: `Une silhouette émerge des ombres avec une grâce féline. Un elfe aux cheveux sombres, vêtu de cuir et portant un arc de guerre dans le dos, s'avance vers vous. Ses yeux perçants vous évaluent avec l'expérience d'un chasseur chevronné."Je vous observais depuis votre arrivée", dit-il d'une voix calme mais ferme. "Je suis Kael, et je traque ces créatures d'ombre depuis des mois. Vous êtes bien l'héritier des Gardiens, n'est-ce pas ?" Son regard se pose sur vous avec un mélange de curiosité et d'urgence. "Le phénomène s'étend bien au-delà de ce village. Nous avons peu de temps."`,
    },
    choices: [
      {
        text: 'Écouter ce qu\'il a à dire',
        next: 'prologue_kael_dialogue'
      }
    ]
  },

  "prologue_kael_dialogue": {
    id: 'prologue_kael_dialogue',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Révélations de Kael',
      description: `Kael s'appuie contre un mur de pierre, son arc toujours à portée de main. Son expression est grave et ses yeux scrutent l'horizon.`,
      text: `Les incursions d'ombres ne se limitent pas à Ravenscroft. J'ai parcouru trois provinces, et partout c'est la même histoire : des créatures d'outre-monde qui se manifestent là où la Lame Éternelle n'est plus pour les contenir.`,
      speaker: 'kael',
    },
    metadata: {
      location: 'Aux abords de Ravenscroft',
    },
    choices: [
      {
        text: 'Que savez-vous de la disparition de la Lame ?',
        next: 'prologue_alliance_choix',
        consequences: { flags: { lame_disparition: true } }
      },
      {
        text: 'Pourquoi m\'aider ? Que gagnez-vous à cela ?',
        next: 'prologue_alliance_choix',
        consequences: { flags: { kael_motivation: true } }
      },
      {
        text: 'Ces créatures peuvent-elles être arrêtées définitivement ?',
        next: 'prologue_alliance_choix',
        consequences: { flags: { ombres_arret: true } }
      }
    ]
  },

  "prologue_alliance_choix": {
    id: 'prologue_alliance_choix',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Proposition d\'Alliance',
      description: `Kael vous fixe intensément, attendant votre réponse. Le vent fait claquer sa cape sombre et l'atmosphère devient plus tendue.`,
      text: `Je propose que nous unissions nos forces. Vous connaissez l'héritage de votre famille, moi je connais les tactiques de ces créatures. Ensemble, nous avons une chance de retrouver la Lame et de fermer définitivement ces brèches.`,
      speaker: 'kael',
    },
    metadata: {
      location: 'Aux abords de Ravenscroft',
    },
    choices: [
      {
        text: 'J\'accepte votre alliance. Travaillons ensemble.',
        next: 'prologue_alliance_strategie',
        consequences: {
          companions: ['kael'],
          reputation: 20,
          flags: { alliance_kael: true, npcRelations: { kael: 5 } }
        }
      },
      {
        text: 'Non merci. Je préfère agir seul.',
        next: 'prologue_solo_preparation',
        consequences: {
          reputation: -10,
          flags: { refus_alliance: true, npcRelations: { kael: 5 } }
        }
      }
    ]
  },

  // ========================================
  // PHASE 4 : STRATÉGIE ET PRÉPARATION
  // ========================================

  prologue_alliance_strategie: {
    id: 'prologue_alliance_strategie',
    type: SCENE_TYPES.REST_LONG,
    content: {
      title: 'Planification Stratégique',
      text: `Kael vous emmène vers un ancien campement qu'il a établi en bordure du village. Autour d'un feu de camp, vous étalez des cartes de la région et discutez de stratégie."Nous avons plusieurs pistes à explorer", explique Kael en pointant différents lieux sur la carte. "Le sanctuaire familial est notre priorité, mais il faut aussi considérer les autres manifestations dans la région."Cette planification minutieuse vous permet de récupérer vos forces et d'acquérir de nouvelles perspectives tactiques.`,
    },

    choices: [
      {
        text: 'Étudier la carte de la région',
        next: 'prologue_carte_region',
        consequences: { flags: { region_complete: true } }
      }
    ]
  },



  prologue_solo_preparation: {
    id: 'prologue_solo_preparation',
    type: SCENE_TYPES.REST_SHORT,
    content: {
      title: 'Préparation Solitaire',
      text: `Kael hoche la tête avec une expression indéchiffrable. "Comme vous voulez. Mais sachez que mon offre reste ouverte si vous changez d'avis."Il disparaît dans les ombres aussi silencieusement qu'il était apparu. Vous vous retrouvez seul avec vos pensées et devez planifier votre prochaine étape en comptant uniquement sur vos propres ressources.`,
    },

    choices: [
      {
        text: 'Étudier vos options seul',
        next: 'prologue_carte_region',
        consequences: { flags: { region_limited: true } }
      }
    ]
  },

  // ========================================
  // PHASE 5 : EXPLORATION AVANCÉE DE LA RÉGION
  // ========================================

  prologue_carte_region: {
    id: 'prologue_carte_region',
    type: SCENE_TYPES.INTERACTIVE,
    content: {
      title: 'Terres de Vethkar - Carte Régionale',
      text: `La carte révèle l'étendue de la corruption qui ronge la région. Des zones marquées en rouge indiquent les manifestations d'ombres les plus importantes. Plusieurs lieux d'intérêt émergent de votre analyse.`,
      variations: {
        alliance_complete: `La carte révèle l'étendue de la corruption qui ronge la région. Des zones marquées en rouge indiquent les manifestations d'ombres les plus importantes. Plusieurs lieux d'intérêt émergent de votre analyse. Kael pointe du doigt les emplacements stratégiques : "Nous devons établir des priorités. Chaque lieu exploré nous rapprochera de la vérité."`,
        solo: `Sans les connaissances approfondies de Kael, vous devez vous fier à votre intuition et aux informations limitées dont vous disposez. La carte montre plusieurs lieux, mais vous ne pouvez pas tous les explorer immédiatement. Votre approche solitaire vous impose de choisir plus prudemment vos objectifs.`
      },
      background: carte
    },
    conditions: {
      show_variation: {
        alliance_complete: "gameFlags.alliance_kael === true",
        solo: "gameFlags.refus_alliance === true"
      }
    },
    hotspots: [
      {
        id: 'sanctuaire_familial',
        coordinates: { x: 63, y: 212, width: 119, height: 116 },
        text: 'Sanctuaire Familial',
        action: {
          type: 'scene_transition',
          next: 'prologue_sanctuaire_approche',
          message: 'Le cœur de votre héritage, où était gardée la Lame Éternelle',
          consequences: { flags: { priority_sanctuaire: true } }
        }
      },
      {
        id: 'nids_ombres',
        coordinates: { x: 300, y: 20, width: 250, height: 145 },
        text: 'Nids d\'Ombres',
        condition: "!gameFlags.refus_alliance",
        action: {
          type: 'scene_transition',
          next: 'prologue_nids_reconnaissance',
          message: 'Concentrations anormales de créatures dans la forêt sombre',
          consequences: { flags: { priority_nids: true } }
        }
      },
      {
        id: 'camp_refugies',
        coordinates: { x: 633, y: 167, width: 205, height: 129 },
        text: 'Camp de Réfugiés',
        condition: "!gameFlags.refus_alliance",
        action: {
          type: 'scene_transition',
          next: 'prologue_refugies_aide',
          message: 'Des survivants rassemblés près des ruines d\'un ancien fort',
          consequences: { flags: { priority_refugies: true } }
        }
      },
      {
        id: 'tour_mage',
        coordinates: { x: 100, y: 30, width: 80, height: 160 },
        text: 'Tour du Mage Érudit',
        condition: "!gameFlags.refus_alliance",
        action: {
          type: 'scene_transition',
          next: 'prologue_mage_consultation',
          message: 'Une tour isolée où vit un sage qui étudie les phénomènes magiques',
          consequences: { flags: { priority_mage: true } }
        }
      },
      {
        id: 'pont_dragon',
        coordinates: { x: 265, y: 200, width: 85, height: 60 },
        text: 'Pont du Dragon Endormi',
        condition: "!gameFlags.refus_alliance",
        action: {
          type: 'scene_transition',
          next: 'prologue_pont_passage',
          message: 'Un passage stratégique gardé par des créatures corrompues',
          consequences: { flags: { priority_pont: true } }
        }
      },
      {
        id: 'village_proche',
        coordinates: { x: 633, y: 297, width: 205, height: 130 },
        text: 'Village Voisin',
        condition: "gameFlags.refus_alliance === true",
        action: {
          type: 'scene_transition',
          next: 'prologue_village_voisin',
          message: 'Un autre petit village qui pourrait avoir des informations',
          consequences: { flags: { priority_village: true } }
        }
      },
      {
        id: 'ruines_visibles',
        coordinates: { x: 285, y: 300, width: 324, height: 160 },
        text: 'Ruines Visibles',
        condition: "gameFlags.refus_alliance === true",
        action: {
          type: 'scene_transition',
          next: 'prologue_ruines_exploration',
          message: 'Des structures en ruines visibles depuis les hauteurs',
          consequences: { flags: { priority_ruines: true } }
        }
      }
    ]
  },


  // DESTINATIONS FINALES (Transitions vers l'acte suivant)

  prologue_sanctuaire_approche: {
    id: 'prologue_sanctuaire_approche',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Approche du Sanctuaire Familial',
      text: `Le sanctuaire se dresse devant vous, ancienne forteresse de pierre blanche nichée dans une clairière protégée par des cercles de runes. Mais quelque chose cloche : une brume violacée émane de l'édifice, et les runes protectrices semblent ternies.Des silhouettes sombres patrouillent autour du périmètre. Il est clair que le sanctuaire a été compromis. L'air vibre d'une énergie malveillante qui fait dresser les cheveux sur vos bras.**Le prologue touche à sa fin. Votre véritable aventure va commencer...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : La Reconquête',
        next: 'acte1_debut',
        consequences: {

          flags: { sanctuaire_corrompu: true, prologue_complete: true }
        }
      }
    ]
  },

  prologue_nids_reconnaissance: {
    id: 'prologue_nids_reconnaissance',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Reconnaissance des Nids d\'Ombres',
      text: `La forêt sombre grouille d'activité malveillante. Depuis votre poste d'observation, vous distinguez des structures organiques pulsantes, comme des cocons géants d'où émergent régulièrement de nouvelles créatures d'ombre. Ces nids semblent se multiplier et s'étendre. Une odeur putride flotte dans l'air, et vous entendez des murmures dans une langue qui glace le sang. **Ce lieu sera crucial pour votre quête future...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : La Menace Grandissante',
        next: 'acte1_nids_debut',
        consequences: {

          flags: { nids_localises: true, prologue_complete: true }
        }
      }
    ]
  },

  prologue_refugies_aide: {
    id: 'prologue_refugies_aide',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Camp de Réfugiés',
      text: `Le camp provisoire abrite une cinquantaine de survivants : fermiers, artisans, et même quelques soldats en déroute. Leurs visages portent les stigmates de la peur et du désespoir.Une femme aux cheveux grisonnants, qui semble diriger le groupe, s'approche de vous. "Êtes-vous venu nous aider, ou simplement observer notre misère ?" Sa voix porte à la fois de l'espoir et de l'amertume. **Ces gens comptent sur vous...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : Le Poids de la Responsabilité',
        next: 'acte1_refugies_debut',
        consequences: {

          flags: { refugies_rencontres: true, prologue_complete: true },
          factionReputation: { refugies: 10 }
        }
      }
    ]
  },

  prologue_mage_consultation: {
    id: 'prologue_mage_consultation',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Tour du Mage Érudit',
      text: `La tour s'élève vers les nuages, ses pierres gravées de formules complexes qui semblent bouger sous votre regard. Un vieil homme à la barbe argentée vous accueille, ses yeux perçants brillant d'une intelligence aiguë. "Ah, l'héritier des Gardiens... Je vous attendais. Les signes étaient clairs." Il gesticule vers des parchemins couverts de calculs mystérieux. "La situation est plus grave que vous ne l'imaginez." **De nouvelles révélations vous attendent...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : Les Révélations du Sage',
        next: 'acte1_mage_debut',
        consequences: {

          flags: { mage_rencontre: true, prologue_complete: true },
          factionReputation: { erudits: 15 }
        }
      }
    ]
  },

  prologue_pont_passage: {
    id: 'prologue_pont_passage',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Pont du Dragon Endormi',
      text: `L'ancien pont de pierre enjambe un gouffre vertigineux. Selon les légendes, un dragon y dormirait depuis des siècles, mais aujourd'hui seules des créatures corrompues gardent le passage. Au-delà du pont, vous apercevez des terres inexplorées où la corruption semble moins dense. Ce passage pourrait être la clé pour atteindre des régions encore préservées. **Un défi majeur vous attend...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : Le Passage Périlleux',
        next: 'acte1_pont_debut',
        consequences: {

          flags: { pont_strategique: true, prologue_complete: true }
        }
      }
    ]
  },

  // BRANCHES SOLO SUPPLÉMENTAIRES

  prologue_village_voisin: {
    id: 'prologue_village_voisin',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Village Voisin Abandonné',
      text: `Le village que vous découvrez est un spectacle désolant : maisons aux volets clos, rues désertes, et cette même brume sinistre que vous avez observée ailleurs. Seuls quelques habitants âgés osent encore sortir en plein jour. Leur méfiance envers les étrangers est palpable, mais ils pourraient détenir des informations précieuses sur la progression de la corruption. **Votre approche solitaire trouve ici ses premières épreuves...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : L\'Isolement du Héros',
        next: 'acte1_solo_debut',
        consequences: {

          flags: { village_abandon: true, prologue_complete: true }
        }
      }
    ]
  },

  prologue_ruines_exploration: {
    id: 'prologue_ruines_exploration',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Ruines Mystérieuses',
      text: `Les ruines révèlent les vestiges d'une civilisation ancienne, antérieure même à votre lignée de Gardiens. Des symboles étranges ornent les pierres, et une énergie résiduelle semble encore émaner des structures effondrées. Ces découvertes soulèvent plus de questions qu'elles n'apportent de réponses. Votre héritage familial ne serait-il qu'un chapitre d'une histoire bien plus vaste ? **Les mystères du passé se révèlent...**`,
    },
    choices: [
      {
        text: 'Continuer vers l\'Acte I : Les Secrets Anciens',
        next: 'acte1_ruines_debut',
        consequences: {

          flags: { ruines_anciennes: true, prologue_complete: true },
          items: { artefact_ancien: 1 }
        }
      }
    ]
  }

};

export default prologueScenes;