/**
 * Étape 2 : Parents / Tuteurs
 * Compatible avec react-hook-form et InscriptionFormComplet
 */

import { UseFormReturn } from 'react-hook-form';
import { Users, User, FileText, Home, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { InscriptionFormData } from '../../utils/validation';

interface InscriptionStep2Props {
  form: UseFormReturn<InscriptionFormData>;
}

export const InscriptionStep2 = ({ form }: InscriptionStep2Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-lg text-green-900">Renseignements sur le tuteur ou tutrice</h3>
        </div>
        <p className="text-sm text-green-700">Informations du responsable légal de l'élève</p>
      </div>

      {/* Parent 1 (Père) */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[#1D3557]">Parent 1 (Père)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prénom *</Label>
            <Input
              {...form.register('parent1_first_name')}
              placeholder="Jean"
            />
          </div>
          <div>
            <Label>Nom *</Label>
            <Input
              {...form.register('parent1_last_name')}
              placeholder="MBEMBA"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Téléphone *</Label>
            <Input
              {...form.register('parent1_phone')}
              placeholder="+242 06 123 4567"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              {...form.register('parent1_email')}
              type="email"
              placeholder="jean.mbemba@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Profession</Label>
            <Input
              {...form.register('parent1_profession')}
              placeholder="Fonctionnaire"
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              {...form.register('parent1_address')}
              placeholder="Quartier, Avenue..."
            />
          </div>
        </div>
      </div>

      {/* Parent 2 (Mère) */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[#1D3557]">Parent 2 (Mère)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prénom</Label>
            <Input
              {...form.register('parent2_first_name')}
              placeholder="Marie"
            />
          </div>
          <div>
            <Label>Nom</Label>
            <Input
              {...form.register('parent2_last_name')}
              placeholder="NGOMA"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Téléphone</Label>
            <Input
              {...form.register('parent2_phone')}
              placeholder="+242 05 987 6543"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              {...form.register('parent2_email')}
              type="email"
              placeholder="marie.ngoma@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Profession</Label>
            <Input
              {...form.register('parent2_profession')}
              placeholder="Commerçante"
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              {...form.register('parent2_address')}
              placeholder="Quartier, Avenue..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
