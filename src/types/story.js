/**
 * Types et interfaces pour le système de scènes narratives
 */

// Types de base pour les scènes
export const SCENE_TYPES = {
  TEXT: 'text',
  DIALOGUE: 'dialogue', 
  INTERACTIVE: 'interactive',     
  MERCHANT: 'merchant',
  COMBAT: 'combat',
  REST_LONG: 'rest_long',
  REST_SHORT: 'rest_short',
  REST_CHOICE: 'rest_choice'       // Choix entre repos court/long (D&D)
};

// Types d'actions possibles
export const ACTION_TYPES = {
  SCENE_TRANSITION: 'scene_transition',
  COMBAT: 'combat',
  SHORT_REST: 'shortRest', 
  LONG_REST: 'longRest',
  ITEM_GAIN: 'item',
  ALLY_JOIN: 'ally',
  SKILL_CHECK: 'skillCheck',
  SHOP_OPEN: 'openShop',
  SHOP_SELL: 'openSellInterface',
  FLAG_SET: 'setFlag',
  REPUTATION_CHANGE: 'changeReputation'
};

/**
 * Structure d'une scène unifiée (nouveau système)
 */
export const UnifiedSceneSchema = {
  // === IDENTIFICATION ===
  id: 'string',                    // Identifiant unique (requis)
  type: 'SCENE_TYPES',             // Type de la scène (requis)
  
  // === CONTENU ===
  content: {
    text: 'string',                // Texte principal (requis)
    speaker: 'string',             // Pour dialogues uniquement
    portrait: 'string',            // Pour dialogues uniquement  
    mood: 'string',                // Pour dialogues (friendly, neutral, hostile)
    background: 'string',          // Pour scènes interactives uniquement
    title: 'string',               // Titre affiché (optionnel)
    description: 'string',         // Description additionnelle (optionnel)
    variations: {
      // key: condition_name, value: text_variant (pour textes dynamiques)
    }
  },
  
  // === NAVIGATION ===
  choices: [
    {
      text: 'string',              // Texte du choix (requis)
      next: 'string',              // ID de la scène suivante (requis)
      condition: 'string',         // Condition pour afficher le choix (optionnel)
                                   // Ex: "false", "character.level >= 3", "gameFlags.hasKey === true"
      consequences: {              // Effets du choix (optionnel)
        // === PROGRESSION PERSONNAGE ===
        experience: 'number',      // XP à ajouter
        items: 'array',            // Items à ajouter à l'inventaire
        companions: 'array',       // Compagnons à recruter
        
        // === ÉTAT NARRATIF ===
        flags: 'object',           // Flags de jeu à modifier
        reputation: 'number',      // Changement de réputation
        npcRelations: 'object',    // Relations avec PNJ
        visitLocation: 'string',   // Marquer lieu comme visité
        majorChoice: {             // Choix important pour l'histoire
          id: 'string',
          description: 'string'
        }
      }
    }
  ],
  
  // === CONDITIONS ===
  conditions: {
    show_if: 'string',             // Condition pour afficher la scène
    show_variation: {              // Conditions pour variations de texte
      // key: variation_name, value: condition_string
    }
  },
  
  // === PROPRIÉTÉS SPÉCIFIQUES PAR TYPE ===
  
  // Pour MERCHANT uniquement
  shop: {
    currency: 'string',
    inventory: 'array',
    reputation_discount: 'object'
  },
  
  // Pour INTERACTIVE uniquement  
  hotspots: [
    {
      id: 'string',
      coordinates: { x: 'number', y: 'number', width: 'number', height: 'number' },
      text: 'string',
      condition: 'string',
      action: { type: 'string', next: 'string', message: 'string' }
    }
  ],
  
  // Pour COMBAT uniquement
  enemies: 'array',
  enemyPositions: 'array',
  onVictory: {                     // Actions à effectuer après la victoire
    next: 'string',                // Scène suivante
    text: 'string',                // Texte du bouton de victoire (optionnel)
    consequences: 'object'         // Conséquences de la victoire (optionnel)
  },
  
  // Pour REST_* uniquement
  restType: 'string',              // 'short', 'long', ou 'choice'
  
  // === MÉTADONNÉES (optionnelles) ===
  metadata: {
    chapter: 'string',             // Chapitre narratif
    location: 'string',            // Lieu de la scène
    tags: 'array',                 // Tags pour organisation
    character: 'string'            // PNJ principal (pour dialogues)
  }
};

// === SCHEMAS LEGACY (à supprimer après migration complète) ===
// Ces schemas restent pour compatibilité avec les composants existants
// mais utilisent maintenant UnifiedSceneSchema comme base

/**
 * @deprecated Utiliser UnifiedSceneSchema à la place
 */
export const InteractiveSceneSchema = UnifiedSceneSchema;

/**
 * @deprecated Utiliser UnifiedSceneSchema à la place  
 */
export const DialogueSceneSchema = UnifiedSceneSchema;

/**
 * @deprecated Utiliser UnifiedSceneSchema à la place
 */
export const MerchantSceneSchema = UnifiedSceneSchema;

/**
 * Structure des variables de jeu
 */
export const GameFlagsSchema = {
  // Flags booléens
  hasSymbol: false,
  tyrionMet: false,
  manuscriptRead: false,
  bridgeSecretFound: false,
  
  // Variables numériques
  reputation: 0,
  gold: 0,
  
  // Listes
  companions: [],
  completedQuests: [],
  visitedLocations: [],
  
  // Relations avec PNJ
  npcRelations: {
    // npcId: reputation_value (-100 à 100)
  },
  
  // Historique des choix importants
  majorChoices: []
};

/**
 * Interface pour les conditions
 */
export const ConditionTypes = {
  // Variables de jeu
  FLAG: 'gameFlags.{flagName}',
  REPUTATION: 'gameFlags.reputation >= {value}',
  NPC_RELATION: 'gameFlags.npcRelations.{npcId} >= {value}',
  
  // Stats de personnage
  LEVEL: 'character.level >= {value}',
  CLASS: 'character.class === "{className}"',
  STAT: 'character.stats.{statName} >= {value}',
  
  // Inventaire
  HAS_ITEM: 'character.inventory.includes("{itemId}")',
  HAS_GOLD: 'character.gold >= {amount}',
  
  // Compagnons
  HAS_COMPANION: 'gameFlags.companions.includes("{companionId}")',
  
  // Combinaisons logiques
  AND: '{condition1} && {condition2}',
  OR: '{condition1} || {condition2}',
  NOT: '!{condition}'
};

/**
 * Helpers de validation
 */
export const SceneValidators = {
  isValidSceneType: (type) => Object.values(SCENE_TYPES).includes(type),
  isValidActionType: (type) => Object.values(ACTION_TYPES).includes(type),
  
  validateScene: (scene) => {
    const errors = [];
    
    if (!scene.metadata?.type) {
      errors.push('Scene must have a type');
    }
    
    if (!scene.content?.text) {
      errors.push('Scene must have text content');
    }
    
    if (!scene.choices || !Array.isArray(scene.choices)) {
      errors.push('Scene must have choices array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default {
  SCENE_TYPES,
  ACTION_TYPES,
  UnifiedSceneSchema,
  InteractiveSceneSchema,
  DialogueSceneSchema, 
  MerchantSceneSchema,
  GameFlagsSchema,
  ConditionTypes,
  SceneValidators
};