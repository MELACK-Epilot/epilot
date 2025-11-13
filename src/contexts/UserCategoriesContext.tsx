/**
 * Context pour gérer les catégories assignées à l'utilisateur
 * React 19 Best Practices + Temps Réel Supabase
 * 
 * @module UserCategoriesContext
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
 * Interface pour une catégorie assignée
 */
interface AssignedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_enabled: boolean;
  assigned_at: string;
  module_count: number;
}

/**
 * Interface du contexte
 */
interface UserCategoriesContextValue {
  categories: AssignedCategory[];
  isLoading: boolean;
  error: Error | null;
  hasCategory: (slug: string) => boolean;
  getCategoryBySlug: (slug: string) => AssignedCategory | undefined;
  refreshCategories: () => Promise<void>;
}

/**
 * Contexte
 */
const UserCategoriesContext = createContext<UserCategoriesContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface UserCategoriesProviderProps {
  children: ReactNode;
}

/**
 * Provider avec temps réel Supabase
 */
export const UserCategoriesProvider = ({ children }: UserCategoriesProviderProps) => {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const [categories, setCategories] = useState<AssignedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Fonction pour charger les catégories
   * Basé sur les modules assignés à l'utilisateur
   */
  const loadCategories = useCallback(async () => {
    if (!user?.id) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Chargement des catégories assignées...', user.id);

      // Récupérer les catégories via les modules assignés
      const { data, error: fetchError } = await supabase
        .from('user_modules')
        .select(`
          is_enabled,
          assigned_at,
          modules!inner(
            category_id,
            business_categories!inner(
              id,
              name,
              slug,
              description,
              icon,
              color,
              status
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .eq('modules.status', 'active')
        .eq('modules.business_categories.status', 'active');

      if (fetchError) throw fetchError;

      // Grouper par catégorie et compter les modules
      const categoryMap = new Map<string, AssignedCategory>();

      (data || []).forEach((um: any) => {
        const cat = um.modules.business_categories;
        if (!cat) return;

        if (categoryMap.has(cat.id)) {
          const existing = categoryMap.get(cat.id)!;
          existing.module_count += 1;
        } else {
          categoryMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            icon: cat.icon,
            color: cat.color,
            is_enabled: um.is_enabled,
            assigned_at: um.assigned_at,
            module_count: 1,
          });
        }
      });

      const mappedCategories = Array.from(categoryMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategories(mappedCategories);
      console.log('✅ Catégories chargées:', mappedCategories.length);
    } catch (err) {
      console.error('❌ Erreur chargement catégories:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Fonction pour rafraîchir les catégories
   */
  const refreshCategories = useCallback(async () => {
    await loadCategories();
    queryClient.invalidateQueries({ queryKey: ['user-categories'] });
  }, [loadCategories, queryClient]);

  /**
   * Fonction pour vérifier si une catégorie est assignée
   */
  const hasCategory = useCallback((slug: string): boolean => {
    return categories.some(c => c.slug === slug && c.is_enabled);
  }, [categories]);

  /**
   * Fonction pour récupérer une catégorie par slug
   */
  const getCategoryBySlug = useCallback((slug: string): AssignedCategory | undefined => {
    return categories.find(c => c.slug === slug && c.is_enabled);
  }, [categories]);

  /**
   * Charger les catégories au montage
   */
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /**
   * Configurer le temps réel Supabase
   * Écouter les changements sur user_modules
   */
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 Configuration temps réel pour catégories...');

    const realtimeChannel = supabase
      .channel(`user_categories:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Changement détecté (catégories):', payload);
          refreshCategories();
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut temps réel catégories:', status);
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔌 Déconnexion temps réel catégories');
      realtimeChannel.unsubscribe();
    };
  }, [user?.id, refreshCategories]);

  /**
   * Valeur mémorisée du contexte
   */
  const value = useMemo<UserCategoriesContextValue>(() => ({
    categories,
    isLoading,
    error,
    hasCategory,
    getCategoryBySlug,
    refreshCategories,
  }), [
    categories,
    isLoading,
    error,
    hasCategory,
    getCategoryBySlug,
    refreshCategories,
  ]);

  return (
    <UserCategoriesContext.Provider value={value}>
      {children}
    </UserCategoriesContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte
 */
export const useUserCategoriesContext = () => {
  const context = useContext(UserCategoriesContext);
  
  if (context === undefined) {
    throw new Error('useUserCategoriesContext must be used within UserCategoriesProvider');
  }
  
  return context;
};
