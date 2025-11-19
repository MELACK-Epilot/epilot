/**
 * Provider React Context pour les profils d'accès
 * Synchronise Zustand Store avec React Query
 * @module AccessProfilesProvider
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useAccessProfilesStore } from '@/stores/access-profiles.store';
import { useAccessProfiles } from '@/features/dashboard/hooks/useAccessProfiles';
import type { AccessProfile, DomainPermission } from '@/stores/access-profiles.store';

interface AccessProfilesContextType {
  profiles: AccessProfile[];
  selectedProfileCode: string | null;
  selectProfile: (code: string) => void;
  getProfile: (code: string) => AccessProfile | undefined;
  getProfilePermissions: (code: string) => AccessProfile['permissions'] | null;
  hasPermission: (code: string, domain: keyof AccessProfile['permissions'], permission: keyof DomainPermission) => boolean;
  isLoading: boolean;
  error: string | null;
}

const AccessProfilesContext = createContext<AccessProfilesContextType | undefined>(undefined);

export const AccessProfilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAccessProfilesStore();
  const { data: profiles, isLoading, error } = useAccessProfiles();
  
  // Fetch profiles on mount only
  useEffect(() => {
    store.fetchProfiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const value: AccessProfilesContextType = {
    profiles: store.profiles.length > 0 ? store.profiles : (profiles || []),
    selectedProfileCode: store.selectedProfileCode,
    selectProfile: store.selectProfile,
    getProfile: store.getProfile,
    getProfilePermissions: store.getProfilePermissions,
    hasPermission: store.hasPermission,
    isLoading: isLoading || store.isLoading,
    error: error?.message || store.error,
  };
  
  return (
    <AccessProfilesContext.Provider value={value}>
      {children}
    </AccessProfilesContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte des profils d'accès
 */
export const useAccessProfilesContext = () => {
  const context = useContext(AccessProfilesContext);
  if (!context) {
    throw new Error('useAccessProfilesContext must be used within AccessProfilesProvider');
  }
  return context;
};
