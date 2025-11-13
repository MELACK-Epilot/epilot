/**
 * Provider combiné pour les permissions utilisateur
 * Combine modules et catégories avec temps réel
 * React 19 Best Practices
 * 
 * @module UserPermissionsProvider
 */

import { type ReactNode } from 'react';
import { UserModulesProvider } from './UserModulesContext';
import { UserCategoriesProvider } from './UserCategoriesContext';

/**
 * Props du Provider
 */
interface UserPermissionsProviderProps {
  children: ReactNode;
}

/**
 * Provider combiné pour toutes les permissions utilisateur
 * Gère modules + catégories avec temps réel Supabase
 */
export const UserPermissionsProvider = ({ children }: UserPermissionsProviderProps) => {
  return (
    <UserModulesProvider>
      <UserCategoriesProvider>
        {children}
      </UserCategoriesProvider>
    </UserModulesProvider>
  );
};

/**
 * Export des hooks pour faciliter l'utilisation
 */
export { 
  useUserModulesContext, 
  useHasModuleRT, 
  useHasModulesRT 
} from './UserModulesContext';

export { 
  useUserCategoriesContext 
} from './UserCategoriesContext';
