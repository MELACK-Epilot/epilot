/**
 * Types pour le dialogue d'assignation de profil
 * @module assign-profile/types
 */

import type { AccessProfile } from '../../../hooks/useProfilesView';

/** Utilisateur simplifié pour l'assignation */
export interface SimpleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar: string | null;
  access_profile_code: string | null;
}

/** Utilisateur avec profil en conflit */
export interface UserWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  currentProfileCode: string;
}

/** Props du dialogue principal */
export interface AssignProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: AccessProfile | null;
}

/** Statistiques de sélection */
export interface SelectionStats {
  total: number;
  filtered: number;
  selected: number;
  toAdd: number;
  toRemove: number;
}

/** Paramètres de mutation */
export interface AssignProfileMutationParams {
  profileCode: string;
  toAdd: string[];
  toRemove: string[];
}

/** Résultat de mutation */
export interface AssignProfileMutationResult {
  added: number;
  removed: number;
}
