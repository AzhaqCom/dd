# 🚀 Plan P1 - Amélioration Complète de l'IA

## 📋 **Objectifs P1**

### **Vision globale** 
Transformer l'IA tactique pour que **tous les acteurs** (joueur, compagnons, ennemis) puissent :
1. **Bouger et attaquer librement** dans l'ordre désiré (règles D&D 5e)
2. **Prendre des décisions tactiques intelligentes** (positionnement, couverture, flanquement)
3. **Avoir des comportements cohérents** et prévisibles selon leur rôle

### **Problèmes actuels identifiés**
- ❌ Gobelin tire à l'arc mais ne bouge **jamais**
- ❌ **7/9 ennemis** sans `aiPriority` → Actions très limitées
- ❌ **Kael & Finn** sans `aiModifiers` → Pas de bonus intelligents  
- ❌ **Rhinghann** ne peut pas attaquer au marteau (pas de `melee_attack`)
- ❌ Pas de **mouvement tactique** intégré dans l'IA

---

## 🎯 **PHASE 1 - HOMOGÉNÉISATION CRITIQUE (P1.1 → P1.4)**

> **Priorité absolue** : Standardiser les propriétés IA pour tous les acteurs

### **P1.1 - Homogénéisation Companions** 🏃‍♂️ *URGENT*

#### **P1.1a - KAEL : Compléter l'IA**
```javascript
// AJOUTER dans companions.js
aiModifiers: {
  "ranged_attack": {
    safeDistanceBonus: +35,     // Maintenir distance archer
    lowHPTargetBonus: +25,      // Finir ennemis blessés
    coverBonus: +30,            // Utiliser couverture  
    elevationBonus: +20         // Position surélevée
  },
  "support_skill": {
    allyInDangerBonus: +40,     // Aider allié en difficulté
    scoutingBonus: +20,         // Reconnaissance/surveillance
    trapDetectionBonus: +30     // Détecter pièges
  }
}
```

#### **P1.1b - FINN : Compléter l'IA**
```javascript  
// AJOUTER dans companions.js
aiModifiers: {
  "support_skill": {
    inventionBonus: +50,        // Gadgets/inventions
    allyEquipmentBonus: +30,    // Réparer équipement
    detectionBonus: +40,        // Analyse/détection
    environmentalBonus: +25     // Exploiter environnement
  },
  "ranged_attack": {
    precisionBonus: +25,        // Tir de précision
    weakSpotBonus: +35,         // Exploiter faiblesses
    technicalBonus: +20         // Armes technologiques
  },
  "heal": {
    mechanicalHealBonus: +20,   // Soins gadgets/mécaniques
    emergencyRepairBonus: +30   // Réparation d'urgence
  }
}
```

#### **P1.1c - RHINGANN : Ajouter combat au marteau**
```javascript
// MODIFIER aiPriority dans companions.js
aiPriority: ["heal", "melee_attack", "buff", "ranged_support"]

// AJOUTER dans aiModifiers
"melee_attack": {
  noHealNeededBonus: +60,     // Attaquer si personne à soigner  
  finishingBlowBonus: +40,    // Achever ennemi blessé
  protectAllyBonus: +50,      // Défendre allié corps-à-corps
  divineSmiteBonus: +35       // Utiliser capacités divines
}
```

---

### **P1.2 - Homogénéisation Enemies** 🧌 *URGENT*

#### **Stratégie** : Ajouter propriétés IA dans `EnemyFactory.js` pour éviter de surcharger `enemies.js`

#### **P1.2a - EnemyFactory : Auto-génération IA**
```javascript
// AJOUTER dans EnemyFactory.createEnemyFromTemplate()
static generateAIForEnemy(template) {
  // Si l'ennemi a déjà une IA complète, la garder
  if (template.aiPriority && template.aiModifiers) {
    return { aiPriority: template.aiPriority, aiModifiers: template.aiModifiers }
  }
  
  // Sinon générer selon le rôle
  const aiByRole = {
    'brute': {
      aiPriority: ['melee_attack', 'charge', 'intimidate'],
      aiModifiers: {
        'melee_attack': { closestTargetBonus: +40, lowHPBonus: +25 },
        'charge': { isolatedTargetBonus: +35 },
        'intimidate': { multipleEnemiesBonus: +30 }
      }
    },
    'skirmisher': {
      aiPriority: ['hit_and_run', 'ranged_attack', 'melee_attack'],
      aiModifiers: {
        'hit_and_run': { isolatedTargetBonus: +40, escapeRouteBonus: +30 },
        'ranged_attack': { safeDistanceBonus: +35, coverBonus: +25 },
        'melee_attack': { corneredBonus: +40, flankedTargetBonus: +30 }
      }
    },
    'caster': {
      aiPriority: ['ranged_spell', 'area_damage', 'debuff'],
      aiModifiers: {
        'ranged_spell': { multipleTargetsBonus: +50, safeDistanceBonus: +40 },
        'area_damage': { groupedEnemiesBonus: +60 },
        'debuff': { strongEnemyBonus: +35 }
      }
    }
  }
  
  return aiByRole[template.role] || aiByRole['brute'] // Fallback
}
```

#### **P1.2b - Application aux 7 ennemis manquants**
- **Ombre** → `skirmisher` (furtif, mobilité)
- **Molosse** → `brute` (charge, morsure)  
- **Méphite** → `skirmisher` (vol, harcèlement)
- **Kobold** → `skirmisher` (petit, agile)
- **Goule** → `brute` (paralysie, contact)
- **Squelette** → `brute` (basique, contact) 
- **Diablotin** → `caster` (sorts, vol)

---

## ⚔️ **PHASE 2 - MOUVEMENT TACTIQUE (P1.3 → P1.5)**

> **Innovation majeure** : Intégrer déplacement + action dans l'IA

### **P1.3 - Architecture Mouvement + Action**

#### **P1.3a - Nouveau système de "TurnPlan"**
```javascript
// Nouvelle structure dans EntityAI_Hybrid
class TurnPlan {
  constructor() {
    this.phases = []  // Array de phases : move, action, move
    this.totalScore = 0
  }
  
  addPhase(type, details) {
    // type: 'move', 'attack', 'spell', 'end_turn'
    this.phases.push({ type, ...details })
  }
}

// Exemple de plan complet
const turnPlan = new TurnPlan()
turnPlan.addPhase('move', { to: { x: 8, y: 5 }, reason: 'get_in_range' })
turnPlan.addPhase('attack', { attack: 'arc_court', target: player })
turnPlan.addPhase('move', { to: { x: 12, y: 7 }, reason: 'take_cover' })
```

#### **P1.3b - Évaluation tactique des positions**
```javascript
// Dans EntityAI_Hybrid - nouvelles méthodes
static evaluatePosition(entity, position, gameState) {
  let score = 0
  
  // Bonus couverture
  if (hasPartialCover(position)) score += 20
  if (hasFullCover(position)) score += 40
  
  // Bonus élévation
  if (isElevated(position)) score += 15
  
  // Malus exposition
  const threateningEnemies = countThreateningEnemies(entity, position, gameState)
  score -= threateningEnemies * 25
  
  // Bonus position tactique selon rôle
  if (entity.role === 'skirmisher') {
    score += hasEscapeRoute(position) ? 30 : -20
  }
  
  return score
}

static planMovementAndAction(entity, gameState) {
  const possiblePlans = []
  
  // Plan 1: Attaquer puis bouger
  const attackThenMove = this.evaluateAttackThenMove(entity, gameState)
  if (attackThenMove) possiblePlans.push(attackThenMove)
  
  // Plan 2: Bouger puis attaquer
  const moveThenAttack = this.evaluateMoveThenAttack(entity, gameState)
  if (moveThenAttack) possiblePlans.push(moveThenAttack)
  
  // Plan 3: Double mouvement (repli/charge)
  const doubleMovement = this.evaluateDoubleMovement(entity, gameState)
  if (doubleMovement) possiblePlans.push(doubleMovement)
  
  // Retourner le meilleur plan
  return possiblePlans.sort((a, b) => b.totalScore - a.totalScore)[0]
}
```

### **P1.4 - Intégration Mouvement D&D 5e**

#### **P1.4a - Règles de déplacement**
- **Vitesse standard** : 30 pieds (6 cases)
- **Action Dash** : Double le mouvement (12 cases)
- **Terrain difficile** : Coût double
- **Attaque d'opportunité** : Quitter case adjacente

#### **P1.4b - Types de mouvements tactiques**
```javascript
const MOVEMENT_TACTICS = {
  'get_in_range': {
    priority: +40,
    condition: (entity, target) => getDistance(entity, target) > attackRange
  },
  'take_cover': {
    priority: +30,
    condition: (entity) => entity.currentHP < entity.maxHP * 0.5
  },
  'flank_target': {
    priority: +35,  
    condition: (entity, target) => canFlank(entity, target)
  },
  'escape_melee': {
    priority: +50,
    condition: (entity) => isInMelee(entity) && entity.role === 'caster'
  },
  'charge_target': {
    priority: +45,
    condition: (entity, target) => entity.role === 'brute' && getDistance(entity, target) > 1
  }
}
```

---

## 🧠 **PHASE 3 - IA AVANCÉE (P1.5 → P1.8)**

### **P1.5 - Comportements Spécialisés par Rôle**

#### **Tank (Tyrion)** 
- **Positionnement** : Front line, protection alliés
- **Mouvement** : Intercepter ennemis, bloquer passages
- **Décisions** : Taunt les plus dangereux, protection priorité healers

#### **Healer (Rhingann)**
- **Positionnement** : Arrière, mais portée de soin
- **Mouvement** : Maintenir ligne de vue alliés, éviter ennemis
- **Décisions** : Soin d'urgence > marteau si sécurisé

#### **Archer (Kael)**  
- **Positionnement** : Élévation, couverture, champ de tir
- **Mouvement** : Kite, maintenir distance optimale
- **Décisions** : Cibles prioritaires (casters ennemis, low HP)

#### **Support (Finn)**
- **Positionnement** : Flexible selon besoins
- **Mouvement** : Adaptation situationnelle  
- **Décisions** : Gadgets tactiques, assistance ciblée

#### **DPS (Zara)**
- **Positionnement** : Distance sécurisée, angles AoE
- **Mouvement** : Optimiser zones d'effet
- **Décisions** : Sorts AoE > Single target > Control

### **P1.6 - IA Ennemis Spécialisée**

#### **Skirmisher (Gobelin, Kobold)**
```javascript
// Comportement hit-and-run amélioré
aiPriority: ['evaluate_battlefield', 'hit_and_run', 'ranged_attack', 'retreat']

planTurn(entity, gameState) {
  // 1. Évaluer si on peut faire hit-and-run
  if (canReachAndRetreat(entity, targets)) {
    return createHitAndRunPlan(entity, bestTarget)
  }
  
  // 2. Sinon tir à distance depuis position sûre
  if (isInSafePosition(entity)) {
    return createRangedAttackPlan(entity, bestTarget)  
  }
  
  // 3. Sinon se repositionner
  return createRepositionPlan(entity, gameState)
}
```

#### **Brute (Molosse, Goule)**
```javascript
// Comportement charge et contact
aiPriority: ['charge_weakest', 'melee_attack', 'intimidate']

planTurn(entity, gameState) {
  const weakestTarget = findWeakestAccessibleTarget(entity, gameState)
  
  // Charger la cible la plus faible accessible
  if (weakestTarget && canCharge(entity, weakestTarget)) {
    return createChargePlan(entity, weakestTarget)
  }
  
  return createMeleeAttackPlan(entity, getBestTarget(entity, gameState))
}
```

### **P1.7 - Système de Menace Dynamique**

#### **Threat Assessment**
```javascript
static calculateThreatLevel(entity, target, gameState) {
  let threat = 0
  
  // Facteurs offensifs
  threat += (target.maxHP / entity.maxHP) * 30
  threat += target.ac > entity.averageAttackBonus ? 20 : 0
  
  // Facteurs situationnels  
  if (target.type === 'player') threat += 40
  if (target.role === 'healer') threat += 35
  if (target.currentHP < target.maxHP * 0.3) threat += 25 // Cible facile
  
  // Distance et accessibilité
  const distance = getDistance(entity, target)
  threat -= Math.min(distance * 5, 30) // Plus loin = moins menaçant
  
  return threat
}
```

---

## 🛠️ **PHASE 4 - INTÉGRATION TECHNIQUE (P1.9 → P1.11)**

### **P1.8 - Refactoring CombatAI**

#### **Nouvelle architecture CombatAI**
```javascript
// CombatAI devient coordinateur de TurnPlanner
static executeEntityTurn(entity, gameState, callbacks) {
  // 1. PLANIFICATION COMPLÈTE DU TOUR
  const turnPlan = EntityAI_Hybrid.planCompleteTurn(entity, gameState)
  
  if (!turnPlan || turnPlan.phases.length === 0) {
    return this.handleNoActionAvailable(entity, callbacks)
  }
  
  // 2. EXÉCUTION SÉQUENTIELLE DES PHASES
  this.executeTurnPlan(entity, turnPlan, gameState, callbacks)
}

static async executeTurnPlan(entity, turnPlan, gameState, callbacks) {
  for (const phase of turnPlan.phases) {
    switch (phase.type) {
      case 'move':
        await this.executeMovement(entity, phase, gameState, callbacks)
        break
      case 'attack':
      case 'spell':  
        await this.executeAction(entity, phase, gameState, callbacks)
        break
    }
    
    // Délai entre phases pour animation
    await this.delay(500)
  }
  
  // Fin du tour
  callbacks.onNextTurn()
}
```

### **P1.9 - Interface Mouvement**

#### **Intégration avec CombatGrid**
```javascript
// Nouveau système de mouvement visuel
static async executeMovement(entity, movePhase, gameState, callbacks) {
  const fromPos = getCurrentPosition(entity, gameState)
  const toPos = movePhase.to
  
  // Animation de déplacement
  await this.animateMovement(entity, fromPos, toPos, callbacks.onMessage)
  
  // Mise à jour positions
  gameState.combatPositions[entity.id || entity.name] = toPos
  
  // Vérifier attaques d'opportunité
  const opportunityAttacks = this.checkOpportunityAttacks(entity, fromPos, toPos, gameState)
  if (opportunityAttacks.length > 0) {
    await this.handleOpportunityAttacks(opportunityAttacks, callbacks)
  }
}
```

---

## 📊 **CALENDRIER D'EXÉCUTION**

### **Sprint 1 (2-3 jours) : Homogénéisation**
- [ ] P1.1 - Compléter aiModifiers Kael, Finn, Rhingann  
- [ ] P1.2 - Auto-génération IA dans EnemyFactory
- [ ] Tests : Tous les acteurs ont des comportements de base

### **Sprint 2 (3-4 jours) : Mouvement Tactique Base** 
- [ ] P1.3 - Système TurnPlan 
- [ ] P1.4 - Règles mouvement D&D 5e
- [ ] Tests : Entities peuvent bouger puis attaquer

### **Sprint 3 (4-5 jours) : IA Avancée**
- [ ] P1.5 - Comportements spécialisés par rôle
- [ ] P1.6 - IA ennemis intelligente  
- [ ] P1.7 - Threat assessment
- [ ] Tests : IA tactique fonctionnelle

### **Sprint 4 (2-3 jours) : Intégration Finale**
- [ ] P1.8 - Refactoring CombatAI
- [ ] P1.9 - Interface mouvement
- [ ] Tests complets et optimisation

---

## 🎯 **Critères de Succès P1**

### **Fonctionnalités**
- ✅ Gobelin effectue hit-and-run (bouge + attaque + se replie)
- ✅ Rhinghann utilise son marteau quand personne à soigner
- ✅ Kael se positionne tactiquement (élévation, couverture)  
- ✅ Tous les ennemis ont des comportements distinctifs
- ✅ Joueur peut choisir ordre mouvement/action

### **Technique**  
- ✅ 0 erreur console pendant 10min de combat
- ✅ Tous les acteurs ont aiPriority + aiModifiers
- ✅ Performance fluide (pas de lag IA)
- ✅ Architecture modulaire et maintenable

### **Expérience Utilisateur**
- ✅ Combat semble "intelligent" et imprévisible
- ✅ Différences visibles entre rôles d'IA  
- ✅ Joueur a contrôle total de son tour
- ✅ Animations fluides et compréhensibles

---

*Plan P1 créé suite à l'analyse complète des problèmes P0 et des besoins d'amélioration tactique. Focus sur homogénéisation puis innovation mouvement.*

permettre au joueur de bouger apres avoir attaquer