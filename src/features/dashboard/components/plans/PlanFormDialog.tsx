/**
 * Dialog de création/modification d'un plan d'abonnement
 * Formulaire complet avec validation Zod
 * @module PlanFormDialog
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Package, DollarSign, Users, Building2, HardDrive, Headphones, Palette, Zap, Crown, Gift, Layers, Info, Settings, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCreatePlan, useUpdatePlan, type CreatePlanInput, type UpdatePlanInput } from '../../hooks/usePlans';
import type { Plan, SubscriptionPlan } from '../../types/dashboard.types';
import { useToast } from '@/hooks/use-toast';
import { CategorySelector } from './CategorySelector';
import { ModuleSelector } from './ModuleSelector';
import { usePlanModules, usePlanCategories, useAssignModulesToPlan, useAssignCategoriesToPlan, useAvailableModulesByPlan } from '../../hooks/usePlanModules';

// Schéma de validation Zod
const planFormSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères').regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  planType: z.enum(['gratuit', 'premium', 'pro', 'institutionnel'] as const, {
    errorMap: () => ({ message: 'Sélectionnez un type de plan valide' }),
  }),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  currency: z.enum(['FCFA', 'EUR', 'USD']).default('FCFA'),
  billingPeriod: z.enum(['monthly', 'quarterly', 'biannual', 'yearly']),
  maxSchools: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStudents: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStaff: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStorage: z.number().min(1, 'Le stockage doit être au moins 1 GB'),
  supportLevel: z.enum(['email', 'priority', '24/7']),
  customBranding: z.boolean().default(false),
  apiAccess: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  discount: z.number().min(0).max(100).optional(),
  trialDays: z.number().min(0).max(90).optional(),
  features: z.string().min(1, 'Ajoutez au moins une fonctionnalité'),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
  mode: 'create' | 'edit';
}

export const PlanFormDialog = ({ open, onOpenChange, plan, mode }: PlanFormDialogProps) => {
  const { toast } = useToast();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  // États pour les modules et catégories
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

  // Fonction pour générer un slug à partir du nom
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Retirer les caractères spéciaux
      .trim()
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/-+/g, '-'); // Remplacer les tirets multiples par un seul
  };

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

  // Hook pour récupérer tous les modules disponibles
  const { data: allAvailableModules } = useAvailableModulesByPlan(currentPlanType);

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
      
      // Si des modules ont été retirés, mettre à jour la sélection
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
        features: (plan as any).features ? (plan as any).features.join('\n') : '',
      });

      // Mettre à jour le type de plan actuel
      setCurrentPlanType(planType);

      // Charger les catégories et modules
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

  const onSubmit = async (values: PlanFormValues) => {
    try {
      const featuresArray = values.features.split('\n').filter(f => f.trim() !== '');

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

        console.log('📝 Création du plan avec input:', input);
        const result = await createPlan.mutateAsync(input);
        console.log('✅ Plan créé:', result);
        
        if (!result || !result.id) {
          console.error('❌ Erreur: Le plan n\'a pas été créé ou l\'ID est manquant', result);
          toast({
            title: 'Erreur',
            description: 'Le plan n\'a pas pu être créé. Vérifiez la console pour plus de détails.',
            variant: 'destructive',
          });
          return;
        }
        
        planId = result.id;
        console.log('🆔 Plan ID:', planId);
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

      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-[#1D3557]" />
            {mode === 'create' ? 'Créer un nouveau plan' : 'Modifier le plan'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create'
              ? 'Configurez les détails du nouveau plan d\'abonnement'
              : 'Modifiez les informations du plan d\'abonnement'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 mx-6 my-3 shrink-0">
              <TabsTrigger value="general" className="flex items-center gap-1.5 text-sm">
                <Info className="w-3.5 h-3.5" />
                Général
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                Tarification
              </TabsTrigger>
              <TabsTrigger value="limits" className="flex items-center gap-1.5 text-sm">
                <Settings className="w-3.5 h-3.5" />
                Limites & Options
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-1.5 text-sm">
                <Layers className="w-3.5 h-3.5" />
                Modules & Catégories
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
              {/* Onglet 1: Informations générales */}
              <TabsContent value="general" className="space-y-6 mt-0">
                {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informations de base
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du plan *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Plan Premium Rentrée 2025"
                  className={form.formState.errors.name ? 'border-red-500' : ''}
                  onChange={(e) => {
                    form.setValue('name', e.target.value);
                    // Auto-générer le slug si en mode création
                    if (mode === 'create') {
                      form.setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="planType">Type de plan *</Label>
                <Select
                  value={form.watch('planType')}
                  onValueChange={(value) => form.setValue('planType', value as SubscriptionPlan)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gratuit">Gratuit</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="institutionnel">Institutionnel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Catégorie du plan (pour filtrage)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Identifiant unique (slug) *</Label>
              <Input
                id="slug"
                {...form.register('slug')}
                placeholder="plan-premium-rentree-2025"
                className={form.formState.errors.slug ? 'border-red-500' : ''}
                disabled={mode === 'edit'}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
              )}
              {mode === 'create' && (
                <p className="text-xs text-gray-500">Généré automatiquement à partir du nom. Vous pouvez le modifier.</p>
              )}
              {mode === 'edit' && (
                <p className="text-xs text-gray-500">Le slug ne peut pas être modifié après création</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Décrivez les avantages de ce plan..."
                rows={3}
                className={form.formState.errors.description ? 'border-red-500' : ''}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fonctionnalités incluses</h3>
            <div className="space-y-2">
              <Label htmlFor="features">Liste des fonctionnalités (une par ligne) *</Label>
              <Textarea
                id="features"
                {...form.register('features')}
                placeholder="Gestion des élèves&#10;Gestion du personnel&#10;Rapports avancés&#10;..."
                rows={6}
                className={form.formState.errors.features ? 'border-red-500' : ''}
              />
              {form.formState.errors.features && (
                <p className="text-sm text-red-500">{form.formState.errors.features.message}</p>
              )}
              <p className="text-xs text-gray-500">Séparez chaque fonctionnalité par un retour à la ligne</p>
            </div>
          </div>
              </TabsContent>

              {/* Onglet 2: Tarification */}
              <TabsContent value="pricing" className="space-y-6 mt-0">
          {/* Tarification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Tarification
            </h3>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value) => form.setValue('currency', value as 'FCFA' | 'EUR' | 'USD')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCFA">FCFA</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingPeriod">Période *</Label>
                <Select
                  value={form.watch('billingPeriod')}
                  onValueChange={(value) => form.setValue('billingPeriod', value as 'monthly' | 'quarterly' | 'biannual' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel (3 mois)</SelectItem>
                    <SelectItem value="biannual">Semestriel (6 mois)</SelectItem>
                    <SelectItem value="yearly">Annuel (12 mois)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Réduction (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  {...form.register('discount', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Essai gratuit (jours)
                </Label>
                <Input
                  id="trialDays"
                  type="number"
                  {...form.register('trialDays', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                  max="90"
                />
              </div>
            </div>
          </div>
              </TabsContent>

              {/* Onglet 3: Limites & Options */}
              <TabsContent value="limits" className="space-y-6 mt-0">
          {/* Limites */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Limites & Quotas
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxSchools" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nombre d'écoles max
                </Label>
                <Input
                  id="maxSchools"
                  type="number"
                  {...form.register('maxSchools', { valueAsNumber: true })}
                  placeholder="-1 pour illimité"
                  min="-1"
                />
                <p className="text-xs text-gray-500">-1 = Illimité</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Nombre d'élèves max</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  {...form.register('maxStudents', { valueAsNumber: true })}
                  placeholder="-1 pour illimité"
                  min="-1"
                />
                <p className="text-xs text-gray-500">-1 = Illimité</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStaff">Personnel max</Label>
                <Input
                  id="maxStaff"
                  type="number"
                  {...form.register('maxStaff', { valueAsNumber: true })}
                  placeholder="-1 pour illimité"
                  min="-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStorage" className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Stockage (GB)
                </Label>
                <Input
                  id="maxStorage"
                  type="number"
                  {...form.register('maxStorage', { valueAsNumber: true })}
                  placeholder="5"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Support & Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Support & Options
            </h3>

            <div className="space-y-2">
              <Label htmlFor="supportLevel">Niveau de support</Label>
              <Select
                value={form.watch('supportLevel')}
                onValueChange={(value) => form.setValue('supportLevel', value as 'email' | 'priority' | '24/7')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email uniquement</SelectItem>
                  <SelectItem value="priority">Support prioritaire</SelectItem>
                  <SelectItem value="24/7">Support 24/7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="customBranding" className="cursor-pointer">Branding personnalisé</Label>
                </div>
                <Switch
                  id="customBranding"
                  checked={form.watch('customBranding')}
                  onCheckedChange={(checked) => form.setValue('customBranding', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="apiAccess" className="cursor-pointer">Accès API</Label>
                </div>
                <Switch
                  id="apiAccess"
                  checked={form.watch('apiAccess')}
                  onCheckedChange={(checked) => form.setValue('apiAccess', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#E9C46A]" />
                  <Label htmlFor="isPopular" className="cursor-pointer">Plan populaire</Label>
                </div>
                <Switch
                  id="isPopular"
                  checked={form.watch('isPopular')}
                  onCheckedChange={(checked) => form.setValue('isPopular', checked)}
                />
              </div>
            </div>
          </div>
              </TabsContent>

              {/* Onglet 4: Modules & Catégories */}
              <TabsContent value="modules" className="space-y-6 mt-0">
          {/* Modules & Catégories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Catégories & Modules
            </h3>
            <p className="text-sm text-gray-600">
              Sélectionnez les catégories et modules inclus dans ce plan. Les modules seront automatiquement assignés aux groupes scolaires qui souscrivent à ce plan.
            </p>

            {/* Barre de recherche */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Rechercher des catégories ou modules
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sélection des catégories */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Catégories incluses *
              </Label>
              <CategorySelector
                planSlug={form.watch('planType') || 'gratuit'}
                selectedCategoryIds={selectedCategoryIds}
                onCategoryChange={setSelectedCategoryIds}
              />
            </div>

            {/* Sélection des modules */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Modules inclus *
              </Label>
              <ModuleSelector
                planSlug={form.watch('planType') || 'gratuit'}
                selectedCategoryIds={selectedCategoryIds}
                selectedModuleIds={selectedModuleIds}
                onModuleChange={setSelectedModuleIds}
              />
            </div>

            {/* Résumé */}
            <div className="p-4 bg-[#2A9D8F]/10 rounded-lg border border-[#2A9D8F]/30">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">Résumé de la sélection :</span>
                <div className="flex gap-4">
                  <span className="text-[#2A9D8F] font-bold">
                    {selectedCategoryIds.length} {selectedCategoryIds.length > 1 ? 'catégories' : 'catégorie'}
                  </span>
                  <span className="text-[#1D3557] font-bold">
                    {validSelectedModules.length} {validSelectedModules.length > 1 ? 'modules' : 'module'}
                  </span>
                </div>
              </div>
            </div>
          </div>
              </TabsContent>
            </div> {/* Fin overflow-y-auto */}
          </Tabs>

          {/* Actions - EN DEHORS DES ONGLETS */}
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-gray-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
              size="sm"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {mode === 'create' ? 'Créer le plan' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormDialog;
