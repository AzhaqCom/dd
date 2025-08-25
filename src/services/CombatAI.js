/**
 * CombatAI - Système unifié intelligent
 * 
 */

import { ActionPlanner } from './ai/ActionPlanner';
import { CombatEngine } from './combatEngine';
import { SpellServiceUnified } from './SpellServiceUnified';

export class CombatAI {
  
  /**
   * POINT D'ENTRÉE PRINCIPAL - Exécute le tour d'une entité
   * @param {Object} entity - L'entité qui joue (ennemi ou compagnon)
   * @param {Object} gameState - État du jeu
   * @param {Function} onMessage - Callback pour les messages
   * @param {Function} onDamage - Callback pour les dégâts 
   * @param {Function} onNextTurn - Callback pour passer au suivant
   */
  static executeEntityTurn(entity, gameState, onMessage, onDamage, onNextTurn) {
    console.log(`🎯 CombatAI UNIFIÉ: Tour de ${entity.name} (${entity.type}) - IA: ActionPlanner + Sorts: SpellServiceUnified`);

    try {
      // 1. Vérifier que l'entité est vivante
      if (entity.currentHP <= 0) {
        onMessage(`${entity.name} est inconscient et passe son tour.`, 'info');
        setTimeout(() => onNextTurn(), 500);
        return;
      }

      // 2. IA TACTIQUE AVANCÉE : Planifier tour complet avec mouvement
      console.log(`🧠 DEBUG: Début planification tactique pour ${entity.name}`);
      console.log(`🧠 DEBUG: Entity data:`, {
        name: entity.name,
        role: entity.role,
        movement: entity.movement,
        currentHP: entity.currentHP,
        maxHP: entity.maxHP,
        aiPriority: entity.aiPriority
      });
      console.log(`🧠 DEBUG: GameState positions:`, gameState.combatPositions);
      
      let turnPlan;
      try {
        turnPlan = ActionPlanner.planCompleteTurn(entity, gameState);
        console.log(`🧠 DEBUG: Plan créé:`, turnPlan);
      } catch (planError) {
        console.error(`❌ DEBUG: Erreur dans planCompleteTurn:`, planError);
        throw planError;
      }
      
      if (!turnPlan || turnPlan.phases.length === 0) {
        // Fallback vers ancien système si pas de plan
        console.log(`⚠️ Pas de plan tactique, fallback vers action simple`);
        const action = ActionPlanner.getBestAction(entity, gameState);
        
        if (!action) {
          onMessage(`${entity.name} ne trouve rien à faire et passe son tour.`, 'info');
          setTimeout(() => onNextTurn(), 500);
          return;
        }

        // Exécution action simple
        const result = this.executeAction(entity, action, gameState);
        this.applyResults(result, onMessage, onDamage);
        setTimeout(() => onNextTurn(), 1000);
        return;
      }

      console.log(`🎯 Plan tactique: ${turnPlan.describe()}`);

      // 3. EXÉCUTION SÉQUENTIELLE DES PHASES DU PLAN
      this.executeTurnPlan(entity, turnPlan, gameState, {
        onMessage,
        onDamage, 
        onNextTurn
      });
      
    } catch (error) {
      console.error(`❌ Erreur dans le tour de ${entity.name}:`, error);
      onMessage(`Erreur dans le tour de ${entity.name}`, 'error');
      setTimeout(() => onNextTurn(), 500);
    }
  }

  /**
   * EXÉCUTEUR D'ACTION UNIFIÉ
   * Prend une action décidée par ActionPlanner et l'exécute
   */
  static executeAction(entity, action, gameState) {
    console.log(`⚡ CombatAI: Exécution de l'action "${action.type}" pour ${entity.name}`);
    
    switch (action.type) {
      case 'attack':
      case 'melee':
      case 'ranged':
        return this.executeAttack(entity, action, gameState);
        
      case 'spell':
        return this.executeSpell(entity, action, gameState);
        
      case 'protect':
      case 'taunt':
        return this.executeSupportAction(entity, action, gameState);
        
      default:
        console.warn(`Action de type "${action.type}" non reconnue.`);
        return {
          messages: [`Action inconnue: ${action.type}`],
          damage: [],
          healing: []
        };
    }
  }

  /**
   * ATTAQUE - Utilise CombatEngine.resolveAttack (qui existe et fonctionne)
   */
  static executeAttack(entity, action, gameState) {
    const attack = action.attack || action; // ActionPlanner peut structurer différemment
    const target = action.target;
    
    if (!target) {
      return {
        messages: [`${entity.name} n'a pas de cible valide.`],
        damage: [],
        healing: []
      };
    }

    console.log(`⚔️ ${entity.name} attaque ${target.name} avec ${attack.name}`);

    // Utiliser CombatEngine.resolveAttack qui fonctionne bien
    const attackResult = CombatEngine.resolveAttack(entity, target, attack);
    
    const result = {
      messages: [attackResult.message],
      damage: attackResult.success ? [{
        targetId: target.id || target.name,
        amount: attackResult.damage
      }] : [],
      healing: []
    };

    return result;
  }

  /**
   * SORT - Utilise SpellServiceUnified (système unifié existant et testé)
   */
  static executeSpell(entity, action, gameState) {
    const spell = action.spell;
    const targets = action.targets || [action.target].filter(Boolean);

    if (!spell || targets.length === 0) {
      return {
        messages: [`Le sort ${spell?.name || 'inconnu'} ne peut être lancé sans cible.`],
        damage: [],
        healing: []
      };
    }

    console.log(`🔮 ${entity.name} lance le sort "${spell.name}" sur ${targets.map(t => t.name).join(', ')}`);

    try {
      // UTILISER LE SYSTÈME DE SORTS UNIFIÉ QUI EXISTE ET QUI MARCHE
      const spellService = new SpellServiceUnified({
        combatStore: { combatPositions: gameState.combatPositions }
      });
      
      const spellResult = spellService.castSpell(entity, spell, targets, {
        context: 'combat',
        combatState: gameState
      });

      console.log(`🔍 SpellServiceUnified raw result:`, spellResult);
      console.log(`🔍 healingResults:`, spellResult.healingResults);

      // Mapper le résultat au format attendu
      const result = {
        messages: spellResult.messages || [],
        damage: (spellResult.damageResults || spellResult.damage || []).map(d => ({
          targetId: d.targetId,
          amount: d.damage || d.amount
        })),
        healing: (spellResult.healingResults || spellResult.healing || []).map(h => ({
          targetId: h.targetId,
          amount: h.amount
        }))
      };

      console.log(`🔮 Résultat du sort:`, result);
      return result;

    } catch (error) {
      console.error(`❌ Erreur lors du lancement du sort ${spell.name}:`, error);
      return {
        messages: [`Échec du lancement de ${spell.name}`],
        damage: [],
        healing: []
      };
    }
  }

  /**
   * ACTION DE SUPPORT (protect, taunt, etc.)
   */
  static executeSupportAction(entity, action, gameState) {
    const result = {
      messages: [],
      damage: [],
      healing: []
    };

    switch (action.type) {
      case 'protect':
        if (action.target) {
          result.messages.push(`🛡️ ${entity.name} protège ${action.target.name}`);
          // TODO: Implémenter l'effet de protection si nécessaire
        }
        break;
        
      case 'taunt':
        result.messages.push(`💢 ${entity.name} attire l'attention des ennemis`);
        // TODO: Implémenter l'effet de taunt si nécessaire
        break;
        
      default:
        result.messages.push(`${entity.name} tente une action de support inconnue`);
    }

    return result;
  }

  /**
   * APPLIQUE LES RÉSULTATS - Logique simple et robuste
   */
  static applyResults(result, onMessage, onDamage) {
    // Messages
    if (result.messages) {
      result.messages.forEach(msg => {
        const message = typeof msg === 'string' ? msg : msg.text || msg;
        onMessage(message, 'combat');
      });
    }

    // Dégâts
    if (result.damage) {
      result.damage.forEach(dmg => {
        console.log(`🩸 CombatAI applique ${dmg.amount} dégâts à ${dmg.targetId}`);
        onDamage(dmg.targetId, dmg.amount);
      });
    }

    // Soins (dégâts négatifs)
    if (result.healing) {
      result.healing.forEach(heal => {
        console.log(`💚 CombatAI applique ${heal.amount} soins à ${heal.targetId}`);
        onDamage(heal.targetId, -heal.amount);
      });
    }
  }

  // === MÉTHODES UTILITAIRES (si besoin) ===
  
  static findEntityPosition(entity, gameState) {
    const key = entity.name || entity.id;
    return gameState.combatPositions[key];
  }

  static findTargets(entity, gameState) {
    if (entity.type === 'enemy') {
      // Ennemis ciblent joueur + compagnons
      const targets = [];
      if (gameState.playerCharacter) targets.push(gameState.playerCharacter);
      if (gameState.activeCompanions) targets.push(...gameState.activeCompanions);
      return targets.filter(t => t.currentHP > 0);
    } else {
      // Compagnons ciblent les ennemis
      return (gameState.combatEnemies || []).filter(e => e.currentHP > 0);
    }
  }

  // === NOUVEAUX SYSTÈMES TACTIQUES - PHASE 2 ===

  /**
   * Exécute un plan de tour complet avec mouvement tactique
   * @param {Object} entity - L'entité qui exécute le plan
   * @param {TurnPlan} turnPlan - Plan à exécuter
   * @param {Object} gameState - État du jeu
   * @param {Object} callbacks - Callbacks {onMessage, onDamage, onNextTurn}
   */
  static async executeTurnPlan(entity, turnPlan, gameState, callbacks) {
    console.log(`🎮 Exécution du plan tactique de ${entity.name}: ${turnPlan.describe()}`);
    
    try {
      for (let i = 0; i < turnPlan.phases.length; i++) {
        const phase = turnPlan.phases[i];
        console.log(`📋 Phase ${i + 1}/${turnPlan.phases.length}: ${phase.type}`);
        
        switch (phase.type) {
          case 'move':
            await this.executeMovementPhase(entity, phase, gameState, callbacks);
            break;
          case 'attack':
          case 'ranged':  // FIX: Ajouter support pour type 'ranged'
          case 'spell':
          case 'support':
            await this.executeActionPhase(entity, phase, gameState, callbacks);
            break;
          case 'dash':
            await this.executeDashPhase(entity, phase, gameState, callbacks);
            break;
          default:
            console.warn(`⚠️ Type de phase inconnu: ${phase.type}`);
            break;
        }
        
        // Délai entre phases pour animation/lisibilité
        if (i < turnPlan.phases.length - 1) {
          await this.delay(600);
        }
      }
      
      // Tour terminé
      console.log(`✅ Plan tactique de ${entity.name} terminé`);
      setTimeout(() => callbacks.onNextTurn(), 800);
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution du plan de ${entity.name}:`, error);
      callbacks.onMessage(`Erreur dans l'exécution tactique de ${entity.name}`, 'error');
      setTimeout(() => callbacks.onNextTurn(), 500);
    }
  }

  /**
   * Exécute une phase de mouvement
   */
  static async executeMovementPhase(entity, phase, gameState, callbacks) {
    const { from, to, reason } = phase;
    
    // Vérification validité du mouvement
    const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    const maxMovement = entity.movement || 6;
    
    if (distance > maxMovement) {
      console.warn(`⚠️ Mouvement trop long pour ${entity.name}: ${distance} > ${maxMovement}`);
      callbacks.onMessage(`${entity.name} ne peut pas se déplacer si loin`, 'warning');
      return;
    }
    
    // Animation du déplacement
    callbacks.onMessage(`${entity.name} se déplace vers ${to.x},${to.y} (${reason})`, 'movement');
    
    // Mise à jour de la position - Recherche intelligente de clé
    let entityKey = entity.id || entity.name;
    
    // Vérifier si la clé actuelle existe, sinon chercher la bonne clé
    if (!gameState.combatPositions[entityKey]) {
      const possibleKeys = Object.keys(gameState.combatPositions);
      const matchingKey = possibleKeys.find(key => {
        const pos = gameState.combatPositions[key];
        return pos && pos.x === from.x && pos.y === from.y; // Même position de départ
      });
      
      if (matchingKey) {
        entityKey = matchingKey;
        console.log(`🔄 DEBUG: Clé corrigée pour ${entity.name}: "${entity.name}" → "${entityKey}"`);
      }
    }
    
    gameState.combatPositions[entityKey] = { x: to.x, y: to.y };
    console.log(`📍 DEBUG: Position mise à jour: ${entityKey} = {${to.x}, ${to.y}}`);
    
    // TODO: Vérifier attaques d'opportunité
    console.log(`🚶 ${entity.name} bouge de ${from.x},${from.y} vers ${to.x},${to.y} (${distance} cases)`);
    
    await this.delay(400); // Animation du mouvement
  }

  /**
   * Exécute une phase d'action (attaque, sort, support)
   */
  static async executeActionPhase(entity, phase, gameState, callbacks) {
    // Convertir phase en action compatible avec système existant
    const action = {
      type: phase.type,
      target: phase.target,
      attack: phase.attack,
      spell: phase.spell,
      ...phase
    };
    
    // Utiliser le système d'exécution existant
    const result = this.executeAction(entity, action, gameState);
    this.applyResults(result, callbacks.onMessage, callbacks.onDamage);
    
    await this.delay(200);
  }

  /**
   * Exécute une phase Dash (double mouvement)
   */
  static async executeDashPhase(entity, phase, gameState, callbacks) {
    callbacks.onMessage(`${entity.name} utilise l'action Dash (mouvement doublé)`, 'action');
    console.log(`🏃 ${entity.name} utilise Dash - mouvement doublé`);
    
    await this.delay(300);
  }

  /**
   * Utilitaire pour délais async
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}