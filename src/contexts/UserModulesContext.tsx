/**
 * Context pour gérer les modules assignés à l'utilisateur
 * React 19 Best Practices + Temps Réel Supabase
 * 
 * @module UserModulesContext
 */

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  useMemo,
  type ReactNode 
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/user-space/hooks/useCurrentUser';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Interface pour un module assigné
 */
export interface AssignedModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_core: boolean;
  category_id: string;
  user_module_id: string;
  is_enabled: boolean;
  assigned_at: string;
  assigned_by?: string;
  settings?: any;
  last_accessed_at?: string;
  access_count?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
}

/**
 * Interface du contexte
 */
interface UserModulesContextValue {
  modules: AssignedModule[];
  isLoading: boolean;
  error: Error | null;
  hasModule: (slug: string) => boolean;
  hasModules: (slugs: string[]) => Record<string, boolean>;
  getModuleBySlug: (slug: string) => AssignedModule | undefined;
  getModulesByCategory: (categoryId: string) => AssignedModule[];
  refreshModules: () => Promise<void>;
  trackModuleAccess: (moduleSlug: string) => Promise<void>;
}

/**
 * Contexte
 */
const UserModulesContext = createContext<UserModulesContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface UserModulesProviderProps {
  children: ReactNode;
}

/**
 * Provider avec temps réel Supabase
 */
export const UserModulesProvider = ({ children }: UserModulesProviderProps) => {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const [modules, setModules] = useState<AssignedModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Fonction pour charger les modules
   */
  const loadModules = useCallback(async () => {
    if (!user?.id) {
      setModules([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Chargement des modules assignés...', user.id);

      const { data, error: fetchError } = await supabase
        .from('user_modules')
        .select(`
          id,
          module_id,
          is_enabled,
          assigned_at,
          assigned_by,
          settings,
          last_accessed_at,
          access_count,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            is_core,
            category_id,
            status,
            business_categories(
              id,
              name,
              slug,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .eq('modules.status', 'active')
        .order('modules(name)', { ascending: true });

      if (fetchError) throw fetchError;

      // Mapper les données
      const mappedModules: AssignedModule[] = (data || []).map((um: any) => ({
        ...um.modules,
        user_module_id: um.id,
        is_enabled: um.is_enabled,
        assigned_at: um.assigned_at,
        assigned_by: um.assigned_by,
        settings: um.settings,
        last_accessed_at: um.last_accessed_at,
        access_count: um.access_count,
        category: um.modules.business_categories,
      }));

      setModules(mappedModules);
      console.log('✅ Modules chargés:', mappedModules.length);
    } catch (err) {
      console.error('❌ Erreur chargement modules:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Fonction pour rafraîchir les modules
   */
  const refreshModules = useCallback(async () => {
    await loadModules();
    // Invalider les caches React Query liés
    queryClient.invalidateQueries({ queryKey: ['user-assigned-modules'] });
    queryClient.invalidateQueries({ queryKey: ['school-stats'] });
  }, [loadModules, queryClient]);

  /**
   * Fonction pour tracker l'accès à un module
   */
  const trackModuleAccess = useCallback(async (moduleSlug: string) => {
    if (!user?.id) return;

    const module = modules.find(m => m.slug === moduleSlug);
    if (!module) return;

    try {
      // Appeler la fonction PostgreSQL
      await supabase.rpc('track_module_access', {
        p_user_id: user.id,
        p_module_id: module.id,
      });

      // Mettre à jour localement
      setModules(prev => prev.map(m => 
        m.slug === moduleSlug 
          ? { 
              ...m, 
              last_accessed_at: new Date().toISOString(),
              access_count: (m.access_count || 0) + 1 
            }
          : m
      ));
    } catch (err) {
      console.error('❌ Erreur tracking module:', err);
    }
  }, [user?.id, modules]);

  /**
   * Fonction pour vérifier si un module est assigné
   */
  const hasModule = useCallback((slug: string): boolean => {
    return modules.some(m => m.slug === slug && m.is_enabled);
  }, [modules]);

  /**
   * Fonction pour vérifier plusieurs modules
   */
  const hasModules = useCallback((slugs: string[]): Record<string, boolean> => {
    return slugs.reduce((acc, slug) => ({
      ...acc,
      [slug]: modules.some(m => m.slug === slug && m.is_enabled)
    }), {});
  }, [modules]);

  /**
   * Fonction pour récupérer un module par slug
   */
  const getModuleBySlug = useCallback((slug: string): AssignedModule | undefined => {
    return modules.find(m => m.slug === slug && m.is_enabled);
  }, [modules]);

  /**
   * Fonction pour récupérer les modules par catégorie
   */
  const getModulesByCategory = useCallback((categoryId: string): AssignedModule[] => {
    return modules.filter(m => m.category_id === categoryId && m.is_enabled);
  }, [modules]);

  /**
   * Charger les modules au montage et quand l'utilisateur change
   */
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  /**
   * Configurer le temps réel Supabase
   */
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 Configuration temps réel pour user_modules...');

    // Créer le channel
    const realtimeChannel = supabase
      .channel(`user_modules:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Changement détecté dans user_modules:', payload);

          // Recharger les modules
          refreshModules();

          // Afficher une notification (optionnel)
          if (payload.eventType === 'INSERT') {
            console.log('✨ Nouveau module assigné !');
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Module retiré');
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Module mis à jour');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut temps réel:', status);
      });

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      console.log('🔌 Déconnexion temps réel user_modules');
      realtimeChannel.unsubscribe();
    };
  }, [user?.id, refreshModules]);

  /**
   * Valeur mémorisée du contexte
   */
  const value = useMemo<UserModulesContextValue>(() => ({
    modules,
    isLoading,
    error,
    hasModule,
    hasModules,
    getModuleBySlug,
    getModulesByCategory,
    refreshModules,
    trackModuleAccess,
  }), [
    modules,
    isLoading,
    error,
    hasModule,
    hasModules,
    getModuleBySlug,
    getModulesByCategory,
    refreshModules,
    trackModuleAccess,
  ]);

  return (
    <UserModulesContext.Provider value={value}>
      {children}
    </UserModulesContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte
 */
export const useUserModulesContext = () => {
  const context = useContext(UserModulesContext);
  
  if (context === undefined) {
    throw new Error('useUserModulesContext must be used within UserModulesProvider');
  }
  
  return context;
};

/**
 * Hook pour vérifier si un module est assigné (version simplifiée)
 */
export const useHasModuleRT = (slug: string): boolean => {
  const { hasModule } = useUserModulesContext();
  return hasModule(slug);
};

/**
 * Hook pour vérifier plusieurs modules (version simplifiée)
 */
export const useHasModulesRT = (slugs: string[]): Record<string, boolean> => {
  const { hasModules } = useUserModulesContext();
  return hasModules(slugs);
};
