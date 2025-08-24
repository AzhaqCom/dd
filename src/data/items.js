import { getModifier } from '../utils/calculations';

export const items = {
    potionOfHealing: {
        name: "Potion de Soin",
        description: "Restaure 2d4 + 2 PV.",
        type: "consumable",
        iconType: "heal",
        weight: 0.5,
        use: (playerCharacter) => {
            const healAmount = Math.floor(Math.random() * 4) + 1 + Math.floor(Math.random() * 4) + 1 + 2;
            const newHP = Math.min(playerCharacter.maxHP, playerCharacter.currentHP + healAmount);
            return {
                ...playerCharacter,
                currentHP: newHP
            };
        },
        message: (healAmount) => `Tu as bu une Potion de Soin et récupères ${healAmount} PV.`,
    },
    // Ajout d'une potion de soin supérieure
    potionOfSuperiorHealing: {
        name: "Potion de Soin Supérieure",
        description: "Restaure 4d4 + 4 PV.",
        type: "consumable",
        iconType: "heal",
        weight: 0.5,
        use: (playerCharacter) => {
            let healAmount = 0;
            for (let i = 0; i < 4; i++) {
                healAmount += Math.floor(Math.random() * 4) + 1;
            }
            healAmount += 4;
            const newHP = Math.min(playerCharacter.maxHP, playerCharacter.currentHP + healAmount);
            return {
                ...playerCharacter,
                currentHP: newHP
            };
        },
        message: (healAmount) => `Tu as bu une Potion de Soin Supérieure et récupères ${healAmount} PV.`,
    },
    scrollOfStrength: {
        name: "Parchemin de Force",
        description: "Augmente ta Force de 2 de manière permanente.",
        type: "consumable",
        iconType: "upgrade",
        weight: 0.1,
        use: (playerCharacter) => {
            return {
                ...playerCharacter,
                stats: {
                    ...playerCharacter.stats,
                    force: playerCharacter.stats.force + 2
                }
            };
        },
        message: () => `Tu as lu un Parchemin de Force et te sens plus puissant !`
    },
    scrollOfDexterity: {
        name: "Parchemin d'Agilité",
        description: "Augmente ta Dextérité de 2 de manière permanente.",
        type: "consumable",
        iconType: "upgrade",
        weight: 0.1,
        use: (playerCharacter) => {
            return {
                ...playerCharacter,
                stats: {
                    ...playerCharacter.stats,
                    dexterite: playerCharacter.stats.dexterite + 2
                }
            };
        },
        message: () => `Tu as lu un Parchemin d'Agilité et te sens plus agile !`
    },
    scrollOfConstitution: {
        name: "Parchemin de Vitalité",
        description: "Augmente ta Constitution de 2 de manière permanente et tes PV maximum de 2.",
        type: "consumable",
        iconType: "upgrade",
        weight: 0.1,
        use: (playerCharacter) => {
            return {
                ...playerCharacter,
                stats: {
                    ...playerCharacter.stats,
                    constitution: playerCharacter.stats.constitution + 2
                },
                maxHP: playerCharacter.maxHP + 2,
                currentHP: playerCharacter.currentHP + 2,
            };
        },
        message: () => `Tu as lu un Parchemin de Vitalité, ton corps se renforce et tu gagnes des PV !`
    },
    scrollOfIntelligence: {
        name: "Parchemin d'Intelligence",
        description: "Augmente ton Intelligence de 2 de manière permanente.",
        type: "consumable",
        iconType: "upgrade",
        rarity:"légendaire",
        weight: 0.1,
        use: (playerCharacter) => {
            return {
                ...playerCharacter,
                stats: {
                    ...playerCharacter.stats,
                    intelligence: playerCharacter.stats.intelligence + 2
                }
            };
        },
        message: () => `Tu as lu un Parchemin d'Intelligence et tes facultés augmentent !`
    },
    scrollOfSagesse: {
        name: "Parchemin de Sagesse",
        description: "Augmente ta Sagesse de 2 de manière permanente.",
        type: "consumable",
        iconType: "upgrade",
        weight: 0.1,
        use: (playerCharacter) => {
            return {
                ...playerCharacter,
                stats: {
                    ...playerCharacter.stats,
                    sagesse: playerCharacter.stats.sagesse + 2
                }
            };
        },
        message: () => `Tu as lu un Parchemin de Sagesse et te sens plus sae !`
    },
    bookArtHeal: {
        name: "Livre l'art de la prestidigitation",
        description: "C'est un jolie livre vous devriez le lire",
        type: "consumable",
        iconType: "heal",
        weight: 0.8,
        use: (playerCharacter) => {
            const healAmount = 2
            const newHP = Math.min(playerCharacter.maxHP, playerCharacter.currentHP + healAmount);
            return {
                ...playerCharacter,
                currentHP: newHP
            };
        },
        message: () => `Tu as lu ce livre pendant une heure et tu t'es un peu reposé, tu as récuperer 2PV`
    }
};