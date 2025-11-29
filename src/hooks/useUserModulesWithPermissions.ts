/**
 * Hook pour récupérer les modules d'un utilisateur avec permissions
 * Utilise la fonction RPC get_user_modules_with_permissions
 * Temps réel via Supabase Realtime
 * 
 * @module useUserModulesWithPermissions
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface ModulePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
}

export interface UserModule {
  module_id: string;
  module_name: string;
  module_slug: string;
  module_icon: string | null;
  module_color: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  category_color: string | null;
  permissions: ModulePermissions;
  assignment_type: 'profile' | 'manual';
  profile_name: string | null;
  assigned_at: string;
}

export interface UserModulesResult {
  /** Liste des modules avec permissions */
  modules: UserModule[];
  /** Modules groupés par catégorie */
  modulesByCategory: Record<string, UserModule[]>;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur */
  error: Error | null;
  /** Vérifie si l'utilisateur a accès à un module */
  hasModule: (slug: string) => boolean;
  /** Vérifie une permission sur un module */
  canOnModule: (slug: string, action: keyof ModulePermissions) => boolean;
  /** Récupère un module par slug */
  getModule: (slug: string) => UserModule | undefined;
  /** Récupère les modules d'une catégorie */
  getModulesByCategory: (categorySlug: string) => UserModule[];
  /** Force le rafraîchissement */
  refresh: () => Promise<void>;
}

// ============================================
// QUERY KEYS
// ============================================

export const userModulesKeys = {
  all: ['user-modules-permissions'] as const,
  user: (userId: string) => [...userModulesKeys.all, userId] as const,
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export const useUserModulesWithPermissions = (userId?: string): UserModulesResult => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Utiliser l'ID fourni ou celui de l'utilisateur connecté
  const targetUserId = userId || user?.id;

  // ============================================
  // QUERY: Récupérer les modules via RPC
  // ============================================
  
  const { 
    data: modules = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: userModulesKeys.user(targetUserId || ''),
    queryFn: async (): Promise<UserModule[]> => {
      if (!targetUserId) return [];

      console.log('🔄 Chargement modules avec permissions pour:', targetUserId);

      const { data, error } = await supabase.rpc('get_user_modules_with_permissions', {
        p_user_id: targetUserId
      });

      if (error) {
        console.error('❌ Erreur RPC get_user_modules_with_permissions:', error);
        throw error;
      }

      console.log('✅ Modules chargés:', (data as UserModule[])?.length || 0);
      return (data as UserModule[]) || [];
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // ============================================
  // REALTIME: Écouter les changements
  // ============================================

  useEffect(() => {
    if (!targetUserId) return;

    console.log('🔌 Configuration temps réel pour user_modules...');

    const channel = supabase
      .channel(`user-modules-rt:${targetUserId}`)
      // Écouter les changements sur user_modules
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          console.log('🔔 Changement user_modules:', payload.eventType);
          
          // Invalider le cache
          queryClient.invalidateQueries({ 
            queryKey: userModulesKeys.user(targetUserId) 
          });

          // Notification
          if (payload.eventType === 'INSERT') {
            toast.success('Nouveau module disponible', {
              description: 'Un module a été ajouté à votre profil.',
              duration: 3000,
            });
          } else if (payload.eventType === 'DELETE') {
            toast.info('Module retiré', {
              description: 'Un module a été retiré de votre profil.',
              duration: 3000,
            });
          }
        }
      )
      // Écouter les changements sur users.access_profile_code
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${targetUserId}`,
        },
        (payload) => {
          const newProfile = (payload.new as any)?.access_profile_code;
          const oldProfile = (payload.old as any)?.access_profile_code;
          
          if (newProfile !== oldProfile) {
            console.log('🔔 Profil changé:', oldProfile, '→', newProfile);
            
            // Invalider le cache (le trigger SQL a déjà sync les modules)
            queryClient.invalidateQueries({ 
              queryKey: userModulesKeys.user(targetUserId) 
            });

            toast.success('Profil mis à jour', {
              description: newProfile 
                ? `Nouveau profil: ${newProfile}` 
                : 'Profil retiré',
              duration: 4000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut temps réel modules:', status);
      });

    return () => {
      console.log('🔌 Déconnexion temps réel modules');
      channel.unsubscribe();
    };
  }, [targetUserId, queryClient]);

  // ============================================
  // COMPUTED: Modules par catégorie
  // ============================================

  const modulesByCategory = useMemo(() => {
    return modules.reduce<Record<string, UserModule[]>>((acc, module) => {
      const key = module.category_slug || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(module);
      return acc;
    }, {});
  }, [modules]);

  // ============================================
  // HELPERS
  // ============================================

  const hasModule = useCallback((slug: string): boolean => {
    return modules.some(m => m.module_slug === slug);
  }, [modules]);

  const canOnModule = useCallback((
    slug: string, 
    action: keyof ModulePermissions
  ): boolean => {
    const module = modules.find(m => m.module_slug === slug);
    if (!module) return false;
    return module.permissions[action] ?? false;
  }, [modules]);

  const getModule = useCallback((slug: string): UserModule | undefined => {
    return modules.find(m => m.module_slug === slug);
  }, [modules]);

  const getModulesByCategory = useCallback((categorySlug: string): UserModule[] => {
    return modulesByCategory[categorySlug] || [];
  }, [modulesByCategory]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ============================================
  // RETURN
  // ============================================

  return {
    modules,
    modulesByCategory,
    isLoading,
    error: error as Error | null,
    hasModule,
    canOnModule,
    getModule,
    getModulesByCategory,
    refresh,
  };
};

// ============================================
// HOOKS SPÉCIALISÉS
// ============================================

/**
 * Hook pour vérifier si l'utilisateur a accès à un module
 */
export const useHasModule = (slug: string): boolean => {
  const { hasModule } = useUserModulesWithPermissions();
  return hasModule(slug);
};

/**
 * Hook pour vérifier une permission sur un module
 */
export const useCanOnModule = (
  slug: string, 
  action: keyof ModulePermissions
): boolean => {
  const { canOnModule } = useUserModulesWithPermissions();
  return canOnModule(slug, action);
};

/**
 * Hook pour récupérer les modules d'une catégorie
 */
export const useCategoryModules = (categorySlug: string): UserModule[] => {
  const { getModulesByCategory } = useUserModulesWithPermissions();
  return getModulesByCategory(categorySlug);
};
