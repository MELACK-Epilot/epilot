/**
 * Section du plan d'abonnement et des compteurs
 * (Plan, Nombre d'écoles, Nombre d'élèves, Statut)
 */

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';
import { CreditCard, Activity } from 'lucide-react';

interface PlanSectionProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
  mode: 'create' | 'edit';
}

const PLANS = [
  { value: 'gratuit', label: '🆓 Gratuit', description: 'Jusqu\'à 3 écoles' },
  { value: 'premium', label: '⭐ Premium', description: 'Jusqu\'à 10 écoles' },
  { value: 'pro', label: '💎 Pro', description: 'Jusqu\'à 50 écoles' },
  { value: 'institutionnel', label: '🏛️ Institutionnel', description: 'Illimité' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '✅ Actif', color: 'text-green-600' },
  { value: 'inactive', label: '⏸️ Inactif', color: 'text-gray-600' },
  { value: 'suspended', label: '🚫 Suspendu', color: 'text-red-600' },
];

export const PlanSection = ({ form, mode }: PlanSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <CreditCard className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Plan et statistiques</h3>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-300 focus:border-[#2A9D8F]">
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{plan.label}</span>
                        <span className="text-xs text-gray-500">{plan.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Type d'abonnement du groupe
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

      {/* Note informative sur les quotas */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              📊 Quotas définis par l'abonnement
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Le nombre d'écoles, d'élèves et de personnel autorisés est déterminé par le plan choisi. 
              Les statistiques réelles seront calculées automatiquement lorsque l'Administrateur de Groupe créera des écoles et ajoutera des utilisateurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
