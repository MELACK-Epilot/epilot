/**
 * Hook pour récupérer le groupe scolaire de l'utilisateur connecté
 * Utilisé par les Admin de Groupe pour voir leurs modules disponibles
 * @module useCurrentUserGroup
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

/**
 * Type pour le groupe scolaire de l'utilisateur
 */
export interface CurrentUserGroup {
  id: string;
  name: string;
  code: string;
  plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  status: 'active' | 'inactive' | 'suspended';
  logo?: string;
  region: string;
  city: string;
  schoolCount: number;
  studentCount: number;
  staffCount: number;
  // Champs pour les restrictions de plan
  schoolsCount?: number; // Alias de schoolCount
  usersCount?: number; // Total utilisateurs
  storageUsed?: number; // Stockage utilisé en GB
  modulesCount?: number; // Nombre de modules actifs
}

/**
 * Hook pour récupérer le groupe scolaire de l'utilisateur connecté
 */
export const useCurrentUserGroup = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-user-group', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('⚠️ [useCurrentUserGroup] Utilisateur non authentifié');
        return null;
      }

      // Récupérer l'utilisateur avec son groupe scolaire
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('school_group_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ [useCurrentUserGroup] Erreur récupération utilisateur:', userError);
        return null;
      }
      
      // Si l'utilisateur n'a pas de groupe (Super Admin), retourner null
      if (!(userData as any)?.school_group_id) {
        console.log('ℹ️ [useCurrentUserGroup] Utilisateur sans groupe (Super Admin)');
        return null;
      }

      // Récupérer les détails du groupe scolaire
      const { data: groupData, error: groupError } = await supabase
        .from('school_groups')
        .select(`
          id,
          name,
          code,
          plan,
          status,
          logo,
          region,
          city,
          school_count,
          student_count,
          staff_count,
          modules_count
        `)
        .eq('id', (userData as any).school_group_id)
        .single();

      if (groupError) {
        console.error('❌ [useCurrentUserGroup] Erreur récupération groupe:', groupError);
        return null;
      }
      if (!groupData) {
        console.warn('⚠️ [useCurrentUserGroup] Groupe non trouvé');
        return null;
      }

      const data = groupData as any;
      
      // Debug log
      console.log('✅ [useCurrentUserGroup] Groupe récupéré:', {
        id: data.id,
        name: data.name,
        plan: data.plan,
        schoolCount: data.school_count,
      });
      
      return {
        id: data.id,
        name: data.name,
        code: data.code,
        plan: data.plan,
        status: data.status,
        logo: data.logo,
        region: data.region,
        city: data.city,
        schoolCount: data.school_count || 0,
        studentCount: data.student_count || 0,
        staffCount: data.staff_count || 0,
        modulesCount: data.modules_count || 0,
      } as CurrentUserGroup;
    },
    enabled: !!user?.id,
    staleTime: 0, // Rechargement immédiat (temporaire pour debug)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
