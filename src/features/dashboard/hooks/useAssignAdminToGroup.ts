/**
 * Hook pour assigner un administrateur à un groupe scolaire
 * Architecture Option B : users.school_group_id → school_groups.id
 * @module useAssignAdminToGroup
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { schoolGroupKeys } from './useSchoolGroups';
import { userKeys } from './useUsers';

interface AssignAdminInput {
  userId: string;
  schoolGroupId: string;
}

/**
 * Hook pour assigner un admin_groupe à un groupe scolaire
 * Met à jour users.school_group_id et users.role
 */
export const useAssignAdminToGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, schoolGroupId }: AssignAdminInput) => {
      // Vérifier que l'utilisateur existe et n'est pas déjà assigné
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, role, school_group_id, email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Utilisateur introuvable : ${userError.message}`);
      }

      // Vérifier que le groupe existe
      const { data: group, error: groupError } = await supabase
        .from('school_groups')
        .select('id, name, code')
        .eq('id', schoolGroupId)
        .single();

      if (groupError) {
        throw new Error(`Groupe scolaire introuvable : ${groupError.message}`);
      }

      // Vérifier qu'il n'y a pas déjà un admin assigné à ce groupe
      const { data: existingAdmin, error: existingError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('school_group_id', schoolGroupId)
        .eq('role', 'admin_groupe')
        .maybeSingle();

      if (existingError) {
        throw new Error(`Erreur lors de la vérification : ${existingError.message}`);
      }

      if (existingAdmin && existingAdmin.id !== userId) {
        throw new Error(
          `Le groupe "${group.name}" a déjà un administrateur assigné : ${existingAdmin.first_name} ${existingAdmin.last_name} (${existingAdmin.email})`
        );
      }

      // Assigner l'utilisateur au groupe
      const { data, error } = await supabase
        .from('users')
        .update({
          school_group_id: schoolGroupId,
          role: 'admin_groupe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de l'assignation : ${error.message}`);
      }

      console.log(
        `✅ ${user.first_name} ${user.last_name} assigné comme admin du groupe "${group.name}"`
      );

      return {
        user: data,
        group,
        message: `${user.first_name} ${user.last_name} est maintenant administrateur du groupe "${group.name}"`,
      };
    },
    onSuccess: (data) => {
      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.detail(data.group.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.user.id) });
    },
  });
};

/**
 * Hook pour retirer un administrateur d'un groupe scolaire
 * Met school_group_id à NULL (l'utilisateur reste dans la base)
 */
export const useUnassignAdminFromGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Récupérer les infos avant de retirer
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, school_group_id, school_groups:school_group_id(name)')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Utilisateur introuvable : ${userError.message}`);
      }

      if (!user.school_group_id) {
        throw new Error('Cet utilisateur n\'est pas assigné à un groupe');
      }

      const groupName = (user.school_groups as any)?.name || 'Groupe inconnu';

      // Retirer l'assignation
      const { data, error } = await supabase
        .from('users')
        .update({
          school_group_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors du retrait : ${error.message}`);
      }

      console.log(
        `✅ ${user.first_name} ${user.last_name} retiré du groupe "${groupName}"`
      );

      return {
        user: data,
        previousGroupId: user.school_group_id,
        message: `${user.first_name} ${user.last_name} n'est plus administrateur du groupe "${groupName}"`,
      };
    },
    onSuccess: (data) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      if (data.previousGroupId) {
        queryClient.invalidateQueries({ queryKey: schoolGroupKeys.detail(data.previousGroupId) });
      }
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.user.id) });
    },
  });
};

/**
 * Hook pour vérifier si un utilisateur peut être assigné comme admin
 */
export const useCanAssignAsAdmin = () => {
  return useMutation({
    mutationFn: async ({ userId, schoolGroupId }: AssignAdminInput) => {
      // Vérifier l'utilisateur
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, role, school_group_id')
        .eq('id', userId)
        .single();

      if (userError) {
        return {
          canAssign: false,
          reason: 'Utilisateur introuvable',
        };
      }

      // Un super_admin ne peut pas être assigné à un groupe
      if (user.role === 'super_admin') {
        return {
          canAssign: false,
          reason: 'Un Super Admin ne peut pas être assigné à un groupe',
        };
      }

      // Vérifier si déjà assigné à un autre groupe
      if (user.school_group_id && user.school_group_id !== schoolGroupId) {
        return {
          canAssign: false,
          reason: 'Cet utilisateur est déjà assigné à un autre groupe',
        };
      }

      // Vérifier si le groupe a déjà un admin
      const { data: existingAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('school_group_id', schoolGroupId)
        .eq('role', 'admin_groupe')
        .maybeSingle();

      if (existingAdmin && existingAdmin.id !== userId) {
        return {
          canAssign: false,
          reason: 'Ce groupe a déjà un administrateur assigné',
        };
      }

      return {
        canAssign: true,
        reason: null,
      };
    },
  });
};
