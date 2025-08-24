/**
 * Scènes de l'Acte I - Les Héritiers de la Lame Éternelle
 * Phase de contextualisation et convergence narrative
 */

import { SCENE_TYPES } from '../../types/story';

export const acte1Scenes = {

  // ================================
  // BRANCHE 1 : SANCTUAIRE (Route principale)
  // ================================

  "acte1_debut": {
    id: 'acte1_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - La Reconquête',
      text: 'Le sanctuaire corrompu se dresse devant vous comme une blessure dans le paysage. Les runes protectrices qui ornaient jadis ses murs pulsent d\'une lueur violacée malsaine. Des créatures d\'ombre patrouillent le périmètre avec une organisation troublante. {{SITUATION_KAEL}} La corruption semble émaner du cœur même du sanctuaire. Votre héritage vous appelle, mais le danger est palpable.',
      placeholders: {
        SITUATION_KAEL: {
          avec_kael: 'Kael observe la situation à vos côtés, son arc prêt.',
          seul: 'Seul face à cette menace, vous devez faire preuve de prudence.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        SITUATION_KAEL: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Observer les patrouilles d\'ombres',
        next: 'acte1_sanctuaire_reconnaissance',
        consequences: { flags: { tactique_observation: true } }
      },
      {
        text: 'Chercher une entrée dérobée',
        next: 'acte1_sanctuaire_infiltration',
        consequences: { flags: { tactique_infiltration: true } }
      }
    ]
  },

  "acte1_sanctuaire_reconnaissance": {
    id: 'acte1_sanctuaire_reconnaissance',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Reconnaissance du Sanctuaire',
      text: 'Depuis votre poste d\'observation, vous étudiez les mouvements des créatures. Elles suivent des patterns précis, comme si elles étaient dirigées par une intelligence supérieure. Les ombres ne se contentent plus d\'attaquer au hasard - elles gardent quelque chose de précieux. {{OBSERVATION_KAEL}}',
      placeholders: {
        OBSERVATION_KAEL: {
          avec_kael: '"Ces créatures sont organisées", murmure Kael. "Quelqu\'un les commande depuis l\'intérieur."',
          seul: 'Une réalisation troublante s\'impose : ces créatures protègent activement le sanctuaire.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        OBSERVATION_KAEL: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Tenter une approche furtive',
        next: 'acte1_convergence_investigation',
        consequences: { flags: { approche_furtive: true } }
      },
      {
        text: 'Préparer un assaut direct',
        next: 'acte1_convergence_action',
        consequences: { flags: { approche_directe: true } }
      }
    ]
  },

  "acte1_sanctuaire_infiltration": {
    id: 'acte1_sanctuaire_infiltration',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Infiltration du Sanctuaire',
      text: 'Contournant les patrouilles principales, vous découvrez une brèche dans les fondations du sanctuaire. L\'air qui s\'en échappe porte une odeur de magie corrompue. Des symboles runiques gravés autour de l\'ouverture semblent résister encore à la corruption. {{RUNES_ANALYSE}}',
      placeholders: {
        RUNES_ANALYSE: {
          avec_kael: 'Kael examine les runes avec attention. "Ces symboles... ils racontent l\'histoire de votre famille. Votre grand-père a laissé des indices."',
          seul: 'Vos connaissances familiales vous permettent de reconnaître quelques symboles. Votre grand-père était-il venu ici ?'
        }
      }
    },
    conditions: {
      show_placeholder: {
        RUNES_ANALYSE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Étudier les runes de près',
        next: 'acte1_convergence_investigation',
        consequences: { flags: { runes_indices: true } }
      },
      {
        text: 'S\'infiltrer immédiatement',
        next: 'acte1_convergence_action',
        consequences: { flags: { infiltration_rapide: true } }
      }
    ]
  },

  // ================================
  // BRANCHE 2 : NIDS D'OMBRES (Action)
  // ================================

  "acte1_nids_debut": {
    id: 'acte1_nids_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - La Menace Grandissante',
      text: 'La forêt grouille d\'une activité malveillante. Les nids d\'ombres pulsent comme des cœurs organiques, expulsant régulièrement de nouvelles créatures dans la nature. L\'air est lourd d\'une puanteur de corruption. {{ANALYSE_MENACE}} Des cris lointains suggèrent que d\'autres survivants sont en danger.',
      placeholders: {
        ANALYSE_MENACE: {
          avec_kael: 'Kael étudie les mouvements avec l\'œil d\'un chasseur expérimenté. "Ces nids se multiplient. Bientôt, ils submergeront toute la région."',
          seul: 'Face à cette menace grandissante, vous réalisez l\'urgence de la situation. Chaque minute compte.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        ANALYSE_MENACE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Attaquer immédiatement les nids',
        next: 'acte1_nids_assault',
        consequences: { flags: { assault_direct: true } }
      },
      {
        text: 'Sauver les survivants d\'abord',
        next: 'acte1_nids_sauvetage',
        consequences: { flags: { priorite_sauvetage: true } }
      }
    ]
  },

  "acte1_nids_assault": {
    id: 'acte1_nids_assault',
    type: SCENE_TYPES.COMBAT,
    content: {
      title: 'Assaut sur les Nids',
      text: `Vous vous lancez dans un assaut direct contre les structures pulsantes. Les nids réagissent violemment, libérant des nuées de créatures pour vous arrêter !`
    },
    enemies: [
      { type: 'molosse_ombre', count: 2 },
      { type: 'ombre', count: 4 }
    ],
    enemyPositions: [
      { x: 2, y: 2 }, { x: 6, y: 2 },
      { x: 1, y: 4 }, { x: 3, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 }
    ],
     choices: [
        {
        text: 'Attaquer les créatures',
      },
    ],
    playerPosition: { x: 4, y: 5 },
    onVictory: {
      text: 'Poursuivre l\'offensive',
      next: 'acte1_convergence_action',
      consequences: {
        experience: 200,
        flags: { nids_endommages: true },
        factionReputation: { ombres: -10 }
      }
    }
  },

  "acte1_nids_sauvetage": {
    id: 'acte1_nids_sauvetage',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Sauvetage des Survivants',
      text: 'Ignorant temporairement les nids, vous vous dirigez vers les cris de détresse. Vous découvrez un groupe de bûcherons pris au piège par des créatures d\'ombre. Leur chef, un homme robuste aux vêtements déchirés, tente désespérément de protéger ses hommes. {{INTERVENTION_KAEL}}',
      placeholders: {
        INTERVENTION_KAEL: {
          avec_kael: 'Kael se positionne déjà pour couvrir votre intervention. "Sauvons-les d\'abord, nous nous occuperons des nids ensuite."',
          seul: 'Seul face à cette situation, vous devez choisir votre approche avec soin.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        INTERVENTION_KAEL: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Créer une distraction pour les faire fuir',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { bucherons_sauves: true },
          factionReputation: { survivants: 15 }
        }
      },
      {
        text: 'Charger pour briser l\'encerclement',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { bucherons_sauves: true, intervention_heroique: true },
          factionReputation: { survivants: 20 }
        }
      }
    ]
  },

  // ================================
  // BRANCHE 3 : CAMP DE RÉFUGIÉS (Responsabilité)
  // ================================

  "acte1_refugies_debut": {
    id: 'acte1_refugies_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - Le Poids de la Responsabilité',
      text: 'Le camp de réfugiés offre un spectacle déchirant. Des familles entières ont tout perdu, leurs biens rassemblés dans quelques ballots dérisoires. La dirigeante du camp, Dame Lyanna, vous accueille avec un mélange d\'espoir et d\'épuisement. {{REFLEXION_SITUATION}} Les ressources s\'amenuisent et des tensions apparaissent.',
      placeholders: {
        REFLEXION_SITUATION: {
          avec_kael: 'Kael observe la détresse des réfugiés avec compassion. "Ces gens ont besoin d\'aide immédiate, mais aussi d\'un avenir."',
          seul: 'Face à tant de souffrance, le poids de votre héritage se fait plus lourd. Ces gens comptent sur vous.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        REFLEXION_SITUATION: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Organiser la défense du camp',
        next: 'acte1_refugies_defense',
        consequences: { flags: { defense_camp: true } }
      },
      {
        text: 'Enquêter sur l\'origine de leur fuite',
        next: 'acte1_refugies_enquete',
        consequences: { flags: { enquete_fuite: true } }
      }
    ]
  },

  "acte1_refugies_defense": {
    id: 'acte1_refugies_defense',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Organisation de la Défense',
      text: 'Vous rassemblez les hommes valides pour organiser la défense du camp. Dame Lyanna vous présente les anciens soldats parmi les réfugiés - des vétérans marqués par les récents combats mais encore déterminés. Ensemble, vous établissez un périmètre de sécurité. {{EXPERTISE_DEFENSE}}',
      placeholders: {
        EXPERTISE_DEFENSE: {
          avec_kael: 'Kael partage son expertise tactique avec les défenseurs. Son expérience est précieuse pour coordonner la défense.',
          seul: 'Votre leadership naturel inspire confiance aux réfugiés. Ils semblent reprendre espoir.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        EXPERTISE_DEFENSE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Se concentrer sur la formation des milices',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { milice_formee: true },
          factionReputation: { refugies: 20 }
        }
      },
      {
        text: 'Étudier les témoignages sur les attaques',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { temoignages_recueillis: true },
          factionReputation: { refugies: 15 }
        }
      }
    ]
  },

  "acte1_refugies_enquete": {
    id: 'acte1_refugies_enquete',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Enquête sur la Fuite',
      description: `Dame Lyanna vous guide vers les témoins les plus lucides. Leurs récits révèlent un pattern troublant dans les attaques qui les ont forcés à fuir.`,
      text: `Ce n'étaient pas des attaques aléatoires. Les créatures cherchaient quelque chose de spécifique... ou quelqu'un. Elles ont fouillé nos maisons, nos caves, comme si elles cherchaient un objet précis.`,
      speaker: 'lyanna'
    },
    choices: [
      {
        text: 'Qu\'est-ce qu\'elles auraient pu chercher ?',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { objet_mystere: true },
          factionReputation: { refugies: 10 }
        }
      },
      {
        text: 'Il faut retrouver ces créatures et les arrêter',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { vengeance_refugies: true },
          factionReputation: { refugies: 15 }
        }
      }
    ]
  },

  // ================================
  // BRANCHE 4 : TOUR DU MAGE (Mystère)
  // ================================

  "acte1_mage_debut": {
    id: 'acte1_mage_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - Les Révélations du Sage',
      text: 'Le vieux mage Alderon vous accueille dans sa tour remplie de parchemins et d\'artefacts anciens. Ses yeux perçants brillent d\'une intelligence qui semble percer les mystères du temps. "J\'ai étudié les signes pendant des décennies", dit-il en déployant des cartes stellaires complexes. {{OBSERVATION_MAGE}}',
      placeholders: {
        OBSERVATION_MAGE: {
          avec_kael: 'Kael examine avec curiosité les instruments magiques. "Ces calculs... ils prédisent les incursions d\'ombres."',
          seul: 'Seul face à cette sagesse millénaire, vous ressentez le poids de votre ignorance sur votre propre héritage.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        OBSERVATION_MAGE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Étudier les cartes stellaires',
        next: 'acte1_mage_cartes',
        consequences: { flags: { cartes_stellaires: true } }
      },
      {
        text: 'Questionner sur la Lame Éternelle',
        next: 'acte1_mage_lame',
        consequences: { flags: { lore_lame_avance: true } }
      }
    ]
  },

  "acte1_mage_cartes": {
    id: 'acte1_mage_cartes',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Les Cartes Stellaires',
      text: 'Alderon déploie devant vous des cartes couvertes de symboles astronomiques complexes. "Regardez ces alignements", dit-il en pointant des constellations particulières. "Les incursions d\'ombres suivent des cycles prévisibles, liés aux mouvements des corps célestes. Votre famille le savait." {{COMPREHENSION_CARTES}}',
      placeholders: {
        COMPREHENSION_CARTES: {
          avec_kael: 'Kael étudie les motifs avec attention. "Cela expliquerait pourquoi certaines régions sont plus touchées que d\'autres."',
          seul: 'Ces révélations illuminent d\'un jour nouveau votre compréhension du phénomène.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        COMPREHENSION_CARTES: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Approfondir l\'étude astronomique',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { astronomie_avancee: true },
          factionReputation: { erudits: 25 }
        }
      },
      {
        text: 'Demander comment utiliser ces connaissances',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { prediction_incursions: true },
          factionReputation: { erudits: 15 }
        }
      }
    ]
  },

  "acte1_mage_lame": {
    id: 'acte1_mage_lame',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Les Secrets de la Lame Éternelle',
      description: `Alderon se tourne vers un grimoire ancien, ses pages jaunies par les siècles. Il semble hésiter avant de parler.`,
      text: `La Lame Éternelle n'est pas qu'une arme... c'est une clé. Une clé qui maintient fermées les portes entre les dimensions. Votre grand-père l'a cachée pour l'empêcher de tomber entre de mauvaises mains, mais sans elle, les barrières s'affaiblissent.`,
      speaker: 'alderon'
    },
    choices: [
      {
        text: 'Où aurait-il pu la cacher ?',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { localisation_indices: true },
          factionReputation: { erudits: 20 }
        }
      },
      {
        text: 'Comment peut-on fermer les portes sans elle ?',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { solution_alternative: true },
          factionReputation: { erudits: 15 }
        }
      }
    ]
  },

  // ================================
  // BRANCHE 5 : PONT DU DRAGON (Passage)
  // ================================

  "acte1_pont_debut": {
    id: 'acte1_pont_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - Le Passage Périlleux',
      text: 'L\'ancien pont de pierre s\'extend au-dessus du gouffre, ses arches défiant le temps. Des créatures corrompues ont établi un campement rudimentaire, bloquant le passage vers les terres moins touchées par la corruption. {{ANALYSE_PONT}} Au loin, vous apercevez de la fumée - signe de communautés isolées de l\'autre côté.',
      placeholders: {
        ANALYSE_PONT: {
          avec_kael: 'Kael observe les positions ennemies. "Ce passage est stratégique. Le contrôler nous donnerait accès aux territoires préservés."',
          seul: 'Le pont représente votre seul espoir d\'atteindre des régions encore épargnées.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        ANALYSE_PONT: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Analyser les défenses ennemies',
        next: 'acte1_pont_reconnaissance',
        consequences: { flags: { reconnaissance_pont: true } }
      },
      {
        text: 'Chercher un passage alternatif',
        next: 'acte1_pont_contournement',
        consequences: { flags: { exploration_gouffre: true } }
      }
    ]
  },

  "acte1_pont_reconnaissance": {
    id: 'acte1_pont_reconnaissance',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Reconnaissance du Pont',
      text: 'Les créatures ont organisé leurs défenses avec une intelligence troublante. Elles utilisent les ruines de l\'ancien poste de garde comme fortification. Vous notez leurs patrouilles et identifiez leurs points faibles. {{TACTIQUE_PONT}}',
      placeholders: {
        TACTIQUE_PONT: {
          avec_kael: 'Kael pointe des positions tactiques. "Une attaque coordonnée pourrait fonctionner, mais ce sera risqué."',
          seul: 'Seul, vous devrez compter sur la ruse plutôt que sur la force.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        TACTIQUE_PONT: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Planifier un assaut tactique',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { tactique_pont: true },
          factionReputation: { survivants: 10 }
        }
      },
      {
        text: 'Étudier leurs motivations',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { comportement_ombres: true }
        }
      }
    ]
  },

  "acte1_pont_contournement": {
    id: 'acte1_pont_contournement',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Exploration du Gouffre',
      text: 'En explorant les parois du gouffre, vous découvrez d\'anciens chemins de montagne partiellement éboulés. Ces passages semblent avoir été utilisés par des contrebandiers ou des réfugiés. L\'un d\'eux pourrait permettre de contourner le pont. {{TRACES_PASSAGE}}',
      placeholders: {
        TRACES_PASSAGE: {
          avec_kael: 'Kael examine les traces. "Des gens sont passés par ici récemment. Peut-être pouvons-nous les rejoindre."',
          seul: 'Ces traces récentes suggèrent que d\'autres ont trouvé ce passage secret.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        TRACES_PASSAGE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Suivre les traces des fuyards',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { refugies_montagne: true },
          factionReputation: { survivants: 15 }
        }
      },
      {
        text: 'Sécuriser ce passage pour d\'autres',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { passage_secret: true },
          factionReputation: { survivants: 20 }
        }
      }
    ]
  },

  // ================================
  // BRANCHE 6 : VILLAGE SOLO (Isolement)
  // ================================

  "acte1_solo_debut": {
    id: 'acte1_solo_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - L\'Isolement du Héros',
      text: `Le village abandonné résonne de votre solitude. Sans Kael à vos côtés, chaque ombre semble plus menaçante, chaque bruit plus suspect. Les quelques habitants encore présents vous observent avec méfiance - un étranger de plus dans leur monde qui s'effrite. Leurs ressources sont limitées et leur confiance encore plus rare.`
    },
    choices: [
      {
        text: 'Gagner la confiance des habitants',
        next: 'acte1_solo_confiance',
        consequences: { flags: { approche_diplomatique: true } }
      },
      {
        text: 'Fouiller les maisons abandonnées',
        next: 'acte1_solo_fouille',
        consequences: { flags: { recherche_indices: true } }
      }
    ]
  },

  "acte1_solo_confiance": {
    id: 'acte1_solo_confiance',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Gagner la Confiance',
      description: `Un vieil homme aux vêtements rapiécés accepte finalement de vous parler. Son regard porte la fatigue de quelqu'un qui a trop vu.`,
      text: `Pourquoi devrions-nous vous faire confiance ? Tous les autres "héros" nous ont abandonnés quand les choses ont mal tourné. Qu'est-ce qui vous rend différent ?`,
      speaker: 'vieux_pere'
    },
    choices: [
      {
        text: 'Prouver ma valeur par mes actes',
        next: 'acte1_convergence_solo',
        consequences: { 
          flags: { respect_gagne: true },
          factionReputation: { villageois_solitaires: 20 }
        }
      },
      {
        text: 'Chercher des informations utiles',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { informations_village: true },
          factionReputation: { villageois_solitaires: 10 }
        }
      }
    ]
  },

  "acte1_solo_fouille": {
    id: 'acte1_solo_fouille',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Fouille des Maisons Abandonnées',
      text: `Les maisons vides racontent des histoires de fuite précipitée. Vous trouvez des objets personnels abandonnés, des provisions oubliées, et surtout des indices sur ce qui a poussé les habitants à partir. Des marques étranges sur les murs suggèrent des recherches systématiques.`
    },
    choices: [
      {
        text: 'Analyser les marques suspectes',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { marques_analysees: true },
          items: { indice_recherche: 1 }
        }
      },
      {
        text: 'Rassembler les provisions utiles',
        next: 'acte1_convergence_solo',
        consequences: { 
          flags: { provisions_recuperees: true },
          items: { rations_survie: 5 }
        }
      }
    ]
  },

  // ================================
  // BRANCHE 7 : RUINES ANCIENNES (Secrets)
  // ================================

  "acte1_ruines_debut": {
    id: 'acte1_ruines_debut',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Acte I - Les Secrets Anciens',
      text: 'Les ruines précèdent votre lignée de plusieurs siècles. Les pierres gravées de symboles inconnus semblent pulser d\'une énergie résiduelle. L\'artefact ancien que vous avez découvert résonne en présence de ces structures. {{MYSTERE_RUINES}}',
      placeholders: {
        MYSTERE_RUINES: {
          avec_kael: 'Kael examine les symboles avec fascination. "Ces marques... elles ne ressemblent à rien de ce que je connais."',
          seul: 'Face à ces mystères millénaires, vous ressentez le poids d\'une histoire qui vous dépasse.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        MYSTERE_RUINES: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Utiliser l\'artefact pour révéler les secrets',
        next: 'acte1_ruines_artefact',
        condition: 'items.artefact_ancien > 0',
        consequences: { flags: { artefact_active: true } }
      },
      {
        text: 'Étudier les symboles méthodiquement',
        next: 'acte1_ruines_symboles',
        consequences: { flags: { etude_symboles: true } }
      }
    ]
  },

  "acte1_ruines_artefact": {
    id: 'acte1_ruines_artefact',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Révélations de l\'Artefact',
      text: 'L\'artefact s\'illumine au contact des ruines, projetant des images holographiques dans l\'air. Vous assistez à des scènes du passé : une civilisation avancée, des portails entre les mondes, et finalement leur chute face à une invasion d\'ombres. Votre famille n\'était pas les premiers Gardiens. {{REVELATION_HERITAGE}}',
      placeholders: {
        REVELATION_HERITAGE: {
          avec_kael: 'Kael observe les visions avec stupéfaction. "Votre héritage est plus ancien et plus important que nous le pensions."',
          seul: 'Ces révélations bouleversent votre compréhension de votre rôle dans cette histoire.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        REVELATION_HERITAGE: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Rechercher d\'autres artefacts similaires',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { civilisation_ancienne: true },
          items: { fragment_memoire: 1 }
        }
      },
      {
        text: 'Utiliser ces connaissances contre les ombres',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { tactiques_anciennes: true },
          experience: 100
        }
      }
    ]
  },

  "acte1_ruines_symboles": {
    id: 'acte1_ruines_symboles',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Étude des Symboles',
      text: 'Par une analyse méthodique, vous commencez à déchiffrer les symboles. Ils décrivent des techniques de scellement dimensionnel, des formules de protection, et des avertissements sur les conséquences de l\'utilisation des portails. Ces connaissances pourraient être cruciales. {{DOCUMENTATION_SYMBOLES}}',
      placeholders: {
        DOCUMENTATION_SYMBOLES: {
          avec_kael: 'Kael aide à documenter vos découvertes. "Ces informations valent une armée contre les créatures d\'ombre."',
          seul: 'Vos efforts solitaires portent leurs fruits. Ces connaissances vous donnent un avantage précieux.'
        }
      }
    },
    conditions: {
      show_placeholder: {
        DOCUMENTATION_SYMBOLES: {
          avec_kael: "gameFlags.alliance_kael === true",
          seul: "gameFlags.alliance_kael !== true"
        }
      }
    },
    choices: [
      {
        text: 'Approfondir la recherche académique',
        next: 'acte1_convergence_investigation',
        consequences: { 
          flags: { maitrise_symboles: true },
          factionReputation: { erudits: 30 }
        }
      },
      {
        text: 'Tester les techniques de scellement',
        next: 'acte1_convergence_action',
        consequences: { 
          flags: { scellement_teste: true },
          items: { rune_scellement: 1 }
        }
      }
    ]
  }

};

export default acte1Scenes;