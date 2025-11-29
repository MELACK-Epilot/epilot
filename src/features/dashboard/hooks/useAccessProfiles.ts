/**
 * React Query hooks pour la gestion des profils d'accès
 * Optimisé pour performance et scalabilité
 * @module useAccessProfiles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/store/auth.store';
import type { AccessProfile } from '@/stores/access-profiles.store';

/**
 * Hook pour récupérer les profils d'accès du groupe de l'utilisateur
 * - Admin Groupe: voit les profils de son groupe
 * - Super Admin: voit tous les profils (templates + groupes)
 */
export const useAccessProfiles = () => {
  const { user } = useAuth();
  const schoolGroupId = user?.schoolGroupId;
  const isSuperAdmin = user?.role === 'super_admin';

  return useQuery({
    queryKey: ['access-profiles', schoolGroupId, isSuperAdmin],
    queryFn: async () => {
      console.log('🔍 Fetching access profiles...', { schoolGroupId, isSuperAdmin });
      
      let query = supabase
        .from('access_profiles')
        .select('*')
        .eq('is_active', true);
      
      // Filtrer par groupe pour Admin Groupe
      if (!isSuperAdmin && schoolGroupId) {
        query = query.eq('school_group_id', schoolGroupId);
      }
      
      // Super Admin voit tout (templates + groupes)
      // Pas de filtre supplémentaire
      
      const { data, error } = await query.order('name_fr');
      
      if (error) {
        console.error('❌ Error fetching profiles:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} profiles`);
      return (data || []) as AccessProfile[];
    },
    enabled: isSuperAdmin || !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook pour récupérer un profil spécifique
 */
export const useAccessProfile = (code: string) => {
  return useQuery({
    queryKey: ['access-profile', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('code', code)
        .single();
      
      if (error) throw error;
      return data as AccessProfile;
    },
    enabled: !!code,
    staleTime: 0, // Toujours recharger les données fraîches
    refetchOnMount: 'always',
  });
};

/**
 * Hook pour assigner module avec profil
 * Utilise RPC pour validation côté serveur
 */
export const useAssignModuleWithProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      accessProfileCode,
      assignedBy,
    }: {
      userId: string;
      moduleId: string;
      accessProfileCode: string;
      assignedBy: string;
    }) => {
      console.log(`🔄 Assigning module ${moduleId} to user ${userId} with profile ${accessProfileCode}`);
      
      // Appeler RPC pour assignation sécurisée
      const { data, error } = await (supabase as any).rpc('assign_module_with_profile', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_access_profile_code: accessProfileCode,
        p_assigned_by: assignedBy,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || result.message || 'Erreur lors de l\'assignation');
      }
      
      console.log('✅ Module assigned successfully');
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      
      toast.success('Module assigné avec succès');
    },
    onError: (error: any) => {
      console.error('❌ Error assigning module:', error);
      toast.error('Erreur lors de l\'assignation', {
        description: error.message,
      });
    },
  });
};

/**
 * Hook pour assigner plusieurs modules avec le même profil
 */
export const useAssignMultipleWithProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      accessProfileCode,
      assignedBy,
    }: {
      userId: string;
      moduleIds: string[];
      accessProfileCode: string;
      assignedBy: string;
    }) => {
      console.log(`🔄 Assigning ${moduleIds.length} modules with profile ${accessProfileCode}`);
      
      // Appeler RPC pour chaque module (en parallèle pour performance)
      const promises = moduleIds.map(moduleId =>
        (supabase as any).rpc('assign_module_with_profile', {
          p_user_id: userId,
          p_module_id: moduleId,
          p_access_profile_code: accessProfileCode,
          p_assigned_by: assignedBy,
        })
      );
      
      const results = await Promise.allSettled(promises);
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ ${succeeded} succeeded, ❌ ${failed} failed`);
      
      return { succeeded, failed, total: moduleIds.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      
      if (data.failed > 0) {
        toast.warning(`${data.succeeded} assigné(s), ${data.failed} échec(s)`);
      } else {
        toast.success(`${data.succeeded} module(s) assigné(s) avec succès`);
      }
    },
    onError: (error: any) => {
      console.error('❌ Error assigning modules:', error);
      toast.error('Erreur lors de l\'assignation en masse', {
        description: error.message,
      });
    },
  });
};

/**
 * Hook pour assigner catégorie avec profil
 */
export const useAssignCategoryWithProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      categoryId,
      accessProfileCode,
      assignedBy,
    }: {
      userId: string;
      categoryId: string;
      accessProfileCode: string;
      assignedBy: string;
    }) => {
      console.log(`🔄 Assigning category ${categoryId} with profile ${accessProfileCode}`);
      
      const { data, error } = await (supabase as any).rpc('assign_category_with_profile', {
        p_user_id: userId,
        p_category_id: categoryId,
        p_access_profile_code: accessProfileCode,
        p_assigned_by: assignedBy,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; assigned: number; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'assignation');
      }
      
      console.log(`✅ Category assigned: ${result.assigned} modules`);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      
      toast.success(`Catégorie assignée: ${data.assigned} module(s)`);
    },
    onError: (error: any) => {
      console.error('❌ Error assigning category:', error);
      toast.error('Erreur lors de l\'assignation de la catégorie', {
        description: error.message,
      });
    },
  });
};

/**
 * Hook pour récupérer les relations parent-élève
 * NOTE: Désactivé temporairement - table parent_student_relations pas encore dans les types Supabase
 */
export const useParentStudentRelations = (parentId?: string) => {
  return useQuery({
    queryKey: ['parent-student-relations', parentId],
    queryFn: async () => {
      if (!parentId) throw new Error('Parent ID required');
      
      // TODO: Activer quand les types Supabase seront générés
      console.log('Parent student relations - À implémenter');
      return [];
    },
    enabled: false, // Désactivé pour l'instant
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour créer une relation parent-élève
 * NOTE: Désactivé temporairement - table parent_student_relations pas encore dans les types Supabase
 */
export const useCreateParentStudentRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      parentId,
      studentId,
      relationType,
      isPrimaryContact,
    }: {
      parentId: string;
      studentId: string;
      relationType: 'pere' | 'mere' | 'tuteur' | 'autre';
      isPrimaryContact?: boolean;
    }) => {
      // TODO: Activer quand les types Supabase seront générés
      console.log('Create parent student relation - À implémenter', {
        parentId,
        studentId,
        relationType,
        isPrimaryContact,
      });
      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parent-student-relations', variables.parentId] });
      toast.success('Relation parent-élève créée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la relation', {
        description: error.message,
      });
    },
  });
};
