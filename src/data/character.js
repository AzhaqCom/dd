import { characterTemplates } from './characterTemplates';

export const spellSlotsByLevel = {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 }
};

// Utilise le template de magicien par défaut
export const character = characterTemplates.warrior;
