/**
 * Fichier de test pour tous les types de scènes et fonctionnalités
 * Contient un exemple de chaque type de scène avec leurs spécificités
 */

import { SCENE_TYPES } from '../../types/story';

export const testScenes = {


    test_factionReputation: {
    id: 'test_factionReputation',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Test Réputation Faction',
      text: 'Voulez-vous tester la réputation des factions ?'
    },
    choices: [
      {
        text: 'Gagner +10 avec Ravenscroft',
        next: 'test_faction_check',
        consequences: {
          factionReputation: { ravenscroft: 10 }
        }
      },
      {
        text: 'Perdre -5 avec Mercenaires',
        next: 'test_faction_check',
        consequences: {
          factionReputation: { mercenaires: -5 }
        }
      }
    ]
  },

  test_faction_check: {
    id: 'test_faction_check',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Vérification Réputation',
      text: 'Réputation mise à jour ! Vérifiez dans la console ou l\'interface.'
    },
    choices: [
      {
        text: 'Choix si Ravenscroft >= 5',
        next: 'test_consequences',
        condition: "gameFlags.factionReputation.ravenscroft >= 5"
      },
      {
        text: 'Retour au test',
        next: 'test_factionReputation'
      }
    ]
  },
  // ========== SCENE TEXT ==========
  "test_start": {
    id: "test_start",
    type: SCENE_TYPES.TEXT,

    content: {
      title: "Test Scene Hub",
      text: "Bienvenue dans la zone de test ! Choisissez le type de scène à tester.",
      variations: {
        mage: "En tant que mage, vous ressentez des énergies magiques partout.",
        experienced: "Votre expérience vous dit que cet endroit est spécial."
      }
    },

    conditions: {
      show_variation: {
        mage: "character.class === 'Magicien'",
        experienced: "character.level >= 3"
      }
    },

    choices: [
      {
        text: "Test Dialogue",
        next: "test_dialogue"
      },
      {
        text: "Test Combat",
        next: "test_combat"
      },
      {
        text: "Test Embuscade",
        next: "test_ambush"
      },
      {
        text: "Test Interactive",
        next: "test_interactive"
      },
      {
        text: "Test Merchant",
        next: "test_merchant"
      },
      {
        text: "Test Rest Choice",
        next: "test_rest_choice"
      },
      {
        text: "Test Consequences",
        next: "test_consequences",
        consequences: {
          companions: ["zara"]
        }
      }
    ],

    metadata: {
      chapter: "test",
      location: "Zone de test",
      tags: ["test", "hub"]
    }
  },


  // ========== SCENE DIALOGUE ==========
  "test_dialogue": {
    id: "test_dialogue",
    type: SCENE_TYPES.DIALOGUE,

    content: {
      text: "Bonjour aventurier ! Je suis un PNJ de test.",
      speaker: "PNJ Test",
      portrait: "marchand.jpg",
      mood: "friendly",
      variations: {
        has_sword: "Je vois que vous avez une épée ! Impressionnant."
      }
    },

    conditions: {
      show_variation: {
        has_sword: "character.inventory.includes('epee_fer')"
      }
    },

    choices: [
      {
        text: "Parler poliment",
        next: "test_dialogue_2",
        consequences: {
          reputation: 5,
          npcRelations: { "pnj_test": 10 }
        }
      },
      {
        text: "Être agressif",
        next: "test_dialogue_2",
        consequences: {
          reputation: -5,
          npcRelations: { "pnj_test": -10 }
        }
      },
      {
        text: "Retour au hub",
        next: "test_start"
      }
    ],

    metadata: {
      chapter: "test",
      location: "Zone de test",
      character: "PNJ Test"
    }
  },

  "test_dialogue_2": {
    id: "test_dialogue_2",
    type: SCENE_TYPES.DIALOGUE,

    content: {
      text: "Votre réaction était intéressante !",
      speaker: "PNJ Test",
      portrait: "marchand.jpg",
      mood: "neutral"
    },

    choices: [
      {
        text: "Retour au hub",
        next: "test_start"
      }
    ]
  },

  // ========== SCENE COMBAT ==========
  "test_combat": {
    id: "test_combat",
    type: SCENE_TYPES.COMBAT,

    content: {
      title: "Test Combat",
      text: "Un ennemi de test apparaît !",
      
    },


    enemies: [{ type: 'ombre', count: 1 }],
    enemyPositions: [
      { x: 4, y: 0 },


    ],
    // Configuration de victoire (remplace le choix avec condition: false)
    onVictory: {
      next: "test_combat_victory",
      text: "Retourner en héros au village",
      consequences: {
        experience: 100,
        items: ["potion_soin"]
      }
    },

    choices: [
      {
        text: "Engager le combat !",
        next: "test_combat"
      }
    ],

    metadata: {
      chapter: "test",
      location: "Arena de test",
      tags: ["combat", "test"]
    }
  },

  "test_combat_victory": {
    id: "test_combat_victory",
    type: SCENE_TYPES.TEXT,

    content: {
      text: "Combat terminé ! Vous avez gagné !"
    },

    choices: [
      {
        text: "Retour au hub",
        next: "test_start",
        consequences: {
          experience: 100,
          items: ["potion_soin"]
        }
      }
    ]
  },

  // ========== SCENE COMBAT EMBUSCADE ==========
  "test_ambush": {
    id: "test_ambush",
    type: SCENE_TYPES.COMBAT,

    content: {
      title: "Embuscade !",
      text: "Des bandits surgissent des buissons ! Pas le temps de réfléchir, il faut se battre !",
      ambush: true // Combat instantané, sans phase d'introduction
    },

    enemies: [{ type: 'ombre', count: 2 }],
    enemyPositions: [
      { x: 3, y: 0 },
      { x: 5, y: 1 }
    ],

    // Configuration de victoire pour l'embuscade
    onVictory: {
      next: "test_start",
      text: "S'échapper rapidement",
      consequences: {
        experience: 50
      }
    },

    choices: [
      // Pas de choix pour une embuscade - combat automatique
    ],

    metadata: {
      chapter: "test",
      location: "Chemin forestier",
      tags: ["combat", "embuscade", "test"],
      ambush: true // Alternative: mettre ambush ici aussi
    }
  },

  // ========== SCENE INTERACTIVE ==========
  "test_interactive": {
    id: "test_interactive",
    type: SCENE_TYPES.INTERACTIVE,

    content: {
      text: "Vous êtes dans une salle avec plusieurs objets interactifs.",
      background: "ruined_fortress.jpg",
      title: "Salle de test interactive"
    },

    hotspots: [
      {
        id: "coffre_test",
        coordinates: { x: 100, y: 100, width: 50, height: 50 },
        text: "Un coffre mystérieux",
        action: {
          type: "item",
          item: "club",
          next: "test_interactive",
          message: "Vous trouvez une épée !"
        }
      },
      {
        id: "autel_test",
        coordinates: { x: 200, y: 150, width: 60, height: 40 },
        text: "Un autel ancien",
        condition: "character.level >= 2",
        action: {
          type: "longRest",
          next: "test_start"
        }
      },
      {
        id: "sortie",
        coordinates: { x: 300, y: 50, width: 40, height: 80 },
        text: "Sortie",
        action: {
          type: "scene_transition",
          next: "test_start"
        }
      }
    ],

    choices: [
      {
        text: "Retour au hub",
        next: "test_start"
      }
    ],

    metadata: {
      chapter: "test",
      location: "Salle interactive",
      tags: ["interactive", "test"]
    }
  },

  // ========== SCENE MERCHANT ==========
  "test_merchant": {
    id: "test_merchant",
    type: SCENE_TYPES.MERCHANT,

    content: {
      text: "Bienvenue dans ma boutique de test !",
      speaker: "Marchand Test",
      portrait: "marchand.jpg"
    },

    shop: {
      currency: "gold",
      inventory: [
        {
          id: "potionOfHealing",
          name: "Potion de soin",
          price: 50,
          quantity: 50
        },
        {
          id: "epee_fer",
          name: "Épée en fer",
          price: 200,
          quantity: 1
        }
      ],
      reputation_discount: {
        50: 0.1,  // 10% réduction à 50+ réputation
        100: 0.2  // 20% réduction à 100+ réputation
      }
    },

    choices: [
      {
        text: "Acheter",
        action: { type: "openShop" }
      },
      {
        text: "Vendre",
        next: "test_merchant"
      },
      {
        text: "Quitter la boutique",
        next: "test_start"
      }
    ],

    metadata: {
      chapter: "test",
      location: "Boutique de test",
      character: "Marchand Test"
    }
  },

  // ========== SCENE REST_CHOICE ==========
  "test_rest_choice": {
    id: "test_rest_choice",
    type: SCENE_TYPES.REST_CHOICE,

    content: {
      title: "Feu de camp",
      text: "Les flammes dansent doucement dans la nuit, projetant des ombres rassurantes sur votre campement. Vos muscles sont fatigués après cette longue journée d'aventure. Le crépitement du feu vous invite au repos, mais vous devez décider comment utiliser ce temps précieux."
    },

    choices: [
      {
        text: "S'assoupir une heure près du feu",
        restType: "short",
        next: "test_start"
      },

      {
        text: "Éteindre le feu et repartir immédiatement",
        next: "test_start"
      }
    ],

    metadata: {
      chapter: "test",
      location: "Camp de fortune",
      tags: ["rest", "test"]
    }
  },

  "test_rest_short": {
    id: "test_rest_short",
    type: SCENE_TYPES.REST_SHORT,

    content: {
      title: "Repos réparateur",
      text: "Vous vous installez confortablement près du feu, laissant vos muscles se détendre. Le temps passe lentement tandis que vous soignez vos blessures et reprenez des forces. Une heure plus tard, vous vous sentez prêt à reprendre la route."
    },

    choices: [
      {
        text: "Rassembler ses affaires et partir",
        restType: "short",
        next: "test_start"
      }
    ]
  },

  "test_rest_long": {
    id: "test_rest_long",
    type: SCENE_TYPES.REST_LONG,

    content: {
      title: "Une nuit de repos",
      text: "Vous vous endormez paisiblement, bercé par le crépitement des flammes. Vos rêves sont emplis d'aventures passées et futures. Quand l'aube pointe ses premiers rayons, vous vous réveillez complètement restauré, corps et esprit régénérés. Vos blessures ont cicatrisé et votre magie a retrouvé toute sa puissance."
    },

    choices: [
      {
        text: "Accueillir le lever du soleil et lever le camp",
        restType: "long",
        next: "test_start"
      }
    ]
  },

  // ========== TEST CONSEQUENCES ==========
  "test_consequences": {
    id: "test_consequences",
    type: SCENE_TYPES.TEXT,

    content: {
      title: "Test des conséquences",
      text: "Choisissez une action pour tester les différentes conséquences."
    },

    choices: [
      {
        text: "Gagner de l'XP",
        next: "test_consequences",
        consequences: {
          experience: 50
        }
      },
      {
        text: "Gagner un objet",
        next: "test_consequences",
        consequences: {
          items: ["potionOfHealing"]
        }
      },
      {
        text: "Recruter un allié",
        next: "test_consequences",
        consequences: {
          companions: ["finn"]
        }
      },
      {
        text: "Modifier des flags",
        next: "test_consequences",
        consequences: {
          flags: {
            test_flag: true,
            test_counter: 1
          },factionReputation: { ravenscroft: -50, mercenaires: 10 } 
        }
      }, {
        text: "ravencroft",
        next: "test_consequences",
        condition: "gameFlags.factionReputation.ravenscroft >= 30",
      },
      {
        text: "Marquer lieu visité",
        next: "test_consequences",
        consequences: {
          visitLocation: "test_zone"
        }
      },
      {
        text: "Choix majeur",
        next: "test_consequences",
        consequences: {
          majorChoice: {
            id: "test_choice",
            description: "Choix de test important"
          }
        }
      },
     
      {
        text: "Changer la relation avec un PNJ",
        next: "test_consequences",
        consequences: {
          npcRelations: { "pnj_test": 20 }
        }
      },

      {
        text: "Test skill check",
        next: "test_skill_check"
      },
      {
        text: "Retour au hub",
        next: "test_start"
      }
    ]
  },

  // ========== TEST SKILL CHECK ==========
  "test_skill_check": {
    id: "test_skill_check",
    type: SCENE_TYPES.TEXT,

    content: {
      text: "Vous tentez un test de compétence..."
    },

    choices: [
      {
        text: "Test d'Athlétisme (DD 15)",
        action: {
          type: "skillCheck",
          skill: "athletics",
          dc: 15,
          onSuccess: "test_skill_success",
          onFailure: "test_skill_failure"
        }
      },
      {
        text: "Test d'Acrobaties (DD 12)",
        action: {
          type: "skillCheck",
          skill: "acrobatics",
          dc: 12,
          onSuccess: "test_skill_success",
          onFailure: "test_skill_failure"
        }
      },
      {
        text: "Retour",
        next: "test_consequences"
      }
    ]
  },

  "test_skill_success": {
    id: "test_skill_success",
    type: SCENE_TYPES.TEXT,

    content: {
      text: "Succès ! Vous réussissez le test de compétence."
    },

    choices: [
      {
        text: "Continuer",
        next: "test_consequences",
        consequences: {
          experience: 25,
          items: ["potionOfHealing"]
        }
      }
    ]
  },

  "test_skill_failure": {
    id: "test_skill_failure",
    type: SCENE_TYPES.TEXT,

    content: {
      text: "Échec ! Vous échouez au test de compétence."
    },

    choices: [
      {
        text: "Réessayer",
        next: "test_skill_check"
      },
      {
        text: "Abandonner",
        next: "test_consequences"
      }
    ]
  }
};

export default testScenes;