/**
 * Service de Génération Procédurale de Contenu
 * 
 * Ce service gère la création dynamique de contenu de jeu basé sur des templates
 * et le contexte actuel du joueur.
 */

import { SCENE_TYPES, PROCEDURAL_TYPES } from '../types/story.js';
import { SceneTemplates } from '../data/procedural/templates.js';
import { enemyTemplates } from '../data/enemies.js';

export class ProceduralGenerator {
  
  /**
   * Génère une scène complète basée sur un template et un contexte
   * @param {string} templateKey - Clé du template à utiliser
   * @param {object} context - Contexte de génération (niveau joueur, biome, etc.)
   * @returns {object} Scène générée conforme au UnifiedSceneSchema
   */
  static generateScene(templateKey, context = {}) {
    console.log(`🔍 Recherche du template: "${templateKey}"`);
    console.log(`📋 Templates disponibles:`, Object.keys(SceneTemplates));
    
    // ✅ GESTION SPÉCIALE: Templates virtuels qui n'existent pas physiquement
    if (templateKey === 'random_encounter') {
      console.log(`🎲 Template virtuel détecté: ${templateKey} - génération directe`);
      return this.generateRandomEncounterScene(context);
    }
    
    if (templateKey === 'combat_victory') {
      console.log(`🏆 Template de victoire détecté: ${templateKey} - scène déjà générée`);
      // Cette scène est déjà générée et stockée, on ne devrait jamais arriver ici
      // Mais au cas où, retourner une scène d'erreur informative
      return {
        id: 'proc_combat_victory_error',
        type: SCENE_TYPES.TEXT,
        content: {
          title: '⚠️ Erreur de Victoire',
          text: 'La scène de victoire devrait être pré-générée. Si vous voyez ceci, contactez le développeur.'
        },
        choices: [{
          text: 'Continuer quand même',
          next: 'continue_journey'
        }]
      };
    }
    
    const template = SceneTemplates[templateKey];
    if (!template) {
      console.error(`❌ Template '${templateKey}' introuvable dans:`, Object.keys(SceneTemplates));
      return this.generateErrorScene(templateKey);
    }
    
    console.log(`✅ Template trouvé: "${templateKey}"`);

    // Générer un seed unique pour cette scène
    const seed = this.generateSeed(templateKey, context);
    
    // Sélectionner les éléments du template
    const selectedElements = this.selectTemplateElements(template, context, seed);
    
    // Construire la scène unifiée
    const scene = this.buildUnifiedScene(selectedElements, context, seed);
    
    // Ajouter les métadonnées procédurales
    scene.generation = {
      template: templateKey,
      context: { ...context },
      variationSeed: seed,
      generatedAt: Date.now()
    };

    return scene;
  }

  /**
   * Génère une rencontre spécifique selon le biome et la difficulté
   * @param {string} biome - Type de biome (forest, dungeon, village, etc.)
   * @param {string} difficulty - Niveau de difficulté (easy, medium, hard)
   * @returns {object} Rencontre générée
   */
  static generateEncounter(biome, difficulty = 'medium') {
    // Lister les templates qui existent vraiment
    const availableTemplates = Object.keys(SceneTemplates).filter(key => 
      key.includes(`${biome}_encounter_`)
    );
    
    console.log(`🎯 Templates disponibles pour ${biome}:`, availableTemplates);
    
    // Si aucun template pour ce biome, utiliser forest par défaut
    if (availableTemplates.length === 0) {
      console.warn(`⚠️ Aucun template pour ${biome}, utilisation de forest`);
      return this.generateEncounter('forest', difficulty);
    }
    
    // Choisir un template aléatoirement parmi ceux qui existent
    const templateKey = this.selectRandom(availableTemplates);
    
    const context = {
      biome,
      difficulty,
      encounterType: templateKey.split('_')[2] // social, combat, discovery
    };

    return this.generateScene(templateKey, context);
  }

  /**
   * Génère un PNJ contextuel pour un lieu donné
   * @param {string} location - Lieu où apparaît le PNJ
   * @param {string} role - Rôle du PNJ (merchant, guard, traveler, etc.)
   * @returns {object} Données du PNJ généré
   */
  static generateNPC(location, role = 'random') {
    const npcTemplates = SceneTemplates.npcs?.[location] || SceneTemplates.npcs?.generic;
    
    if (!npcTemplates) {
      return this.generateGenericNPC(role);
    }

    const selectedTemplate = role === 'random' 
      ? this.selectRandom(npcTemplates)
      : npcTemplates.find(t => t.role === role) || this.selectRandom(npcTemplates);

    return {
      ...selectedTemplate,
      name: this.generateNPCName(),
      id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: Date.now()
    };
  }

  /**
   * Génère du dialogue contextuel pour un PNJ
   * @param {object} npc - Données du PNJ
   * @param {object} playerContext - Contexte du joueur
   * @returns {array} Options de dialogue générées
   */
  static generateDialogue(npc, playerContext = {}) {
    const dialogueTemplates = SceneTemplates.dialogues?.[npc.role] || SceneTemplates.dialogues?.generic;
    
    if (!dialogueTemplates) {
      return this.generateGenericDialogue(npc);
    }

    // Sélectionner les dialogues appropriés selon le contexte
    const relevantDialogues = dialogueTemplates.filter(dialogue => 
      this.isDialogueRelevant(dialogue, playerContext)
    );

    return relevantDialogues.length > 0 
      ? this.selectRandom(relevantDialogues)
      : this.generateGenericDialogue(npc);
  }

  /**
   * Génère un identifiant unique de scène procédurale
   * @param {string} type - Type de scène
   * @param {object} context - Contexte de génération
   * @returns {string} ID de scène procédurale
   */
  static generateProceduralSceneId(type, context = {}) {
    const timestamp = Date.now();
    const contextHash = this.hashContext(context);
    return `proc_${type}_${contextHash}_${timestamp}`;
  }

  /**
   * Génère une scène de combat complète avec ennemis sélectionnés selon le CR
   * @param {string} encounterType - Type de rencontre (bandit_ambush, beast_attack, etc.)
   * @param {object} context - Contexte (biome, difficulty, surprise, etc.)
   * @returns {object} Scène de combat générée
   */
  static generateCombatScene(encounterType, context = {}) {
    console.log(`🗡️ Génération combat: ${encounterType}`, context);
    
    // Sélectionner les ennemis selon le biome et la difficulté
    const enemies = this.selectEnemiesForEncounter(context);
    const enemyPositions = this.generateEnemyPositions(enemies.length);
    
    // Générer le contenu narratif
    const narrativeContent = this.generateCombatNarrative(encounterType, context, enemies);
    
    // Calculer les récompenses
    const rewards = this.calculateCombatRewards(enemies, context);
    
    return {
      id: this.generateProceduralSceneId('combat', context),
      type: SCENE_TYPES.COMBAT,
      content: narrativeContent,
      // ✅ Format attendu par EnemyFactory - Grouper les ennemis identiques
      enemies: this.groupEnemiesByType(enemies),
      enemyPositions: enemyPositions,
      choices: [{
        text: 'Commencer le combat'
      }],
      onVictory: {
        next: this.generatePostCombatSceneId(context),
        text: 'Victoire ! Vous fouillez le champ de bataille...',
        consequences: rewards,
        // Générer directement la scène post-combat complète
        generatedScene: this.generatePostCombatScene(context, rewards)
      },
      metadata: {
        chapter: 'procedural',
        location: context.biome || 'battlefield',
        tags: ['procedural_combat', encounterType, context.difficulty || 'medium'],
        environment: context.biome || 'wilderness'
      },
      generation: {
        template: encounterType,
        context: { ...context },
        enemies: enemies,
        generatedAt: Date.now()
      }
    };
  }

  /**
   * Génère une scène de texte narrative procédurale
   * @param {string} textType - Type de texte (exploration_result, dialogue_outcome, etc.)
   * @param {object} context - Contexte de génération
   * @returns {object} Scène TEXT générée
   */
  static generateTextScene(textType, context = {}) {
    console.log(`📝 Génération texte: ${textType}`, context);
    
    const narrativeContent = this.generateTextNarrative(textType, context);
    const choices = this.generateTextChoices(textType, context);
    
    return {
      id: this.generateProceduralSceneId('text', context),
      type: SCENE_TYPES.TEXT,
      content: narrativeContent,
      choices: choices,
      metadata: {
        chapter: 'procedural',
        location: context.location || 'unknown',
        tags: ['procedural_text', textType],
        environment: context.biome || 'neutral'
      },
      generation: {
        template: textType,
        context: { ...context },
        generatedAt: Date.now()
      }
    };
  }

  /**
   * Génère une scène de dialogue procédurale
   * @param {string} dialogueType - Type de dialogue (npc_meeting, merchant_encounter, etc.)
   * @param {object} context - Contexte avec données du PNJ
   * @returns {object} Scène DIALOGUE générée
   */
  static generateDialogueScene(dialogueType, context = {}) {
    console.log(`💬 Génération dialogue: ${dialogueType}`, context);
    
    const npc = context.npc || this.generateContextualNPC(context);
    const dialogueContent = this.generateDialogueContent(dialogueType, npc, context);
    const dialogueChoices = this.generateDialogueChoices(dialogueType, npc, context);
    
    return {
      id: this.generateProceduralSceneId('dialogue', context),
      type: SCENE_TYPES.DIALOGUE,
      content: dialogueContent,
      choices: dialogueChoices,
      npc: npc,
      metadata: {
        chapter: 'procedural',
        location: context.location || npc?.location || 'encounter',
        tags: ['procedural_dialogue', dialogueType, npc?.role || 'generic'],
        environment: context.biome || 'neutral'
      },
      generation: {
        template: dialogueType,
        context: { ...context },
        npc: npc,
        generatedAt: Date.now()
      }
    };
  }

  // === MÉTHODES UTILITAIRES PRIVÉES ===

  /**
   * Génère un seed reproductible basé sur le template et le contexte
   */
  static generateSeed(templateKey, context) {
    const contextString = JSON.stringify(context);
    const combined = templateKey + contextString + Date.now();
    return this.simpleHash(combined);
  }

  /**
   * Sélectionne les éléments du template selon le contexte
   */
  static selectTemplateElements(template, context, seed) {
    const rng = this.createSeededRandom(seed);
    
    return {
      description: this.selectRandomWithSeed(template.descriptions || [], rng),
      encounter: this.selectContextualEncounter(template.encounters, context, rng),
      npc: this.selectContextualNPC(template.npcs, context, rng),
      rewards: this.selectRewards(template.rewards, context, rng)
    };
  }

  /**
   * Construit une scène conforme au UnifiedSceneSchema
   */
  static buildUnifiedScene(elements, context, seed) {
    const sceneId = this.generateProceduralSceneId(PROCEDURAL_TYPES.RANDOM_ENCOUNTER, context);
    
    return {
      id: sceneId,
      type: SCENE_TYPES.HUB, // ✅ Type HUB pour déclencher le bon composant
      
      content: {
        text: elements.description || 'Une zone à explorer s\'ouvre devant vous.',
        title: `${this.getBiomeTitle(context.biome || 'unknown')} - Exploration`,
        description: 'Zone générée procéduralement'
      },
      
      choices: this.generateExplorationChoices(elements, context),
      
      conditions: {
        show_if: 'true' // Toujours visible pour les scènes procédurales
      },

      // ✅ Données spécifiques à l'exploration - Format attendu par ExplorationScene
      exploration: {
        encounters: elements.encounter ? [elements.encounter] : [],
        npcs: elements.npc ? [elements.npc] : [],
        rewards: elements.rewards || [],
        biome: context.biome || 'unknown',
        // Ajouter les éléments pour le composant
        availableActions: ['explore', 'continue'],
        discoveredElements: []
      },

      metadata: {
        chapter: 'procedural',
        location: context.biome || 'generated_area',
        tags: ['procedural', 'exploration', context.difficulty || 'medium'],
        environment: context.biome || 'wilderness'
      }
    };
  }

  /**
   * Génère les choix pour une scène d'exploration
   */
  static generateExplorationChoices(elements, context) {
    const choices = [
      {
        text: '🔍 Explorer la zone',
        next: 'proc_explore_action',
        consequences: {
          // Déclenche un événement procédural
        }
      }
    ];

    // Ajouter des choix contextuels selon les éléments disponibles
    if (elements.npc) {
      choices.push({
        text: `💬 Approcher ${elements.npc.name || 'l\'individu'}`,
        next: 'proc_npc_interaction'
      });
    }

    if (elements.encounter && elements.encounter.type === 'combat') {
      choices.push({
        text: '⚔️ Se préparer au combat',
        next: 'proc_combat_encounter'
      });
    }

    // Toujours permettre de continuer
    choices.push({
      text: '➡️ Continuer son chemin',
      next: 'continue_journey' // Retour à la narration principale
    });

    return choices;
  }

  /**
   * Sélectionne un élément aléatoire d'un tableau
   */
  static selectRandom(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Sélectionne un élément selon des poids
   */
  static selectRandomWeighted(weightedArray) {
    const totalWeight = weightedArray.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedArray) {
      random -= item.weight;
      if (random <= 0) return item.type;
    }
    
    return weightedArray[0].type; // Fallback
  }

  /**
   * Hash simple pour générer des seeds reproductibles
   */
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Crée un générateur aléatoire seedé
   */
  static createSeededRandom(seed) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  /**
   * Génère une scène d'erreur en cas de problème
   */
  static generateErrorScene(templateKey) {
    return {
      id: `error_${Date.now()}`,
      type: SCENE_TYPES.TEXT,
      content: {
        text: `Erreur de génération procédurale (template: ${templateKey}). Vous continuez votre chemin...`,
        title: 'Erreur de Génération'
      },
      choices: [{
        text: 'Continuer',
        next: 'continue_journey'
      }],
      metadata: {
        tags: ['error', 'procedural']
      }
    };
  }

  // === MÉTHODES UTILITAIRES SUPPLÉMENTAIRES ===

  static hashContext(context) {
    const str = JSON.stringify(context);
    return this.simpleHash(str).toString(36).substr(2, 8);
  }

  static selectRandomWithSeed(array, rng) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(rng() * array.length)];
  }

  static selectContextualEncounter(encounters, context, rng) {
    if (!encounters || !encounters[context.difficulty]) return null;
    return this.selectRandomWithSeed(encounters[context.difficulty], rng);
  }

  static selectContextualNPC(npcs, context, rng) {
    if (!npcs || !Array.isArray(npcs) || npcs.length === 0) {
      // Générer un PNJ générique si aucun n'est défini dans le template
      return this.generateGenericNPC('traveler');
    }
    return this.selectRandomWithSeed(npcs, rng);
  }

  static selectRewards(rewards, context, rng) {
    if (!rewards || !rewards[context.difficulty]) return [];
    return this.selectRandomWithSeed(rewards[context.difficulty], rng);
  }

  static generateNPCName() {
    const firstNames = ['Aldric', 'Brenna', 'Caius', 'Dara', 'Ewan', 'Fira', 'Gareth', 'Hilda'];
    const lastNames = ['Forgefer', 'Ventelame', 'Pierredor', 'Boisvert', 'Flammecoeur', 'Glacelune'];
    
    const firstName = this.selectRandom(firstNames);
    const lastName = this.selectRandom(lastNames);
    return `${firstName} ${lastName}`;
  }

  static generateGenericNPC(role) {
    return {
      role: role || 'traveler',
      personality: this.selectRandom(['friendly', 'neutral', 'suspicious', 'helpful']),
      name: this.generateNPCName(),
      description: 'Un individu que vous croisez sur votre chemin.'
    };
  }

  static generateGenericDialogue(npc) {
    // Utiliser les dialogues génériques des templates
    return SceneTemplates.dialogues?.generic || [
      {
        text: 'Bonjour, voyageur. Comment puis-je vous aider ?',
        responses: [
          { text: 'Bonjour.', action: 'greet' },
          { text: 'Connaissez-vous les environs ?', action: 'ask_area' },
          { text: 'Bonne journée.', action: 'leave' }
        ]
      }
    ];
  }

  static isDialogueRelevant(dialogue, playerContext) {
    // Logique pour déterminer si un dialogue est pertinent
    // Basé sur le niveau, la réputation, les quêtes actives, etc.
    return true; // Simplifié pour l'instant
  }

  /**
   * Génère un titre approprié pour le biome
   */
  static getBiomeTitle(biome) {
    // Utiliser les templates des scènes pour générer des titres cohérents
    const templateKey = `${biome}_encounter_social`;
    const template = SceneTemplates[templateKey];
    
    if (template && template.descriptions) {
      // Extraire un titre naturel de la première description
      const description = template.descriptions[0];
      return description.split('.')[0] + '...';
    }
    
    // Fallback simple
    const simpleEmojis = { forest: '🌲', village: '🏘️', dungeon: '🏰', mountain: '⛰️', wilderness: '🌿' };
    return `${simpleEmojis[biome] || '❓'} Zone d'Exploration`;
  }

  // === MÉTHODES DE GÉNÉRATION DE CONTENU SPÉCIALISÉES ===

  /**
   * Sélectionne les ennemis appropriés selon le contexte et challengeRating
   */
  static selectEnemiesForEncounter(context) {
    const { biome = 'forest', difficulty = 'medium', playerLevel = 1 } = context;
    
    // Définir les CR appropriés selon la difficulté et le niveau joueur
    const targetCRs = this.getTargetChallengeRatings(difficulty, playerLevel);
    
    // Filtrer les ennemis selon le biome et le CR
    const suitableEnemies = Object.entries(enemyTemplates).filter(([key, enemy]) => {
      return this.isEnemySuitableForContext(enemy, biome, targetCRs);
    });
    
    console.log(`🎯 Ennemis disponibles pour ${biome} (${difficulty}):`, suitableEnemies.map(([k,e]) => `${e.name} (CR ${e.challengeRating})`));
    
    if (suitableEnemies.length === 0) {
      console.warn('⚠️ Aucun ennemi adapté, utilisation des gobelins par défaut');
      return [{ id: 'gobelin', ...enemyTemplates.gobelin }];
    }
    
    // Sélectionner 1-3 ennemis selon la difficulté
    const enemyCount = this.getEnemyCount(difficulty);
    const selectedEnemies = [];
    
    for (let i = 0; i < enemyCount; i++) {
      const [enemyKey, enemyData] = this.selectRandom(suitableEnemies);
      selectedEnemies.push({ id: enemyKey, ...enemyData });
    }
    
    return selectedEnemies;
  }

  /**
   * Détermine les Challenge Ratings cibles selon difficulté et niveau
   */
  static getTargetChallengeRatings(difficulty, playerLevel) {
    const crMappings = {
      easy: ['1/8', '1/4'],
      medium: ['1/4', '1/2', '1'],
      hard: ['1/2', '1', '2'],
      deadly: ['1', '2', '3']
    };
    
    return crMappings[difficulty] || crMappings.medium;
  }

  /**
   * Vérifie si un ennemi convient au contexte
   */
  static isEnemySuitableForContext(enemy, biome, targetCRs) {
    // Vérifier le Challenge Rating
    if (!targetCRs.includes(enemy.challengeRating)) {
      return false;
    }
    
    // Associations biome -> IDs d'ennemis (utiliser les clés de enemyTemplates)
    const biomeEnemies = {
      forest: ['gobelin', 'kobold', 'ombre', 'goule'],
      village: ['gobelin', 'mageNoir'],
      dungeon: ['squelette', 'goule', 'ombre', 'molosse_ombre', 'diablotin', 'diable', 'mageNoir'],
      mountain: ['kobold', 'gobelin'],
      wilderness: ['gobelin', 'kobold', 'ombre', 'mephiteBoueux']
    };
    
    // Si aucune restriction de biome, accepter tous les ennemis
    const allowedEnemyIds = biomeEnemies[biome];
    if (!allowedEnemyIds) return true;
    
    // Pour identifier l'ennemi, on utilise la propriété enemy.name directement
    // car on n'a pas l'ID de l'ennemi ici
    const enemyName = enemy.name?.toLowerCase() || '';
    
    // Mapping des noms d'ennemis vers leurs IDs
    const nameToId = {
      'gobelin': 'gobelin',
      'kobold': 'kobold', 
      'ombre': 'ombre',
      'goule': 'goule',
      'squelette': 'squelette',
      'molosse d\'ombre': 'molosse_ombre',
      'diablotin': 'diablotin',
      'diable épineux': 'diable',
      'mage noir': 'mageNoir',
      'méphite boueux': 'mephiteBoueux'
    };
    
    // Trouver l'ID correspondant au nom
    const enemyId = Object.entries(nameToId).find(([name, id]) => enemyName.includes(name))?.[1];
    
    return enemyId ? allowedEnemyIds.includes(enemyId) : false;
  }

  /**
   * Détermine le nombre d'ennemis selon la difficulté
   */
  static getEnemyCount(difficulty) {
    const counts = {
      easy: 1,
      medium: this.selectRandom([1, 2]),
      hard: this.selectRandom([2, 3]),
      deadly: this.selectRandom([3, 4])
    };
    return counts[difficulty] || 1;
  }

  /**
   * Génère les positions des ennemis sur la grille
   */
  static generateEnemyPositions(enemyCount) {
    const positions = [
      { x: 3, y: 2 },
      { x: 4, y: 3 },
      { x: 2, y: 3 },
      { x: 5, y: 2 },
      { x: 3, y: 4 }
    ];
    
    return positions.slice(0, enemyCount);
  }

  /**
   * Génère le contenu narratif pour un combat
   */
  static generateCombatNarrative(encounterType, context, enemies) {
    const narratives = {
      bandit_ambush: {
        title: 'Embuscade de Bandits',
        text: `Des bandits surgissent des buissons ! ${enemies.map(e => e.name).join(', ')} vous attaquent par surprise !`
      },
      beast_attack: {
        title: 'Attaque de Créatures',
        text: `Des créatures sauvages vous attaquent ! Vous devez vous défendre contre ${enemies.map(e => e.name).join(', ')} !`
      },
      undead_encounter: {
        title: 'Rencontre Mort-Vivante',
        text: `Des mort-vivants émergent des ombres... ${enemies.map(e => e.name).join(', ')} rôdent vers vous !`
      }
    };
    
    return narratives[encounterType] || {
      title: 'Combat Inattendu',
      text: `Un combat se déclenche ! Vous affrontez ${enemies.map(e => e.name).join(', ')} !`
    };
  }

  /**
   * Calcule les récompenses selon les ennemis vaincus
   */
  static calculateCombatRewards(enemies, context) {
    const totalXP = enemies.reduce((sum, enemy) => sum + (enemy.xp || 0), 0);
    const baseGold = Math.floor(totalXP / 10); // 1 or par 10 XP
    
    const rewards = {
      experience: totalXP,
      gold: baseGold
    };
    
    // Ajouter des items selon le contexte
    if (context.biome === 'dungeon') {
      rewards.items = ['potion_guerison'];
    } else if (context.difficulty === 'hard') {
      rewards.items = ['piece_or', 'arme_simple'];
    }
    
    return rewards;
  }

  /**
   * Génère l'ID de scène post-combat
   */
  static generatePostCombatSceneId(context) {
    return 'proc_combat_victory'; // On générera cette scène à la volée
  }

  /**
   * Génère une scène post-combat complète
   */
  static generatePostCombatScene(context, rewards) {
    // Récupérer l'ID du hub procédural actuel depuis le contexte
    const currentHubId = context.currentHubId || context.originalHubId || context.sceneId;
    
    const victoryScene = {
      id: 'proc_combat_victory',
      type: SCENE_TYPES.TEXT,
      content: {
        title: '🏆 Victoire !',
        text: `Le combat est terminé ! Vous fouillez le champ de bataille et trouvez quelques objets de valeur.
        
        ${rewards.experience ? `💫 Vous gagnez ${rewards.experience} points d'expérience !` : ''}
        ${rewards.gold ? `💰 Vous trouvez ${rewards.gold} pièces d'or !` : ''}
        ${rewards.items ? `🎁 Objets trouvés : ${rewards.items.join(', ')}` : ''}`
      },
      choices: [
        {
          text: '🔍 Continuer l\'exploration du hub',
          next: currentHubId // Retourner au hub procédural actuel
        },
        {
          text: '➡️ Quitter cette zone',
          next: 'continue_journey'
        }
      ],
      metadata: {
        chapter: 'procedural',
        location: 'post_combat',
        tags: ['combat_victory', 'hub_return', 'procedural']
      }
    };

    // ✅ La scène sera stockée via le système onVictory.generatedScene
    // Pas besoin de stocker ici, le système de combat s'en occupe

    return victoryScene;
  }

  /**
   * Génère du contenu textuel contextuel
   */
  static generateTextNarrative(textType, context) {
    // Utiliser les descriptions des templates existants
    const biome = context.biome || 'forest';
    const templateKey = `${biome}_encounter_discovery`;
    const template = SceneTemplates[templateKey] || SceneTemplates['forest_encounter_discovery'];
    
    if (template && template.descriptions) {
      return {
        title: 'Résultat d\'Exploration',
        text: this.selectRandom(template.descriptions)
      };
    }
    
    return {
      title: 'Continuation',
      text: 'Votre aventure continue...'
    };
  }

  /**
   * Génère les choix pour une scène textuelle
   */
  static generateTextChoices(textType, context) {
    // Choix génériques pour retourner au hub ou continuer
    return [
      {
        text: '🔍 Explorer plus en détail',
        action: 'explore_more'
      },
      {
        text: '↩️ Retour à l\'exploration',
        action: 'return_hub'
      },
      {
        text: '➡️ Continuer son chemin',
        next: 'continue_journey'
      }
    ];
  }

  /**
   * Génère un PNJ contextuel
   */
  static generateContextualNPC(context) {
    // Utiliser les NPCs des templates existants
    const biome = context.biome || 'forest';
    const npcTemplate = SceneTemplates.npcs?.[biome] || SceneTemplates.npcs?.generic || [];
    
    if (npcTemplate.length > 0) {
      const baseNpc = this.selectRandom(npcTemplate);
      return {
        ...this.generateGenericNPC(baseNpc.role),
        personality: baseNpc.personality,
        knowledge: baseNpc.knowledge,
        services: baseNpc.services,
        location: context.biome
      };
    }
    
    return this.generateGenericNPC('traveler');
  }

  /**
   * Génère le contenu d'un dialogue
   */
  static generateDialogueContent(dialogueType, npc, context) {
    // Utiliser les dialogues des templates
    const role = npc.role || 'generic';
    const dialogues = SceneTemplates.dialogues?.[role] || SceneTemplates.dialogues?.generic || [];
    
    if (dialogues.length > 0) {
      const dialogue = this.selectRandom(dialogues);
      return {
        title: `Conversation avec ${npc.name}`,
        text: `${npc.name}: "${dialogue.text || npc.defaultDialogue || 'Bonjour, voyageur. Comment puis-je vous aider ?'}"`
      };
    }
    
    return {
      title: `Conversation avec ${npc.name}`,
      text: `${npc.name} vous regarde. "${npc.defaultDialogue || 'Bonjour, voyageur. Comment puis-je vous aider ?'}"`
    };
  }

  /**
   * Génère les choix d'un dialogue
   */
  static generateDialogueChoices(dialogueType, npc, context) {
    // Utiliser les choix des templates de dialogues
    const role = npc.role || 'generic';
    const dialogues = SceneTemplates.dialogues?.[role] || SceneTemplates.dialogues?.generic || [];
    
    if (dialogues.length > 0) {
      const dialogue = this.selectRandom(dialogues);
      if (dialogue.responses) {
        return dialogue.responses.map(response => ({
          text: response.text,
          action: response.action
        }));
      }
    }
    
    // Fallback vers des choix génériques
    return [
      {
        text: 'Demander des informations',
        action: 'ask_info'
      },
      {
        text: 'Proposer un échange',
        action: 'trade'
      },
      {
        text: 'Saluer et partir',
        action: 'leave'
      }
    ];
  }

  /**
   * Génère une scène de rencontre aléatoire (template virtuel)
   * Utilisé quand on veut une scène hub déjà générée précédemment
   */
  static generateRandomEncounterScene(context) {
    console.log('🎲 Génération de scène de rencontre aléatoire:', context);
    
    // Utiliser un template réel selon le biome
    const biome = context.biome || 'forest';
    const availableTemplates = Object.keys(SceneTemplates).filter(key => 
      key.startsWith(`${biome}_encounter_`)
    );
    
    if (availableTemplates.length === 0) {
      // Fallback vers forest
      const fallbackTemplate = 'forest_encounter_social';
      console.log(`⚠️ Pas de template pour ${biome}, utilisation de ${fallbackTemplate}`);
      return this.generateScene(fallbackTemplate, { ...context, biome: 'forest' });
    }
    
    // Choisir un template aléatoirement
    const selectedTemplate = this.selectRandom(availableTemplates);
    console.log(`✨ Template sélectionné pour rencontre aléatoire: ${selectedTemplate}`);
    
    return this.generateScene(selectedTemplate, context);
  }

  /**
   * Groupe les ennemis identiques pour EnemyFactory
   * Convertit ['gobelin', 'gobelin', 'ombre'] → [{type: 'gobelin', count: 2}, {type: 'ombre', count: 1}]
   */
  static groupEnemiesByType(enemies) {
    const grouped = {};
    
    enemies.forEach(enemy => {
      if (grouped[enemy.id]) {
        grouped[enemy.id].count++;
      } else {
        grouped[enemy.id] = {
          type: enemy.id,
          count: 1
        };
      }
    });
    
    return Object.values(grouped);
  }
}