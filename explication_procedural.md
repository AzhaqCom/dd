# Explication du Système Procédural Actuel

## 🎯 Objectif Original
Créer du contenu de jeu automatiquement pour éviter d'écrire à la main des centaines de scènes.

---

## 📁 Les Fichiers Créés

### 1. `src/types/story.js` - Les Nouveaux Types
**Ce qu'on a ajouté :**
- `EXPLORATION: 'exploration'` → Un nouveau type de scène
- `PROCEDURAL_ENCOUNTER: 'procedural_encounter'` → Pour les rencontres générées

**À quoi ça sert :**
Ces types disent au jeu "cette scène est spéciale, elle se comporte différemment".

### 2. `src/services/ProceduralGenerator.js` - Le Générateur
**Ce que ça fait :**
- Prend un nom de template (exemple: `"forest_encounter_social"`)
- Regarde dans les templates pour trouver les données
- Mélange le contenu aléatoirement
- Crée une nouvelle scène complète

**Exemple simple :**
```javascript
ProceduralGenerator.generateScene("forest_encounter_social")
// → Crée une scène avec du texte sur la forêt + des choix + des PNJ
```

### 3. `src/data/procedural/templates.js` - La Base de Données
**Ce que ça contient :**
- `forest_encounter_social` → 5 descriptions de forêt + PNJ + dialogues
- `village_encounter_social` → 5 descriptions de village + marchands + habitants  
- `dungeon_encounter_combat` → 5 descriptions de donjon + monstres + combats

**Comment ça marche :**
Le générateur pioche au hasard dans ces listes pour créer du contenu unique.

### 4. `src/services/SceneManager.js` - Le Chef d'Orchestre
**Ce qu'on a ajouté :**
- `getOrGenerateScene()` → Si la scène existe, la charge. Sinon, la génère.
- `isProceduralSceneId()` → Détecte si un ID de scène est procédural
- `generateProceduralScene()` → Appelle le générateur et met en cache

**Le flux :**
1. Le jeu demande la scène `"forest_encounter_social"`
2. SceneManager ne la trouve pas dans les fichiers normaux
3. SceneManager dit "c'est procédural !" et appelle le générateur
4. Le générateur crée la scène et la renvoie

### 5. `src/components/game/ExplorationScene.jsx` - L'Interface
**Ce que ça fait :**
- Affiche une interface d'exploration avec des boutons
- "🔍 Explorer la zone" → génère une nouvelle rencontre
- "💬 Approcher quelqu'un" → dialogue avec PNJ
- "➡️ Continuer" → retour à l'histoire normale

**Le problème :**
Cette interface attend des scènes de type `EXPLORATION`, mais nos templates créent des scènes de type `TEXT`.

### 6. `src/data/scenes/test_procedural.js` - Les Tests
**Ce que ça fait :**
- Crée un menu de test accessible depuis le prologue
- Chaque choix mène vers un template différent
- Permet de tester si la génération fonctionne

**Les options de test :**
- `forest_encounter_social` → Teste les rencontres sociales en forêt
- `village_encounter_social` → Teste les rencontres sociales au village
- `dungeon_encounter_combat` → Teste les combats de donjon

---

## 🔄 Comment Ça Fonctionne (Théoriquement)

### Flux Normal :
1. **Joueur clique** sur "Tester une forêt procédurale"
2. **Le jeu** demande la scène `"forest_encounter_social"`
3. **SceneManager** ne trouve pas cette scène dans les fichiers
4. **SceneManager** appelle `ProceduralGenerator.generateScene("forest_encounter_social")`
5. **ProceduralGenerator** regarde dans `templates.js`
6. **ProceduralGenerator** trouve le template `forest_encounter_social`
7. **ProceduralGenerator** pioche au hasard : description 3/5, PNJ 1/3, etc.
8. **ProceduralGenerator** assemble tout en une nouvelle scène
9. **Le jeu** affiche cette scène générée

### Exemple Concret :
```javascript
// Le joueur clique sur "Tester une forêt"
// Le jeu appelle SceneManager.getScene("forest_encounter_social")
// SceneManager appelle ProceduralGenerator.generateScene("forest_encounter_social")
// Le générateur pioche dans le template :

Template: {
  descriptions: [
    "Les arbres murmurent...",           // ← CELLE-CI est choisie
    "Un sentier serpente...",
    "La lumière filtrée...",
    // etc.
  ],
  npcs: [
    { role: 'hermit', name: 'Vieux Tom' }, // ← CELUI-CI est choisi
    // etc.
  ]
}

// Résultat = nouvelle scène avec :
// - Texte: "Les arbres murmurent..."
// - PNJ: Vieux Tom l'ermite
// - Choix générés automatiquement
```

---

## 🐛 Pourquoi Ça Ne Marche Pas Actuellement

### Problème 1 : Type de Scène Incorrect
- Les templates créent des scènes `TEXT` normales
- Le composant `ExplorationScene` attend des scènes `EXPLORATION`
- Résultat : Les scènes générées s'affichent comme du texte normal

### Problème 2 : Détection Procédurale Cassée
- `isProceduralSceneId("forest_encounter_social")` retourne `false`
- Le SceneManager ne sait pas que c'est procédural
- Il cherche dans les fichiers normaux, ne trouve rien, retourne une erreur

### Problème 3 : Templates Mal Formatés
- Les templates ne respectent pas exactement le format `UnifiedSceneSchema`
- Certaines propriétés attendues sont manquantes
- Le rendu peut planter

---

## 🎯 Ce Qu'Il Faut Tester (Une Fois Réparé)

### Test Simple :
1. Lance le jeu
2. Choisis un personnage
3. Clique sur "🎲 [DEV] Tester génération procédurale"
4. Choisis "🌲 Tester une forêt procédurale (social)"

### Ce Que Tu Devrais Voir :
- Un texte généré aléatoirement sur la forêt
- Des choix comme "Approcher l'ermite" ou "Explorer davantage"
- Une interface différente des scènes normales
- Dans la console : des logs de génération

### Ce Que Tu Vois Actuellement :
- "Erreur de génération procédurale (template: forest)"
- Une scène d'erreur générique
- Aucune interface d'exploration

---

## 🔧 Comment Réparer (En Résumé)

1. **Corriger la détection procédurale** dans SceneManager
2. **Faire que les templates créent des scènes EXPLORATION** au lieu de TEXT
3. **Connecter ExplorationScene avec les scènes générées**
4. **Tester que tout fonctionne ensemble**

Le système est là, il faut juste connecter les pièces correctement !