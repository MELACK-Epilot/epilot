/**
 * Zustand Store pour la gestion des profils d'accès
 * Optimisé pour 500 groupes et 7000 écoles
 * @module AccessProfilesStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface AccessProfile {
  id: string;
  code: string;
  name_fr: string;
  name_en?: string;
  description?: string;
  permissions: {
    pedagogie: DomainPermission;
    vie_scolaire: DomainPermission;
    administration: DomainPermission;
    finances: DomainPermission;
    statistiques: DomainPermission;
    scope: 'TOUTE_LECOLE' | 'SES_CLASSES_ET_MATIERES' | 'SES_ENFANTS_UNIQUEMENT' | 'LUI_MEME_UNIQUEMENT';
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DomainPermission {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
  validate: boolean;
}

interface AccessProfilesState {
  // State
  profiles: AccessProfile[];
  selectedProfileCode: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  fetchProfiles: () => Promise<void>;
  selectProfile: (code: string) => void;
  getProfile: (code: string) => AccessProfile | undefined;
  getProfilePermissions: (code: string) => AccessProfile['permissions'] | null;
  hasPermission: (code: string, domain: keyof AccessProfile['permissions'], permission: keyof DomainPermission) => boolean;
  clearError: () => void;
  reset: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (profils changent rarement)

export const useAccessProfilesStore = create<AccessProfilesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profiles: [],
        selectedProfileCode: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        
        // Fetch profiles from database with caching
        fetchProfiles: async () => {
          const state = get();
          
          // Check cache
          if (
            state.profiles.length > 0 &&
            state.lastFetched &&
            Date.now() - state.lastFetched < CACHE_DURATION
          ) {
            console.log('✅ Using cached access profiles');
            return;
          }
          
          set({ isLoading: true, error: null });
          
          try {
            console.log('🔍 Fetching access profiles from database...');
            
            const { data, error } = await supabase
              .from('access_profiles')
              .select('*')
              .eq('is_active', true)
              .order('name_fr');
            
            if (error) throw error;
            
            console.log(`✅ Fetched ${data.length} access profiles`);
            
            set({ 
              profiles: data as AccessProfile[], 
              isLoading: false,
              lastFetched: Date.now(),
              error: null
            });
          } catch (error: any) {
            console.error('❌ Error fetching access profiles:', error);
            set({ error: error.message, isLoading: false });
          }
        },
        
        // Select profile
        selectProfile: (code) => {
          const profile = get().profiles.find(p => p.code === code);
          if (profile) {
            console.log(`✅ Selected profile: ${profile.name_fr}`);
            set({ selectedProfileCode: code });
          } else {
            console.warn(`⚠️ Profile not found: ${code}`);
          }
        },
        
        // Get profile by code
        getProfile: (code) => {
          return get().profiles.find(p => p.code === code);
        },
        
        // Get permissions for profile
        getProfilePermissions: (code) => {
          const profile = get().profiles.find(p => p.code === code);
          return profile?.permissions || null;
        },
        
        // Check if profile has specific permission
        hasPermission: (code, domain, permission) => {
          const profile = get().profiles.find(p => p.code === code);
          if (!profile || !profile.permissions[domain]) return false;
          
          // @ts-ignore - Dynamic access
          return profile.permissions[domain][permission] === true;
        },
        
        // Clear error
        clearError: () => set({ error: null }),
        
        // Reset store
        reset: () => set({
          profiles: [],
          selectedProfileCode: null,
          isLoading: false,
          error: null,
          lastFetched: null,
        }),
      }),
      {
        name: 'access-profiles-storage',
        partialize: (state) => ({ 
          profiles: state.profiles,
          selectedProfileCode: state.selectedProfileCode,
          lastFetched: state.lastFetched,
        }),
      }
    ),
    { name: 'AccessProfilesStore' }
  )
);

/**
 * Hook pour récupérer un profil spécifique
 */
export const useAccessProfile = (code: string) => {
  const profile = useAccessProfilesStore(state => 
    state.profiles.find(p => p.code === code)
  );
  return profile;
};

/**
 * Hook pour récupérer les permissions d'un profil
 */
export const useProfilePermissions = (code: string) => {
  const permissions = useAccessProfilesStore(state => 
    state.getProfilePermissions(code)
  );
  return permissions;
};

/**
 * Hook pour vérifier une permission spécifique
 */
export const useHasPermission = (
  code: string, 
  domain: keyof AccessProfile['permissions'], 
  permission: keyof DomainPermission
) => {
  const hasPermission = useAccessProfilesStore(state => 
    state.hasPermission(code, domain, permission)
  );
  return hasPermission;
};
