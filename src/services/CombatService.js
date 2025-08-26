import { EnemyFactory } from './EnemyFactory'
import { spells } from '../data/spells'
import { getModifier } from '../utils/calculations'
import { CombatEngine } from './combatEngine'
import { ActionPlanner } from './ai/ActionPlanner'
import { SpellServiceUnified } from './SpellServiceUnified'
import { CombatEffects } from './combatEffects'


/**
 * Service gérant toute la logique métier du combat.
 * C'est l'orchestrateur principal pour les actions de combat.
 */
export class CombatService {
  // ... (méthodes d'initialisation existantes : initializeCombat, rollInitiative, etc.)

  /**
   * POINT D'ENTRÉE PRINCIPAL POUR LE TOUR D'UNE ENTITÉ (PNJ ou Compagnon)
   * Orchestre la décision de l'IA et l'exécution de l'action.
   */
  static executeTurn(entity, gameState) {

    const results = {
      messages: [],
      damage: [],
      healing: [],
      effects: [],
      movement: null,
      success: false,
    };

    try {
      // 1. Décision de l'IA : Que faire ?
      const bestAction = ActionPlanner.getBestAction(entity, gameState);

      if (!bestAction) {
        results.messages.push({
          text: `${entity.name} ne sait pas quoi faire et passe son tour.`, 
          type: 'info',
        });
 
        return results;
      }
      
   

      // 2. Exécution de l'action choisie
      const actionResult = CombatService.executeAction(entity, bestAction, gameState);

      // 3. Fusionner les résultats
      return { ...results, ...actionResult, success: true };

    } catch (error) {
      console.error(`💥 Erreur critique durant le tour de ${entity.name}:`, error);
      results.messages.push({
        text: `Une erreur est survenue durant le tour de ${entity.name}.`, 
        type: 'error',
      });
      return results;
    }
  }

  /**
   * EXÉCUTEUR D'ACTION UNIFIÉ
   * Prend une action (décidée par l'IA ou le joueur) et la délègue au bon sous-système.
   */
  static executeAction(entity, action, gameState) {
 
    switch (action.type) {
      case 'attack':
      case 'melee':
      case 'ranged':
        return CombatService.executeAttackAction(entity, action, gameState);

      case 'spell':
        return CombatService.executeSpellAction(entity, action, gameState);
      
      case 'heal_support':
        return CombatService.executeHealAction(entity, action, gameState);

      case 'protect':
      case 'taunt':
        return CombatService.executeSupportAction(entity, action, gameState);

      default:
        console.warn(`Action de type "${action.type}" non reconnue.`);
        return {
          messages: [{ text: `Action inconnue: ${action.type}`, type: 'error' }],
          success: false,
        };
    }
  }

  /**
   * Gère les actions d'attaque (mêlée ou à distance).
   */
  static executeAttackAction(attacker, action, gameState) {
    const results = { damage: [], messages: [] };
    const attackData = action.attack || action;
    const target = action.target;

    if (!target) {
      results.messages.push({ text: `${attacker.name} n'a pas de cible valide.`, type: 'error' });
      return results;
    }

    const { success, damage, critical, message } = CombatEngine.resolveAttack(attacker, target, attackData);
    
    results.messages.push({ text: message, type: success ? (critical ? 'critical' : 'hit') : 'miss' });

    if (success) {
      results.damage.push({
        targetId: target.id || target.name,
        damage,
        source: attacker.name,
      });
    }
    return results;
  }

  /**
   * Gère les actions de sort en utilisant le service unifié.
   */
  static executeSpellAction(caster, action, gameState) {
    const spell = action.spell;
    const targets = action.targets || [action.target].filter(Boolean);

    if (!spell || targets.length === 0) {
      return {
        messages: [{ text: `Le sort ${spell?.name || ''} ne peut être lancé sans cible.`, type: 'error' }],
        success: false,
      };
    }


    // Appel au service de sorts unifié
    const spellService = new SpellServiceUnified();
    const result = spellService.castSpell(caster, spell, targets, {
        context: 'combat',
        combatState: gameState,
        // Callbacks pour les messages peuvent être ajoutés ici si nécessaire
    });

    // Mapper le résultat de SpellServiceUnified au format attendu par le combatStore
    const mappedResult = {
        damage: (result.damageResults || result.damage || []).map(d => ({ 
          targetId: d.targetId, 
          damage: d.damage || d.amount, 
          source: caster.name 
        })),
        healing: (result.healingResults || result.healing || []).map(h => ({ 
          targetId: h.targetId, 
          amount: h.amount, 
          source: caster.name 
        })),
        effects: result.effects || [],
        messages: (result.messages || []).map(msg => ({ 
          text: typeof msg === 'string' ? msg : msg.text, 
          type: 'spell' 
        })),
        success: result.success,
    };

  
    return mappedResult;
  }
  
    /**
   * Exécute une action de soin/support
   */
  static executeHealAction(healer, action, gameState) {
    const results = { healing: [], messages: [] };
    const target = action.target;
    
    if (!target) {
      results.messages.push({ text: `${healer.name} ne trouve personne à soigner`, type: 'info' });
      return results;
    }

    // Logique de soin spécifique (ex: inventions de Finn)
    const healAmount = CombatEngine.rollD6() + 2;
    results.healing.push({
      targetId: target.id,
      amount: healAmount,
      source: healer.name
    });
    
    results.messages.push({
      text: `🔧 ${healer.name} soigne ${target.name} (+${healAmount} PV)`,
      type: 'healing'
    });
    
    return results;
  }

  /**
   * Exécute une action de support tactique
   */
  static executeSupportAction(supporter, action, gameState) {
    const results = { effects: [], messages: [] };
    switch (action.type) {
      case 'protect':
        results.messages.push({ text: `🛡️ ${supporter.name} protège ${action.target.name}`, type: 'support' });
        results.effects.push({
          type: 'protection',
          targetId: action.target.id,
          source: supporter.name,
          duration: 1
        });
        break;
        
      case 'taunt':
        results.messages.push({ text: `💢 ${supporter.name} attire l'attention des ennemis`, type: 'support' });
        results.effects.push({
          type: 'taunt',
          source: supporter.name,
          targets: action.targets.map(t => t.name),
          duration: 1
        });
        break;
    }
    return results;
  }

  // ... (garder les autres méthodes utilitaires : rollInitiative, checkCombatEnd, etc.)
  
    /**
   * Initialise un nouveau combat
   */
  static initializeCombat(playerCharacter, activeCompanions, encounterData) {
    // Créer les ennemis
    const enemies = EnemyFactory.createEnemiesFromEncounter(encounterData)
    
    // Créer l'ordre d'initiative
    const turnOrder = CombatService.rollInitiative(playerCharacter, activeCompanions, enemies)
    
    // Positions initiales
    const positions = CombatService.initializePositions(
      playerCharacter, 
      activeCompanions, 
      enemies, 
      encounterData.enemyPositions
    )
    
    return {
      enemies,
      turnOrder,
      positions,
      currentTurn: 0
    }
  }


  /**
   * Lance l'initiative pour tous les combattants
   */
  static rollInitiative(playerCharacter, activeCompanions, enemies) {
    const combatants = []

    // Vérification de sécurité
    if (!playerCharacter || !playerCharacter.stats) {
      console.error('CombatService: playerCharacter ou playerCharacter.stats manquant')
      throw new Error('Personnage joueur requis pour initialiser le combat')
    }

    // Joueur
    const playerInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(playerCharacter)
    combatants.push({
      ...playerCharacter,
      id: 'player',
      type: 'player',
      initiative: playerInit,
      isAlive: true
    })

    // Compagnons actifs
    if (activeCompanions && activeCompanions.length > 0) {
      activeCompanions.forEach(companion => {
        const companionInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(companion)
        combatants.push({
          ...companion,
          id: companion.id || companion.name.toLowerCase(),
          type: 'companion',
          initiative: companionInit,
          isAlive: true
        })
      })
    }

    // Ennemis
    enemies.forEach(enemy => {
      const enemyInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(enemy)
      combatants.push({
        ...enemy,
        initiative: enemyInit
      })
    })

    // DEBUG: Afficher les initiatives avant tri


    // Trier par initiative (plus haute en premier, joueur gagne les égalités)
    const sorted = combatants.sort((a, b) => {
      if (b.initiative === a.initiative) {
        // Priorité: player > companion > enemy
        if (a.type === 'player') return -1
        if (b.type === 'player') return 1
        if (a.type === 'companion') return -1
        if (b.type === 'companion') return 1
        return 0
      }
      return b.initiative - a.initiative
    })
    

    return sorted
  }

  /**
   * Initialise les positions de combat
   */
  static initializePositions(playerCharacter, activeCompanions, enemies, customPositions = null) {
    const positions = {
      // Positions par défaut du joueur
      player: { x: 1, y: 2 },
      
      // État de mouvement
      playerHasMoved: false
    }

    // Ajouter les positions des compagnons actifs
    if (activeCompanions && activeCompanions.length > 0) {
      activeCompanions.forEach((companion, index) => {
        const companionId = companion.id || companion.name.toLowerCase()
        positions[companionId] = { x: 0, y: index + 1 }
        positions[`${companionId}HasMoved`] = false
      })
    }

    // Positions des ennemis
    if (customPositions) {
      // Utiliser les positions personnalisées
      enemies.forEach((enemy, index) => {
        const customPos = customPositions[index]
        if (customPos) {
          positions[enemy.id] = { x: customPos.x, y: customPos.y }
        } else {
          // Position par défaut si pas de position custom
          positions[enemy.id] = CombatService.getDefaultEnemyPosition(index, enemies.length)
        }
      })
    } else {
      // Positions par défaut
      enemies.forEach((enemy, index) => {
        positions[enemy.id] = CombatService.getDefaultEnemyPosition(index, enemies.length)
      })
    }

    return positions
  }

  /**
   * Calcule une position par défaut pour un ennemi
   */
  static getDefaultEnemyPosition(index, totalEnemies) {
    const cols = 8
    const rows = 6
    
    // Placer les ennemis du côté droit
    const startX = Math.floor(cols * 0.6)
    const availableWidth = cols - startX
    
    if (totalEnemies === 1) {
      return { x: startX + Math.floor(availableWidth / 2), y: Math.floor(rows / 2) }
    }
    
    // Répartir sur plusieurs lignes si nécessaire
    const enemiesPerRow = Math.min(availableWidth, totalEnemies)
    const row = Math.floor(index / enemiesPerRow)
    const col = index % enemiesPerRow
    
    return {
      x: startX + col,
      y: Math.max(1, Math.min(rows - 2, row + 1))
    }
  }

  /**
   * Exécute une action du joueur
   */
  static executePlayerAction(playerCharacter, action, targets, enemies, positions) {
    const messages = []
    const results = {
      damage: [],
      effects: [],
      messages
    }

    if (!action || !targets.length) {
      messages.push({ text: "Aucune action ou cible sélectionnée", type: 'error' })
      return results
    }

    switch (action.type) {
      case 'attack':
        return CombatService.executeAttack(playerCharacter, action, targets, results)
      
      case 'spell':
        return CombatService.executeSpell(playerCharacter, action, targets, results)
      
      default:
        messages.push({ text: `Type d'action inconnu: ${action.type}`, type: 'error' })
        return results
    }
  }

  /**
   * Exécute une attaque
   */
  static executeAttack(attacker, weapon, targets, results) {
    targets.forEach(target => {
      // Jet d'attaque
      const attackRoll = CombatEngine.rollD20()
      const attackBonus = CombatService.getAttackBonus(attacker, weapon)
      const totalAttack = attackRoll + attackBonus
      
      const criticalHit = attackRoll === 20
      const hit = totalAttack >= target.ac || criticalHit
      
      if (hit) {
        // Dégâts
        let damage = CombatService.rollDamage(weapon.damage)
        if (criticalHit) {
          damage *= 2
          results.messages.push({
            text: `💥 Coup critique ! ${attacker.name} inflige ${damage} dégâts à ${target.name} !`, 
            type: 'critical'
          })
        } else {
          results.messages.push({
            text: `${attacker.name} touche ${target.name} et inflige ${damage} dégâts`, 
            type: 'hit'
          })
        }
        
        results.damage.push({ targetId: target.id, damage })
      } else {
        results.messages.push({
          text: `❌ ${attacker.name} manque ${target.name} (${totalAttack} vs CA ${target.ac})`, 
          type: 'miss'
        })
      }
    })
    
    return results
  }

  /**
   * Exécute un sort
   */
  static executeSpell(caster, spell, targets, results) {
    // Gestion spéciale pour les sorts de zone
    if (spell.isAreaEffect && targets.length > 1) {
      results.messages.push({
        text: ` ${caster.name} lance ${spell.name} (zone d'effet sur ${targets.length} cibles)`, 
        type: 'spell'
      })
      
      // Pour les sorts de zone, calculer les dégâts une fois et les appliquer à tous
      let baseDamage = 0
      if (spell.damage) {
        baseDamage = CombatService.rollDamage(spell.damage.dice) + (spell.damage.bonus || 0)
      }
      
      targets.forEach(target => {
        let finalDamage = baseDamage
        
        // Jets de sauvegarde pour AoE (si applicable)
        if (spell.saveType) {
          const saveRoll = CombatEngine.rollD20()
          const saveBonus = CombatService.getSaveBonus(target, spell.saveType)
          const saveDC = spell.saveDC || (8 + CombatService.getSpellAttackBonus(caster))
          
          if (saveRoll + saveBonus >= saveDC) {
            finalDamage = Math.floor(finalDamage / 2) // Demi-dégâts en cas de réussite
            results.messages.push({
              text: `🛡️ ${target.name} résiste partiellement (${finalDamage} dégâts)`, 
              type: 'save-success'
            })
          } else {
            results.messages.push({
              text: `💥 ${target.name} subit les pleins effets (${finalDamage} dégâts)`, 
              type: 'save-fail'
            })
            
            // Appliquer les effets supplémentaires si échec de sauvegarde
            if (spell.effect) {
              const effect = CombatEffects.applyEffect(target, spell.effect, 3, caster.name)
              results.effects.push({
                type: spell.effect,
                targetId: target.id || target.name,
                source: caster.name,
                duration: 3,
                effectId: effect?.id
              })
            }
          }
        } else if (spell.effect) {
          // Effet automatique sans sauvegarde
          const effect = CombatEffects.applyEffect(target, spell.effect, 3, caster.name)
          results.effects.push({
            type: spell.effect,
            targetId: target.id || target.name,
            source: caster.name,
            duration: 3,
            effectId: effect?.id
          })
        }
        
        if (finalDamage > 0) {
          results.damage.push({ targetId: target.id || target.name, damage: finalDamage })
        }
      })
    } else {
      // Gestion normale pour sorts à cible unique ou multiple sans AoE
      results.messages.push({
        text: ` ${caster.name} lance ${spell.name}`, 
        type: 'spell'
      })
      
      // Traiter chaque cible individuellement
      targets.forEach(target => {
        if (spell.requiresAttackRoll) {
          // Sorts nécessitant un jet d'attaque (comme Rayon de givre)
          const attackRoll = CombatEngine.rollD20()
          const spellAttackBonus = CombatService.getSpellAttackBonus(caster)
          const totalAttack = attackRoll + spellAttackBonus
          
          const criticalHit = attackRoll === 20
          const hit = totalAttack >= target.ac || criticalHit
          
          if (hit) {
            let damage = 0
            if (spell.damage) {
              damage = CombatService.rollDamage(spell.damage.dice) + (spell.damage.bonus || 0)
              if (criticalHit) damage *= 2
            }
            
            results.messages.push({
              text: `${spell.name} touche ${target.name} et inflige ${damage} dégâts`, 
              type: criticalHit ? 'critical' : 'hit'
            })
            
            results.damage.push({ targetId: target.id || target.name, damage })
          } else {
            results.messages.push({
              text: ` ${spell.name} manque ${target.name} (${totalAttack} vs CA ${target.ac})`, 
              type: 'miss'
            })
          }
        } else {
          // Sorts à touche automatique (comme Projectile Magique)
          let damage = 0
          if (spell.damage) {
            damage = CombatService.rollDamage(spell.damage.dice) + (spell.damage.bonus || 0)
          }
          
          results.messages.push({
            text: `💥 ${spell.name} touche automatiquement ${target.name} et inflige ${damage} dégâts`, 
            type: 'spell-hit'
          })
          
          results.damage.push({ targetId: target.id || target.name, damage })
        }
      })
    }
    
    return results
  }

  /**
   * Calcule le bonus d'attaque (délègue au CombatEngine)
   */
  static getAttackBonus(character, weapon) {
    return CombatEngine.calculateAttackBonus(character, weapon)
  }

  /**
   * Calcule le bonus d'attaque de sort (délègue au CombatEngine)
   */
  static getSpellAttackBonus(caster) {
    return CombatEngine.calculateSpellAttackBonus(caster)
  }

  /**
   * Calcule le bonus de sauvegarde (délègue au CombatEngine)
   */
  static getSaveBonus(creature, saveType) {
    return CombatEngine.calculateSaveBonus(creature, saveType)
  }

  /**
   * Lance les dégâts d'une arme (délègue au CombatEngine)
   */
  static rollDamage(damageString) {
    return CombatEngine.rollDamage(damageString)
  }


  /**
   * Vérifie si un combattant est vaincu (délègue au CombatEngine)
   */
  static isDefeated(character) {
    return CombatEngine.isDefeated(character)
  }

  /**
   * Vérifie les conditions de victoire/défaite
   */
  static checkCombatEnd(playerCharacter, activeCompanions, enemies) {
    const playerDefeated = CombatService.isDefeated(playerCharacter)
    const allCompanionsDefeated = activeCompanions.length === 0 || activeCompanions.every(companion => CombatService.isDefeated(companion))
    const allEnemiesDefeated = enemies.every(enemy => CombatService.isDefeated(enemy))
    
    if (playerDefeated && allCompanionsDefeated) {
      return 'defeat'
    }
    
    if (allEnemiesDefeated) {
      return 'victory'
    }
    
    return null
  }

  /**
   * Exécute une attaque d'entité (ennemi ou compagnon)
   */
  static executeEntityAttack(attacker, attack, target, addCombatMessage) {
    // Validation des paramètres
    if (!attacker || !attack || !target) {
      console.error('❌ Paramètres manquants pour executeEntityAttack')
      return { success: false, damage: 0 }
    }

    // Vérifier que la cible est vivante
    if (target.character && target.character.currentHP <= 0) {
      console.warn(`⚠️ ${attacker.name} tente d'attaquer ${target.name} qui est déjà mort`)
      addCombatMessage(`${attacker.name} réalise que ${target.name} est déjà tombé au combat.`)
      return { success: false, damage: 0 }
    }

    // Jet d'attaque
    const attackRoll = CombatEngine.rollD20()
    const attackBonus = CombatService.getAttackBonus(attacker, attack)
    
    if (isNaN(attackBonus)) {
      console.error('❌ Attack bonus est NaN pour:', attacker, attack)
      return { success: false, damage: 0 }
    }
    
    const totalAttack = attackRoll + attackBonus
    const criticalHit = attackRoll === 20
    const targetAC = target.character ? target.character.ac : (target.ac || 10)
    
    if (isNaN(targetAC)) {
      console.error('❌ Target AC est NaN pour:', target)
      return { success: false, damage: 0 }
    }
    
    const hit = totalAttack >= targetAC || criticalHit
    
    if (hit) {
      // Calculer les dégâts
      let damage = 0
      if (attack.damageDice) {
        damage = CombatService.rollDamage(attack.damageDice) + (attack.damageBonus || 0)
      } else if (attack.damage) {
        damage = CombatService.rollDamage(attack.damage)
      } else {
        damage = 1 // Fallback
      }
      
      if (criticalHit) {
        damage *= 2
        addCombatMessage(
          `💥 Coup critique ! ${attacker.name} utilise ${attack.name} et inflige ${damage} dégâts à ${target.name} !`, 
          'critical'
        )
      } else {
        addCombatMessage(
          `${attacker.name} utilise ${attack.name} et inflige ${damage} dégâts à ${target.name}`, 
          attacker.type === 'enemy' ? 'enemy-hit' : 'companion-hit'
        )
      }
      
      return { success: true, damage, critical: criticalHit }
    } else {
      addCombatMessage(
        `❌ ${attacker.name} manque ${target.name} avec ${attack.name} (${totalAttack} vs CA ${targetAC})`, 
        'miss'
      )
      return { success: false, damage: 0 }
    }
  }

  /**
   * Valide et exécute un mouvement d'entité
   */
  static executeEntityMovement(entity, currentPos, targetPos, combatState, addCombatMessage) {
    // Valider le mouvement
    const isValid = CombatEngine.validateMovement(entity, currentPos, targetPos, combatState)
    
    if (!isValid) {
      console.warn(`❌ Mouvement invalide pour ${entity.name}`)
      addCombatMessage(`${entity.name} ne peut pas se déplacer à cette position.`)
      return false
    }
    
    return true
  }

  /**
   * NOUVELLE MÉTHODE : Exécute le tour d'un compagnon avec la nouvelle IA
   */
  static executeCompanionAction(companionId, companion, gameState) {

    
    const results = {
      messages: [],
      damage: [],
      healing: [],
      effects: [],
      success: false
    }

    try {
      // 1. Obtenir la meilleure action via l'IA unifiée
 
      const bestAction = ActionPlanner.getBestAction(companion, gameState)

      
      if (!bestAction) {
        results.messages.push({
          text: `${companion.name} ne trouve aucune action à effectuer`, 
          type: 'info'
        })
        return results
      }

      // 2. Calculer le mouvement optimal
      const currentPosition = gameState.combatPositions[companionId]
      const optimalPosition = CombatEngine.calculateOptimalMovement(
        companion, 
        currentPosition, 
        gameState
      )

      // 3. Exécuter l'action selon son type
      switch (bestAction.type) {
        case 'attack':
          return CombatService.executeCompanionAttack(companion, bestAction, gameState, results)
          
        case 'spell':
          return CombatService.executeCompanionSpell(companion, bestAction, gameState, results)
          
        case 'heal_support':
          return CombatService.executeCompanionHeal(companion, bestAction, gameState, results)
          
        case 'protect':
        case 'taunt':
          return CombatService.executeCompanionSupport(companion, bestAction, gameState, results)
          
        default:
          results.messages.push({
            text: `Action inconnue: ${bestAction.type}`, 
            type: 'error'
          })
          return results
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action du compagnon:', error)
      results.messages.push({
        text: `Erreur lors de l'action de ${companion.name}`, 
        type: 'error'
      })
      return results
    }
  }

  /**
   * Exécute une attaque de compagnon (physique ou ranged)
   */
  static executeCompanionAttack(companion, action, gameState, results) {
    const attack = action.attack || companion.attacks[0]
    const target = action.target

    if (!attack || !target) {
      results.messages.push({
        text: `${companion.name} ne peut pas attaquer`, 
        type: 'error'
      })
      return results
    }

    // Jet d'attaque
    const attackRoll = CombatEngine.rollD20()
    const attackBonus = CombatService.getAttackBonus(companion, attack)
    const totalAttack = attackRoll + attackBonus
    
    const criticalHit = attackRoll === 20
    const hit = totalAttack >= target.ac || criticalHit
    
    if (hit) {
      let damage = CombatEngine.calculateDamage(attack).damage
      if (criticalHit) damage *= 2
      
      const attackType = attack.type === 'ranged' ? 'ranged-hit' : 'hit'
      const criticalText = criticalHit ? ' (CRITIQUE!)' : ''
      
      results.messages.push({
        text: `${companion.name} utilise ${attack.name} sur ${target.name} (${damage} dégâts)${criticalText}`, 
        type: criticalHit ? 'critical' : attackType
      })
      
      results.damage.push({
        targetId: target.name, 
        damage,
        source: companion.name,
        attackType: attack.type 
      })
      results.success = true
    } else {
      results.messages.push({
        text: `💨 ${companion.name} rate son attaque sur ${target.name}`, 
        type: 'miss'
      })
    }
    
    return results
  }

  /**
   * Exécute un sort de compagnon - NOUVELLE VERSION UNIFIÉE
   */
  static executeCompanionSpell(companion, action, gameState, results) {
    const spell = action.spell
    const spellName = spell.name || spell.id // Obtenir le nom du sort
    const targets = Array.isArray(action.target) ? action.target : [action.target].filter(Boolean)
    

    
    // Utiliser directement SpellServiceUnified
    const spellService = new SpellServiceUnified({
      combatStore: { combatPositions: gameState.combatPositions }
    })
    
    const spellResult = spellService.castSpell(companion, spell, targets, {
      context: 'combat',
      gameState: gameState
    })
    
    // Convertir le résultat au format attendu
    if (!spellResult.success) {
      results.messages.push({
        text: spellResult.messages[0] || `Échec du sort ${spellName}`, 
        type: 'error'
      })
      return results
    }
    
    // Traiter les messages
    spellResult.messages.forEach(msg => {
      results.messages.push({
        text: msg,
        type: 'spell'
      })
    })
    
    // Traiter les dégâts
    if (spellResult.damageResults) {
      spellResult.damageResults.forEach(dmg => {
        results.damage.push({
          targetId: dmg.targetId,
          damage: dmg.damage,
          source: dmg.source,
          damageType: dmg.damageType
        })
        
        results.messages.push({
          text: `🔥 ${dmg.source} inflige ${dmg.damage} dégâts de ${dmg.damageType} à ${dmg.targetName}`, 
          type: 'spell'
        })
      })
    }
    
    // Traiter les soins
    if (spellResult.healingResults) {
      spellResult.healingResults.forEach(heal => {
        results.healing.push({
          targetId: heal.targetId,
          amount: heal.amount,
          source: heal.source
        })
        
        results.messages.push({
          text: `✨ ${heal.source} soigne ${heal.targetName} (+${heal.amount} PV)`, 
          type: 'healing'
        })
      })
    }
    
    // Traiter les effets
    if (spellResult.effects) {
      spellResult.effects.forEach(effect => {
        results.effects.push({
          type: effect.type,
          targetId: effect.targetId,
          source: effect.source,
          duration: effect.duration,
          effectId: effect.effectId
        })
        
        if (effect.type === 'restrained') {
          results.messages.push({
            text: `🕸️ ${effect.targetName} est entravé pour ${Math.ceil(effect.duration / 60)} tours`, 
            type: 'spell'
          })
        }
      })
    }
    
    results.success = true
    return results
  }

  /**
   * Exécute une action de soin/support
   */
  static executeCompanionHeal(companion, action, gameState, results) {
    const target = action.target
    
    if (!target) {
      results.messages.push({
        text: `${companion.name} ne trouve personne à soigner`, 
        type: 'info'
      })
      return results
    }

    // Soin via inventions (pour Finn)
    const healAmount = CombatService.rollD6() + 2
    results.healing.push({
      targetId: target.id,
      amount: healAmount,
      source: companion.name
    })
    
    results.messages.push({
      text: `🔧 ${companion.name} soigne ${target.name} avec ses inventions (+${healAmount} PV)`, 
      type: 'healing'
    })
    
    results.success = true
    return results
  }

  /**
   * Exécute une action de support tactique
   */
  static executeCompanionSupport(companion, action, gameState, results) {
    switch (action.type) {
      case 'protect':
        results.messages.push({
          text: `🛡️ ${companion.name} protège ${action.target.name}`, 
          type: 'support'
        })
        results.effects.push({
          type: 'protection',
          targetId: action.target.id,
          source: companion.name,
          duration: 1
        })
        break
        
      case 'taunt':
        results.messages.push({
          text: `💢 ${companion.name} attire l'attention des ennemis`, 
          type: 'support'
        })
        results.effects.push({
          type: 'taunt',
          source: companion.name,
          targets: action.targets.map(t => t.name),
          duration: 1
        })
        break
    }
    
    results.success = true
    return results
  }

  /**
   * Utilitaires pour les dés (délègue au CombatEngine)
   */
  static rollD6() { return CombatEngine.rollD6() }
  static rollD8() { return CombatEngine.rollD8() }
  static rollD10() { return CombatEngine.rollD10() }

  /**
   * Trouve la meilleure cible pour une entité (logique d'orchestration)
   */
  static findBestTarget(attacker, attackerPos, combatState) {
    return CombatEngine.findBestTarget(attacker, attackerPos, combatState)
  }

  /**
   * Consomme un slot de sort
   */
  static consumeSpellSlot(companion, spellName) {
    // TODO: Implémenter la consommation de slots
    // Pour l'instant, on log juste
 
  }
}
