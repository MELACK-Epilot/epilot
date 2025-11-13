/**
 * Hook pour gérer les quotas des groupes scolaires
 * Vérifie les limites avant création de ressources
 * @module useQuotas
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GroupQuotas } from '../types/dashboard.types';

export const quotaKeys = {
  all: ['quotas'] as const,
  group: (schoolGroupId: string) => [...quotaKeys.all, schoolGroupId] as const,
};

/**
 * Hook pour récupérer les quotas d'un groupe scolaire
 */
export const useGroupQuotas = (schoolGroupId: string) => {
  return useQuery({
    queryKey: quotaKeys.group(schoolGroupId),
    queryFn: async () => {
      // @ts-expect-error - Vue school_groups_with_quotas sera créée par le script SQL
      const { data, error } = await supabase
        .from('school_groups_with_quotas')
        .select('*')
        .eq('school_group_id', schoolGroupId)
        .single();

      if (error) throw error;

      return {
        schoolGroupId: data.school_group_id,
        planId: data.plan_id,
        maxSchools: data.max_schools,
        maxStudents: data.max_students,
        maxPersonnel: data.max_personnel,
        storageLimit: data.storage_limit,
        currentSchools: data.current_schools,
        currentStudents: data.current_students,
        currentPersonnel: data.current_personnel,
        currentStorage: data.current_storage,
        schoolsUsagePercent: data.schools_usage_percent,
        studentsUsagePercent: data.students_usage_percent,
        personnelUsagePercent: data.personnel_usage_percent,
        storageUsagePercent: data.storage_usage_percent,
        isSchoolsLimitReached: data.is_schools_limit_reached,
        isStudentsLimitReached: data.is_students_limit_reached,
        isPersonnelLimitReached: data.is_personnel_limit_reached,
        isStorageLimitReached: data.is_storage_limit_reached,
      } as GroupQuotas;
    },
    enabled: !!schoolGroupId,
    staleTime: 1 * 60 * 1000, // 1 minute (quotas changent fréquemment)
  });
};

/**
 * Interface pour le résultat de vérification de quota
 */
export interface QuotaCheckResult {
  allowed: boolean;
  message: string;
  current: number;
  max: number;
  planName: string;
}

/**
 * Hook pour vérifier un quota avant création
 */
export const useCheckQuota = () => {
  return useMutation({
    mutationFn: async ({
      schoolGroupId,
      resourceType,
      increment = 1,
    }: {
      schoolGroupId: string;
      resourceType: 'school' | 'student' | 'personnel';
      increment?: number;
    }) => {
      const { data, error } = await supabase.rpc('check_quota_before_creation', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
        p_increment: increment,
      });

      if (error) throw error;

      return data as QuotaCheckResult;
    },
  });
};

/**
 * Hook helper pour vérifier si une action est autorisée
 */
export const useCanCreateResource = (
  schoolGroupId: string,
  resourceType: 'school' | 'student' | 'personnel'
) => {
  const { data: quotas, isLoading } = useGroupQuotas(schoolGroupId);

  if (isLoading || !quotas) {
    return { canCreate: false, reason: 'Chargement des quotas...' };
  }

  let canCreate = true;
  let reason = '';

  switch (resourceType) {
    case 'school':
      canCreate = !quotas.isSchoolsLimitReached;
      if (!canCreate) {
        reason = `Limite atteinte : ${quotas.currentSchools}/${quotas.maxSchools} écoles`;
      }
      break;
    case 'student':
      canCreate = !quotas.isStudentsLimitReached;
      if (!canCreate) {
        reason = `Limite atteinte : ${quotas.currentStudents}/${quotas.maxStudents} élèves`;
      }
      break;
    case 'personnel':
      canCreate = !quotas.isPersonnelLimitReached;
      if (!canCreate) {
        reason = `Limite atteinte : ${quotas.currentPersonnel}/${quotas.maxPersonnel} personnel`;
      }
      break;
  }

  return { canCreate, reason, quotas };
};

/**
 * Fonction helper pour formater un message d'erreur de quota
 */
export const formatQuotaError = (
  resourceType: 'school' | 'student' | 'personnel',
  current: number,
  max: number,
  planName: string
): string => {
  const resourceNames = {
    school: 'écoles',
    student: 'élèves',
    personnel: 'personnel',
  };

  return `Limite atteinte : Vous avez atteint la limite de votre plan ${planName} (${current}/${max} ${resourceNames[resourceType]}). Veuillez passer à un plan supérieur.`;
};
