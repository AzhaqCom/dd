# État des Lieux : Système de Temporalité

## 📊 Analyse de l'État Actuel

### ✅ Système REST : IMPLÉMENTÉ ET FONCTIONNEL

Le système de repos est **déjà complètement implémenté** avec une architecture solide :

#### Types de Scènes REST
```javascript
// src/types/story.js
REST_LONG: 'rest_long',        // Repos long (8h) - récupération complète
REST_SHORT: 'rest_short',      // Repos court (1h) - dés de vie
REST_CHOICE: 'rest_choice'     // Choix entre repos court/long
```

#### Composant RestScene
- **Fichier** : `src/components/game/RestScene.jsx` (194 lignes)
- **État** : Complètement fonctionnel
- **Fonctionnalités** :
  - Interface utilisateur dédiée avec icônes contextuelles
  - Gestion des dés de vie pour repos courts
  - Affichage de l'état du personnage (HP, dés de vie disponibles)
  - Animation de repos avec feedback visuel
  - Intégration parfaite avec le système de scènes

#### Mécaniques de Repos dans CharacterStore
```javascript
// Déjà implémenté
shortRestPlayer()     // Récupère une partie des HP via dés de vie
longRestPlayer()      // Récupération complète HP + sorts
spendHitDie()        // Dépenser dés de vie pendant repos court
```

### ❌ Système TEMPOREL : PRÉPARÉ MAIS NON IMPLÉMENTÉ

#### Infrastructure UI Prête
```javascript
// StatusCorner.jsx - DÉJÀ PRÉVU
gameTime ? formatTime(gameTime) : null
gameTime.day, gameTime.hour, gameTime.weather
```

```javascript
// GameHotbar.jsx - DÉJÀ PRÉVU  
gameTime ? (gameTime.hour < 6 ? 'Nuit' : 'Jour') : ''
```

#### TODOs Explicites dans le Code
```javascript
// App.jsx - Lignes 503, 510
gameTime={null} // TODO: Ajouter gameTime quand implémenté
```

---

## 🎯 Recommandations Techniques

### 1. Architecture du Store Temporel

```javascript
// src/stores/timeStore.js
export const useTimeStore = create(
  devtools((set, get) => ({
    // État temporel
    currentTime: {
      day: 1,           // Jour du voyage (commence à 1)
      hour: 8,          // Heure (0-23, commence à 8h00)
      minute: 0,        // Minutes (pour précision future)
      phase: 'morning'  // 'morning', 'day', 'evening', 'night'
    },
    
    // Configuration temporelle
    config: {
      minutesPerAction: 30,    // Chaque action = 30 minutes
      hoursPerLongRest: 8,     // Repos long = 8 heures
      hoursPerShortRest: 1,    // Repos court = 1 heure
      dayStartHour: 6,         // 6h = début du jour
      nightStartHour: 22       // 22h = début de la nuit
    },

    // Actions temporelles
    advanceTime: (minutes) => set((state) => {
      const newTime = TimeUtils.addMinutes(state.currentTime, minutes);
      return { 
        currentTime: newTime,
        // Trigger events si changement de jour/phase
        ...TimeUtils.checkTimeEvents(state.currentTime, newTime)
      };
    }),

    performRest: (restType) => set((state) => {
      const hours = restType === 'long' ? 8 : 1;
      const newTime = TimeUtils.addHours(state.currentTime, hours);
      return { currentTime: newTime };
    }),

    // Utilitaires
    getTimePhase: () => {
      const { hour } = get().currentTime;
      if (hour < 6) return 'night';
      if (hour < 12) return 'morning'; 
      if (hour < 18) return 'day';
      if (hour < 22) return 'evening';
      return 'night';
    },

    isNightTime: () => {
      const { hour } = get().currentTime;
      return hour < 6 || hour >= 22;
    }
  }))
);
```

### 2. Service Utilitaire Temporel

```javascript
// src/services/TimeService.js
export class TimeService {
  
  static addMinutes(currentTime, minutes) {
    let { day, hour, minute } = currentTime;
    
    minute += minutes;
    
    // Gestion des dépassements
    while (minute >= 60) {
      hour++;
      minute -= 60;
    }
    
    while (hour >= 24) {
      day++;
      hour -= 24;
    }
    
    return { 
      day, 
      hour, 
      minute,
      phase: this.calculatePhase(hour)
    };
  }
  
  static calculatePhase(hour) {
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'day';
    if (hour < 22) return 'evening';
    return 'night';
  }
  
  static formatTime(timeObj) {
    const { hour, minute, day } = timeObj;
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    const period = this.getPeriodName(hour);
    
    return {
      time: `${formattedHour}:${formattedMinute}`,
      period,
      day: `Jour ${day}`
    };
  }
  
  static getPeriodName(hour) {
    if (hour < 6) return 'Nuit';
    if (hour < 12) return 'Matin';
    if (hour < 18) return 'Jour';
    if (hour < 22) return 'Soir';
    return 'Nuit';
  }
}
```

### 3. Intégration avec les Actions du Joueur

```javascript
// Extension du SceneManager pour progression temporelle
export class SceneManager {
  
  static processSceneTransition(fromScene, toScene, choice) {
    const timeAdvanced = this.calculateTimeAdvanced(fromScene, toScene, choice);
    
    if (timeAdvanced > 0) {
      useTimeStore.getState().advanceTime(timeAdvanced);
    }
    
    // Vérifier les événements temporels déclenchés
    this.checkTimeBasedEvents();
  }
  
  static calculateTimeAdvanced(fromScene, toScene, choice) {
    // Temps par type d'action
    const ACTION_TIME_COST = {
      combat: 30,           // 30 minutes par combat
      exploration: 60,      // 1 heure par exploration
      dialogue: 15,         // 15 minutes par dialogue
      travel: 120,          // 2 heures par voyage
      investigation: 45     // 45 minutes par investigation
    };
    
    // Analyser le type d'action basé sur les scènes
    if (choice?.consequences?.timeCost) {
      return choice.consequences.timeCost; // Temps explicite
    }
    
    if (toScene.type === 'COMBAT') return ACTION_TIME_COST.combat;
    if (toScene.type === 'INTERACTIVE') return ACTION_TIME_COST.exploration;
    
    return ACTION_TIME_COST.dialogue; // Défaut
  }
}
```

### 4. Extension du Système REST

```javascript
// Extension de RestScene.jsx pour intégration temporelle
const handleRestChoice = (choice) => {
  const restType = choice.restType;
  const timeStore = useTimeStore();
  
  // Calculer la durée du repos
  const restHours = restType === 'long' ? 8 : 1;
  
  // Message avec heure de fin
  const currentTime = timeStore.currentTime;
  const endTime = TimeService.addHours(currentTime, restHours);
  
  addCombatMessage(
    `Repos ${restType === 'short' ? 'court' : 'long'} jusqu'à ${TimeService.formatTime(endTime).time}`,
    'rest-start'
  );
  
  // Effectuer le repos + avancer le temps
  setTimeout(() => {
    if (restType === 'short') {
      shortRestPlayer();
    } else {
      longRestPlayer();
    }
    
    // NOUVEAU : Avancer le temps
    timeStore.performRest(restType);
    
    setRestInProgress(false);
    if (onChoice) onChoice(choice);
  }, 1000);
};
```

---

## 🚀 Plan d'Implémentation Progressif - SUIVI DÉTAILLÉ

### Phase 1 : Infrastructure (1 semaine)
- [✅] Créer `timeStore.js` avec état temporel de base
  - ✅ Store Zustand avec devtools et partialize
  - ✅ État temporel complet (jour/heure/phase)
  - ✅ Configuration des coûts temporels par action
  - ✅ Historique et statistiques
  - ✅ Actions principales (advanceTime, performRest, etc.)
  - ✅ Getters et utilitaires (phases, formatage)
  - ✅ Méthodes de debug pour développement
  - ✅ Classe utilitaire TimeStore avec méthodes pures
  - ✅ Sélecteurs optimisés pour les composants
- [✅] Implémenter `TimeService.js` avec utilitaires
  - ✅ Calculs temporels de base (addMinutes, addHours, addDays)
  - ✅ Calculs de phases et périodes (calculatePhase, isNight, isDay)
  - ✅ Formatage et affichage (formatTime, getPeriodName)
  - ✅ Logique métier (calculateActionTimeCost, validateRestAvailability)
  - ✅ Utilitaires et helpers (getTimeDifference, timeToTotalMinutes)
  - ✅ Génération d'événements temporels (generateTimeEvents)
  - ✅ Méthodes de test et debug (validateTimeObject, createTestTime)
- [✅] Connecter les composants UI existants (`StatusCorner`, `GameHotbar`)
  - ✅ StatusCorner intégré avec système temporel
  - ✅ GameHotbar intégré avec système temporel  
  - ✅ Suppression des paramètres gameTime obsolètes dans App.jsx
  - ✅ Correction des sélecteurs pour éviter les boucles infinies
- [✅] Tests unitaires sur les calculs temporels
  - ✅ 45+ tests couvrant tous les calculs critiques
  - ✅ Tests de calculs de base (addMinutes, addHours, addDays)
  - ✅ Tests de phases temporelles (calculatePhase, isNight, isDay)
  - ✅ Tests de formatage et affichage 
  - ✅ Tests de logique métier (calculateActionTimeCost, validateRestAvailability)
  - ✅ Tests d'utilitaires et edge cases
  - ✅ Tests de validation et robustesse

### Phase 2 : Intégration Actions (1 semaine)  
- [ ] Modifier `SceneManager` pour progression temporelle automatique
- [ ] Étendre `RestScene` avec gestion temporelle
- [ ] Ajouter coûts temporels dans les définitions de scènes
- [ ] Tests d'intégration avec scènes existantes

### Phase 3 : Événements Temporels (1 semaine)
- [ ] Système d'événements basés sur l'heure (jour/nuit)
- [ ] Mécaniques spéciales nocturnes (malus/bonus)
- [ ] Rencontres aléatoires temporelles
- [ ] Intégration avec génération procédurale

### Phase 4 : Optimisations (1 semaine)
- [ ] Sauvegarde/chargement de l'état temporel
- [ ] Optimisations performances
- [ ] Interface de debug temporel
- [ ] Documentation complète

---

## ✅ Avantages de cette Approche

### Architecture Cohérente
- **Réutilise** le système REST déjà fonctionnel
- **Étend** sans perturber l'architecture existante  
- **Respecte** les patterns Zustand établis

### Progression Naturelle
- **Immersion** : Le temps passe naturellement avec les actions
- **Stratégie** : Les joueurs doivent planifier leurs repos
- **Réalisme** : Cohérence avec les mécaniques D&D

### Extensibilité Future
- **Génération procédurale** : Templates temporels (événements nocturnes)
- **Quêtes temporelles** : Objectifs avec limites de temps
- **Système météo** : Évolution selon les jours

### Performance
- **Léger** : Calculs simples, pas de timers complexes
- **Déterministe** : Basé sur les actions, pas sur le temps réel
- **Cacheable** : État sérialisable pour sauvegarde

---

## 🎯 Conclusion

Votre système de repos est **déjà excellent et fonctionnel**. Le système temporel nécessite simplement :

1. **Store temporel** simple avec calculs basés sur les actions
2. **Extension du SceneManager** pour progression automatique  
3. **Connexion des composants UI** déjà préparés
4. **Intégration avec REST** existant pour cohérence

Cette approche respecte parfaitement votre architecture actuelle tout en ajoutant la dimension temporelle de manière organique et stratégique.