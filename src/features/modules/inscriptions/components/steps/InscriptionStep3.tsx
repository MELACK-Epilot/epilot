/**
 * Étape 3 : Informations Scolaires
 * Compatible avec react-hook-form et InscriptionFormComplet
 */

import { UseFormReturn } from 'react-hook-form';
import { GraduationCap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { InscriptionFormData } from '../../utils/validation';

interface InscriptionStep3Props {
  form: UseFormReturn<InscriptionFormData>;
}

// Options pour les menus déroulants
const ANNEES_ACADEMIQUES = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
];

const TYPES_ECOLE = [
  { value: 'generale', label: 'École Générale' },
  { value: 'technique', label: 'École Technique' },
  { value: 'professionnelle', label: 'École Professionnelle' },
];

const NIVEAUX_MATERNELLE = [
  'Petite Section',
  'Moyenne Section',
  'Grande Section',
];

const NIVEAUX_PRIMAIRE = [
  'CP1',
  'CP2',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
];

const NIVEAUX_COLLEGE = [
  '6ème',
  '5ème',
  '4ème',
  '3ème',
];

const NIVEAUX_LYCEE = [
  'Seconde',
  'Première',
  'Terminale',
];

const SERIES_GENERALE = [
  { value: 'A', label: 'A - Littéraire' },
  { value: 'C', label: 'C - Mathématiques & Sciences Physiques' },
  { value: 'D', label: 'D - Mathématiques & Sciences de la Vie' },
];

const SERIES_TECHNIQUE = [
  { value: 'F1', label: 'F1 - Construction Mécanique' },
  { value: 'F2', label: 'F2 - Électronique' },
  { value: 'F3', label: 'F3 - Électrotechnique' },
  { value: 'F4', label: 'F4 - Génie Civil' },
  { value: 'G', label: 'G - Gestion & Comptabilité' },
];

const FILIERES = [
  'Scientifique',
  'Littéraire',
  'Économique et Social',
  'Technique',
  'Professionnelle',
];

export const InscriptionStep3 = ({ form }: InscriptionStep3Props) => {
  const typeEcole = form.watch('type_ecole') as string | undefined;
  const niveau = form.watch('requested_level');
  
  // Déterminer les séries disponibles selon le type d'école
  const seriesDisponibles = typeEcole === 'technique' ? SERIES_TECHNIQUE : SERIES_GENERALE;
  
  // Afficher Série/Filière seulement pour Lycée
  const afficherSerieFiliere = niveau && (niveau.includes('Seconde') || niveau.includes('Première') || niveau.includes('Terminale'));
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 rounded-xl border-2 border-orange-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-6 h-6 text-orange-600" />
          <h3 className="font-bold text-lg text-orange-900">Informations Scolaires</h3>
        </div>
        <p className="text-sm text-orange-700">Détails de l'inscription et du parcours scolaire</p>
      </div>

      {/* Année académique et Type d'école */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Année académique <span className="text-red-500">*</span></Label>
          <Select
            value={form.watch('academic_year')}
            onValueChange={(value) => form.setValue('academic_year', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'année" />
            </SelectTrigger>
            <SelectContent>
              {ANNEES_ACADEMIQUES.map((annee) => (
                <SelectItem key={annee} value={annee}>
                  {annee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.academic_year && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.academic_year.message}
            </p>
          )}
        </div>

        <div>
          <Label>Type d'école <span className="text-red-500">*</span></Label>
          <Select
            value={form.watch('type_ecole')}
            onValueChange={(value) => form.setValue('type_ecole', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES_ECOLE.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Niveau demandé */}
      <div>
        <Label>Niveau demandé <span className="text-red-500">*</span></Label>
        <Select
          value={form.watch('requested_level')}
          onValueChange={(value) => form.setValue('requested_level', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner le niveau" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Maternelle</div>
            {NIVEAUX_MATERNELLE.map((niveau) => (
              <SelectItem key={niveau} value={niveau}>
                {niveau}
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">Primaire</div>
            {NIVEAUX_PRIMAIRE.map((niveau) => (
              <SelectItem key={niveau} value={niveau}>
                {niveau}
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">Collège</div>
            {NIVEAUX_COLLEGE.map((niveau) => (
              <SelectItem key={niveau} value={niveau}>
                {niveau}
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">Lycée</div>
            {NIVEAUX_LYCEE.map((niveau) => (
              <SelectItem key={niveau} value={niveau}>
                {niveau}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.requested_level && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.requested_level.message}
          </p>
        )}
      </div>

      {/* Type d'inscription */}
      <div>
        <Label>Type d'inscription *</Label>
        <RadioGroup
          value={form.watch('type_inscription')}
          onValueChange={(value) => form.setValue('type_inscription', value as any)}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nouvelle" id="nouvelle" />
            <Label htmlFor="nouvelle">Nouvelle</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="reinscription" id="reinscription" />
            <Label htmlFor="reinscription">Réinscription</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="transfert" id="transfert" />
            <Label htmlFor="transfert">Transfert</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Série et filière - Seulement pour Lycée */}
      {afficherSerieFiliere && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Série</Label>
            <Select
              value={form.watch('serie') || ''}
              onValueChange={(value) => form.setValue('serie', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la série" />
              </SelectTrigger>
              <SelectContent>
                {seriesDisponibles.map((serie) => (
                  <SelectItem key={serie.value} value={serie.value}>
                    {serie.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Filière</Label>
            <Select
              value={form.watch('filiere') || ''}
              onValueChange={(value) => form.setValue('filiere', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la filière" />
              </SelectTrigger>
              <SelectContent>
                {FILIERES.map((filiere) => (
                  <SelectItem key={filiere} value={filiere}>
                    {filiere}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Statut scolaire */}
      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={form.watch('est_redoublant')}
            onCheckedChange={(checked) => form.setValue('est_redoublant', !!checked)}
          />
          <Label>Redoublant</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={form.watch('est_affecte')}
            onCheckedChange={(checked) => form.setValue('est_affecte', !!checked)}
          />
          <Label>Affecté</Label>
        </div>
      </div>

      {/* Numéro d'affectation si affecté */}
      {form.watch('est_affecte') && (
        <div>
          <Label>Numéro d'affectation</Label>
          <Input
            {...form.register('numero_affectation')}
            placeholder="Numéro d'affectation"
          />
        </div>
      )}

      {/* École d'origine si transfert */}
      {form.watch('type_inscription') === 'transfert' && (
        <div>
          <Label>École d'origine</Label>
          <Input
            {...form.register('ancienne_ecole')}
            placeholder="Nom de l'établissement d'origine"
          />
        </div>
      )}
    </div>
  );
};
