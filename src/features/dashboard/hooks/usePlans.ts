/**
 * Hook pour gérer les plans d'abonnement
 * Version complète avec CRUD et statistiques
 * @module usePlans
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Plan, SubscriptionPlan } from '../types/dashboard.types';

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...planKeys.lists(), filters] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
  stats: () => [...planKeys.all, 'stats'] as const,
};

/**
 * Interface pour créer un plan
 */
export interface CreatePlanInput {
  name: string;
  slug: string; // Maintenant un string libre au lieu de SubscriptionPlan
  planType?: SubscriptionPlan; // Nouveau champ pour la catégorisation
  description: string;
  price: number;
  currency?: 'FCFA' | 'EUR' | 'USD';
  billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'yearly'; // Renommé et étendu
  features: string[];
  maxSchools: number;
  maxStudents: number;
  maxStaff: number; // Renommé de maxPersonnel
  maxStorage: number; // Maintenant un number (GB)
  supportLevel: 'email' | 'priority' | '24/7';
  customBranding?: boolean;
  apiAccess?: boolean;
  isPopular?: boolean;
  discount?: number;
  trialDays?: number;
}

/**
 * Interface pour mettre à jour un plan
 */
export interface UpdatePlanInput {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: 'FCFA' | 'EUR' | 'USD';
  billingPeriod?: 'monthly' | 'quarterly' | 'biannual' | 'yearly'; // Aligné avec CreatePlanInput
  features?: string[];
  maxSchools?: number;
  maxStudents?: number;
  maxStaff?: number; // Aligné avec CreatePlanInput
  maxStorage?: number; // Aligné avec CreatePlanInput (number au lieu de string)
  supportLevel?: 'email' | 'priority' | '24/7';
  customBranding?: boolean;
  apiAccess?: boolean;
  isActive?: boolean;
  isPopular?: boolean;
  discount?: number;
  trialDays?: number;
}

/**
 * Hook pour récupérer la liste des plans
 */
export const usePlans = (filters?: { query?: string; status?: string }) => {
  return useQuery({
    queryKey: planKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,slug.ilike.%${filters.query}%`);
      }

      if (filters?.status) {
        if (filters.status === 'active') {
          query = query.eq('is_active', true);
        } else if (filters.status === 'archived') {
          query = query.eq('is_active', false);
        }
        // Si 'all', on ne filtre pas
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        planType: plan.plan_type,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency || 'FCFA',
        billingPeriod: plan.billing_period,
        features: plan.features || [],
        maxSchools: plan.max_schools,
        maxStudents: plan.max_students,
        maxStaff: plan.max_staff,
        maxStorage: plan.max_storage,
        supportLevel: plan.support_level || 'email',
        customBranding: plan.custom_branding || false,
        apiAccess: plan.api_access || false,
        isActive: plan.is_active,
        isPopular: plan.is_popular || false,
        discount: plan.discount,
        trialDays: plan.trial_days,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
      })) as Plan[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer un plan par ID
 */
export const usePlan = (id: string) => {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        price: data.price,
        currency: data.currency || 'FCFA',
        billingCycle: data.billing_cycle,
        duration: data.duration || 1,
        features: data.features || [],
        maxSchools: data.max_schools,
        maxStudents: data.max_students,
        maxPersonnel: data.max_personnel,
        storageLimit: data.storage_limit || '5GB',
        categoryIds: data.category_ids || [],
        moduleIds: data.module_ids || [],
        supportLevel: data.support_level || 'email',
        customBranding: data.custom_branding || false,
        apiAccess: data.api_access || false,
        isActive: data.is_active,
        isPopular: data.is_popular || false,
        discount: data.discount,
        trialDays: data.trial_days,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Plan;
    },
    enabled: !!id,
  });
};

/**
 * Hook pour créer un plan
 */
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      const { data, error} = await supabase
        .from('subscription_plans')
        .insert({
          name: input.name,
          slug: input.slug,
          plan_type: input.planType,
          description: input.description,
          price: input.price,
          currency: input.currency || 'FCFA',
          billing_period: input.billingPeriod,
          features: input.features,
          max_schools: input.maxSchools,
          max_students: input.maxStudents,
          max_staff: input.maxStaff,
          max_storage: input.maxStorage,
          support_level: input.supportLevel,
          custom_branding: input.customBranding || false,
          api_access: input.apiAccess || false,
          is_popular: input.isPopular || false,
          discount: input.discount,
          trial_days: input.trialDays,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
      // Invalider aussi les queries avec contenu (modules/catégories)
      queryClient.invalidateQueries({ queryKey: ['plan-with-content'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
    },
  });
};

/**
 * Hook pour mettre à jour un plan
 */
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePlanInput) => {
      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.billingPeriod !== undefined) updateData.billing_period = updates.billingPeriod;
      if (updates.features !== undefined) updateData.features = updates.features;
      if (updates.maxSchools !== undefined) updateData.max_schools = updates.maxSchools;
      if (updates.maxStudents !== undefined) updateData.max_students = updates.maxStudents;
      if (updates.maxStaff !== undefined) updateData.max_staff = updates.maxStaff;
      if (updates.maxStorage !== undefined) updateData.max_storage = updates.maxStorage;
      if (updates.supportLevel !== undefined) updateData.support_level = updates.supportLevel;
      if (updates.customBranding !== undefined) updateData.custom_branding = updates.customBranding;
      if (updates.apiAccess !== undefined) updateData.api_access = updates.apiAccess;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isPopular !== undefined) updateData.is_popular = updates.isPopular;
      if (updates.discount !== undefined) updateData.discount = updates.discount;
      if (updates.trialDays !== undefined) updateData.trial_days = updates.trialDays;

      const { data, error} = await supabase
        .from('subscription_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ['plan-with-content'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
    },
  });
};

/**
 * Hook pour supprimer un plan (archivage)
 */
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
      // Invalider aussi les queries avec contenu (modules/catégories)
      queryClient.invalidateQueries({ queryKey: ['plan-with-content'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
    },
  });
};

/**
 * Hook pour restaurer un plan archivé
 */
export const useRestorePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer définitivement un plan
 */
export const usePermanentDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
};

/**
 * Hook pour récupérer les statistiques des plans
 */
export const usePlanStats = () => {
  return useQuery({
    queryKey: planKeys.stats(),
    queryFn: async () => {
      // Utiliser la vue SQL plan_stats
      const { data, error } = await supabase
        .from('plan_stats')
        .select('*');

      if (error) {
        console.warn('Vue plan_stats non disponible, calcul manuel');
        // Fallback si la vue n'existe pas encore
        const { count: total } = await supabase
          .from('plans')
          .select('*', { count: 'exact', head: true });

        return {
          total: total || 0,
          active: 0,
          subscriptions: 0,
          planBreakdown: [],
        };
      }

      return {
        total: data?.length || 0,
        active: data?.filter((p: any) => p.subscription_count > 0).length || 0,
        subscriptions: data?.reduce((acc: number, p: any) => acc + (p.subscription_count || 0), 0) || 0,
        planBreakdown: data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
