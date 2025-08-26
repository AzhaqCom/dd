# Structure des Effets de Sorts - Guide de Documentation

## 📋 Vue d'ensemble

Ce document détaille la structure unifiée des effets de sorts après la refactorisation du système. Tous les sorts avec effets doivent suivre cette structure standardisée.

---

## 🏗️ Structure Générale

### Format Requis
```js
"Nom du Sort": {
    // Propriétés du sort existantes...
    name: "Nom du Sort",
    level: 1,
    school: "École",
    // ...
    
    // ✅ NOUVELLE STRUCTURE UNIFIÉE
    effect: {
        type: "nom_type_effet",      // Type exact dans CombatEffects.EFFECT_TYPES
        duration: 3600,              // Durée en secondes
        properties: {                // Propriétés spécifiques à l'effet
            // Voir exemples ci-dessous
        },
        description: "Description courte de l'effet"
    }
}
```

### Règles de Structuration
1. **Type obligatoire** : Doit correspondre exactement à un type dans `CombatEffects.EFFECT_TYPES`
2. **Durée en secondes** : Toujours en secondes pour la cohérence
3. **Properties spécifiques** : Adaptées au type d'effet
4. **Description claire** : Résumé de l'effet pour l'UI

---

## 📚 Exemples par Catégorie

### 🛡️ Effets de CA (Classe d'Armure)

#### Armure du Mage (setAC)
```js
effect: {
    type: "mage_armor",
    duration: 28800,             // 8 heures
    properties: {
        setAC: 13,               // CA fixe à 13 + Mod. Dex
        usesDexMod: true
    },
    description: "CA = 13 + Mod. Dex pendant 8 heures"
}
```

#### Bouclier (bonus CA)
```js
effect: {
    type: "shield",
    duration: 6,                 // 1 round
    properties: {
        acBonus: 5,              // +5 CA
        isReaction: true         // Sort de réaction
    },
    description: "+5 CA jusqu'au début du prochain tour"
}
```

### ⚔️ Effets de Combat

#### Bénédiction (bonus aux jets)
```js
effect: {
    type: "blessed",
    duration: 600,               // 10 minutes
    properties: {
        attackBonus: "1d4",      // +1d4 aux attaques
        saveBonus: "1d4"         // +1d4 aux sauvegardes
    },
    description: "+1d4 aux attaques et sauvegardes pendant 1 minute"
}
```

#### Entrave (restriction de mouvement)
```js
effect: {
    type: "restrained",
    duration: 3600,              // 1 heure
    properties: {
        speedReduction: 0,       // Vitesse = 0
        disadvantageAttacks: true,
        disadvantageDexSaves: true
    },
    description: "Entravé pendant 1 heure (vitesse = 0, désavantage attaques/Dex)"
}
```

### 🛡️ Effets de Protection

#### Sanctuaire (protection)
```js
effect: {
    type: "sanctuary",
    duration: 600,               // 10 minutes
    properties: {
        protectionType: "attack_spell", // Protection contre attaques et sorts
        saveDC: "spell",                // DC basé sur le lanceur
        saveAbility: "wisdom"           // Jet de sagesse requis
    },
    description: "Protection contre attaques (Jet Sag. DD sort) pendant 1 minute"
}
```

### ❤️ Effets de Points de Vie

#### Aide (bonus PV)
```js
effect: {
    type: "aid",
    duration: 28800,             // 8 heures
    properties: {
        maxHPBonus: 5,           // +5 PV maximum
        currentHPBonus: 5        // +5 PV actuels (règle D&D)
    },
    description: "+5 PV maximum et actuels pendant 8 heures"
}
```

---

## 🔧 Propriétés par Type d'Effet

### Types de Properties Communes

#### Bonus Numériques
```js
properties: {
    acBonus: 5,              // Bonus à la CA
    attackBonus: "1d4",      // Bonus aux attaques (peut être un dé)
    saveBonus: "1d4",        // Bonus aux sauvegardes
    speedBonus: 30,          // Bonus de vitesse
    maxHPBonus: 5,           // Bonus aux PV max
    currentHPBonus: 5        // Bonus aux PV actuels
}
```

#### Mécaniques Spéciales
```js
properties: {
    setAC: 13,                      // CA fixe (remplace la CA existante)
    usesDexMod: true,               // Utilise le modificateur de Dextérité
    isReaction: true,               // Sort lancé en réaction
    protectionType: "attack_spell", // Type de protection
    saveDC: "spell",                // DC de sauvegarde basé sur le lanceur
    saveAbility: "wisdom"           // Caractéristique pour le jet de sauvegarde
}
```

#### Restrictions et Désavantages
```js
properties: {
    speedReduction: 0,          // Réduction de vitesse (0 = immobile)
    disadvantageAttacks: true,   // Désavantage aux attaques
    disadvantageDexSaves: true,  // Désavantage aux jets de Dex
    cannotMove: true,           // Impossible de se déplacer
    cannotAttack: true          // Impossible d'attaquer
}
```

---

## 🎯 Correspondance avec CombatEffects.EFFECT_TYPES

### Types Disponibles
| Type Code | Nom Français | Mécaniques |
|-----------|--------------|------------|
| `mage_armor` | Armure du Mage | setAC: 13 + Dex |
| `blessed` | Béni | +1d4 attaques/saves |
| `shield` | Bouclier | +5 CA temporaire |
| `sanctuary` | Sanctuaire | Protection attaques |
| `aid` | Aide | +5 PV maximum |
| `restrained` | Entravé | Vitesse 0, désavantages |
| `poisoned` | Empoisonné | Désavantage attaques/tests |
| `stunned` | Étourdi | Incapacité totale |
| `paralyzed` | Paralysé | Incapacité + vulnérabilité |
| `frightened` | Effrayé | Désavantage conditionnel |
| `charmed` | Charmé | Restrictions sociales |
| `haste` | Hâte | Vitesse x2, +action, +2 CA |

---

## ✅ Liste de Contrôle pour Nouveaux Sorts

### Avant d'ajouter un sort avec effet :

1. **☑️ Type existant** : Le type existe-t-il dans `CombatEffects.EFFECT_TYPES` ?
2. **☑️ Duration cohérente** : Durée en secondes selon les règles D&D ?
3. **☑️ Properties appropriées** : Les propriétés correspondent-elles aux mécaniques ?
4. **☑️ Description claire** : La description résume-t-elle l'effet ?
5. **☑️ Cohérence UI** : L'effet sera-t-il bien affiché dans l'interface ?

### Si le type n'existe pas :
1. Ajouter le type dans `CombatEffects.EFFECT_TYPES`
2. Implémenter les mécaniques associées
3. Tester l'intégration avec le système

---

## 📝 Migration depuis l'Ancien Format

### Anciens formats à supprimer :
```js
// ❌ ANCIEN FORMAT (à supprimer)
buff: {
    acBonus: 3,
    duration: 28800
}

// ❌ ANCIEN FORMAT (à supprimer)
effect: "restrained"
```

### Nouveau format unifié :
```js
// ✅ NOUVEAU FORMAT (standardisé)
effect: {
    type: "mage_armor",
    duration: 28800,
    properties: {
        setAC: 13,
        usesDexMod: true
    },
    description: "CA = 13 + Mod. Dex pendant 8 heures"
}
```

---

*Document créé le : 2025-08-26*  
*Dernière mise à jour : 2025-08-26*  
*Version : 1.0 - Structure unifiée*