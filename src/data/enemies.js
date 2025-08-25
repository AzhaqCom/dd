export const enemyTemplates = {
    ombre: {
        name: "Ombre",
        maxHP: 16,
        currentHP: 16,
        ac: 12,
        xp: 100,
        role: "brute", // Ombres = escarmoucheurs furtifs
        challengeRating: "1/2",
        movement: 6,
        // Système d'IA hybride - Escarmoucheur furtif
        aiPriority: ["melee_attack", "ranged_attack",],
        aiModifiers: {
            "melee_attack": {
                isolatedTargetBonus: +40,
                lowHPBonus: +30,
                multipleEnemiesBonus: +20
            },
            "ranged_attack": {
                distanceBonus: +25,
                coverBonus: +35,
                meleeDisadvantageBonus: +50
            },

        },
        stats: {
            force: 6,
            dexterite: 14,
            constitution: 13,
            intelligence: 6,
            sagesse: 10,
            charisme: 8,
        },
        attacks: [
            {
                name: "absorption de force",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "2d6",
                damageBonus: 2,
                damageType: "necrotique",
                description: "absorption de force",
                // Enrichissement tactique
                aiWeight: 100,      // Priorité de base
                effects: [
                    {
                        type: "debuff",
                        stat: "force",
                        reduction: 1,
                        description: "Réduit la Force de 1"
                    }
                ],
                targetPreference: "weakest", // Préfère les cibles affaiblies
                situational: {
                    lowHP: +50,     // Bonus si cible a peu de PV
                    isolated: +30   // Bonus si cible isolée
                }
            }
        ],
        image: "https://www.aidedd.org/dnd/images/shadow.jpg"
    },
    molosse_ombre: {
        name: "Molosse d'Ombre",
        maxHP: 33,
        currentHP: 33,
        ac: 12,
        xp: 450,
        movement: 6,
        role: "brute", // Ombres = escarmoucheurs furtifs
        challengeRating: "2",
        // Système d'IA hybride - Brute agressive
        aiPriority: ["melee_attack", "charge_attack", "intimidate"],
        aiModifiers: {
            "melee_attack": {
                flankingBonus: +40,      // Bonus flanquement
                lowLightBonus: +30,      // Avantage dans l'obscurité
                isolatedTargetBonus: +35 // Préfère les cibles seules
            },
            "charge_attack": {
                distantTargetBonus: +50, // Charge sur cibles éloignées
                groupedEnemiesBonus: +25 // Préfère charger dans un groupe
            },
            "intimidate": {
                weakEnemiesBonus: +40,   // Intimide les faibles
                multipleEnemiesBonus: +20
            }
        },
        stats: {
            force: 16,
            dexterite: 14,
            constitution: 13,
            intelligence: 5,
            sagesse: 12,
            charisme: 5,
        },
        attacks: [
            {
                name: "Morsure",
                type: "melee",
                attackBonus: 5,
                range: 1,
                targets: 1,
                damageDice: "2d6",
                damageBonus: 3,
                damageType: "perforant",
                description: "Une morsure puissante qui lacère la chair.",
                aiWeight: 90,
                effects: [
                    {
                        type: "status",
                        condition: "prone",
                        saveDC: 12,
                        description: "La cible doit réussir un jet de Force DD 12 ou être jetée à terre."
                    }
                ],
                targetPreference: "isolated", // Préfère attaquer les cibles seules
                situational: {
                    flanking: +40, // Bonus si allié en avantage positionnel
                    lowLight: +30, // Préférence d’attaque en pénombre/obscurité
                }
            }
        ],
        image: "https://www.aidedd.org/dnd/images/shadow-mastiff.jpg"
    },
    gobelin: {
        name: "Gobelin",
        maxHP: 7,
        currentHP: 7,
        ac: 15,
        xp: 50, 
        movement: 6,
        challengeRating: "1/4",
        // Système d'IA hybride : aiPriority + données tactiques
        role: "skirmisher",
        aiPriority: ["melee_attack", "ranged_attack"],
        // Modificateurs intelligents pour affiner les décisions
        aiModifiers: {
            "melee_attack": {
                isolatedTargetBonus: +40,
                lowHPBonus: +30,
                multipleEnemiesBonus: +20
            },
            "ranged_attack": {
                distanceBonus: +25,
                coverBonus: +35,
                meleeDisadvantageBonus: +50
            }
        },
        stats: {
            force: 8,
            dexterite: 14,
            constitution: 10,
            intelligence: 10,
            sagesse: 8,
            charisme: 8,
        },
        attacks: [
            {
                name: "son Cimeterre",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "1d6",
                damageBonus: 2,
                damageType: "tranchant",
                description: "Attaque au corps à corps avec une arme : +4 au toucher, allonge 1,50 m, une cible. Touché : 5 (1d6 + 2) dégâts tranchants.",
                // Données tactiques pour l'IA
                aiWeight: 70,
                targetPreference: "closest",
                situational: {
                    flanking: +20,
                    desperateBonus: +30  // Quand peu de PV
                }
            },
            {
                name: "Arc court",
                type: "ranged",
                attackBonus: 4,
                range: 6,
                targets: 1,
                damageDice: "1d6",
                damageBonus: 2,
                damageType: "perforant",
                description: "Attaque à distance : +4 au toucher, portée 24/96 m, une cible. Touché : 5 (1d6 + 2) dégâts perforants.",
                // Données tactiques pour l'IA
                aiWeight: 85,
                targetPreference: "weakest",
                situational: {
                    safeDistance: +35,
                    lowHPTarget: +25,
                    outOfMeleeRange: +40
                }
            }
        ],
        image: "https://www.aidedd.org/dnd/images/goblin.jpg"
    }, mephiteBoueux: {
        name: "Méphite boueux",
        maxHP: 27,
        currentHP: 27,
        ac: 11,
        xp: 50,
        movement: 6,
        challengeRating: "1/4",
        role: "skirmisher",
        // Système d'IA hybride - Escarmoucheur élémentaire
        aiPriority: ["elemental_attack", "hit_and_run", "melee_attack"],
        aiModifiers: {
            "elemental_attack": {
                groupedEnemiesBonus: +40, // Préfère attaquer des groupes
                weakTargetBonus: +25,     // Cible les affaiblis
                safeDistanceBonus: +30    // Garde ses distances
            },
            "hit_and_run": {
                multipleEnemiesBonus: +35,
                lowHPBonus: +30,
                isolatedBonus: +20
            },
            "melee_attack": {
                corneredBonus: +50,       // Attaque si acculé
                desperateBonus: +40
            }
        },
        stats: {
            force: 8,
            dexterite: 12,
            constitution: 12,
            intelligence: 9,
            sagesse: 11,
            charisme: 7
        },
        attacks: [
            {
                name: "Poing",
                type: "melee",
                attackBonus: 3,
                range: 1,
                targets: 1,
                damageDice: "1d6",
                damageBonus: 1,
                damageType: "contondant",
                description: "Attaque au corps à corps avec une arme : +3 au toucher, allonge 1,50 m, une créature. Touché : 4 (1d6 + 1) dégâts contondants."
            }
        ]
        , image: "https://www.aidedd.org/dnd/images/mud-mephit.jpg"
    },
    kobold: {
        name: "Kobold",
        maxHP: 5,
        currentHP: 5,
        ac: 12,
        xp: 25,
        movement: 6,
        challengeRating: "1/8",
        role: "skirmisher",
        // Système d'IA hybride - Lâche tactique
        aiPriority: ["coward_tactics", "ranged_attack", "melee_attack"],
        aiModifiers: {
            "coward_tactics": {
                outnumberedBonus: +60,    // Fuit si en infériorité
                lowHPBonus: +50,          // Fuit si blessé
                isolatedBonus: +40        // Évite d'être seul
            },
            "ranged_attack": {
                safeDistanceBonus: +45,   // Préfère la distance
                groupSupportBonus: +30,   // Attaque avec support d'alliés
                weakTargetBonus: +25
            },
            "melee_attack": {
                desperateBonus: +60,      // Attaque uniquement si désespéré
                flankingBonus: +35        // Ou si en flanquement
            }
        },
        stats: {
            force: 8,
            dexterite: 15,
            constitution: 10,
            intelligence: 8,
            sagesse: 8,
            charisme: 8,
        },
        attacks: [
            {
                name: "sa Dague",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "1d4",
                damageBonus: 2,
                damageType: "perforant",
                description: "Attaque au corps à corps : +4 au toucher, allonge 1 m, une cible. Touché : 4 (1d4 + 2) dégâts perforants."
            }
        ],
        image: "https://www.aidedd.org/dnd/images/kobold.jpg"
    },
    goule: {
        name: "Goule",
        maxHP: 22,
        currentHP: 22,
        ac: 12,
        xp: 200,
        movement: 6,
        challengeRating: "1",
        role: "controller",
        // Système d'IA hybride - Contrôleur mort-vivant
        aiPriority: ["paralyze_attack", "melee_attack", "undead_resilience"],
        aiModifiers: {
            "paralyze_attack": {
                strongTargetBonus: +50,   // Cible les ennemis forts
                spellcasterBonus: +60,    // Priorité sur les lanceurs de sorts
                healerTargetBonus: +55    // Cible les soigneurs
            },
            "melee_attack": {
                paralyzedTargetBonus: +70, // Attaque les paralysés
                flankingBonus: +30,        // Bonus flanquement
                weakTargetBonus: +25
            },
            "undead_resilience": {
                lowHPBonus: +40,           // Résiste quand blessée
                outnumberedBonus: +35      // Tient bon si encerclée
            }
        },
        stats: {
            force: 13,
            dexterite: 15,
            constitution: 10,
            intelligence: 7,
            sagesse: 10,
            charisme: 6,
        },
        attacks: [
            {
                name: "Griffes",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "2d4",
                damageBonus: 2,
                damageType: "tranchant",
                description: "Attaque au corps à corps avec une arme : +4 au toucher, allonge 1,50 m, une cible. Touché : 7 (2d4 + 2) dégâts tranchants. Si la cible est une créature autre qu'un elfe ou un mort-vivant, celle-ci doit réussir un jet de sauvegarde de Constitution DD 10 pour ne pas être paralysée pendant 1 minute. La cible peut relancer le jet de sauvegarde à la fin de chacun de ses tours, mettant fin à l'effet qui l'affecte en cas de réussite."
            }

        ],
        image: 'https://www.aidedd.org/dnd/images/ghoul.jpg',
    },
    squelette: {
        name: "Squelette",
        maxHP: 13,
        currentHP: 13,
        ac: 13,
        xp: 50,
        movement: 6,
        challengeRating: "1/4",
        role: "soldier",
        // Système d'IA hybride - Soldat mort-vivant
        aiPriority: ["formation_attack", "melee_attack", "undead_persistence"],
        aiModifiers: {
            "formation_attack": {
                groupedAlliesBonus: +50,  // Combat en formation avec alliés
                flankingBonus: +40,       // Bonus flanquement
                coordinatedBonus: +35     // Attaques coordonnées
            },
            "melee_attack": {
                closestTargetBonus: +30,  // Cible la plus proche
                persistentBonus: +25,     // Attaque méthodique
                weakTargetBonus: +20
            },
            "undead_persistence": {
                lowHPBonus: +45,          // Continue même blessé
                isolatedBonus: +30        // Persiste même seul
            }
        },
        stats: {
            force: 10,
            dexterite: 14,
            constitution: 15,
            intelligence: 6,
            sagesse: 8,
            charisme: 5,
        },
        attacks: [
            {
                name: "son Épée courte",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "1d6",
                damageBonus: 2,
                damageType: "perforant",
                description: "Attaque au corps à corps : +4 au toucher, allonge 1 m, une cible. Touché : 4 (1d4 + 2) dégâts perforants."
            }
        ],
        image: "https://www.aidedd.org/dnd/images/skeleton.jpg"
    },
    diablotin: {
        name: "Diablotin",
        maxHP: 10,
        currentHP: 10,
        ac: 13,
        xp: 200,
        movement: 6,
        challengeRating: "1",
        role: "support",
        // Système d'IA hybride - Support démoniaque
        aiPriority: ["demonic_support", "hit_and_run", "melee_attack"],
        aiModifiers: {
            "demonic_support": {
                alliedDevilsBonus: +60,   // Soutient autres diables
                spellcasterBonus: +45,    // Protège les lanceurs de sorts
                strategicBonus: +40       // Positionnement tactique
            },
            "hit_and_run": {
                flyingAdvantageBonus: +50, // Utilise sa capacité de vol
                multipleEnemiesBonus: +35,
                lowHPBonus: +40
            },
            "melee_attack": {
                poisonStingBonus: +30,    // Utilise son dard empoisonné
                desperateBonus: +25,
                flankingBonus: +20
            }
        },
        stats: {
            force: 6,
            dexterite: 17,
            constitution: 13,
            intelligence: 11,
            sagesse: 12,
            charisme: 14,
        },
        attacks: [
            {

                name: "Dard",
                type: "melee",
                attackBonus: 5,
                range: 1,
                targets: 1,
                damageDice: "1d4",
                damageBonus: 3,
                damageType: "perforants",
                description: "Attaque au corps à corps : +4 au toucher, allonge 1 m, une cible. Touché : 4 (1d4 + 2) dégâts perforants."
            }

        ],
        image: "https://www.aidedd.org/dnd/images/imp.jpg"
    }
    ,
    diable: {
        name: "Diable épineux",
        maxHP: 22,
        currentHP: 22,
        ac: 13,
        xp: 450,
        stats: {
            force: 10,
            dexterite: 15,
            constitution: 12,
            intelligence: 11,
            sagesse: 14,
            charisme: 8,
        },
        movement: 8,
        attackSets: [
            {
                name: "Morsure et fourche",
                attacks: [
                    {
                        name: "Morsure",
                        type: "melee",
                        attackBonus: 2,
                        range: 1,
                        damageDice: "2d4",
                        damageBonus: 0,
                        damageType: "tranchants",
                        description: "Attaque avec ces crocs aceres"
                    },
                    {
                        name: "Fourche",
                        type: "melee",
                        attackBonus: 2,
                        range: 1,
                        damageDice: "1d6",
                        damageBonus: 0, // D'après la fiche, pas de bonus de dégâts
                        damageType: "perforants",
                        description: "Attaque avec une fourche"
                    }
                ]
            },
            {
                name: "Double épine caudale",
                attacks: [
                    {
                        name: "Épine caudale",
                        type: "ranged",
                        attackBonus: 4,
                        range: 6,
                        damageDice: "1d4",
                        damageBonus: 2,
                        damageType: "perforants",
                        secondaryDamageDice: "1d6",
                        secondaryDamageBonus: 0,
                        secondaryDamageType: "feu",
                        description: "Projette une épine de sa queue"
                    },
                    {
                        name: "Épine caudale", // Une deuxième épine
                        type: "ranged",
                        attackBonus: 4,
                        range: 6,
                        damageDice: "1d4",
                        damageBonus: 2,
                        damageType: "perforants",
                        secondaryDamageDice: "1d6",
                        secondaryDamageBonus: 0,
                        secondaryDamageType: "feu",
                        description: "Projette une épine de sa queue"
                    }
                ]
            }
        ],
        image: "https://www.aidedd.org/dnd/images/spined-devil.jpg"
    },

    // === ENNEMI LANCEUR DE SORTS POUR TESTER LE SYSTÈME UNIFIÉ ===
    mageNoir: {
        name: "Mage Noir",
        maxHP: 24,
        currentHP: 24,
        ac: 12,
        xp: 450,
        level: 3,
        movement: 6,
        challengeRating: "2",
        role: "caster", // Rôle IA
        type: "enemy",
        stats: {
            force: 9,
            dexterite: 14,
            constitution: 12,
            intelligence: 16,
            sagesse: 12,
            charisme: 10
        },
        attacks: [
            {
                name: "Dague",
                type: "melee",
                attackBonus: 4,
                range: 1,
                targets: 1,
                damageDice: "1d4",
                damageBonus: 2,
                damageType: "perforant",
                description: "Attaque de corps à corps basique"
            }
        ],
        // === NOUVEAU : SPELLCASTING UNIFIÉ ===
        spellcasting: {
            // === CONFIGURATION DE BASE ===
            ability: "intelligence",
            type: "prepared",
            ritual: false,

            // === EMPLACEMENTS DE SORTS ===
            spellSlots: {
                1: { max: 4, used: 0, available: 4 },  // Mage niveau 3
                2: { max: 2, used: 0, available: 2 }
            },

            // === SORTS CONNUS/PRÉPARÉS ===
            cantrips: ["Rayon de givre"],
            knownSpells: [],
            preparedSpells: ["Trait de Feu", "Bouclier", "Toile d'araignée", "Boule de Feu"],

            // === MÉTADONNÉES OPTIONNELLES ===
            spellcastingClass: null,
            startLevel: 1,
            maxKnown: null,
            maxPrepared: 6, // INT 16 (3) + niveau 3 = 6

            // === RESTRICTIONS ===
            schoolRestrictions: [],
            ritualCasting: false,

            // === SORTS INNÉS ===
            innateSpells: {}
        },
        aiPriority: ["ranged_spell", "area_damage", "debuff", "retreat"],
        aiModifiers: {
            "ranged_spell": {
                multipleTargetsBonus: +50,
                safeDistanceBonus: +40,
                lowHPTargetBonus: +30
            },
            "area_damage": {
                groupedEnemiesBonus: +60,
                multipleEnemiesBonus: +45
            },
            "debuff": {
                strongEnemyBonus: +35,
                tankTargetBonus: +25
            }
        },
        image: "https://www.aidedd.org/dnd/images/archmage.jpg"
    }
};