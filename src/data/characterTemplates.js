export const characterTemplates = {
    wizard: {
        name: "Elarion",
        familyName:'Thalendor',
        level: 1,
        currentXP: 0,
        race: "Haut Elfe",
        class: "Magicien",
        historic: "Érudit de l'Académie",
        maxHP: 12,
        currentHP: 12,
        ac: 10,
        initiative: 0,
        speed: "9m",
        proficiencyBonus: 2,
        hitDice: 1,
        hitDiceType: 6,
        type: "player",
        gold: 100, 
        stats: {
            force: 10,
            dexterite: 15,
            constitution: 12,
            intelligence: 16,
            sagesse: 13,
            charisme: 12
        },
        proficiencies: {
            saves: ["intelligence", "sagesse"],
            skills: ["arcane", "histoire", "investigation", "perspicacite"]
        },
        weaponProficiencies: ["simple"],
        spellcasting: {
            // === CONFIGURATION DE BASE ===
            ability: "intelligence",
            type: "prepared",
            ritual: true,
            
            // === EMPLACEMENTS DE SORTS ===
            spellSlots: {
                1: { max: 2, used: 0, available: 2 }  // Magicien niveau 1
            },
            
            // === SORTS CONNUS/PRÉPARÉS ===
            cantrips: ["Projectile Magique", "Rayon de givre"],
            knownSpells: [],
            preparedSpells: ["Armure du Mage"],
            
            // === MÉTADONNÉES OPTIONNELLES ===
            spellcastingClass: null,
            startLevel: 1,
            maxKnown: null,
            maxPrepared: null,
            
            // === RESTRICTIONS ===
            schoolRestrictions: [],
            ritualCasting: true,
            
            // === SORTS INNÉS ===
            innateSpells: {}
        },
        weapons: ["dagger"],
        inventory: []
    },

    warrior: {
        name: "Gareth",
        familyName:'Stonehaven',
        level: 1,
        currentXP: 0,
        race: "Humain",
        class: "Guerrier",
        historic: "Soldat Vétéran",
        maxHP: 18, // d10 + 4 (CON) + 2 (humain bonus)
        currentHP: 18,
        ac: 16, // Cotte de mailles + bouclier
        initiative: 0,
        speed: "9m",
        proficiencyBonus: 2,
        hitDice: 1,
        hitDiceType: 10,
        type: "player",
        stats: {
            force: 16, // Stat principale
            dexterite: 14,
            constitution: 15,
            intelligence: 10,
            sagesse: 12,
            charisme: 13
        },
        proficiencies: {
            saves: ["force", "constitution"],
            skills: ["athletisme", "intimidation", "perception", "survie"]
        },
        weaponProficiencies: ["simple", "martial"],
        armorProficiencies: ["light", "medium", "heavy", "shields"],
        weapons: ["longsword", "shortbow", "heavybow", "dagger"],
        armor: "chainmail", // CA 16
        shield: true,
        inventory: []
    },

    rogue: {
        name: "Lyra",
        familyName:"Copperfoot",
        level: 1,
        currentXP: 0,
        race: "Halfelin",
        class: "Roublard",
        historic: "Criminel",
        maxHP: 14, // d8 + 2 (CON) + 1 (halfelin bonus)
        currentHP: 14,
        ac: 13, // Armure de cuir + DEX (2)
        initiative: 0,
        speed: "7.5m", // Halfelin plus lent
        proficiencyBonus: 2,
        hitDice: 1,
        hitDiceType: 8,
        type: "player",
        stats: {
            force: 15,
            dexterite: 16, // Stat principale
            constitution: 14,
            intelligence: 13,
            sagesse: 12,
            charisme: 8
        },
        proficiencies: {
            saves: ["dexterite", "intelligence"],
            skills: ["acrobaties", "discretion", "escamotage", "investigation", "perception", "persuasion", "tromperie"]
        },
        weaponProficiencies: ["simple", "longsword", "rapier", "shortsword", "lightCrossbow"],
        armorProficiencies: ["light"],
        weapons: ["rapier", "shortbow", "dagger"], // Deux dagues
        armor: "leather", // CA 11 + DEX
        specialAbilities: {
            sneakAttack: {
                name: "Attaque Sournoise",
                description: "1d6 dégâts supplémentaires si avantage ou allié adjacent",
                damage: "1d6",
                level: 1
            },
            expertise: {
                name: "Expertise",
                description: "Double le bonus de maîtrise pour certaines compétences",
                skills: ["discretion", "escamotage"]
            }
        },
        inventory: []
    },
    paladin:{
        name: "Elara",
        familyName:"Brightlance",
        level: 1,
        currentXP: 0,
        race: "Elfe",
        class: "Paladin",
        historic: "Templier",
        maxHP: 16, // d10 + 2 (CON) + 4 (elfe bonus)
        currentHP: 16,
        ac: 18, // Cotte de mailles + bouclier
        initiative: 0,
        speed: "9m",
        proficiencyBonus: 2,
        hitDice: 1,
        hitDiceType: 10,
        type: "player",
        stats: {
            force: 15,
            dexterite: 12,
            constitution: 14,
            intelligence: 10,
            sagesse: 13,
            charisme: 16 // Stat principale
        },
        proficiencies: {
            saves: ["force", "charisme"],
            skills: ["athletisme", "intimidation", "medecine", "persuasion"]
        },
        weaponProficiencies: ["simple", "martial"],
        armorProficiencies: ["light", "medium", "heavy", "shields"],
        weapons: ["longsword", "shield"],
        armor: "chainmail", // CA 18
        shield: true,
        inventory: []
    }
};

// Fonction utilitaire pour créer un personnage à partir d'un template
export const createCharacterFromTemplate = (templateKey) => {
    const template = characterTemplates[templateKey];
    if (!template) {
        throw new Error(`Template de personnage '${templateKey}' introuvable`);
    }
    
    return {
        ...template,
        // Générer un ID unique pour l'inventaire
        inventory: template.inventory.map(item => ({
            ...item,
            id: Date.now() + Math.random()
        }))
    };
};