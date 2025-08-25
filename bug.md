👹 Enemy turn starting: Ombre
CombatTurnManager.jsx:281 🔴 SimpleTurn: Ombre
combatStore.js:47 🎯 CombatStore: Tour unifié pour Ombre (enemy)
CombatAI.js:21 🎯 CombatAI UNIFIÉ: Tour de Ombre (enemy) - IA: ActionPlanner + Sorts: SpellServiceUnified
CombatAI.js:32 🧠 DEBUG: Début planification tactique pour Ombre
CombatAI.js:33 🧠 DEBUG: Entity data: {name: 'Ombre', role: 'brute', movement: 6, currentHP: 16, maxHP: 16, …}
CombatAI.js:41 🧠 DEBUG: GameState positions: {player: {…}, rhingann: {…}, Ombre: {…}, Gobelin: {…}, playerStartPos: {…}, …}
ActionPlanner.js:355 🎯 DEBUG: Début planCompleteTurn pour Ombre
ActionPlanner.js:360 🎯 DEBUG: Évaluation plan 1 - Attaque sur place
ActionPlanner.js:431 🎯 DEBUG: evaluateAttackInPlace pour Ombre
ActionPlanner.js:435 🎯 DEBUG: Position actuelle: {x: 2, y: 1}
ActionPlanner.js:630 🎯 DEBUG: getBestActionAtPosition pour Ombre à position {x: 2, y: 1}
ActionPlanner.js:452 🎯 DEBUG: Meilleure action: null
ActionPlanner.js:455 ❌ DEBUG: Aucune action disponible depuis position actuelle
ActionPlanner.js:366 ❌ DEBUG: Plan 1 rejeté
ActionPlanner.js:370 🎯 DEBUG: Évaluation plan 2 - Bouger puis attaquer
ActionPlanner.js:487 🎯 DEBUG: evaluateMoveThenAttack pour Ombre
ActionPlanner.js:490 🎯 DEBUG: Position actuelle pour mouvement: {x: 2, y: 1}
MovementPlanner.js:56 🗺️ DEBUG: 39 positions libres trouvées pour Ombre
ActionPlanner.js:630 🎯 DEBUG: getBestActionAtPosition pour Ombre à position {x: 4, y: 5}
ActionPlanner.js:510 ❌ DEBUG: Aucune action possible depuis la meilleure position trouvée
ActionPlanner.js:376 ❌ DEBUG: Plan 2 rejeté
ActionPlanner.js:380 🎯 DEBUG: Évaluation plan 3 - Hit-and-run
ActionPlanner.js:630 🎯 DEBUG: getBestActionAtPosition pour Ombre à position {x: 2, y: 1}
ActionPlanner.js:386 ❌ DEBUG: Plan 3 rejeté
ActionPlanner.js:390 🎯 DEBUG: Évaluation plan 4 - Double mouvement
MovementPlanner.js:56 🗺️ DEBUG: 43 positions libres trouvées pour Ombre
ActionPlanner.js:394 ✅ DEBUG: Plan 4 ajouté
ActionPlanner.js:399 🎯 DEBUG: 1 plans disponibles
ActionPlanner.js:404 🎯 DEBUG: Plan 1 score: 34
ActionPlanner.js:411 🧠 Ombre planifie: Plan: Action Dash pour double mouvement → Bouge vers 5,5 (position_tactique) [Score: 34]
CombatAI.js:46 🧠 DEBUG: Plan créé: TurnPlan {phases: Array(2), totalScore: 34, movementUsed: 7, totalMovement: 12, reasoning: 'Charge agressive'}
CombatAI.js:70 🎯 Plan tactique: Plan: Action Dash pour double mouvement → Bouge vers 5,5 (position_tactique) [Score: 34]
CombatAI.js:294 🎮 Exécution du plan tactique de Ombre: Plan: Action Dash pour double mouvement → Bouge vers 5,5 (position_tactique) [Score: 34]
CombatAI.js:299 📋 Phase 1/2: dash
CombatAI.js:406 🏃 Ombre utilise Dash - mouvement doublé
CombatAI.js:299 📋 Phase 2/2: move
CombatAI.js:347 ⚠️ Mouvement trop long pour Ombre: 7 > 6
✅ Plan tactique de Ombre terminé