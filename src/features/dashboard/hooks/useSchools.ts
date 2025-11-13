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
  totalStaff: number;
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
        query = query.eq('status', filters.status as any);
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
        .select('status, student_count, staff_count');

      if (school_group_id) {
        query = query.eq('school_group_id', school_group_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: SchoolStats = {
        totalSchools: data.length,
        activeSchools: data.filter(s => s.status === 'active').length,
        inactiveSchools: data.filter(s => s.status === 'inactive').length,
        suspendedSchools: data.filter(s => s.status === 'suspended').length,
        totalStudents: data.reduce((sum, s) => sum + (s.student_count || 0), 0),
        totalStaff: data.reduce((sum, s) => sum + (s.staff_count || 0), 0),
      };

      return stats;
    },
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

      // Transformer les données avec typage explicite
      const transformedData: SchoolWithDetails = {
        ...(data as any),
        school_group_name: (data as any).school_groups?.name,
        admin_first_name: (data as any).users?.first_name,
        admin_last_name: (data as any).users?.last_name,
        admin_email: (data as any).users?.email,
      };

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
      const { data, error } = await supabase
        .from('schools')
        .insert(school)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertCreated('École', (data as any).name || 'École');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('créer', 'l\'\u00e9cole', error.message);
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
      const { data, error } = await supabase
        .from('schools')
        .update(school)
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
      alertOperationFailed('modifier', 'l\'\u00e9cole', error.message);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      // ✅ Alerte moderne de succès
      alertDeleted('École', 'École');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('supprimer', 'l\'\u00e9cole', error.message);
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
      const { data, error } = await supabase
        .from('schools')
        .update({ status })
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
