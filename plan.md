# Plan de Refactorisation du Système de Sorts

## 📋 Vue d'ensemble

Ce document trace la refonte complète du système de sorts pour résoudre les problèmes d'architecture identifiés :

### Problématiques Résolues
- **Violation d'immutabilité** : `CombatEffects.applyEffect` modifie l'objet en place
- **Types d'effets incohérents** : Effet "buff" générique inexistant dans `EFFECT_TYPES`
- **Duplication de logique** : Séparation artificielle entre sorts combat/exploration
- **Responsabilités mélangées** : Store gérant calculs ET état

### Objectifs
- ✨ **Fonctions pures** sans effets de bord
- 🎯 **Responsabilité unique** par service
- 🔄 **Système unifié** pour tous les contextes de sorts
- 🧪 **Architecture testable** et maintenable

---

## 🗺️ Phase Préliminaire : Base de Données

### Harmonisation des Sorts
- [ ] **Tâche 1.1** : Auditer `src/data/spells.js` pour identifier les sorts avec effets
- [ ] **Tâche 1.2** : Standardiser la structure des effets dans chaque sort
  ```js
  effect: {
    type: "mage_armor",           // Type exact dans CombatEffects.EFFECT_TYPES
    duration: 28800,             // Durée en secondes
    properties: {                // Propriétés spécifiques
      setAC: 13,
      usesDexMod: true
    },
    description: "CA = 13 + Mod. Dex pendant 8 heures"
  }
  ```
- [ ] **Tâche 1.3** : Valider que tous les types d'effets existent dans `CombatEffects.EFFECT_TYPES`
- [ ] **Tâche 1.4** : Créer des exemples de documentation pour les nouveaux formats

### Fichiers Impactés
- `src/data/spells.js`
- Documentation des structures de données

---

## 🧪 Phase 1 : Fonctions Pures

### Implémentation CombatEffects Pur
- [ ] **Tâche 2.1** : Créer `applyEffectPure(character, effectData)` avec JSDoc complet
- [ ] **Tâche 2.2** : Créer `calculateTotalACPure(character)` avec JSDoc complet
- [ ] **Tâche 2.3** : Ajouter méthodes utilitaires privées `_addOrReplaceEffect` et `_calculateACModifiers`
- [ ] **Tâche 2.4** : Marquer les anciennes méthodes comme `@deprecated`
- [ ] **Tâche 2.5** : Ajouter validation stricte des types d'effets avec messages d'erreur explicites

### Tests Unitaires
- [ ] **Tâche 2.6** : Créer `tests/services/CombatEffects.pure.test.js`
- [ ] **Tâche 2.7** : Test d'immutabilité (objet original non modifié)
- [ ] **Tâche 2.8** : Test de déterminisme (même entrée = même sortie)
- [ ] **Tâche 2.9** : Test de validation des types d'effets
- [ ] **Tâche 2.10** : Test des cas limites (character null, effets invalides)

### Fichiers Impactés
- `src/services/combatEffects.js`
- `tests/services/CombatEffects.pure.test.js`

---

## 📦 Phase 2 : Store Refactorisé

### Nouvelle Architecture du Store
- [ ] **Tâche 3.1** : Créer `applyEffectToPlayer(effectData)` remplaçant `applyBuffToPlayer`
- [ ] **Tâche 3.2** : Refactoriser `castSpellPlayer` pour déléguer au service unifié
- [ ] **Tâche 3.3** : Ajouter gestion d'erreurs avec try/catch dans `applyEffectToPlayer`
- [ ] **Tâche 3.4** : Marquer `applyBuffToPlayer` comme `@deprecated`

### Injection de Dépendances
- [ ] **Tâche 3.5** : Modifier constructeur `SpellServiceUnified` pour recevoir les dépendances
- [ ] **Tâche 3.6** : Passer `applyEffectToPlayer` au service dans `castSpellPlayer`

### Tests d'Intégration Store
- [ ] **Tâche 3.7** : Test `applyEffectToPlayer` avec différents types d'effets
- [ ] **Tâche 3.8** : Test gestion d'erreurs (effet invalide, character null)
- [ ] **Tâche 3.9** : Test `castSpellPlayer` avec délégation au service

### Fichiers Impactés
- `src/stores/characterStore.js`
- `tests/stores/characterStore.test.js`

---

## ✨ Phase 3 : Service Unifié

### Simplification SpellServiceUnified
- [ ] **Tâche 4.1** : Refactoriser `processExplorationSpellResults` pour utiliser `applyEffect` injecté
- [ ] **Tâche 4.2** : Créer `_applyEnvironmentalEffect` pour effets non-statistiques
- [ ] **Tâche 4.3** : Supprimer la logique de mapping complexe `determineBuffType`
- [ ] **Tâche 4.4** : Simplifier le constructeur avec injection de dépendances claire

### Nettoyage du Code
- [ ] **Tâche 4.5** : Supprimer les imports inutiles (`CombatEffects` dans le service)
- [ ] **Tâche 4.6** : Nettoyer les méthodes obsolètes de mapping d'effets
- [ ] **Tâche 4.7** : Harmoniser les messages d'erreur avec les nouvelles structures

### Tests Service Unifié
- [ ] **Tâche 4.8** : Test avec injection de dépendances mock
- [ ] **Tâche 4.9** : Test séparation effets statistiques/environnementaux
- [ ] **Tâche 4.10** : Test compatibility contexts combat/exploration

### Fichiers Impactés
- `src/services/SpellServiceUnified.js`
- `tests/services/SpellServiceUnified.test.js`

---

## 🧪 Phase 4 : Tests et Migration

### Suite de Tests Complète
- [ ] **Tâche 5.1** : Tests end-to-end du flux complet (sort → effet → application)
- [ ] **Tâche 5.2** : Tests de régression sur les cas d'usage existants
- [ ] **Tâche 5.3** : Tests de performance (fonctions pures vs mutatives)
- [ ] **Tâche 5.4** : Coverage report et validation 100% des nouvelles fonctions

### Migration des Composants UI
- [ ] **Tâche 5.5** : Identifier les composants utilisant l'ancien système
- [ ] **Tâche 5.6** : Migrer `CharacterSheet.jsx` vers nouvelles méthodes
- [ ] **Tâche 5.7** : Migrer `CombatPanel.jsx` vers nouvelles méthodes
- [ ] **Tâche 5.8** : Tester l'interface utilisateur après migration

### Nettoyage Final
- [ ] **Tâche 5.9** : Supprimer les méthodes `@deprecated` après validation
- [ ] **Tâche 5.10** : Nettoyer les imports et dépendances obsolètes
- [ ] **Tâche 5.11** : Mise à jour de la documentation technique
- [ ] **Tâche 5.12** : Validation finale avec tests de non-régression

### Fichiers Impactés
- Tous les composants utilisant le système de sorts
- Documentation projet

---

## 📊 Métriques de Succès

### Critères de Validation
- [ ] **Critère 1** : Aucun effet de bord détectable dans les tests
- [ ] **Critère 2** : 100% de coverage sur les nouvelles fonctions pures
- [ ] **Critère 3** : Aucune régression fonctionnelle détectée
- [ ] **Critère 4** : Temps d'exécution équivalent ou amélioré
- [ ] **Critère 5** : Suppression complète des warnings de types d'effets

### Indicateurs de Qualité
- [ ] **Indicateur 1** : Complexité cyclomatique réduite dans les services
- [ ] **Indicateur 2** : Nombre de responsabilités par classe respecté (SRP)
- [ ] **Indicateur 3** : Couplage réduit entre les modules
- [ ] **Indicateur 4** : Documentation complète (JSDoc) sur toutes les nouvelles fonctions

---

## 🗂️ Organisation des Fichiers

### Structure Avant Refactorisation
```
src/
├── services/
│   ├── combatEffects.js          # Fonctions mutatives
│   ├── SpellServiceUnified.js    # Logique dupliquée
├── stores/
│   └── characterStore.js         # applyBuffToPlayer + castSpellPlayer
└── data/
    └── spells.js                 # Structure inconsistante
```

### Structure Après Refactorisation
```
src/
├── services/
│   ├── combatEffects.js          # ✅ Fonctions pures + deprecated
│   ├── SpellServiceUnified.js    # ✅ Service simplifié avec DI
├── stores/
│   └── characterStore.js         # ✅ applyEffectToPlayer unifié
├── data/
│   └── spells.js                 # ✅ Structure harmonisée
└── tests/
    └── services/
        ├── CombatEffects.pure.test.js
        └── SpellServiceUnified.test.js
```

---

## 🚀 Prochaines Étapes

1. **Validation du Plan** : Review de ce document avec l'équipe
2. **Setup Environnement** : Configuration des outils de test
3. **Démarrage Phase Préliminaire** : Audit de `spells.js`

---

*Document créé le : 2025-08-26*  
*Dernière mise à jour : 2025-08-26*  
*Statut global : 🔄 Planification*