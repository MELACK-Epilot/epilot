/**
 * Hook pour gérer les Groupes Scolaires
 * Version optimisée React 19 avec meilleures pratiques
 * @module useSchoolGroups
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SchoolGroup } from '../types/dashboard.types';

const schoolGroupsTable = () => supabase.from('school_groups') as any;

/**
 * Clés de requête pour React Query
 */
export const schoolGroupKeys = {
  all: ['school-groups'] as const,
  lists: () => [...schoolGroupKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...schoolGroupKeys.lists(), filters] as const,
  details: () => [...schoolGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolGroupKeys.details(), id] as const,
  stats: () => [...schoolGroupKeys.all, 'stats'] as const,
};

/**
 * Interface pour les filtres de recherche
 */
export interface SchoolGroupFilters {
  query?: string;
  status?: 'active' | 'inactive' | 'suspended';
  plan?: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  region?: string;
  department?: string;
}

/**
 * Hook pour récupérer la liste des groupes scolaires avec temps réel
 */
export const useSchoolGroups = (filters?: SchoolGroupFilters) => {
  const queryClient = useQueryClient();

  // Log uniquement en développement et si nécessaire
  if (import.meta.env.DEV && filters) {
    console.log('🚀 useSchoolGroups: Filtres appliqués:', filters);
  }

  // Setup realtime subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('school_groups_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_groups',
        },
        (payload) => {
          // Invalider le cache pour forcer un refresh
          queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
          queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: schoolGroupKeys.list(filters || {}),
    queryFn: async () => {
      // Utiliser la vue school_groups_with_admin pour récupérer les groupes avec leurs admins
      let query = supabase
        .from('school_groups_with_admin')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtres
      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,code.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.plan) {
        query = query.eq('plan', filters.plan);
      }

      if (filters?.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur Supabase school_groups:', error);
        console.error('❌ Détails erreur:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        // Retourner un tableau vide au lieu de throw pour éviter de casser l'app
        console.warn('⚠️ Retour d\'un tableau vide pour éviter le crash');
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Aucune donnée retournée par Supabase');
        console.warn('⚠️ Vérifiez que la table school_groups contient des données');
        // Vérifier les politiques RLS si erreur persistante
      }

      // Transformer les données depuis la vue school_groups_with_admin
      const rawGroups = (data || []) as any[];

      return rawGroups.map((group) => ({
        id: group.id,
        name: group.name,
        code: group.code,
        region: group.region || 'Non défini',
        city: group.city || 'Non défini',
        address: group.address || undefined,
        phone: group.phone || undefined,
        website: group.website || undefined,
        foundedYear: group.founded_year || undefined,
        description: group.description || undefined,
        logo: group.logo || undefined,
        // Informations admin depuis la vue (peuvent être NULL)
        adminId: group.admin_id || undefined,
        adminName: group.admin_name || undefined,
        adminEmail: group.admin_email || undefined,
        adminPhone: group.admin_phone || undefined,
        adminAvatar: group.admin_avatar || undefined,
        adminStatus: group.admin_status || undefined,
        adminLastLogin: group.admin_last_login || undefined,
        schoolCount: group.school_count || 0,
        studentCount: group.student_count || 0,
        staffCount: group.staff_count || 0,
        plan: group.plan || 'gratuit',
        status: group.status,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      } as SchoolGroup));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer un groupe scolaire par ID
 */
export const useSchoolGroup = (id: string) => {
  return useQuery({
    queryKey: schoolGroupKeys.detail(id),
    queryFn: async () => {
      // Utiliser la vue pour récupérer le groupe avec son admin
      const { data, error } = await supabase
        .from('school_groups_with_admin')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const group = data as any;

      return {
        id: group.id,
        name: group.name,
        code: group.code,
        region: group.region || 'Non défini',
        city: group.city || 'Non défini',
        address: group.address || undefined,
        phone: group.phone || undefined,
        website: group.website || undefined,
        foundedYear: group.founded_year || undefined,
        description: group.description || undefined,
        logo: group.logo || undefined,
        // Informations admin depuis la vue
        adminId: group.admin_id || undefined,
        adminName: group.admin_name || undefined,
        adminEmail: group.admin_email || undefined,
        adminPhone: group.admin_phone || undefined,
        adminAvatar: group.admin_avatar || undefined,
        adminStatus: group.admin_status || undefined,
        adminLastLogin: group.admin_last_login || undefined,
        schoolCount: group.school_count || 0,
        studentCount: group.student_count || 0,
        staffCount: group.staff_count || 0,
        plan: group.plan || 'gratuit',
        status: group.status,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      } as SchoolGroup;
    },
    enabled: !!id,
  });
};

/**
 * Interface pour créer un groupe scolaire
 */
export interface CreateSchoolGroupInput {
  name: string;
  code: string;
  region: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  foundedYear?: number;
  description?: string;
  logo?: string;
  // Note: adminId supprimé - l'admin est assigné via users.school_group_id
  plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  schoolCount?: number;
  studentCount?: number;
  staffCount?: number;
}

/**
 * Hook pour créer un groupe scolaire
 */
export const useCreateSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSchoolGroupInput) => {
      // Récupérer l'utilisateur connecté pour l'admin_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // Valider et nettoyer le website
      let cleanWebsite = null;
      if (input.website && input.website.trim() !== '') {
        const website = input.website.trim();
        // Ajouter https:// si pas de protocole
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          cleanWebsite = `https://${website}`;
        } else {
          cleanWebsite = website;
        }
      }

      // Préparer les données d'insertion
      const insertData: any = {
        name: input.name,
        code: input.code,
        region: input.region,
        city: input.city,
        address: input.address || null,
        phone: input.phone || null,
        website: cleanWebsite,
        founded_year: input.foundedYear || null,
        description: input.description || null,
        logo: input.logo || null,
        plan: input.plan,
        // school_count, student_count, staff_count sont auto-calculés par triggers SQL
        status: 'active',
      };

      // Note : L'admin sera assigné séparément via users.school_group_id
      // Le Super Admin crée le groupe, puis assigne un Admin Groupe

      // ts-expect-error - Table school_groups non reconnue par TypeScript (base de données à configurer)
      const { data, error } = await schoolGroupsTable()
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Erreur création groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de la création du groupe scolaire');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Interface pour mettre à jour un groupe scolaire
 */
export interface UpdateSchoolGroupInput {
  id: string;
  name?: string;
  code?: string;
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  foundedYear?: number;
  description?: string;
  logo?: string;
  // Note: adminId supprimé - l'admin est assigné via users.school_group_id
  plan?: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  schoolCount?: number;
  studentCount?: number;
  staffCount?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Hook pour mettre à jour un groupe scolaire
 */
export const useUpdateSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSchoolGroupInput) => {
      const { id, ...updates } = input;

      // Construire l'objet de mise à jour uniquement avec les champs fournis
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.region !== undefined) updateData.region = updates.region;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      
      // Valider et nettoyer le website
      if (updates.website !== undefined) {
        if (updates.website && updates.website.trim() !== '') {
          const website = updates.website.trim();
          // Ajouter https:// si pas de protocole
          if (!website.startsWith('http://') && !website.startsWith('https://')) {
            updateData.website = `https://${website}`;
          } else {
            updateData.website = website;
          }
        } else {
          updateData.website = null;
        }
      }
      if (updates.foundedYear !== undefined) updateData.founded_year = updates.foundedYear;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.logo !== undefined) updateData.logo = updates.logo;
      // Note: admin_id supprimé - utiliser useAssignAdminToGroup pour assigner un admin
      if (updates.plan !== undefined) updateData.plan = updates.plan;
      if (updates.schoolCount !== undefined) updateData.school_count = updates.schoolCount;
      if (updates.studentCount !== undefined) updateData.student_count = updates.studentCount;
      if (updates.staffCount !== undefined) updateData.staff_count = updates.staffCount;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await schoolGroupsTable()
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de la mise à jour du groupe scolaire');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer un groupe scolaire (suppression définitive)
 */
export const useDeleteSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Suppression définitive
      const { data, error } = await schoolGroupsTable()
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur suppression groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de la suppression du groupe scolaire');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Hook pour activer un groupe scolaire
 */
export const useActivateSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await schoolGroupsTable()
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur activation groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de l\'activation du groupe scolaire');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Hook pour désactiver un groupe scolaire
 */
export const useDeactivateSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await schoolGroupsTable()
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur désactivation groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de la désactivation du groupe scolaire');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Hook pour suspendre un groupe scolaire
 */
export const useSuspendSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await schoolGroupsTable()
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur suspension groupe scolaire:', error);
        throw new Error(error.message || 'Erreur lors de la suspension du groupe scolaire');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });
    },
  });
};

/**
 * Hook pour obtenir les statistiques des groupes scolaires
 */
export const useSchoolGroupStats = () => {
  return useQuery({
    queryKey: schoolGroupKeys.stats(),
    queryFn: async () => {
      // Total groupes
      const { count: total, error: totalError } = await supabase
        .from('school_groups')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Groupes actifs
      const { count: active, error: activeError } = await supabase
        .from('school_groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Groupes inactifs
      const { count: inactive, error: inactiveError } = await supabase
        .from('school_groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');

      if (inactiveError) throw inactiveError;

      // Groupes suspendus
      const { count: suspended, error: suspendedError } = await supabase
        .from('school_groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'suspended');

      if (suspendedError) throw suspendedError;

      // Total écoles
      const { data: schoolsData, error: schoolsError } = await schoolGroupsTable()
        .select('school_count');

      if (schoolsError) throw schoolsError;

      const totalSchools = (schoolsData as any[])?.reduce((sum: number, group: any) => sum + (group.school_count || 0), 0) || 0;

      // Total élèves
      const { data: studentsData, error: studentsError } = await schoolGroupsTable()
        .select('student_count');

      if (studentsError) throw studentsError;

      const totalStudents = (studentsData as any[])?.reduce((sum: number, group: any) => sum + (group.student_count || 0), 0) || 0;

      return {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        suspended: suspended || 0,
        totalSchools,
        totalStudents,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
