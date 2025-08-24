🔍 Validation du sort "Armure du Mage": {spell: {…}, caster: {…}, potentialTargets: Array(0), context: {…}}
SpellEngine.js:174   🎯 Sort pouvant cibler "self", ajout du lanceur comme cible
SpellEngine.js:179 
🎯 Vérification de Elarion:
SpellEngine.js:212     📏 Pas de positions → accepté (hors combat)
SpellEngine.js:183   📏 Portée OK: true
SpellEngine.js:257     🎭 targetType requis: "self"
SpellEngine.js:258     🎭 caster.type: "player", target.type: "player"
SpellEngine.js:269     🎭 Self: true
SpellEngine.js:188   🎭 Type OK: true
SpellEngine.js:192   ✅ Elarion ajouté aux cibles valides
SpellEngine.js:197 
📊 Résultat: 1/1 cibles valides
SpellServiceUnified.js:134 Cibles valides pour Armure du Mage: ['Elarion']
SpellServiceUnified.js:54 🔍 DEBUG: validTargets après filtrage: 1 ['Elarion']
SpellServiceUnified.js:65 🎯 DEBUG: Lancement du sort Armure du Mage sur 1 cibles
SpellServiceUnified.js:69 🎯 DEBUG: Résultat castSpell: true {success: true, caster: {…}, spell: {…}, targets: Array(1), messages: Array(1), …}
SpellServiceUnified.js:76 🔄 DEBUG: Traitement résultats sort, contexte: exploration
SpellServiceUnified.js:77 🔄 DEBUG: castResult.effects: [{…}]
SpellServiceUnified.js:205 🌍 DEBUG: Traitement effets exploration, 1 effets
SpellServiceUnified.js:209 🌍 DEBUG: Traitement effet exploration: {type: 'buff', targetId: 'Elarion', targetName: 'Elarion', buffType: {…}, duration: 28800, …}
SpellServiceUnified.js:215 🌍 DEBUG: Application buff exploration sur Elarion
characterStore.js:280 ✨ DEBUG: Application buff sur joueur: {type: 'buff', targetId: 'Elarion', targetName: 'Elarion', buffType: {…}, duration: 28800, …}
characterStore.js:290 ✨ DEBUG: buffConfig: {acBonus: 3, duration: 28800} duration: 28800
characterStore.js:297 ✨ DEBUG: Effet mage_armor appliqué sur joueur, activeEffects: 1
characterStore.js:306 ✨ DEBUG: Mise à jour state avec activeEffects: 1
SpellServiceUnified.js:80 ✅ DEBUG: Sort terminé avec succès
🛡️ DEBUG: CA calculée - Total: 10, activeEffects: 0