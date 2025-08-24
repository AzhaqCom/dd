/**
 * Variables persistantes du jeu
 * Ces flags permettent de suivre l'état narratif et les choix du joueur
 */

export const initialGameFlags = {
  // === FLAGS PRINCIPAUX DE L'HISTOIRE ===
  hasSymbol: false,                    // Le joueur a-t-il le symbole mystérieux
  manuscriptRead: false,               // Le manuscrit de l'académie a été lu
  bridgeSecretFound: false,            // Le secret du pont ancien découvert
  
  // === RENCONTRES ET COMPAGNONS ===
  tyrionMet: false,                    // Tyrion a été rencontré
  tyrionRejected: false,               // Tyrion a été rejeté poliment
  tyrionDelayed: false,                // Proposition à Tyrion reportée
  rhingannMet: false,                  // Rhingann a été rencontré
  
  // === QUÊTES ET ÉVÉNEMENTS ===
  completedGoblinQuest: false,         // Quête des gobelins terminée
  visitedTavern: false,                // La taverne a été visitée
  coldWeather: false,                  // Il fait froid (pour la cheminée)
  questActive: false,                  // Une quête est en cours
  
  // === VARIABLES NUMÉRIQUES ===
  reputation: 0,                       // Réputation générale (-100 à 100)
  factionReputation:{},          // Réputation par faction (ex: [{ ravenscroft: 5 }])
  
  // === LISTES ET COLLECTIONS ===
  companions: [],                      // Liste des compagnons actuels
  completedQuests: [],                 // Liste des quêtes terminées
  visitedLocations: [],               // Lieux visités
  majorChoices: [],                   // Choix importants effectués
  
  // === RELATIONS AVEC LES PNJ ===
  npcRelations: {
    tyrion: 0,                        // Relation avec Tyrion (-100 à 100)
    aldric: 0,                        // Relation avec le marchand Aldric
    rhingann: 0,                      // Relation avec Rhingann
    // Autres PNJ seront ajoutés ici
  },
  
  // === FLAGS DE TUTORIAL ET UI ===
  tutorialCompleted: false,           // Tutorial terminé
  firstCombat: true,                  // Premier combat
  
  // === DÉCOUVERTES ET CONNAISSANCES ===
  discoveredSecrets: [],              // Secrets découverts
  learnedSpells: [],                  // Sorts appris via l'histoire
  
  // === FLAGS TEMPORAIRES ===
  // Ces flags peuvent être réinitialisés ou modifiés temporairement
  lastTavernVisit: null,              // Timestamp de la dernière visite à la taverne
  currentWeather: 'clear',            // Météo actuelle
  
  // === FLAGS DE DIFFICULTÉS ET ACHIEVEMENTS ===
  pacifistRun: true,                  // Aucun ennemi tué (jusqu'à présent)
  perfectDiplomat: true,              // Tous les conflits résolus par la diplomatie
  treasureHunter: 0,                  // Nombre de trésors trouvés
  
  // === FLAGS SPÉCIFIQUES AUX LIEUX ===
  academyReturns: 0,                  // Nombre de retours à l'académie
  tavernRoomKey: false,               // Clé de la chambre de taverne
  aldricTrust: 0,                     // Niveau de confiance avec Aldric (0-100)
};

/**
 * Helpers pour manipuler les flags
 */
export const GameFlagsHelpers = {
  
  /**
   * Initialise les flags avec des valeurs par défaut
   */
  getInitialFlags: () => ({ ...initialGameFlags }),
  
  /**
   * Vérifie si un flag existe
   */
  hasFlag: (flags, flagName) => {
    return flags.hasOwnProperty(flagName);
  },
  
  /**
   * Obtient la valeur d'un flag avec une valeur par défaut
   */
  getFlag: (flags, flagName, defaultValue = false) => {
    return flags[flagName] ?? defaultValue;
  },
  
  /**
   * Met à jour un flag
   */
  setFlag: (flags, flagName, value) => {
    return {
      ...flags,
      [flagName]: value
    };
  },
  
  /**
   * Met à jour plusieurs flags
   */
  setFlags: (flags, updates) => {
    return {
      ...flags,
      ...updates
    };
  },
  
  /**
   * Ajoute un élément à une liste si pas déjà présent
   */
  addToList: (flags, listName, item) => {
    const currentList = flags[listName] || [];
    if (!currentList.includes(item)) {
      return {
        ...flags,
        [listName]: [...currentList, item]
      };
    }
    return flags;
  },
  
  /**
   * Retire un élément d'une liste
   */
  removeFromList: (flags, listName, item) => {
    const currentList = flags[listName] || [];
    return {
      ...flags,
      [listName]: currentList.filter(i => i !== item)
    };
  },
  
  /**
   * Met à jour une relation avec un PNJ
   */
  updateNpcRelation: (flags, npcId, change) => {
    const currentRelation = flags.npcRelations?.[npcId] || 0;
    const newRelation = Math.max(-100, Math.min(100, currentRelation + change));
    
    return {
      ...flags,
      npcRelations: {
        ...flags.npcRelations,
        [npcId]: newRelation
      }
    };
  },
  
  /**
   * Met à jour la réputation générale
   */
  updateReputation: (flags, change) => {
    const newReputation = Math.max(-100, Math.min(100, (flags.reputation || 0) + change));
    return {
      ...flags,
      reputation: newReputation
    };
  },
  
  /**
   * Ajoute un choix majeur à l'historique
   */
  addMajorChoice: (flags, choiceId, description, sceneId) => {
    const choice = {
      id: choiceId,
      description,
      sceneId,
      timestamp: Date.now()
    };
    
    return {
      ...flags,
      majorChoices: [...(flags.majorChoices || []), choice]
    };
  },
  
  /**
   * Marque un lieu comme visité
   */
  visitLocation: (flags, locationId) => {
    return GameFlagsHelpers.addToList(flags, 'visitedLocations', locationId);
  },
  
  /**
   * Marque une quête comme terminée
   */
  completeQuest: (flags, questId) => {
    return GameFlagsHelpers.addToList(flags, 'completedQuests', questId);
  },
  
  /**
   * Vérifie si une quête est terminée
   */
  isQuestCompleted: (flags, questId) => {
    return (flags.completedQuests || []).includes(questId);
  },
  
  /**
   * Obtient le niveau de relation avec un PNJ
   */
  getNpcRelation: (flags, npcId) => {
    return flags.npcRelations?.[npcId] || 0;
  },
  
  /**
   * Obtient le statut de relation avec un PNJ (texte)
   */
  getNpcRelationStatus: (flags, npcId) => {
    const relation = GameFlagsHelpers.getNpcRelation(flags, npcId);
    
    if (relation >= 75) return 'Adoré';
    if (relation >= 50) return 'Ami proche';
    if (relation >= 25) return 'Ami';
    if (relation >= 10) return 'Sympathique';
    if (relation >= -10) return 'Neutre';
    if (relation >= -25) return 'Méfiant';
    if (relation >= -50) return 'Hostile';
    if (relation >= -75) return 'Ennemi';
    return 'Ennemi juré';
  },
  
  /**
   * Debug : affiche l'état actuel des flags
   */
  debugFlags: (flags) => {
    console.group('🏴 Game Flags Debug');
    console.log('Reputation:', flags.reputation);
    console.log('Companions:', flags.companions);
    console.log('NPC Relations:', flags.npcRelations);
    console.log('Completed Quests:', flags.completedQuests);
    console.log('Visited Locations:', flags.visitedLocations);
    console.log('Major Choices:', flags.majorChoices);
    console.groupEnd();
  }
};

export default {
  initialGameFlags,
  GameFlagsHelpers
};