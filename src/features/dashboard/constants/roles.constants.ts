/**
 * Constantes pour les rôles et profils d'accès
 * @module roles.constants
 */

import * as LucideIcons from 'lucide-react';
import { Box } from 'lucide-react';

/**
 * Mapping des émojis pour les rôles standards
 */
export const ROLE_EMOJIS: Record<string, string> = {
  proviseur: '🎓',
  directeur: '👔',
  directeur_etudes: '📋',
  secretaire: '📝',
  comptable: '💰',
  enseignant: '👨‍🏫',
  cpe: '🎯',
  surveillant: '👮',
  bibliothecaire: '📚',
  gestionnaire_cantine: '🍽️',
  conseiller_orientation: '🧭',
  infirmier: '⚕️',
  eleve: '🎒',
  parent: '👨‍👩‍👧‍👦',
  autre: '👤',
  admin_groupe: '🏫',
} as const;

/**
 * Récupère l'emoji pour un rôle donné
 */
export const getRoleEmoji = (roleCode: string): string => {
  return ROLE_EMOJIS[roleCode] || '👤';
};

/**
 * Récupère une icône Lucide dynamiquement par son nom
 */
export const getModuleIcon = (iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  // @ts-expect-error - Accès dynamique aux icônes Lucide
  return (LucideIcons[iconName] as React.ComponentType) || Box;
};

/**
 * Emoji par défaut pour les profils
 */
export const DEFAULT_PROFILE_EMOJI = '👤';
