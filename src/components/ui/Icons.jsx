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
  GiBladeDrag,
  GiBrain,
  GiCrossedSwords,
  GiBowArrow,
  GiWalkingBoot,
  GiPositionMarker,
  GiRecycle,
  GiFireDash, GiSmallFire,
  GiBouncingSword
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
export const BrainIcon = createIcon(GiBrain, 'brain-icon');
export const CombatIcon = createIcon(GiCrossedSwords, 'combat-icon');
export const BowIcon = createIcon(GiBowArrow, 'bow-icon');
export const MoveIcon = createIcon(GiWalkingBoot, 'move-icon');
export const PositionIcon = createIcon(GiPositionMarker, 'position-icon');
export const RefreshIcon = createIcon(GiRecycle, 'refresh-icon');
export const FireDashIcon = createIcon(GiFireDash, 'dash-icon');
export const SmallFireIcon = createIcon(GiSmallFire, 'small-fire-icon');
export const CombatSwordIcon = createIcon(GiBouncingSword, 'combat-sword-icon');

// Dynamic icon selector
export const getIconForType = (type) => {
  const iconMap = {
    'player-damage': MagicIcon,
    'enemy-damage': SwordIcon,
    'opportunity-hit': SwordIcon,
    'opportunity-miss': MissIcon,
    'victory': VictoryIcon,
    'heal': HeartIcon,
    'miss': MissIcon,
    'defeat': SkullIcon,
    'initiative': DiceIcon,
    'bag': BagIcon,
    'upgrade': UpgradeIcon,
    'levelup': LevelUpIcon,
    'experience': ExpIcon,
    'spell': SpellIcon,
    'burning-blobs': BurningBlobsIcon,
    'duration': DurationIcon,
    'brain': BrainIcon,
    'combat': SwordIcon,
    'bow': BowIcon,
    'dash': FireDashIcon,
    'position': PositionIcon,
    'refresh': RefreshIcon,
    'target': MissIcon,
    'warning': MissIcon,
    'success': VictoryIcon,
    'error': SkullIcon,
    'debug': DiceIcon,
    'action': CombatIcon,
    'movement': MoveIcon,
    'damage': SwordIcon,
    'healing': HeartIcon,
    'buff': MagicIcon,
    'info': DiceIcon,
    'combat-start': CombatIcon,
    'spell-hit': SmallFireIcon,
    'critical-hit': CombatSwordIcon
  };

  const IconComponent = iconMap[type];
  return IconComponent ? <IconComponent /> : null;
};

