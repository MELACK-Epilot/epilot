/**
 * Provider combiné pour les permissions utilisateur
 * Combine modules, catégories et profils d'accès avec temps réel
 * React 19 Best Practices
 * 
 * @module UserPermissionsProvider
 */

import { type ReactNode } from 'react';
import { UserModulesProvider } from './UserModulesContext';
import { UserCategoriesProvider } from './UserCategoriesContext';
import { UserProfilePermissionsProvider } from './UserProfilePermissionsContext';

/**
 * Props du Provider
 */
interface UserPermissionsProviderProps {
  children: ReactNode;
}

/**
 * Provider combiné pour toutes les permissions utilisateur
 * Gère:
 * - Profils d'accès (permissions basées sur le profil assigné)
 * - Modules (modules assignés individuellement)
 * - Catégories (catégories de modules)
 * Tout avec temps réel Supabase
 */
export const UserPermissionsProvider = ({ children }: UserPermissionsProviderProps) => {
  return (
    <UserProfilePermissionsProvider>
      <UserModulesProvider>
        <UserCategoriesProvider>
          {children}
        </UserCategoriesProvider>
      </UserModulesProvider>
    </UserProfilePermissionsProvider>
  );
};

/**
 * Export des hooks pour faciliter l'utilisation
 */

// Profils d'accès (NOUVEAU)
export { 
  useProfilePermissions,
  useHasProfilePermission,
  useCanAccessDomain,
  useDomainPermissions,
  useUserProfile,
  useHasProfile,
  type UserAccessProfile,
  type ProfilePermissions,
  type DomainPermissions,
} from './UserProfilePermissionsContext';

// Modules
export { 
  useUserModulesContext, 
  useHasModuleRT, 
  useHasModulesRT 
} from './UserModulesContext';

// Catégories
export { 
  useUserCategoriesContext 
} from './UserCategoriesContext';
