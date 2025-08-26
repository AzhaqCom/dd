/**
 * Test rapide de la correction SpellCaster
 */

// À tester dans la console navigateur après rechargement :

console.log('🧪 TEST DE LA CORRECTION');

// 1. Vérifier l'état initial
const initialChar = useCharacterStore.getState().playerCharacter;
console.log('📊 État initial - CA:', initialChar?.ac);

// 2. Tester le sort Armure du Mage
const result = useCharacterStore.getState().castSpellPlayer('Armure du Mage');
console.log('📊 Résultat castSpellPlayer:', result);

// 3. Vérifier l'état final
const finalChar = useCharacterStore.getState().playerCharacter;
console.log('✅ État final:');
console.log('  - CA:', finalChar.ac);
console.log('  - Effets actifs:', finalChar.activeEffects?.length);
console.log('  - Premier effet:', finalChar.activeEffects?.[0]);

// Si ça marche, tu devrais voir:
// - CA: 15 (au lieu de 10)
// - Effets actifs: 1
// - Premier effet: { type: "mage_armor", ... }