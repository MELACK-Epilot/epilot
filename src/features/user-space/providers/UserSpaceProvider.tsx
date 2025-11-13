/**
 * Provider principal pour l'espace utilisateur
 * Combine tous les contextes nécessaires avec React 19
 */

import { memo } from 'react';
import { NavigationProvider } from '../contexts/NavigationContext';

interface UserSpaceProviderProps {
  children: React.ReactNode;
}

// Provider principal avec composition moderne
export const UserSpaceProvider = memo(({ children }: UserSpaceProviderProps) => {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  );
});

UserSpaceProvider.displayName = 'UserSpaceProvider';
