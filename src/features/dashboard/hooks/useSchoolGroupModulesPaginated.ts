/**
 * Hook React Query avec Pagination Infinie
 * Optimisé pour 2000+ utilisateurs
 * @module useSchoolGroupModulesPaginated
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ModulesPageParams {
  schoolGroupId: string;
  pageSize?: number;
  search?: string;
  categoryId?: string;
}

interface ModulePage {
  modules: any[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

/**
 * Hook pour récupérer modules avec pagination infinie
 * Utilise la fonction RPC get_school_group_modules_paginated
 */
export const useSchoolGroupModulesPaginated = ({
  schoolGroupId,
  pageSize = 50,
  search,
  categoryId
}: ModulesPageParams) => {
  return useInfiniteQuery<ModulePage>({
    queryKey: ['modules-paginated', schoolGroupId, search, categoryId, pageSize],
    
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await supabase.rpc(
        'get_school_group_modules_paginated',
        {
          p_school_group_id: schoolGroupId,
          p_page: pageParam,
          p_page_size: pageSize,
          p_search: search || null,
          p_category_id: categoryId || null
        }
      );

      if (error) {
        console.error('❌ Erreur pagination modules:', error);
        throw error;
      }

      // Supabase RPC retourne un array avec 1 élément
      const result = data?.[0];
      
      if (!result) {
        return {
          modules: [],
          total_count: 0,
          page: 1,
          page_size: pageSize,
          total_pages: 1,
          has_next_page: false,
          has_prev_page: false
        };
      }

      return result;
    },
    
    getNextPageParam: (lastPage) => {
      if (lastPage.has_next_page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    
    getPreviousPageParam: (firstPage) => {
      if (firstPage.has_prev_page) {
        return firstPage.page - 1;
      }
      return undefined;
    },
    
    initialPageParam: 1,
    
    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    
    // Optimisations
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    
    // Enabled seulement si schoolGroupId existe
    enabled: !!schoolGroupId,
  });
};

/**
 * Hook pour récupérer utilisateurs avec pagination infinie
 */
export const useSchoolGroupUsersPaginated = ({
  schoolGroupId,
  pageSize = 50,
  search,
  role,
  schoolId
}: {
  schoolGroupId: string;
  pageSize?: number;
  search?: string;
  role?: string;
  schoolId?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['users-paginated', schoolGroupId, search, role, schoolId, pageSize],
    
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await supabase.rpc(
        'get_school_group_users_paginated',
        {
          p_school_group_id: schoolGroupId,
          p_page: pageParam,
          p_page_size: pageSize,
          p_search: search || null,
          p_role: role || null,
          p_school_id: schoolId || null
        }
      );

      if (error) {
        console.error('❌ Erreur pagination users:', error);
        throw error;
      }

      return data?.[0] || {
        users: [],
        total_count: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false
      };
    },
    
    getNextPageParam: (lastPage) => {
      if (lastPage.has_next_page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!schoolGroupId,
  });
};

/**
 * Hook pour stats modules optimisées
 */
export const useUserModuleStatsOptimized = (userId: string) => {
  return useQuery({
    queryKey: ['user-module-stats-optimized', userId],
    
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_user_module_stats_optimized',
        { p_user_id: userId }
      );

      if (error) {
        console.error('❌ Erreur stats modules:', error);
        throw error;
      }

      return data?.[0];
    },
    
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  });
};

/**
 * Utilitaire pour flatten les pages
 */
export const flattenInfiniteQueryData = <T>(data: any): T[] => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => page.modules || page.users || []);
};

/**
 * Utilitaire pour obtenir le total count
 */
export const getTotalCount = (data: any): number => {
  return data?.pages?.[0]?.total_count || 0;
};
