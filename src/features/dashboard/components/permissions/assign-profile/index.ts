/**
 * Module d'assignation de profil
 * Export principal
 * @module assign-profile
 */

// Composant principal
export { AssignProfileDialog } from './AssignProfileDialog';

// Types
export type {
  SimpleUser,
  UserWithProfile,
  AssignProfileDialogProps,
  SelectionStats,
  AssignProfileMutationParams,
  AssignProfileMutationResult,
} from './types';

// Hooks (pour réutilisation externe)
export {
  useAssignableUsers,
  useAssignProfileMutation,
  useAssignProfileState,
  assignableUsersKeys,
} from './hooks';

// Constantes
export {
  EXCLUDED_ROLES,
  ITEM_HEIGHT,
  MAX_USERS_LIMIT,
  BATCH_SIZE,
  SEARCH_DEBOUNCE_MS,
  USERS_STALE_TIME,
} from './constants';
