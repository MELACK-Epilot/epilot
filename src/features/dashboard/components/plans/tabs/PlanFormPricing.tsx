/**
 * Onglet Tarification du formulaire de plan
 * Prix, devise, période, réductions et essai gratuit
 * @module PlanFormPricing
 */

import { DollarSign, Gift, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlanFormTabProps } from '../PlanForm.types';

export const PlanFormPricing = ({ form }: PlanFormTabProps) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
