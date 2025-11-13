/**
 * Hook optimisé pour récupérer un plan avec ses modules et catégories
 * Performance améliorée avec une seule requête
 * @module usePlanWithContent
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanWithContent {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  isPopular: boolean;
  isActive: boolean;
  discount?: number;
  trialDays?: number;
  maxSchools: number;
  maxStudents: number;
  maxStaff: number;
  maxStorage: number;
  supportLevel: string;
  customBranding: boolean;
  apiAccess: boolean;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    description?: string;
  }>;
  modules: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    description?: string;
    is_core: boolean;
    is_premium: boolean;
    category_id?: string;
  }>;
}

export const usePlanWithContent = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-with-content', planId],
    queryFn: async (): Promise<PlanWithContent | null> => {
      if (!planId) return null;

      // Récupérer le plan avec ses modules et catégories en une seule requête
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          currency,
          billing_period,
          is_popular,
          discount,
          trial_days,
          max_schools,
          max_students,
          max_staff,
          max_storage,
          support_level,
          custom_branding,
          api_access
        `)
        .eq('id', planId)
        .single();

      if (planError || !planData) {
        console.error('Erreur récupération plan:', planError);
        return null;
      }

      // Récupérer les catégories du plan
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('plan_categories')
        .select(`
          business_categories!inner(
            id,
            name,
            slug,
            icon,
            color,
            description
          )
        `)
        .eq('plan_id', planId);

      // Récupérer les modules du plan
      const { data: modulesData, error: modulesError } = await supabase
        .from('plan_modules')
        .select(`
          modules!inner(
            id,
            name,
            slug,
            icon,
            color,
            description,
            is_core,
            is_premium,
            category_id
          )
        `)
        .eq('plan_id', planId);

      if (categoriesError) {
        console.error('Erreur récupération catégories:', categoriesError);
      }

      if (modulesError) {
        console.error('Erreur récupération modules:', modulesError);
      }

      // Transformer les données
      const categories = (categoriesData || [])
        .map((item: any) => item.business_categories)
        .filter(Boolean);

      const modules = (modulesData || [])
        .map((item: any) => item.modules)
        .filter(Boolean);

      return {
        id: planData.id,
        name: planData.name,
        slug: planData.slug,
        description: planData.description || '',
        price: planData.price || 0,
        currency: planData.currency || 'FCFA',
        billingPeriod: planData.billing_period || 'monthly',
        isPopular: planData.is_popular || false,
        isActive: planData.is_active !== false,
        discount: planData.discount,
        trialDays: planData.trial_days,
        maxSchools: planData.max_schools || 0,
        maxStudents: planData.max_students || 0,
        maxStaff: planData.max_staff || 0,
        maxStorage: planData.max_storage || 0,
        supportLevel: planData.support_level || 'email',
        customBranding: planData.custom_branding || false,
        apiAccess: planData.api_access || false,
        categories,
        modules,
      };
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer tous les plans avec leur contenu
 */
export const useAllPlansWithContent = (searchQuery?: string, showArchived?: boolean) => {
  return useQuery({
    queryKey: ['all-plans-with-content', searchQuery, showArchived],
    queryFn: async (): Promise<PlanWithContent[]> => {
      // Récupérer tous les plans
      let plansQuery = supabase
        .from('subscription_plans')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          currency,
          billing_period,
          is_popular,
          discount,
          trial_days,
          max_schools,
          max_students,
          max_staff,
          max_storage,
          support_level,
          custom_branding,
          api_access,
          is_active
        `)
        .order('price', { ascending: true });

      // Filtrer par statut
      if (showArchived) {
        // Afficher uniquement les plans archivés
        plansQuery = plansQuery.eq('is_active', false);
      } else {
        // Afficher uniquement les plans actifs
        plansQuery = plansQuery.eq('is_active', true);
      }

      if (searchQuery) {
        plansQuery = plansQuery.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
      }

      const { data: plans, error: plansError } = await plansQuery;

      if (plansError || !plans) {
        console.error('Erreur récupération plans:', plansError);
        return [];
      }

      // Récupérer toutes les catégories et modules en parallèle
      const planIds = plans.map(p => p.id);

      // Récupérer catégories et modules avec gestion d'erreur améliorée
      const [categoriesResult, modulesResult] = await Promise.all([
        supabase
          .from('plan_categories')
          .select(`
            plan_id,
            business_categories!inner(
              id,
              name,
              slug,
              icon,
              color,
              description
            )
          `)
          .in('plan_id', planIds)
          .then(result => {
            if (result.error) {
              console.warn('⚠️ Erreur récupération catégories plans:', result.error.message);
              console.warn('Détails:', result.error);
            }
            return result;
          }),
        
        supabase
          .from('plan_modules')
          .select(`
            plan_id,
            modules!inner(
              id,
              name,
              slug,
              icon,
              color,
              description,
              is_core,
              is_premium,
              category_id
            )
          `)
          .in('plan_id', planIds)
          .then(result => {
            if (result.error) {
              console.warn('⚠️ Erreur récupération modules plans:', result.error.message);
              console.warn('Détails:', result.error);
            }
            return result;
          })
      ]);

      // Grouper par plan
      const categoriesByPlan = new Map<string, any[]>();
      const modulesByPlan = new Map<string, any[]>();

      (categoriesResult.data || []).forEach((item: any) => {
        if (!categoriesByPlan.has(item.plan_id)) {
          categoriesByPlan.set(item.plan_id, []);
        }
        categoriesByPlan.get(item.plan_id)!.push(item.business_categories);
      });

      (modulesResult.data || []).forEach((item: any) => {
        if (!modulesByPlan.has(item.plan_id)) {
          modulesByPlan.set(item.plan_id, []);
        }
        modulesByPlan.get(item.plan_id)!.push(item.modules);
      });

      // Construire le résultat final
      const result = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price: plan.price || 0,
        currency: plan.currency || 'FCFA',
        billingPeriod: plan.billing_period || 'monthly',
        isPopular: plan.is_popular || false,
        isActive: plan.is_active !== false,
        discount: plan.discount,
        trialDays: plan.trial_days,
        maxSchools: plan.max_schools || 0,
        maxStudents: plan.max_students || 0,
        maxStaff: plan.max_staff || 0,
        maxStorage: plan.max_storage || 0,
        supportLevel: plan.support_level || 'email',
        customBranding: plan.custom_branding || false,
        apiAccess: plan.api_access || false,
        categories: categoriesByPlan.get(plan.id) || [],
        modules: modulesByPlan.get(plan.id) || [],
      }));

      // Log de debug pour vérifier les données
      console.log('📊 Plans avec contenu récupérés:', {
        totalPlans: result.length,
        plansAvecCategories: result.filter(p => p.categories.length > 0).length,
        plansAvecModules: result.filter(p => p.modules.length > 0).length,
        details: result.map(p => ({
          nom: p.name,
          categories: p.categories.length,
          modules: p.modules.length
        }))
      });

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
