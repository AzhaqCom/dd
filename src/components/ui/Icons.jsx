import React from 'react';
import { 
  FaHeart, 
  FaDiceD20, 
  FaCrosshairs, 
  FaSkull, 
  FaHatWizard, 
  FaFlagCheckered 
} from 'react-icons/fa';
import { 
  GiUpgrade, 
  GiLevelTwoAdvanced, 
  GiBurningBlobs, 
  GiSpellBook, 
  GiDuration,
  GiKnapsack,
  GiBladeDrag 
} from "react-icons/gi";
import { MdOutlineAutoAwesome } from "react-icons/md";

// Icon component factory for consistent styling
const createIcon = (IconComponent, defaultClassName = '') => ({ className = '', ...props }) => (
  <IconComponent className={`icon ${defaultClassName} ${className}`} {...props} />
);

// Exported icon components with semantic names
export const HeartIcon = createIcon(FaHeart, 'heal-icon');
export const SwordIcon = createIcon(GiBladeDrag, 'damage-icon');
export const MagicIcon = createIcon(FaHatWizard, 'magic-icon');
export const DiceIcon = createIcon(FaDiceD20, 'dice-icon');
export const MissIcon = createIcon(FaCrosshairs, 'miss-icon');
export const SkullIcon = createIcon(FaSkull, 'defeat-icon');
export const VictoryIcon = createIcon(FaFlagCheckered, 'victory-icon');
export const BagIcon = createIcon(GiKnapsack, 'bag-icon');
export const UpgradeIcon = createIcon(GiUpgrade, 'upgrade-icon');
export const LevelUpIcon = createIcon(GiLevelTwoAdvanced, 'levelup-icon');
export const ExpIcon = createIcon(MdOutlineAutoAwesome, 'exp-icon');
export const SpellIcon = createIcon(GiSpellBook, 'spell-icon');
export const BurningBlobsIcon = createIcon(GiBurningBlobs, 'burning-blobs-icon');
export const DurationIcon = createIcon(GiDuration, 'duration-icon');

// Icon type mapping for dynamic icon selection
export const ICON_TYPES = {
  PLAYER_DAMAGE: 'player-damage',
  ENEMY_DAMAGE: 'enemy-damage',
  VICTORY: 'victory',
  HEAL: 'heal',
  MISS: 'miss',
  DEFEAT: 'defeat',
  INITIATIVE: 'initiative',
  BAG: 'bag',
  UPGRADE: 'upgrade',
  LEVEL_UP: 'levelup',
  EXPERIENCE: 'experience',
  SPELL: 'spell',
  BURNING_BLOBS: 'burning-blobs',
  DURATION: 'duration'
};

// Dynamic icon selector
export const getIconForType = (type) => {
  const iconMap = {
    [ICON_TYPES.PLAYER_DAMAGE]: MagicIcon,
    [ICON_TYPES.ENEMY_DAMAGE]: SwordIcon,
    [ICON_TYPES.VICTORY]: VictoryIcon,
    [ICON_TYPES.HEAL]: HeartIcon,
    [ICON_TYPES.MISS]: MissIcon,
    [ICON_TYPES.DEFEAT]: SkullIcon,
    [ICON_TYPES.INITIATIVE]: DiceIcon,
    [ICON_TYPES.BAG]: BagIcon,
    [ICON_TYPES.UPGRADE]: UpgradeIcon,
    [ICON_TYPES.LEVEL_UP]: LevelUpIcon,
    [ICON_TYPES.EXPERIENCE]: ExpIcon,
    [ICON_TYPES.SPELL]: SpellIcon,
    [ICON_TYPES.BURNING_BLOBS]: BurningBlobsIcon,
    [ICON_TYPES.DURATION]: DurationIcon
  };

  const IconComponent = iconMap[type];
  return IconComponent ? <IconComponent /> : null;
};