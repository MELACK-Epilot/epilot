/**
 * Hooks React Query pour la gestion des Écoles
 * Compatible avec la structure existante de la table schools
 * Pour Administrateur Groupe Scolaire
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  alertCreated,
  alertUpdated,
  alertDeleted,
  alertOperationFailed,
  alertLimitReached,
} from '@/lib/alerts';

// ============================================================================
// TYPES - Structure EXACTE de la table schools existante
// ============================================================================

export interface School {
  id: string;
  name: string;
  code: string;
  school_group_id: string;
  admin_id: string; // Directeur/Admin de l'école
  student_count: number;
  staff_count: number;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  
  // Niveaux d'enseignement (booléens - correspond à la BDD)
  has_preschool?: boolean;
  has_primary?: boolean;
  has_middle?: boolean;
  has_high?: boolean;
  
  // Nouvelles colonnes ajoutées pour le formulaire amélioré
  logo_url?: string | null;
  couleur_principale?: string | null;
  departement?: string | null;
  city?: string | null;
  commune?: string | null;
  code_postal?: string | null;
}

export interface SchoolWithDetails extends School {
  school_group_name?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_email?: string;
}

export interface SchoolFilters {
  search?: string;
  status?: string;
  school_group_id?: string;
}

export interface SchoolStats {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  suspendedSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  averageStudentsPerSchool: number;
  schoolsThisYear: number;
  privateSchools: number;
  publicSchools: number;
  
  // Stats par niveau
  schoolsWithPreschool: number;
  schoolsWithPrimary: number;
  schoolsWithMiddle: number;
  schoolsWithHigh: number;
  multiLevelSchools: number; // 2+ niveaux
  completeLevelSchools: number; // 4 niveaux
}

// ============================================================================
// HOOK: Liste des écoles avec filtres
// ============================================================================

export const useSchools = (filters?: SchoolFilters) => {
  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select(`
          *,
          school_groups!inner(name),
          users!schools_admin_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // Filtres
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.school_group_id) {
        query = query.eq('school_group_id', filters.school_group_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données pour ajouter les infos jointes
      const transformedData = data?.map((school: any) => ({
        ...school,
        school_group_name: school.school_groups?.name,
        admin_first_name: school.users?.first_name,
        admin_last_name: school.users?.last_name,
        admin_email: school.users?.email,
      })) as SchoolWithDetails[];

      return transformedData;
    },
  });
};

// ============================================================================
// HOOK: Statistiques des écoles
// ============================================================================

export const useSchoolStats = (school_group_id?: string) => {
  return useQuery({
    queryKey: ['school-stats', school_group_id],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('status, student_count, staff_count, nombre_eleves_actuels, nombre_enseignants, type_etablissement, annee_ouverture, created_at, has_preschool, has_primary, has_middle, has_high');

      if (school_group_id) {
        query = query.eq('school_group_id', school_group_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const currentYear = new Date().getFullYear();
      const totalStudents = data.reduce((sum: number, s: any) => sum + (s.nombre_eleves_actuels || s.student_count || 0), 0);
      const totalTeachers = data.reduce((sum: number, s: any) => sum + (s.nombre_enseignants || 0), 0);

      const stats: SchoolStats = {
        totalSchools: data.length,
        activeSchools: data.filter((s: any) => s.status === 'active').length,
        inactiveSchools: data.filter((s: any) => s.status === 'inactive').length,
        suspendedSchools: data.filter((s: any) => s.status === 'suspended').length,
        totalStudents,
        totalTeachers,
        totalStaff: data.reduce((sum: number, s: any) => sum + (s.staff_count || 0), 0),
        averageStudentsPerSchool: data.length > 0 ? Math.round(totalStudents / data.length) : 0,
        schoolsThisYear: data.filter((s: any) => s.annee_ouverture === currentYear || new Date(s.created_at).getFullYear() === currentYear).length,
        privateSchools: data.filter((s: any) => s.type_etablissement === 'prive').length,
        publicSchools: data.filter((s: any) => s.type_etablissement === 'public').length,
        
        // Stats par niveau
        schoolsWithPreschool: data.filter((s: any) => s.has_preschool).length,
        schoolsWithPrimary: data.filter((s: any) => s.has_primary).length,
        schoolsWithMiddle: data.filter((s: any) => s.has_middle).length,
        schoolsWithHigh: data.filter((s: any) => s.has_high).length,
        multiLevelSchools: data.filter((s: any) => {
          const count = [s.has_preschool, s.has_primary, s.has_middle, s.has_high]
            .filter(Boolean).length;
          return count >= 2;
        }).length,
        completeLevelSchools: data.filter((s: any) => 
          s.has_preschool && s.has_primary && s.has_middle && s.has_high
        ).length,
      };

      return stats;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes pour temps réel
    staleTime: 10000, // Considérer les données comme fraîches pendant 10 secondes
  });
};

// ============================================================================
// HOOK: Détails d'une école
// ============================================================================

export const useSchool = (id: string) => {
  return useQuery({
    queryKey: ['school', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select(`
          *,
          school_groups!inner(name),
          users!schools_admin_id_fkey(first_name, last_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transformer les données
      // @ts-ignore - Supabase types issue
      const transformedData = {
        ...data,
        school_group_name: (data as any).school_groups?.name,
        admin_first_name: (data as any).users?.first_name,
        admin_last_name: (data as any).users?.last_name,
        admin_email: (data as any).users?.email,
      } as SchoolWithDetails;

      return transformedData;
    },
    enabled: !!id,
  });
};

// ============================================================================
// HOOK: Créer une école
// ============================================================================

export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (school: Omit<School, 'id' | 'created_at' | 'updated_at'>) => {
      // ✅ VÉRIFIER LA LIMITE D'ÉCOLES (DYNAMIQUE depuis subscription_plans)
      const { data: limitCheck, error: limitError } = await supabase.rpc('check_plan_limit', {
        p_school_group_id: school.school_group_id,
        p_resource_type: 'schools',
      });

      if (limitError) throw limitError;

      const result = Array.isArray(limitCheck) ? limitCheck[0] : limitCheck;

      // ❌ BLOQUER SI LIMITE ATTEINTE
      if (!result.allowed) {
        throw new Error(result.message);
      }

      // ✅ Créer l'école
      const { data, error } = await supabase
        .from('schools')
        .insert(school as any)
        .select()
        .single();

      if (error) throw error;
      
      // ✅ INCRÉMENTER LE COMPTEUR (via fonction SQL)
      await supabase.rpc('increment_resource_count', {
        p_school_group_id: school.school_group_id,
        p_resource_type: 'schools',
        p_increment: 1,
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertCreated('École', data.name);
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      if (error.message.includes('Limite')) {
        // Alerte spécifique pour limite atteinte (déjà gérée par la fonction check_plan_limit)
        toast.error('Limite atteinte', {
          description: error.message,
        });
      } else {
        alertOperationFailed('créer', 'l\'école', error.message);
      }
    },
  });
};

// ============================================================================
// HOOK: Mettre à jour une école
// ============================================================================

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...school }: Partial<School> & { id: string }) => {
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('schools')
        .update(school as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('École', (data as any).name || 'École');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('modifier', 'l\'école', error.message);
    },
  });
};

// ============================================================================
// HOOK: Supprimer une école
// ============================================================================

export const useDeleteSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertDeleted('École', 'École');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('supprimer', 'l\'école', error.message);
    },
  });
};

// ============================================================================
// HOOK: Changer le statut d'une école
// ============================================================================

export const useUpdateSchoolStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: School['status'] }) => {
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('schools')
        .update({ status } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Statut', 'Statut modifié avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('modifier', 'le statut', error.message);
    },
  });
};

// ============================================================================
// HOOK: Assigner un directeur à une école
// ============================================================================

export const useAssignDirector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, adminId }: { schoolId: string; adminId: string }) => {
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('schools')
        .update({ admin_id: adminId } as any)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Directeur', 'Directeur assigné avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('assigner', 'le directeur', error.message);
    },
  });
};
