/**
 * Export principal du module user-details
 */

export { UserDetailsDialog } from './UserDetailsDialog';
export { UserDetailsDialog as UserDetailsDialogEnhanced } from './UserDetailsDialog';

// Types
export type { UserDetailsDialogProps, UserModule, UserStats, ActivityLog } from './types';

// Hooks (pour réutilisation externe si nécessaire)
export { useUserDetails, useUserModules, useUserActivity } from './hooks';

// Utils
export { getRoleLabel, getProfileLabel, calculateUserStats, groupModulesByCategory } from './utils';
