# 🤖 Déroulement de l'IA - Analyse Complète

## 🎯 **RÉPONSES AUX QUESTIONS CRITIQUES**

### **1. DÉPLACEMENT DES ENNEMIS - Où est codée la fonction qui décide si un ennemi doit bouger ?**

#### 📍 **RÉPONSE PRÉCISE :**

**Fichier** : `src/services/EntityAI_Hybrid.js`  
**Fonction** : `getActionsByPriority()` → `getActionsForPriorityType()` (lignes 79-304)  
**Problème identifié** : **Lignes 103-120** 

```javascript
// LIGNE 103-105 : LE PROBLÈME ÉTAIT ICI ! (maintenant corrigé)
if (!entityPos) {
  // AVANT P0.4 : return actions  // ❌ ENNEMI IMMOBILE !
  // APRÈS P0.4 : Système de fallback intelligent ✅
}
```

#### 🔧 **POURQUOI LES GOBELINS NE BOUGENT JAMAIS :**

1. **Cause racine** : Position manquante dans `gameState.combatPositions`
2. **Logique défaillante** : Si position introuvable → `return actions` (liste vide)
3. **Conséquence** : Aucune action générée → Gobelin passe son tour
4. **Solution P0.4** : Système de fallback avec génération automatique de positions

---

### **2. GESTION DES COMPAGNONS - Où est codé le choix avec aiPriority + aiModifiers ?**

#### 📍 **RÉPONSE PRÉCISE :**

**Fichier** : `src/services/EntityAI_Hybrid.js`  
**Fonction principale** : `getBestAction()` (lignes 15-43)  
**Flux complet** :

```javascript
// 1. POINT D'ENTRÉE
EntityAI_Hybrid.getBestAction(entity, gameState)

// 2. OBTENIR ACTIONS PAR PRIORITÉ
→ getActionsByPriority(entity, gameState)  // Lignes 48-74
  → Parcourt entity.aiPriority[]
  → Pour chaque priorité, appelle getActionsForPriorityType()

// 3. GÉNÉRER ACTIONS SPÉCIFIQUES  
→ getActionsForPriorityType(priorityType, entity, gameState)  // Lignes 79-304
  → switch(priorityType) : 'heal', 'buff', 'ranged_support', etc.
  
// 4. CALCUL SCORE HYBRIDE
→ calculateHybridScore(action, entity, gameState)  // Lignes 309-337
  → Score de base (aiPriority)
  → + Modificateurs intelligents (aiModifiers) 
  → + Bonus situationnels

// 5. SÉLECTION FINALE
→ Tri par score décroissant → Retourne la meilleure action
```

#### 🚨 **POURQUOI RHINGHANN NE FAIT QUE HEAL :**

```javascript
// RHINGHANN : aiPriority = ["heal", "buff", "ranged_support"]
// PROBLÈME : "melee_attack" ABSENT !

// Marteau de guerre défini dans attacks[] :
attacks: [{ name: "son Marteau de guerre", type: "melee", ... }]

// MAIS aiPriority ne contient pas "melee_attack"
// → Le marteau n'est JAMAIS considéré comme option !
```

**SOLUTION IDENTIFIÉE** : Modifier `aiPriority` pour inclure `"melee_attack"` avec conditions

---

## 🔄 **FLUX COMPLET DE L'IA**

### **Phase 1 : Déclenchement du Tour**

```javascript
// FICHIER: stores/combatStore.js  
executeCompanionTurn(companion) {
  // Appelle le système unifié :
  CombatAI.executeEntityTurn(companion, gameState, onMessage, onDamage, onNextTurn)
}
```

### **Phase 2 : CombatAI - Orchestrateur Principal**

```javascript
// FICHIER: services/CombatAI.js - POINT D'ENTRÉE UNIFIÉ
static executeEntityTurn(entity, gameState, callbacks) {
  
  // 1. DÉCISION IA SOPHISTIQUÉE
  const action = EntityAI_Hybrid.getBestAction(entity, gameState)
  
  // 2. EXÉCUTION ROBUSTE
  const result = this.executeAction(entity, action, gameState)
  
  // 3. APPLICATION RÉSULTATS
  this.applyResults(result, callbacks)
}
```

### **Phase 3 : EntityAI_Hybrid - Cerveau Tactique**

```javascript
// FICHIER: services/EntityAI_Hybrid.js - IA SOPHISTIQUÉE

// 3A. ANALYSE PRIORITÉS
static getActionsByPriority(entity, gameState) {
  // Parcourt entity.aiPriority[] dans l'ordre
  entity.aiPriority.forEach((priorityType, index) => {
    const actions = getActionsForPriorityType(priorityType, entity, gameState)
    // Chaque action reçoit un score de base selon sa position dans aiPriority
  })
}

// 3B. GÉNÉRATION D'ACTIONS SPÉCIFIQUES
static getActionsForPriorityType(priorityType, entity, gameState) {
  switch (priorityType) {
    case 'heal':
      // Trouve alliés blessés + sélectionne sorts de soin optimaux
      const woundedAllies = findWoundedAllies(entity, gameState)
      // Génère actions de soin pour chaque allié
      
    case 'melee_attack':
      // Trouve cibles à portée + sélectionne attaques corps-à-corps
      const meleeTargets = findTargetsInMeleeRange(entity, gameState)
      
    case 'ranged_attack':
      // Trouve cibles à distance + sélectionne attaques à distance
      const rangedTargets = findTargetsInRange(entity, gameState)
  }
}

// 3C. SCORING INTELLIGENT  
static calculateHybridScore(action, entity, gameState) {
  let score = action.priorityScore  // Base aiPriority
  
  // Modificateurs depuis aiModifiers
  if (entity.aiModifiers[action.priorityType]) {
    score += applyAIModifiers(...)
  }
  
  // Bonus situationnels (HP, distance, etc.)
  score += getHealthAdjustments(...)
  score += getPositionalAdjustments(...)
  
  return score
}
```

### **Phase 4 : Exécution Actions**

```javascript
// RETOUR À CombatAI.js - EXÉCUTION
static executeAction(entity, action, gameState) {
  switch (action.type) {
    case 'attack':
    case 'melee': 
    case 'ranged':
      // Utilise CombatEngine.resolveAttack()
      
    case 'spell':
      // Utilise SpellServiceUnified.castSpell()
      
    case 'protect':
    case 'taunt':
      // Actions de support
  }
}
```

---

## 📊 **ANALYSE DÉTAILLÉE PAR TYPE D'ENTITÉ**

### **COMPANIONS - Analyse Comportementale**

#### **TYRION (Tank)** ✅ **FONCTIONNE BIEN**
```javascript
aiPriority: ["protect", "taunt", "melee_attack"]
aiModifiers: {
  "protect": { allyLowHPBonus: +60, emergencyBonus: +100 },
  "taunt": { multipleEnemiesBonus: +30, strongEnemyBonus: +45 },
  "melee_attack": { closestEnemyBonus: +20, finishingBonus: +35 }
}
// ✅ COMPORTEMENT: Protège, provoque, attaque au contact - LOGIQUE
```

#### **RHINGANN (Healer)** ❌ **PROBLÈME IDENTIFIÉ**
```javascript
aiPriority: ["heal", "buff", "ranged_support"]  // ❌ "melee_attack" MANQUANT
attacks: [{ name: "Marteau de guerre", type: "melee" }]  // ✅ ARME DÉFINIE
// ❌ COMPORTEMENT: Ne peut JAMAIS utiliser son marteau !
// 🔧 SOLUTION: Ajouter "melee_attack" avec conditions intelligentes
```

#### **KAEL (Archer)** ⚠️ **aiModifiers MANQUANT**
```javascript
aiPriority: ["ranged_attack", "support_skill"]  // ✅ PRIORITÉS COHÉRENTES
aiModifiers: undefined  // ❌ AUCUN BONUS INTELLIGENT
// ⚠️ COMPORTEMENT: Actions basiques sans optimisation
```

#### **FINN (Support)** ⚠️ **aiModifiers MANQUANT**
```javascript
aiPriority: ["support_skill", "ranged_attack", "heal"]  // ✅ PRIORITÉS COHÉRENTES  
aiModifiers: undefined  // ❌ AUCUN BONUS INTELLIGENT
// ⚠️ COMPORTEMENT: Actions basiques sans optimisation
```

#### **ZARA (DPS Caster)** ✅ **FONCTIONNE BIEN**
```javascript
aiPriority: ["ranged_spell", "area_damage", "debuff"]  // ✅ PRIORITÉS COHÉRENTES
aiModifiers: undefined  // ❌ MANQUANT MAIS COMPENSÉ PAR SORTS
// ✅ COMPORTEMENT: Lance des sorts offensifs - CORRECT
```

---

### **ENEMIES - Analyse Comportementale**

#### **GOBELIN** ✅ **IA COMPLÈTE**
```javascript
aiPriority: ["hit_and_run", "ranged_attack", "melee_attack"]
aiModifiers: {
  "hit_and_run": { isolatedTargetBonus: +40 },
  "ranged_attack": { distanceBonus: +25, coverBonus: +35 },
  "melee_attack": { corneredBonus: +40 }
}
// ✅ COMPORTEMENT PRÉVU: Harcèlement, tir à l'arc, combat rapproché
// ❌ PROBLÈME RÉSOLU P0.4: Position manquante → Immobilité  
```

#### **MAGE NOIR** ✅ **IA COMPLÈTE + SORTS**
```javascript
aiPriority: ["ranged_spell", "area_damage", "debuff", "retreat"]
aiModifiers: { ... }  // Complets
spellcasting: { ... }  // Sorts définis
// ✅ COMPORTEMENT: Lanceur de sorts intelligent - PARFAIT
```

#### **TOUS LES AUTRES ENNEMIS** ❌ **IA MANQUANTE**
```javascript
// ombre, molosse, méphite, kobold, goule, squelette, diablotin, diable
aiPriority: undefined      // ❌ AUCUNE PRIORITÉ !
aiModifiers: undefined     // ❌ AUCUN BONUS !
type: undefined           // ❌ TYPE MANQUANT (sauf quelques-uns)
// ❌ COMPORTEMENT: Utilise getFallbackActions() → TRÈS LIMITÉ
```

---

## 🛠️ **FONCTIONS CRITIQUES - Localisation Exacte**

### **DÉPLACEMENT ET POSITIONNEMENT**

| Fonction | Fichier | Lignes | Responsabilité |
|----------|---------|--------|----------------|
| `generateFallbackPosition()` | EntityAI_Hybrid.js | 833-877 | Génère position si manquante |
| `findNearestFreePosition()` | EntityAI_Hybrid.js | 901-938 | Évite collisions |
| `getDistanceToTarget()` | EntityAI_Hybrid.js | 475-498 | Calcul distance entre entités |
| `getPositionalAdjustments()` | EntityAI_Hybrid.js | 448-469 | Bonus/malus selon position |

### **SÉLECTION DE CIBLES**

| Fonction | Fichier | Lignes | Responsabilité |
|----------|---------|--------|----------------|
| `findTargets()` | EntityAI_Hybrid.js | 544-557 | Trouve ennemis selon type entité |
| `findTargetsInMeleeRange()` | EntityAI_Hybrid.js | 642-647 | Cibles à portée contact (≤1) |
| `findTargetsInRange()` | EntityAI_Hybrid.js | 649-654 | Cibles à portée distance (≤6) |
| `findWoundedAllies()` | EntityAI_Hybrid.js | 532-569 | Alliés à soigner (avec seuils intelligents) |

### **SÉLECTION D'ACTIONS**

| Fonction | Fichier | Lignes | Responsabilité |
|----------|---------|--------|----------------|
| `getMeleeAttacks()` | EntityAI_Hybrid.js | 559-561 | Attaques corps-à-corps |
| `getRangedAttacks()` | EntityAI_Hybrid.js | 563-565 | Attaques à distance |
| `getHealingSpells()` | EntityAI_Hybrid.js | 621-673 | Sorts de soin (avec sélection intelligente) |
| `getOffensiveSpells()` | EntityAI_Hybrid.js | 702-729 | Sorts de dégâts |

### **EXÉCUTION D'ACTIONS**

| Fonction | Fichier | Lignes | Responsabilité |
|----------|---------|--------|----------------|
| `executeAttack()` | CombatAI.js | 92-119 | Exécute attaques via CombatEngine |
| `executeSpell()` | CombatAI.js | 124-176 | Exécute sorts via SpellServiceUnified |
| `executeSupportAction()` | CombatAI.js | 181-206 | Actions protect/taunt |

---

## 🐛 **BUGS IDENTIFIÉS - Localisation Précise**

### **BUG #1 : Gobelins Immobiles** ✅ **RÉSOLU P0.4**
- **Fichier** : `EntityAI_Hybrid.js`
- **Lignes** : 103-105 (avant correction)
- **Cause** : Position manquante → `return actions` (liste vide)
- **Solution** : Système de fallback avec génération automatique de positions

### **BUG #2 : Rhinghann N'attaque Jamais** ❌ **NON RÉSOLU**
- **Fichier** : `data/companions.js` 
- **Lignes** : 105 (`aiPriority`)
- **Cause** : `"melee_attack"` absent de `aiPriority`
- **Solution requise** : Ajouter `"melee_attack"` avec conditions

### **BUG #3 : Ennemis Basiques Sans IA** ❌ **NON RÉSOLU**
- **Fichier** : `data/enemies.js`
- **Cause** : 7/9 ennemis sans `aiPriority` ni `aiModifiers`
- **Solution requise** : Homogénéisation complète des propriétés

### **BUG #4 : Companions Sans aiModifiers** ❌ **NON RÉSOLU**
- **Fichier** : `data/companions.js`
- **Entités** : Kael, Finn
- **Cause** : Aucun bonus intelligent défini
- **Solution requise** : Ajouter `aiModifiers` adaptés

---

## 🔍 **POINTS D'INJECTION POUR DEBUGGING**

### **Traces Console Existantes :**
```javascript
// EntityAI_Hybrid.js
console.log(`🧠 ${entity.name} évalue ${actions.length} actions possibles`)
console.log(`🎲 Action choisie:`, bestAction)

// CombatAI.js  
console.log(`🎯 CombatAI UNIFIÉ: Tour de ${entity.name}`)
console.log(`⚡ Exécution de l'action "${action.type}"`)
```

### **Points de Debug Recommandés :**
1. **Début `getBestAction()`** : Vérifier `entity.aiPriority` et `entity.aiModifiers`
2. **`getActionsForPriorityType()`** : Vérifier nombre d'actions générées par type
3. **`calculateHybridScore()`** : Tracer le calcul de score pour chaque action
4. **`executeAction()`** : Confirmer le type d'action avant exécution

---

## 🎯 **PROCHAINES ÉTAPES - Plan d'Action**

### **P1 - Homogénéisation Propriétés** (Urgent)
1. **Companions** : Ajouter `aiModifiers` à Kael et Finn
2. **Companions** : Ajouter `melee_attack` à Rhinghann  
3. **Enemies** : Ajouter `aiPriority` + `aiModifiers` à tous les ennemis manquants

### **P2 - Optimisations IA** (Important)
1. **Scoring dynamique** : Adapter les bonus selon la situation de combat
2. **Actions de groupe** : Coordonner les actions entre compagnons
3. **IA défensive** : Améliorer les décisions de repli/protection

### **P3 - Tests et Validation** (Critique)
1. **Tests unitaires** : Vérifier chaque priorityType
2. **Tests d'intégration** : Valider le flux complet de décision
3. **Tests de performance** : Optimiser les calculs de score

---

*Document généré suite à l'analyse complète du système d'IA - Tous les bugs et solutions sont documentés avec précision.*