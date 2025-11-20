/**
 * Onglet Général du formulaire de plan
 * Informations de base et fonctionnalités
 * @module PlanFormGeneral
 */

import { Package } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeaturesAutoGenerator } from '../FeaturesAutoGenerator';
import type { PlanFormTabProps } from '../PlanForm.types';
import type { SubscriptionPlan } from '../../../types/dashboard.types';

interface PlanFormGeneralProps extends PlanFormTabProps {
  onNameChange: (name: string) => void;
  selectedModuleIds: string[];
  allAvailableModules: any[];
}

export const PlanFormGeneral = ({ 
  form, 
  mode, 
  onNameChange, 
  selectedModuleIds, 
  allAvailableModules 
}: PlanFormGeneralProps) => {
  return (
    <div className="space-y-6">
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
                onNameChange(e.target.value);
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
        <FeaturesAutoGenerator
          selectedModuleIds={selectedModuleIds}
          allModules={allAvailableModules}
          value={form.watch('features') || ''}
          onChange={(features) => form.setValue('features', features)}
        />
        {form.formState.errors.features && (
          <p className="text-sm text-red-500">{form.formState.errors.features.message}</p>
        )}
      </div>
    </div>
  );
};
