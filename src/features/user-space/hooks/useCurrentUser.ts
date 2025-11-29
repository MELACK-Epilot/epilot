/**
 * Hook pour récupérer l'utilisateur connecté
 * 
 * ⚡ OPTIMISÉ:
 * - Utilise d'abord le cache Zustand (instant)
 * - Fallback sur React Query si cache vide
 * - Évite les appels réseau redondants après login
 * 
 * @module useCurrentUser
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  schoolGroupId?: string;
  avatar?: string;
  status: string;
}

export const useCurrentUser = () => {
  const queryClient = useQueryClient();
  
  // ⚡ Priorité 1: Cache Zustand (instant, déjà chargé au login)
  const zustandUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // ⚡ Priorité 2: Cache React Query
  const cachedUser = queryClient.getQueryData<CurrentUser>(['current-user']);
  
  // Déterminer si on a déjà les données
  const hasUserData = useMemo(() => {
    return !!(zustandUser || cachedUser);
  }, [zustandUser, cachedUser]);

  // Transformer le user Zustand en CurrentUser
  const transformedZustandUser = useMemo((): CurrentUser | null => {
    if (!zustandUser) return null;
    return {
      id: zustandUser.id,
      email: zustandUser.email,
      firstName: zustandUser.firstName || 'Utilisateur',
      lastName: zustandUser.lastName || '',
      role: zustandUser.role,
      schoolId: zustandUser.schoolId,
      schoolGroupId: zustandUser.schoolGroupId,
      avatar: zustandUser.avatar,
      status: 'active',
    };
  }, [zustandUser]);

  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<CurrentUser | null> => {
      // Si on a déjà les données Zustand, les utiliser
      if (transformedZustandUser) {
        return transformedZustandUser;
      }

      // Sinon, fetch depuis Supabase (fallback)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          school_id,
          school_group_id,
          avatar,
          status
        `)
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        console.error('❌ Erreur récupération user:', error);
        return null;
      }

      const userData = data as any;
      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        schoolId: userData.school_id,
        schoolGroupId: userData.school_group_id,
        avatar: userData.avatar,
        status: userData.status,
      };
    },
    // ⚡ Optimisation: Ne pas fetch si on a déjà les données
    enabled: isAuthenticated && !hasUserData,
    staleTime: 10 * 60 * 1000, // 10 minutes (augmenté)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
    // ⚡ Utiliser les données Zustand comme initialData
    initialData: transformedZustandUser || undefined,
  });

  // ⚡ Retourner les données Zustand en priorité (instant)
  return {
    data: transformedZustandUser || query.data || null,
    isLoading: !hasUserData && query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
