/**
 * Templates de Génération Procédurale
 * 
 * Base de données des templates utilisés pour générer du contenu dynamique.
 * Organisés par type de biome et de situation.
 */

export const SceneTemplates = {
  
  // === TEMPLATES D'EXPLORATION PAR BIOME ===
  
  forest_encounter_social: {
    descriptions: [
      'Les arbres anciens murmurent des secrets oubliés tandis qu\'une silhouette émerge de l\'ombre.',
      'Un sentier serpente entre les fougères géantes. Vous entendez des voix au loin.',
      'La lumière filtrée par la canopée révèle une clairière où quelqu\'un semble attendre.',
      'Des traces fraîches dans la mousse indiquent qu\'un voyageur est passé récemment.',
      'Un feu de camp fumant suggère une présence proche dans cette partie de la forêt.'
    ],
    encounters: {
      easy: [
        { 
          type: 'social', 
          description: 'Un vieil ermite cueille des champignons',
          npc: { role: 'hermit', personality: 'wise', knowledge: ['local_lore', 'herbalism'] }
        },
        { 
          type: 'social', 
          description: 'Un chasseur local examine des traces',
          npc: { role: 'hunter', personality: 'practical', knowledge: ['wildlife', 'tracking'] }
        }
      ],
      medium: [
        { 
          type: 'social', 
          description: 'Un groupe de pèlerins fait une pause près d\'un ruisseau',
          npc: { role: 'pilgrim_group', personality: 'devout', knowledge: ['religious_lore', 'distant_lands'] }
        },
        { 
          type: 'mystery', 
          description: 'Un marchand semble en détresse près de sa charrette brisée',
          npc: { role: 'merchant', personality: 'worried', quest: 'broken_cart_help' }
        }
      ],
      hard: [
        { 
          type: 'social', 
          description: 'Un groupe d\'aventuriers expérimentés établit un campement',
          npc: { role: 'veteran_party', personality: 'cautious', knowledge: ['dungeon_rumors', 'monster_lore'] }
        }
      ]
    },
    npcs: [
      { 
        role: 'hermit', 
        personality: 'wise', 
        knowledge: ['local_lore'],
        defaultDialogue: 'Ces bois recèlent bien des mystères, jeune voyageur...'
      },
      { 
        role: 'hunter', 
        personality: 'practical', 
        knowledge: ['wildlife'],
        defaultDialogue: 'Attention aux loups dans cette région. Ils chassent en meute.'
      },
      { 
        role: 'trader', 
        personality: 'jovial', 
        inventory: ['basic_supplies'],
        defaultDialogue: 'Des provisions pour la route ? J\'ai ce qu\'il vous faut !'
      }
    ],
    rewards: {
      easy: [
        { type: 'item', items: ['herbes_medicinales', 'baies_sauvages'] },
        { type: 'information', knowledge: 'local_shortcut' }
      ],
      medium: [
        { type: 'item', items: ['potion_guerison_legere', 'carte_region'] },
        { type: 'experience', amount: 50 },
        { type: 'reputation', amount: 1 }
      ],
      hard: [
        { type: 'item', items: ['equipment_upgrade', 'rare_component'] },
        { type: 'experience', amount: 100 },
        { type: 'alliance', npc: 'veteran_adventurer' }
      ]
    }
  },

  forest_encounter_combat: {
    descriptions: [
      'Des bruissements suspects dans les fourrés vous mettent en alerte.',
      'Le silence soudain de la forêt annonce un danger imminent.',
      'Des grognements sourds résonnent entre les arbres.',
      'Vous apercevez des yeux brillants qui vous observent depuis l\'obscurité.',
      'Une odeur de musc et de danger flotte dans l\'air humide.'
    ],
    encounters: {
      easy: [
        { 
          type: 'combat', 
          enemies: ['loup_solitaire'], 
          description: 'Un loup solitaire bloque votre passage'
        },
        { 
          type: 'combat', 
          enemies: ['sanglier_territorial'], 
          description: 'Un sanglier défend agressivement son territoire'
        }
      ],
      medium: [
        { 
          type: 'combat', 
          enemies: ['meute_loups'], 
          description: 'Une meute de loups vous encercle'
        },
        { 
          type: 'combat', 
          enemies: ['gobelin_eclaireur', 'gobelin_guerrier'], 
          description: 'Des gobelins dressent une embuscade'
        }
      ],
      hard: [
        { 
          type: 'combat', 
          enemies: ['ours_des_cavernes'], 
          description: 'Un ours massif surgit de sa tanière'
        },
        { 
          type: 'combat', 
          enemies: ['chef_gobelin', 'gobelin_guerrier', 'gobelin_eclaireur'], 
          description: 'Une bande organisée de gobelins attaque'
        }
      ]
    },
    rewards: {
      easy: [
        { type: 'item', items: ['peau_loup', 'viande_fraiche'] },
        { type: 'experience', amount: 25 }
      ],
      medium: [
        { type: 'item', items: ['trophee_chasse', 'arme_gobeline'] },
        { type: 'experience', amount: 75 }
      ],
      hard: [
        { type: 'item', items: ['peau_ours_rare', 'tresor_gobelin'] },
        { type: 'experience', amount: 150 }
      ]
    }
  },

  forest_encounter_discovery: {
    descriptions: [
      'Un éclat inhabituel attire votre attention entre les racines d\'un chêne centenaire.',
      'Vous découvrez une structure artificielle à demi cachée par la végétation.',
      'Un parfum étrange et envoûtant émane d\'une petite clairière secrète.',
      'Des symboles gravés dans l\'écorce d\'un arbre semblent raconter une histoire.',
      'Une source cristalline jaillit d\'un rocher aux propriétés peut-être magiques.'
    ],
    encounters: {
      easy: [
        { 
          type: 'discovery', 
          description: 'Vous trouvez un bosquet de plantes médicinales rares',
          reward: { type: 'item', items: ['herbes_rares'] }
        },
        { 
          type: 'discovery', 
          description: 'Un vieux coffre est caché sous des racines',
          reward: { type: 'treasure', level: 'minor' }
        }
      ],
      medium: [
        { 
          type: 'discovery', 
          description: 'Vous découvrez une petite grotte avec des cristaux lumineux',
          reward: { type: 'item', items: ['cristal_lumineux'] }
        },
        { 
          type: 'mystery', 
          description: 'D\'anciennes ruines elfiques émergent du sol forestier',
          reward: { type: 'knowledge', lore: 'ancient_elven_history' }
        }
      ],
      hard: [
        { 
          type: 'discovery', 
          description: 'Une source magique aux propriétés curatives',
          reward: { type: 'permanent_bonus', stat: 'max_hp', amount: 2 }
        }
      ]
    },
    rewards: {
      easy: [
        { type: 'item', items: ['champignon_rare', 'composant_alchimie'] }
      ],
      medium: [
        { type: 'item', items: ['artefact_mineur', 'grimoire_fragment'] },
        { type: 'knowledge', lore: 'forest_secrets' }
      ],
      hard: [
        { type: 'item', items: ['artefact_majeur'] },
        { type: 'spell', spell: 'sort_nature' }
      ]
    }
  },

  // === TEMPLATES DE VILLAGE ===
  
  village_encounter_social: {
    descriptions: [
      'Les maisons de pierre et de chaume témoignent d\'une communauté laborieuse.',
      'Le marché du village bourdonne d\'activité malgré l\'heure tardive.',
      'Des villageois se rassemblent près de la fontaine centrale pour discuter.',
      'L\'auberge locale résonne de rires et de conversations animées.',
      'Un crieur public annonce les dernières nouvelles de la région.'
    ],
    encounters: {
      easy: [
        { 
          type: 'social', 
          description: 'Le forgeron local travaille tard dans sa forge',
          npc: { role: 'blacksmith', services: ['repair', 'simple_crafting'] }
        },
        { 
          type: 'social', 
          description: 'Une vieille dame nourrit les chats errants',
          npc: { role: 'elder', knowledge: ['village_history', 'local_gossip'] }
        }
      ],
      medium: [
        { 
          type: 'social', 
          description: 'Le maire semble préoccupé par un problème local',
          npc: { role: 'mayor', quest: 'village_problem', reward: 'reputation' }
        },
        { 
          type: 'social', 
          description: 'Un groupe de miliciens discute de patrouilles récentes',
          npc: { role: 'militia', knowledge: ['local_threats', 'safe_routes'] }
        }
      ],
      hard: [
        { 
          type: 'mystery', 
          description: 'Des événements étranges troublent la communauté',
          npc: { role: 'investigator', quest: 'mystery_investigation' }
        }
      ]
    },
    rewards: {
      easy: [
        { type: 'service', services: ['rest', 'repair', 'supplies'] },
        { type: 'information', knowledge: 'local_rumors' }
      ],
      medium: [
        { type: 'reputation', amount: 2 },
        { type: 'alliance', faction: 'village_militia' }
      ],
      hard: [
        { type: 'reputation', amount: 5 },
        { type: 'property', building: 'village_house' }
      ]
    }
  },

  // === TEMPLATES DE DONJON ===
  
  dungeon_encounter_combat: {
    descriptions: [
      'Les murs suintent d\'humidité et résonnent d\'échos menaçants.',
      'Des torches vacillantes projettent des ombres dansantes sur la pierre ancienne.',
      'L\'air vicié porte des odeurs de moisi et de danger.',
      'Des gravures inquiétantes ornent les parois de ce couloir oublié.',
      'Le silence pesant est soudain brisé par un bruit hostile.'
    ],
    encounters: {
      easy: [
        { 
          type: 'combat', 
          enemies: ['rat_geant'], 
          description: 'Des rats géants infestent ce niveau'
        },
        { 
          type: 'combat', 
          enemies: ['squelette_gardien'], 
          description: 'Un ancien gardien squelettique bloque le passage'
        }
      ],
      medium: [
        { 
          type: 'combat', 
          enemies: ['gobelin_fouineur', 'gobelin_guerrier'], 
          description: 'Des gobelins ont établi un poste avancé ici'
        },
        { 
          type: 'combat', 
          enemies: ['araignee_geante'], 
          description: 'Une araignée géante a tissé sa toile dans cette salle'
        }
      ],
      hard: [
        { 
          type: 'combat', 
          enemies: ['orc_champion', 'orc_guerrier'], 
          description: 'Des orcs ont revendiqué ce territoire'
        },
        { 
          type: 'boss', 
          enemies: ['gardien_ancien'], 
          description: 'Un puissant gardien protège les secrets du donjon'
        }
      ]
    },
    rewards: {
      easy: [
        { type: 'item', items: ['os_ancien', 'debris_metal'] },
        { type: 'experience', amount: 30 }
      ],
      medium: [
        { type: 'item', items: ['arme_ancienne', 'gemme_mineure'] },
        { type: 'experience', amount: 80 }
      ],
      hard: [
        { type: 'treasure', level: 'major' },
        { type: 'experience', amount: 200 }
      ]
    }
  },

  // === TEMPLATES DE DIALOGUES ===
  
  dialogues: {
    hermit: [
      {
        text: 'Ah, un voyageur ! Cela fait longtemps que je n\'ai vu âme qui vive dans ces bois.',
        responses: [
          { text: 'Que faites-vous ici ?', action: 'ask_purpose' },
          { text: 'Connaissez-vous la région ?', action: 'ask_knowledge' },
          { text: 'Je dois continuer ma route.', action: 'leave' }
        ]
      }
    ],
    merchant: [
      {
        text: 'Salutations ! Puis-je vous intéresser à quelques-unes de mes marchandises ?',
        responses: [
          { text: 'Montrez-moi vos articles.', action: 'open_shop' },
          { text: 'Que vendez-vous ?', action: 'ask_inventory' },
          { text: 'Pas aujourd\'hui, merci.', action: 'decline' }
        ]
      }
    ],
    guard: [
      {
        text: 'Halte ! Déclinez votre identité et vos intentions.',
        responses: [
          { text: 'Je suis un voyageur paisible.', action: 'peaceful_approach' },
          { text: 'Je suis en mission officielle.', action: 'official_business', condition: 'hasOfficialPapers' },
          { text: 'Cela ne vous regarde pas !', action: 'hostile_response' }
        ]
      }
    ],
    generic: [
      {
        text: 'Bonjour, voyageur. Comment puis-je vous aider ?',
        responses: [
          { text: 'Bonjour.', action: 'greet' },
          { text: 'Connaissez-vous les environs ?', action: 'ask_area' },
          { text: 'Bonne journée.', action: 'leave' }
        ]
      }
    ]
  },

  // === TEMPLATES DE PNJ ===
  
  npcs: {
    forest: [
      { 
        role: 'hermit', 
        personality: 'wise', 
        knowledge: ['local_lore', 'herbalism'],
        services: ['guidance', 'herb_trade'] 
      },
      { 
        role: 'hunter', 
        personality: 'practical', 
        knowledge: ['wildlife', 'tracking'],
        services: ['information', 'guide'] 
      },
      { 
        role: 'bandit', 
        personality: 'hostile', 
        knowledge: ['hidden_paths'],
        services: [] 
      }
    ],
    village: [
      { 
        role: 'merchant', 
        personality: 'friendly', 
        services: ['trade', 'information'] 
      },
      { 
        role: 'innkeeper', 
        personality: 'welcoming', 
        services: ['lodging', 'meals', 'rumors'] 
      },
      { 
        role: 'blacksmith', 
        personality: 'gruff', 
        services: ['repair', 'crafting'] 
      }
    ],
    generic: [
      { 
        role: 'traveler', 
        personality: 'neutral', 
        knowledge: ['distant_lands'] 
      },
      { 
        role: 'pilgrim', 
        personality: 'devout', 
        knowledge: ['religious_lore'] 
      }
    ]
  }
};

// === TEMPLATES ADAPTATIFS ===

export const AdaptiveTemplates = {
  
  // Templates qui s'adaptent au niveau du joueur
  scalingEncounters: {
    bandit_ambush: {
      level_1_3: { 
        enemies: ['bandit'], 
        difficulty: 'easy',
        description: 'Un bandit solitaire vous barre la route.'
      },
      level_4_6: { 
        enemies: ['bandit_leader', 'bandit'], 
        difficulty: 'medium', 
        tactics: 'flanking',
        description: 'Une bande de brigands organise une embuscade.'
      },
      level_7_9: { 
        enemies: ['bandit_captain', 'bandit_veteran', 'bandit'], 
        difficulty: 'hard', 
        equipment: 'magical',
        description: 'Une troupe de bandits expérimentés vous tend un piège mortel.'
      }
    }
  },
  
  // Templates qui réagissent aux choix précédents
  consequenceAware: {
    villager_reaction: {
      high_reputation: {
        template: 'grateful_welcome',
        description: 'Les villageois vous accueillent comme un héros.'
      },
      neutral_reputation: {
        template: 'cautious_greeting',
        description: 'Les villageois vous saluent poliment mais gardent leurs distances.'
      },
      low_reputation: {
        template: 'suspicious_confrontation',
        description: 'Les villageois vous regardent avec méfiance et hostilité.'
      }
    }
  },
  
  // Templates narrativement cohérents
  storyAware: {
    mysterious_discovery: {
      early_game: {
        template: 'foreshadowing_hints',
        description: 'Vous trouvez des indices énigmatiques qui semblent importants.'
      },
      mid_game: {
        template: 'connecting_clues',
        description: 'Cette découverte fait écho à des événements précédents.'
      },
      late_game: {
        template: 'revelation_confirmations',
        description: 'Cette révélation confirme vos soupçons sur la véritable nature des événements.'
      }
    }
  }
};

export default { SceneTemplates, AdaptiveTemplates };