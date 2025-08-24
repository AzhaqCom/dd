export const spells = {
    // Sorts mineurs (Cantrips - niveau 0)
    "Projectile Magique": {
        name: "Projectile Magique",
        level: 0,
        school: "Évocation",
        castingTime: "1 action",
        range: "36 mètres",
        description: "Vous créez trois fléchettes faites d'énergie magique brillante. Chacune touche une créature de votre choix, située à portée et dans votre champ de vision. Une fléchette inflige 1d4+1 dégâts de force à la cible. Toutes les fléchettes frappent leur cible en même temps, sachant que vous pouvez toutes les diriger contre une seule et même créature ou les répartir entre plusieurs.",
        damage: { dice: "1d4", bonus: 1, type: "force" },
        projectiles: 3,
        requiresAttackRoll: false,
        targetType: "enemy",
        castableOutOfCombat: false,
        class: ["Magicien"],
        // Enrichissement tactique IA
        aiWeight: 80,           // Bon sort de base
        targetPreference: "finishing", // Excellent pour finir les ennemis
        situational: {
            multipleEnemies: +20,   // Bonus contre plusieurs ennemis
            lowHPTarget: +40,       // Excellent pour achever
            guaranteedHit: +30      // Avantage : ne rate jamais
        },
        aiRoles: ["dps", "support"], // Recommandé pour ces rôles
        combatStage: "any"          // Utilisable à tout moment
    },
    "Trait de Feu": {
        name: "Trait de Feu",
        level: 1, // Sort de niveau 1
        school: "Évocation",
        castingTime: "1 action",
        range: "36 mètres",
        duration: "instantanée",
        description: "Vous lancez un trait enflammé sur une créature ou un objet à portée. Faites une attaque de sort à distance contre la cible. Si vous touchez, elle subit 1d10 dégâts de feu. Si le sort touche un objet inflammable qui n'est ni porté ni transporté, il s'embrase.",
        damage: { dice: "1d10", bonus: 0, type: "feu" },
        projectiles: 1,
        requiresAttackRoll: true,
        targetType: "enemy",
        castableOutOfCombat: false,
        class: ["Magicien"]
    },
    "Rayon de givre": {
        name: "Rayon de givre",
        level: 0,
        school: "Évocation",
        castingTime: "1 action",
        range: "18 mètres",
        description: "Un rayon de lumière d'un blanc bleuté file vers une créature à portée. Faites une attaque de sort à distance contre la cible. Si vous la touchez, elle subit 1d8 dégâts de froid et sa vitesse est réduite de 3 mètres jusqu'au début de votre prochain tour.",
        damage: { dice: "1d8", bonus: 0, type: "froid" },
        projectiles: 1,
        requiresAttackRoll: true,
        targetType: "enemy",
        castableOutOfCombat: false,
        class: ["Magicien"]
    },
    "Rayon Ardent": {
        name: "Rayon Ardent",
        level: 2,
        school: "Évocation",
        castingTime: "1 action",
        range: "36 mètres",
        description: "Vous créez trois rayons de feu et les projetez sur des cibles à portée. Vous pouvez les diriger contre une même cible ou contre des cibles différentes. Faites une attaque de sort à distance pour chaque rayon. Si vous touchez, la cible reçoit 2d6 dégâts.",
        damage: { dice: "2d6", bonus: 0, type: "feu" },
        projectiles: 3,
        requiresAttackRoll: true,
        targetType: "enemy",
        castableOutOfCombat: false,
        class: ["Magicien"]
    },

    "Boule de Feu": {
        name: "Boule de Feu",
        level: 2,
        school: "Évocation",
        castingTime: "1 action",
        range: "45 mètres",
        description: "Une boule de feu explose dans une sphère de 6 mètres de rayon centrée sur un point à portée. Chaque créature dans la zone doit faire un jet de sauvegarde de Dextérité. En cas d'échec, elle subit 8d6 dégâts de feu, ou la moitié en cas de réussite.",
        damage: { dice: "8d6", bonus: 0, type: "feu" },
        areaOfEffect: { shape: "sphere", radius: 20 }, // 20 feet = 4 squares radius
        savingThrow: { ability: "dexterite", dc: "spell" },
        isAreaEffect: true,
        saveType: "dexterite",
        saveDC: null, // Calculé automatiquement
        requiresAttackRoll: false,
        targetType: "enemy",
        castableOutOfCombat: false,
        projectiles: 1,
        class: ["Magicien"]
    },
    "Toile d'araignée": {
        name: "Toile d'araignée",
        level: 2,
        school: "Invocation",
        castingTime: "1 action",
        range: "18 mètres",
        description: "Vous invoquez une masse de toiles d'araignée épaisses et collantes à un point de votre choix situé à portée. Les toiles remplissent un cube de 6 mètres d'arête à partir de ce point. Les créatures dans la zone sont entravées.",
        damage: null,
        areaOfEffect: { shape: "cube", size: 20 }, // 20 feet cube
        savingThrow: { ability: "dexterite", dc: "spell" },
        isAreaEffect: true,
        saveType: "dexterite",
        saveDC: null,
        effect: "restrained",
        duration: "1 heure",
        requiresAttackRoll: false,
        targetType: "enemy",
        castableOutOfCombat: true,
        class: ["Magicien", "Sorcier"]
    },
    "Armure du Mage": {
        name: "Armure du Mage",
        level: 1,
        school: "Abjuration",
        castingTime: "1 action",
        range: "Touch",
        description: "Vous touchez une créature consentante et non-vêtue d'une armure. Sa Classe d'Armure devient 13 + son modificateur de Dextérité.",
        requiresAttackRoll: false,
        castableOutOfCombat: true,
        targetType: "self", // Sort qu'on lance sur soi-même principalement
        validTargets: ["self", "ally"],
        buff: {
            acBonus: 3, // +3 CA de base (13 - 10)
            duration: 28800 // 8 heures
        },
        class: ["Magicien"]
    },

    // === SORTS DE SOIN ET DE SUPPORT POUR COMPAGNONS ===

    "Soins": {
        name: "Soins",
        level: 1,
        school: "Évocation",
        castingTime: "1 action",
        range: "Toucher",
        description: "Une créature que vous touchez récupère un nombre de points de vie égal à 1d8 + votre modificateur de caractéristique d'incantation.",
        healing: { dice: "1d8", bonus: "wisdom" },
        requiresAttackRoll: false,
        targetType: "ally",
        castableOutOfCombat: true,
        class: ["barde", "clerc", "druide", "paladin", "rodeur"]
    },

    "Bénédiction": {
        name: "Bénédiction",
        level: 1,
        school: "Enchantement",
        castingTime: "1 action",
        range: "9 mètres",
        duration: "Concentration, jusqu'à 1 minute",
        description: "Vous bénissez jusqu'à trois créatures de votre choix à portée. Chaque fois qu'une cible effectue un jet d'attaque ou de sauvegarde avant la fin du sort, elle peut lancer 1d4 et ajouter le résultat au jet.",
        buff: {
            attackBonus: "1d4",
            saveBonus: "1d4",
            duration: 600 // 10 rounds
        },
        targetType: "ally",
        maxTargets: 3,
        requiresAttackRoll: false,
        castableOutOfCombat: true,
        class: ["clerc", "paladin"]
    },

    "Sanctuaire": {
        name: "Sanctuaire",
        level: 1,
        school: "Abjuration",
        castingTime: "1 action bonus",
        range: "9 mètres",
        duration: "1 minute",
        description: "Vous protégez une créature à portée contre les attaques. Jusqu'à la fin du sort, toute créature qui cible la créature protégée avec une attaque ou un sort offensif doit d'abord effectuer un jet de sauvegarde de Sagesse.",
        buff: {
            protection: "sanctuary",
            saveDC: "spell",
            duration: 600 // 10 rounds
        },
        targetType: "ally",
        requiresAttackRoll: false,
        castableOutOfCombat: true,
        class: ["clerc"]
    },

    "Aide": {
        name: "Aide",
        level: 2,
        school: "Abjuration",
        castingTime: "1 action",
        range: "9 mètres",
        duration: "8 heures",
        description: "Votre sort renforce vos alliés avec endurance et résolution. Choisissez jusqu'à trois créatures à portée. Le maximum de points de vie de chaque cible augmente de 5 pour la durée du sort.",
        buff: {
            maxHPBonus: 5,
            duration: 28800 // 8 heures en secondes  
        },
        maxTargets: 3,
        targetType: "ally",
        requiresAttackRoll: false,
        castableOutOfCombat: true,
        class: ["clerc", "paladin"]

    },

    // === SORTS OFFENSIFS POUR COMPAGNON DPS ===

    "Bouclier": {
        name: "Bouclier",
        level: 1,
        school: "Abjuration",
        castingTime: "1 réaction",
        range: "Personnel",
        duration: "1 round",
        description: "Une barrière invisible de force magique apparaît et vous protège. Jusqu'au début de votre prochain tour, vous avez un bonus de +5 à la CA.",
        buff: {
            acBonus: 5,
            duration: 1 // 1 round
        },
        targetType: "self",
        requiresAttackRoll: false,
        castableOutOfCombat: false,
        class: ["ensorceleur", "Magicien"]
    }
};