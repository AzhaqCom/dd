/**
 * Modular class configuration system
 * Each class defines its own rules and behaviors
 */

export const classConfigurations = {
    'Magicien': {
        hitDie: 6,
        primaryStats: ['intelligence'],
        savingThrowProficiencies: ['intelligence', 'sagesse'],
        skillChoices: ['arcane', 'histoire', 'intuition', 'investigation', 'medecine', 'religion'],
        skillCount: 2,
        spellcasting: {
            ability: 'intelligence',
            type: 'prepared', // prepared vs known
            ritual: true,
            cantripsKnown: {
                1: 3, 2: 3, 3: 3, 4: 4, 5: 4
            },
            spellsKnown: 'all', // Wizards can learn all spells
            spellsPrepared: (level, intMod) => level + intMod
        },
        weaponProficiencies: ['simple'],
        armorProficiencies: [],
        features: {
            1: ['Récupération Arcanique'],
            2: ['École de Magie'],
            3: ['Sorts de 2e niveau'],
            4: ['Amélioration de Caractéristique'],
            5: ['Sorts de 3e niveau']
        }
    },

    'Guerrier': {
        hitDie: 10,
        primaryStats: ['force', 'dexterite'],
        savingThrowProficiencies: ['force', 'constitution'],
        skillChoices: ['acrobaties', 'athletisme', 'dressage', 'histoire', 'intuition', 'intimidation', 'perception', 'survie'],
        skillCount: 2,
        spellcasting: null, // Base fighter has no spellcasting
        weaponProficiencies: ['simple', 'martial'],
        armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
        features: {
            1: ['Style de Combat', 'Second Souffle'],
            2: ['Fougue'],
            3: ['Archétype Martial'],
            4: ['Amélioration de Caractéristique'],
            5: ['Attaque Supplémentaire']
        },
        archetypes: {
            'Champion': {
                features: {
                    3: ['Critique Amélioré'],
                    7: ['Athlète Remarquable'],
                    10: ['Style de Combat Supplémentaire'],
                    15: ['Critique Supérieur'],
                    18: ['Survivant']
                }
            },
            'Chevalier Mystique': {
                spellcasting: {
                    ability: 'intelligence',
                    type: 'known',
                    startLevel: 3,
                    cantripsKnown: {
                        3: 2, 4: 2, 7: 2, 10: 3, 11: 3
                    },
                    spellsKnown: {
                        3: 3, 4: 4, 7: 5, 8: 6, 10: 7, 11: 8, 13: 9, 14: 10, 16: 11, 19: 12, 20: 13
                    },
                    schoolRestrictions: ['Abjuration', 'Évocation']
                },
                features: {
                    3: ['Lien Magique', 'Sorts'],
                    7: ['Frappe de Guerre'],
                    10: ['Charge Mystique'],
                    15: ['Frappe Arcanique'],
                    18: ['Magie Améliorée']
                }
            }
        }
    },

    'Roublard': {
        hitDie: 8,
        primaryStats: ['dexterite'],
        savingThrowProficiencies: ['dexterite', 'intelligence'],
        skillChoices: ['acrobaties', 'athletisme', 'discretion', 'escamotage', 'intimidation', 'intuition', 'investigation', 'perception', 'persuasion', 'representation', 'tromperie'],
        skillCount: 4,
        spellcasting: null, // Base rogue has no spellcasting
        weaponProficiencies: ['simple', 'longsword', 'rapier', 'shortsword', 'lightCrossbow'],
        armorProficiencies: ['light'],
        features: {
            1: ['Expertise', 'Attaque Sournoise', 'Argot des Voleurs'],
            2: ['Action Rusée'],
            3: ['Archétype de Roublard'],
            4: ['Amélioration de Caractéristique'],
            5: ['Esquive Instinctive']
        },
        archetypes: {
            'Voleur': {
                features: {
                    3: ['Mains Lestes', 'Travail de Cambrioleur'],
                    9: ['Mobilité Suprême'],
                    13: ['Utilisation d\'Objets Magiques'],
                    17: ['Réflexes de Voleur']
                }
            },
            'Filou Arcanique': {
                spellcasting: {
                    ability: 'intelligence',
                    type: 'known',
                    startLevel: 3,
                    cantripsKnown: {
                        3: 3, 4: 3, 10: 4, 11: 4
                    },
                    spellsKnown: {
                        3: 3, 4: 4, 7: 5, 8: 6, 10: 7, 11: 8, 13: 9, 14: 10, 16: 11, 19: 12, 20: 13
                    },
                    schoolRestrictions: ['Enchantement', 'Illusion']
                },
                features: {
                    3: ['Main du Mage', 'Sorts'],
                    9: ['Embuscade Magique'],
                    13: ['Voleur Polyvalent'],
                    17: ['Surprise Magique']
                }
            }
        }
    }
};

/**
 * Get configuration for a character class and archetype
 */
export const getClassConfiguration = (className, archetypeName = null) => {
    const baseConfig = classConfigurations[className];
    if (!baseConfig) return null;

    if (archetypeName && baseConfig.archetypes?.[archetypeName]) {
        const archetypeConfig = baseConfig.archetypes[archetypeName];
        
        // Merge base and archetype configurations
        return {
            ...baseConfig,
            spellcasting: archetypeConfig.spellcasting || baseConfig.spellcasting,
            features: {
                ...baseConfig.features,
                ...archetypeConfig.features
            }
        };
    }

    return baseConfig;
};

/**
 * Calculate spell progression for a character
 */
export const calculateSpellProgression = (character) => {
    const config = getClassConfiguration(character.class, character.archetype);
    if (!config?.spellcasting) return null;

    const spellcasting = config.spellcasting;
    const level = character.level;
    
    // Check if character has reached spellcasting level
    if (spellcasting.startLevel && level < spellcasting.startLevel) {
        return null;
    }

    const result = {
        ability: spellcasting.ability,
        cantripsKnown: spellcasting.cantripsKnown?.[level] || 0,
        spellsKnown: 0,
        spellsPrepared: 0
    };

    if (spellcasting.type === 'known') {
        result.spellsKnown = spellcasting.spellsKnown?.[level] || 0;
    } else if (spellcasting.type === 'prepared') {
        const abilityMod = Math.floor((character.stats[spellcasting.ability] - 10) / 2);
        result.spellsPrepared = spellcasting.spellsPrepared(level, abilityMod);
    }

    return result;
};