/**
 * Section du plan d'abonnement - VERSION AMÉLIORÉE
 * ✅ Charge automatiquement les infos du plan depuis la BDD
 * ✅ Affiche montant, période, limites en temps réel
 * ✅ React 19 + Best Practices
 */

import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';
import { CreditCard, Activity, DollarSign, Calendar, Users, Building2, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanSectionProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
  mode: 'create' | 'edit';
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  max_schools: number | null;
  max_students: number | null;
  max_staff: number | null;
  description: string | null;
  features: string[] | null;
}

const STATUS_OPTIONS = [
  { value: 'active', label: '✅ Actif', color: 'text-green-600' },
  { value: 'inactive', label: '⏸️ Inactif', color: 'text-gray-600' },
  { value: 'suspended', label: '🚫 Suspendu', color: 'text-red-600' },
];

export const PlanSection = ({ form, mode }: PlanSectionProps) => {
  // ✅ Récupérer tous les plans depuis la BDD
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans-for-group'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  // ✅ Récupérer le plan sélectionné
  const selectedPlanSlug = form.watch('plan');
  
  const selectedPlan = useMemo(() => 
    plans?.find(p => p.slug === selectedPlanSlug),
    [plans, selectedPlanSlug]
  );

  // ✅ Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  // ✅ Formater la période
  const formatPeriod = (period: string) => {
    return period === 'monthly' ? 'Mensuel' : 'Annuel';
  };

  // ✅ Icône du plan
  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'gratuit': return '🆓';
      case 'premium': return '⭐';
      case 'pro': return '💎';
      case 'institutionnel': return '🏛️';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <CreditCard className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Plan d'abonnement</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan d'abonnement */}
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Plan d'abonnement *
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={loadingPlans}
              >
                <FormControl>
                  <SelectTrigger className="border-gray-300 focus:border-[#2A9D8F]">
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.slug}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">
                          {getPlanIcon(plan.slug)} {plan.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatPrice(plan.price)} FCFA / {formatPeriod(plan.billing_period)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Sélectionnez le plan d'abonnement du groupe
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statut (seulement en mode édition) */}
        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Statut *
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-gray-300 focus:border-[#2A9D8F]">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  État actuel du groupe
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Détails du plan sélectionné - Animation */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-xl p-6 border-2 border-[#2A9D8F]/20"
          >
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#2A9D8F]" />
              Détails du Plan : {getPlanIcon(selectedPlan.slug)} {selectedPlan.name}
            </h4>

            {/* Description */}
            {selectedPlan.description && (
              <p className="text-sm text-gray-600 mb-4 italic">
                {selectedPlan.description}
              </p>
            )}

            {/* Informations financières */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
                  <span className="text-sm font-medium text-gray-600">Montant</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(selectedPlan.price)} FCFA
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-[#2A9D8F]" />
                  <span className="text-sm font-medium text-gray-600">Période</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPeriod(selectedPlan.billing_period)}
                </p>
              </div>
            </div>

            {/* Limites et quotas */}
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900 text-sm mb-2">📊 Limites et Quotas</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Écoles */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Écoles</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPlan.max_schools === null ? '∞' : selectedPlan.max_schools}
                    </p>
                  </div>
                </div>

                {/* Élèves */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Élèves</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPlan.max_students === null ? '∞' : formatPrice(selectedPlan.max_students)}
                    </p>
                  </div>
                </div>

                {/* Personnel */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Personnel</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPlan.max_staff === null ? '∞' : formatPrice(selectedPlan.max_staff)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fonctionnalités */}
            {selectedPlan.features && selectedPlan.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-semibold text-gray-900 text-sm mb-2">✨ Fonctionnalités Incluses</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Note importante */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Note :</strong> Un abonnement sera créé automatiquement avec ces paramètres 
                lors de la création du groupe. Les modules et catégories du plan seront également assignés.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note informative si aucun plan sélectionné */}
      {!selectedPlan && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                📊 Sélectionnez un plan
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Choisissez un plan d'abonnement pour voir les détails (montant, période, limites). 
                Un abonnement sera créé automatiquement lors de la création du groupe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
