/**
 * Onglet Limites & Options du formulaire de plan
 * Quotas, support et options avancées
 * @module PlanFormLimits
 */

import { Users, Building2, HardDrive, Headphones, Palette, Zap, Crown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PlanFormTabProps } from '../PlanForm.types';

export const PlanFormLimits = ({ form }: PlanFormTabProps) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
