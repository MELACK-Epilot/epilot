/**
 * Context pour gérer les permissions basées sur le profil d'accès
 * Temps réel Supabase + React Query + React 19
 * 
 * ARCHITECTURE:
 * - L'utilisateur a un `access_profile_code` dans la table `users`
 * - Le profil (`access_profiles`) contient les permissions JSON
 * - Quand l'admin assigne un profil, l'utilisateur voit ses permissions en temps réel
 * 
 * @module UserProfilePermissionsContext
 */

import { 
  createContext, 
  useContext, 
  useEffect, 
  useCallback,
  useMemo,
  type ReactNode 
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

/** Structure des permissions par domaine */
export interface DomainPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  export?: boolean;
}

/** Structure complète des permissions d'un profil */
export interface ProfilePermissions {
  pedagogie?: DomainPermissions;
  finances?: DomainPermissions;
  administration?: DomainPermissions;
  communication?: DomainPermissions;
  scolarite?: DomainPermissions;
  rh?: DomainPermissions;
  vie_scolaire?: DomainPermissions;
  services?: DomainPermissions;
  securite?: DomainPermissions;
  documents?: DomainPermissions;
  scope?: 'own' | 'school' | 'group' | 'platform';
  [key: string]: DomainPermissions | string | undefined;
}

/** Profil d'accès complet */
export interface UserAccessProfile {
  id: string;
  code: string;
  name_fr: string;
  name_en: string | null;
  description: string | null;
  icon: string | null;
  permissions: ProfilePermissions;
  is_active: boolean;
}

/** Valeur du contexte */
interface UserProfilePermissionsContextValue {
  /** Profil d'accès actuel */
  profile: UserAccessProfile | null;
  /** Code du profil */
  profileCode: string | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: Error | null;
  /** Vérifie une permission spécifique */
  hasPermission: (domain: string, action: 'read' | 'write' | 'delete' | 'export') => boolean;
  /** Vérifie si l'utilisateur peut accéder à un domaine */
  canAccessDomain: (domain: string) => boolean;
  /** Récupère les permissions d'un domaine */
  getDomainPermissions: (domain: string) => DomainPermissions;
  /** Récupère le scope du profil */
  getScope: () => 'own' | 'school' | 'group' | 'platform';
  /** Force le rafraîchissement */
  refresh: () => Promise<void>;
  /** Indique si l'utilisateur a un profil */
  hasProfile: boolean;
}

// ============================================
// CONTEXT
// ============================================

const UserProfilePermissionsContext = createContext<UserProfilePermissionsContextValue | undefined>(undefined);

// ============================================
// QUERY KEYS
// ============================================

const profilePermissionsKeys = {
  all: ['profile-permissions'] as const,
  user: (userId: string) => [...profilePermissionsKeys.all, 'user', userId] as const,
  profile: (code: string) => [...profilePermissionsKeys.all, 'profile', code] as const,
};

// ============================================
// PROVIDER
// ============================================

interface UserProfilePermissionsProviderProps {
  children: ReactNode;
}

export const UserProfilePermissionsProvider = ({ children }: UserProfilePermissionsProviderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ============================================
  // QUERY: Récupérer le profil de l'utilisateur
  // ============================================
  
  const { 
    data: profileData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: profilePermissionsKeys.user(user?.id || ''),
    queryFn: async (): Promise<{ profile: UserAccessProfile | null; profileCode: string | null }> => {
      if (!user?.id) return { profile: null, profileCode: null };

      console.log('🔄 Chargement du profil de permissions pour:', user.id);

      // 1. Récupérer le code du profil de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('access_profile_code')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ Erreur récupération user:', userError);
        throw userError;
      }

      const profileCode = userData?.access_profile_code;

      // 2. Si pas de profil, retourner null (admin ou non assigné)
      if (!profileCode) {
        console.log('ℹ️ Utilisateur sans profil assigné');
        return { profile: null, profileCode: null };
      }

      // 3. Récupérer le profil complet
      const { data: profile, error: profileError } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('code', profileCode)
        .eq('is_active', true)
        .single();

      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.warn('⚠️ Profil non trouvé ou inactif:', profileCode);
        return { profile: null, profileCode };
      }

      console.log('✅ Profil chargé:', profile.name_fr);

      return {
        profile: profile as UserAccessProfile,
        profileCode,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  const profile = profileData?.profile ?? null;
  const profileCode = profileData?.profileCode ?? null;

  // ============================================
  // REALTIME: Écouter les changements
  // ============================================

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 Configuration temps réel pour les permissions...');

    // Canal pour écouter les changements sur l'utilisateur
    const channel = supabase
      .channel(`user-profile-permissions:${user.id}`)
      // Écouter les changements sur la table users (access_profile_code)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfileCode = (payload.new as any)?.access_profile_code;
          const oldProfileCode = (payload.old as any)?.access_profile_code;

          if (newProfileCode !== oldProfileCode) {
            console.log('🔔 Profil modifié:', oldProfileCode, '→', newProfileCode);
            
            // Invalider le cache et refetch
            queryClient.invalidateQueries({ 
              queryKey: profilePermissionsKeys.user(user.id) 
            });

            // Notification à l'utilisateur
            if (newProfileCode) {
              toast.success('Profil mis à jour', {
                description: 'Vos permissions ont été modifiées. Rechargement...',
                duration: 3000,
              });
            } else {
              toast.info('Profil retiré', {
                description: 'Votre profil d\'accès a été retiré.',
                duration: 3000,
              });
            }
          }
        }
      )
      // Écouter les changements sur les profils (si le profil lui-même est modifié)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'access_profiles',
        },
        (payload) => {
          const updatedCode = (payload.new as any)?.code;
          
          // Si c'est notre profil qui a été modifié
          if (profileCode && updatedCode === profileCode) {
            console.log('🔔 Profil actuel modifié:', updatedCode);
            
            queryClient.invalidateQueries({ 
              queryKey: profilePermissionsKeys.user(user.id) 
            });

            toast.info('Permissions mises à jour', {
              description: 'Les permissions de votre profil ont été modifiées.',
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut temps réel permissions:', status);
      });

    // Channel est géré par le cleanup

    return () => {
      console.log('🔌 Déconnexion temps réel permissions');
      channel.unsubscribe();
    };
  }, [user?.id, profileCode, queryClient]);

  // ============================================
  // HELPERS
  // ============================================

  /** Vérifie une permission spécifique */
  const hasPermission = useCallback((
    domain: string, 
    action: 'read' | 'write' | 'delete' | 'export'
  ): boolean => {
    if (!profile?.permissions) return false;
    
    const domainPerms = profile.permissions[domain];
    if (!domainPerms || typeof domainPerms === 'string') return false;
    
    return domainPerms[action] ?? false;
  }, [profile]);

  /** Vérifie si l'utilisateur peut accéder à un domaine (au moins read) */
  const canAccessDomain = useCallback((domain: string): boolean => {
    return hasPermission(domain, 'read');
  }, [hasPermission]);

  /** Récupère les permissions d'un domaine */
  const getDomainPermissions = useCallback((domain: string): DomainPermissions => {
    const defaultPerms: DomainPermissions = { 
      read: false, 
      write: false, 
      delete: false, 
      export: false 
    };

    if (!profile?.permissions) return defaultPerms;
    
    const domainPerms = profile.permissions[domain];
    if (!domainPerms || typeof domainPerms === 'string') return defaultPerms;
    
    return {
      read: domainPerms.read ?? false,
      write: domainPerms.write ?? false,
      delete: domainPerms.delete ?? false,
      export: domainPerms.export ?? false,
    };
  }, [profile]);

  /** Récupère le scope du profil */
  const getScope = useCallback((): 'own' | 'school' | 'group' | 'platform' => {
    if (!profile?.permissions?.scope) return 'own';
    
    const scope = profile.permissions.scope;
    if (['own', 'school', 'group', 'platform'].includes(scope)) {
      return scope as 'own' | 'school' | 'group' | 'platform';
    }
    
    return 'own';
  }, [profile]);

  /** Force le rafraîchissement */
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo<UserProfilePermissionsContextValue>(() => ({
    profile,
    profileCode,
    isLoading,
    error: error as Error | null,
    hasPermission,
    canAccessDomain,
    getDomainPermissions,
    getScope,
    refresh,
    hasProfile: !!profile,
  }), [
    profile,
    profileCode,
    isLoading,
    error,
    hasPermission,
    canAccessDomain,
    getDomainPermissions,
    getScope,
    refresh,
  ]);

  return (
    <UserProfilePermissionsContext.Provider value={value}>
      {children}
    </UserProfilePermissionsContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook principal pour accéder aux permissions du profil
 */
export const useProfilePermissions = (): UserProfilePermissionsContextValue => {
  const context = useContext(UserProfilePermissionsContext);
  
  if (context === undefined) {
    throw new Error('useProfilePermissions must be used within UserProfilePermissionsProvider');
  }
  
  return context;
};

/**
 * Hook pour vérifier une permission spécifique
 * @example
 * const canEditFinances = useHasProfilePermission('finances', 'write');
 */
export const useHasProfilePermission = (
  domain: string, 
  action: 'read' | 'write' | 'delete' | 'export'
): boolean => {
  const { hasPermission } = useProfilePermissions();
  return hasPermission(domain, action);
};

/**
 * Hook pour vérifier l'accès à un domaine
 * @example
 * const canAccessPedagogie = useCanAccessDomain('pedagogie');
 */
export const useCanAccessDomain = (domain: string): boolean => {
  const { canAccessDomain } = useProfilePermissions();
  return canAccessDomain(domain);
};

/**
 * Hook pour récupérer toutes les permissions d'un domaine
 * @example
 * const { read, write, delete: canDelete } = useDomainPermissions('finances');
 */
export const useDomainPermissions = (domain: string): DomainPermissions => {
  const { getDomainPermissions } = useProfilePermissions();
  return getDomainPermissions(domain);
};

/**
 * Hook pour récupérer le profil complet
 */
export const useUserProfile = (): UserAccessProfile | null => {
  const { profile } = useProfilePermissions();
  return profile;
};

/**
 * Hook pour vérifier si l'utilisateur a un profil
 */
export const useHasProfile = (): boolean => {
  const { hasProfile } = useProfilePermissions();
  return hasProfile;
};
