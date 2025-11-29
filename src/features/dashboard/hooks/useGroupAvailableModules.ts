/**
 * Hook pour récupérer les modules disponibles pour le groupe scolaire connecté
 * Filtre les modules selon le plan d'abonnement actif du groupe
 * 
 * ARCHITECTURE:
 * - L'abonnement est lié au GROUPE SCOLAIRE (pas à l'utilisateur)
 * - On récupère d'abord le groupe de l'utilisateur connecté
 * - Puis on appelle la fonction RPC qui filtre par plan d'abonnement
 * 
 * @module useGroupAvailableModules
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUserGroup } from './useCurrentUserGroup';

export interface Module {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string;
  slug: string;
  status: string;
  category_id: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string;
  color: string | null;
  modules: Module[];
}

/**
 * Hook pour récupérer les modules disponibles selon le plan d'abonnement du groupe
 * Utilise la fonction RPC get_available_modules_for_group qui filtre par plan
 * 
 * @param schoolGroupId - ID du groupe scolaire (optionnel, utilise le contexte par défaut)
 * @returns Les catégories et modules disponibles pour le groupe
 */
export const useGroupAvailableModules = (schoolGroupId?: string) => {
  // Récupérer le groupe scolaire de l'utilisateur connecté
  const { data: currentGroup, isLoading: groupLoading } = useCurrentUserGroup();
  
  // Utiliser le schoolGroupId fourni OU celui du groupe de l'utilisateur
  const groupId = schoolGroupId || currentGroup?.id;
  
  // Debug: afficher les sources
  console.log('🔍 [useGroupAvailableModules] Sources groupId:', {
    paramètre: schoolGroupId,
    currentGroup: currentGroup?.id,
    currentGroupName: currentGroup?.name,
    groupLoading,
    groupIdFinal: groupId,
  });
  
  return useQuery({
    queryKey: ['group-available-modules', groupId],
    queryFn: async () => {
      if (!groupId) {
        console.warn('⚠️ [useGroupAvailableModules] Aucun school_group_id disponible - vérifiez la connexion');
        return [];
      }

      console.log('🔍 [useGroupAvailableModules] Chargement des modules pour le groupe:', groupId);

      // Appeler la fonction RPC qui filtre par plan d'abonnement
      // @ts-expect-error - RPC function parameters not in generated Supabase types
      const { data, error } = await supabase.rpc('get_available_modules_for_group', {
        p_school_group_id: groupId
      }) as { data: Category[] | null; error: Error | null };

      if (error) {
        console.error('❌ [useGroupAvailableModules] Erreur RPC:', error);
        throw error;
      }

      console.log('📦 [useGroupAvailableModules] Données brutes reçues:', data);

      // Parser le résultat JSON
      const categories: Category[] = (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        code: cat.code || cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        modules: (cat.modules || []).map((mod: any) => ({
          id: mod.id,
          name: mod.name,
          code: mod.code || mod.slug,
          description: mod.description,
          icon: mod.icon,
          slug: mod.slug,
          status: mod.status,
          category_id: mod.category_id,
          is_active: mod.is_active ?? true,
        }))
      }));

      const totalModules = categories.reduce((sum, cat) => sum + cat.modules.length, 0);
      
      console.log('✅ [useGroupAvailableModules] Résultat:', {
        categories: categories.length,
        modules: totalModules,
        détail: categories.map(c => `${c.name}: ${c.modules.length} modules`)
      });

      return categories;
    },
    // Activer uniquement quand on a un groupId ET que le groupe est chargé
    enabled: !!groupId && !groupLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes - données relativement stables
    gcTime: 1000 * 60 * 30, // 30 minutes en cache
    // Retry en cas d'erreur
    retry: 2,
  });
};

/**
 * Hook pour les Super Admins - récupère TOUS les modules du système
 * Sans filtrage par plan (pour la configuration globale)
 */
export const useAllSystemModules = () => {
  return useQuery({
    queryKey: ['all-system-modules'],
    queryFn: async () => {
      console.log('🔍 [useAllSystemModules] Chargement de TOUS les modules...');

      // Récupérer toutes les catégories actives
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('business_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (categoriesError) {
        console.error('❌ [useAllSystemModules] Erreur catégories:', categoriesError);
        throw categoriesError;
      }

      // Récupérer tous les modules actifs
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (modulesError) {
        console.error('❌ [useAllSystemModules] Erreur modules:', modulesError);
        throw modulesError;
      }

      // Grouper les modules par catégorie
      const categories: Category[] = (categoriesData || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        code: cat.code || cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        modules: (modulesData || [])
          .filter((mod: any) => mod.category_id === cat.id)
          .map((mod: any) => ({
            id: mod.id,
            name: mod.name,
            code: mod.code || mod.slug,
            description: mod.description,
            icon: mod.icon,
            slug: mod.slug,
            status: mod.status,
            category_id: mod.category_id,
            is_active: true,
          }))
      })).filter(cat => cat.modules.length > 0);

      const totalModules = categories.reduce((sum, cat) => sum + cat.modules.length, 0);
      
      console.log('✅ [useAllSystemModules] TOUS les modules:', {
        categories: categories.length,
        modules: totalModules
      });

      return categories;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 heure
  });
};
