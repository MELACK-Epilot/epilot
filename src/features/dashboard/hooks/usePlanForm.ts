/**
 * Hook personnalisé pour la gestion du formulaire de plan
 * Gère l'état, la validation et la soumission
 * @module usePlanForm
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useCreatePlan, useUpdatePlan, type CreatePlanInput, type UpdatePlanInput } from './usePlans';
import { usePlanModules, usePlanCategories, useAssignModulesToPlan, useAssignCategoriesToPlan, useAvailableModulesByPlan } from './usePlanModules';
import { planFormSchema, type PlanFormValues } from '../components/plans/PlanForm.types';
import { generateSlug, featuresToString, stringToFeatures } from '../utils/planForm.utils';
import type { Plan, SubscriptionPlan } from '../types/dashboard.types';

export const usePlanForm = (
  plan: Plan | null | undefined,
  mode: 'create' | 'edit',
  onSuccess: () => void
) => {
  const { toast } = useToast();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  // États
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlanType, setCurrentPlanType] = useState<SubscriptionPlan>('gratuit');

  // Hooks pour récupérer les modules/catégories existants (mode edit)
  const { data: existingModules } = usePlanModules(plan?.id);
  const { data: existingCategories } = usePlanCategories(plan?.id);

  // Hooks pour assigner
  const assignModules = useAssignModulesToPlan();
  const assignCategories = useAssignCategoriesToPlan();

  // Hook pour récupérer tous les modules disponibles
  const { data: allAvailableModules } = useAvailableModulesByPlan(currentPlanType);

  // Formulaire
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      planType: 'gratuit',
      description: '',
      price: 0,
      currency: 'FCFA',
      billingPeriod: 'monthly',
      maxSchools: 1,
      maxStudents: 100,
      maxStaff: 10,
      maxStorage: 5,
      supportLevel: 'email',
      customBranding: false,
      apiAccess: false,
      isPopular: false,
      discount: undefined,
      trialDays: undefined,
      features: '',
    },
  });

  // Calculer les modules valides (ceux dont la catégorie est sélectionnée)
  const validSelectedModules = selectedModuleIds.filter(moduleId => {
    const module = allAvailableModules?.find(m => m.id === moduleId);
    return module && selectedCategoryIds.includes(module.category_id);
  });

  // Synchroniser currentPlanType avec le formulaire
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'planType' && value.planType) {
        setCurrentPlanType(value.planType as SubscriptionPlan);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Nettoyer automatiquement les modules dont la catégorie a été désélectionnée
  useEffect(() => {
    if (allAvailableModules && selectedModuleIds.length > 0) {
      const validModuleIds = selectedModuleIds.filter(moduleId => {
        const module = allAvailableModules.find(m => m.id === moduleId);
        return module && selectedCategoryIds.includes(module.category_id);
      });
      
      if (validModuleIds.length !== selectedModuleIds.length) {
        setSelectedModuleIds(validModuleIds);
      }
    }
  }, [selectedCategoryIds, allAvailableModules]);

  // Charger les données du plan en mode édition
  useEffect(() => {
    if (mode === 'edit' && plan) {
      const planType = (plan as any).planType || 'gratuit';
      
      form.reset({
        name: plan.name,
        slug: plan.slug,
        planType: planType,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        maxSchools: plan.maxSchools,
        maxStudents: plan.maxStudents,
        maxStaff: plan.maxStaff || -1,
        maxStorage: plan.maxStorage || 10,
        supportLevel: plan.supportLevel || 'email',
        customBranding: plan.customBranding || false,
        apiAccess: plan.apiAccess || false,
        isPopular: plan.isPopular,
        discount: plan.discount,
        trialDays: plan.trialDays,
        features: featuresToString((plan as any).features),
      });

      setCurrentPlanType(planType);

      if (existingCategories) {
        setSelectedCategoryIds(existingCategories.map(c => c.id));
      }
      if (existingModules) {
        setSelectedModuleIds(existingModules.map(m => m.id));
      }
    } else {
      form.reset();
      setCurrentPlanType('gratuit');
      setSelectedCategoryIds([]);
      setSelectedModuleIds([]);
    }
  }, [mode, plan, form, existingCategories, existingModules]);

  // Soumission du formulaire
  const onSubmit = async (values: PlanFormValues) => {
    try {
      const featuresArray = stringToFeatures(values.features);

      // Validation : Au moins 1 catégorie et 1 module
      if (selectedCategoryIds.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Sélectionnez au moins une catégorie',
          variant: 'destructive',
        });
        return;
      }

      if (selectedModuleIds.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Sélectionnez au moins un module',
          variant: 'destructive',
        });
        return;
      }

      let planId: string;

      if (mode === 'create') {
        const input: CreatePlanInput = {
          name: values.name,
          slug: values.slug,
          planType: values.planType,
          description: values.description,
          price: values.price,
          currency: values.currency,
          billingPeriod: values.billingPeriod,
          features: featuresArray,
          maxSchools: values.maxSchools,
          maxStudents: values.maxStudents,
          maxStaff: values.maxStaff,
          maxStorage: values.maxStorage,
          supportLevel: values.supportLevel,
          customBranding: values.customBranding,
          apiAccess: values.apiAccess,
          isPopular: values.isPopular,
          discount: values.discount,
          trialDays: values.trialDays,
        };

        const result = await createPlan.mutateAsync(input);
        
        if (!result || !result.id) {
          toast({
            title: 'Erreur',
            description: 'Le plan n\'a pas pu être créé.',
            variant: 'destructive',
          });
          return;
        }
        
        planId = result.id;
      } else if (plan) {
        const input: UpdatePlanInput = {
          id: plan.id,
          name: values.name,
          description: values.description,
          price: values.price,
          currency: values.currency,
          billingPeriod: values.billingPeriod,
          features: featuresArray,
          maxSchools: values.maxSchools,
          maxStudents: values.maxStudents,
          maxStaff: values.maxStaff,
          maxStorage: values.maxStorage,
          supportLevel: values.supportLevel,
          customBranding: values.customBranding,
          apiAccess: values.apiAccess,
          isPopular: values.isPopular,
          discount: values.discount,
          trialDays: values.trialDays,
        };

        await updatePlan.mutateAsync(input);
        planId = plan.id;
      } else {
        return;
      }

      // Assigner les catégories et modules
      await Promise.all([
        assignCategories.mutateAsync({ planId, categoryIds: selectedCategoryIds }),
        assignModules.mutateAsync({ planId, moduleIds: selectedModuleIds }),
      ]);

      toast({
        title: mode === 'create' ? 'Plan créé' : 'Plan modifié',
        description: `Le plan "${values.name}" a été ${mode === 'create' ? 'créé' : 'modifié'} avec ${selectedCategoryIds.length} catégories et ${selectedModuleIds.length} modules.`,
      });

      onSuccess();
      form.reset();
      setSelectedCategoryIds([]);
      setSelectedModuleIds([]);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createPlan.isPending || updatePlan.isPending;

  return {
    form,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedModuleIds,
    setSelectedModuleIds,
    validSelectedModules,
    currentPlanType,
    isLoading,
    onSubmit,
    generateSlug,
  };
};
