/**
 * Étape 4 : Informations Financières
 * Compatible avec react-hook-form et InscriptionFormComplet
 */

import { UseFormReturn } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { InscriptionFormData } from '../../utils/validation';

interface InscriptionStep4Props {
  form: UseFormReturn<InscriptionFormData>;
}

export const InscriptionStep4 = ({ form }: InscriptionStep4Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-lg text-green-900">Informations Financières</h3>
        </div>
        <p className="text-sm text-green-700">Frais de scolarité et modalités de paiement</p>
      </div>

      {/* Frais */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Frais d'inscription (FCFA) *</Label>
          <Input
            {...form.register('frais_inscription', { valueAsNumber: true })}
            type="number"
            placeholder="50000"
          />
        </div>
        <div>
          <Label>Frais de scolarité (FCFA) *</Label>
          <Input
            {...form.register('frais_scolarite', { valueAsNumber: true })}
            type="number"
            placeholder="500000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Frais de cantine (FCFA)</Label>
          <Input
            {...form.register('frais_cantine', { valueAsNumber: true })}
            type="number"
            placeholder="100000"
          />
        </div>
        <div>
          <Label>Frais de transport (FCFA)</Label>
          <Input
            {...form.register('frais_transport', { valueAsNumber: true })}
            type="number"
            placeholder="50000"
          />
        </div>
      </div>

      {/* Aides sociales */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[#1D3557]">Aides et statuts particuliers</h4>
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.watch('a_aide_sociale')}
              onCheckedChange={(checked) => form.setValue('a_aide_sociale', !!checked)}
            />
            <Label>Aide sociale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.watch('est_pensionnaire')}
              onCheckedChange={(checked) => form.setValue('est_pensionnaire', !!checked)}
            />
            <Label>Pensionnaire</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.watch('a_bourse')}
              onCheckedChange={(checked) => form.setValue('a_bourse', !!checked)}
            />
            <Label>Bourse</Label>
          </div>
        </div>
      </div>

      {/* Informations importantes */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm">
        <h4 className="font-bold text-blue-900 mb-3">
          📋 Informations importantes
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✦</span>
            <span>Les frais d'inscriptions et réinscriptions ne sont pas remboursables</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✦</span>
            <span>Les frais d'écolage sont payables d'Octobre à Juin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✦</span>
            <span>Le mois entamé est payable en totalité</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
