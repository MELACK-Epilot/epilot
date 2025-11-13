/**
 * Export centralisé des composants partagés
 * Facilite les imports et la maintenance
 * 
 * @module SharedComponents
 */

export { UserAvatar } from './UserAvatar';
export { LoadingState } from './LoadingState';
export { StatsCard } from './StatsCard';

// Re-export des constantes du design system
export { COLORS, GRADIENTS, COMMON_CLASSES, ANIMATIONS } from '../../constants/designSystem';
export type { ColorKey, GradientKey, CommonClassKey } from '../../constants/designSystem';
