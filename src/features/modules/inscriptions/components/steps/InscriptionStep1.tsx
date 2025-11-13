/**
 * Étape 1 : Informations Générales de l'Élève
 * Compatible avec react-hook-form et InscriptionFormComplet
 */

import { UseFormReturn } from 'react-hook-form';
import { User, Calendar, MapPin, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '../PhotoUpload';
import type { InscriptionFormData } from '../../utils/validation';

interface InscriptionStep1Props {
  form: UseFormReturn<InscriptionFormData>;
}

export const InscriptionStep1 = ({ form }: InscriptionStep1Props) => {
  const studentName = `${form.watch('student_first_name') || ''} ${form.watch('student_last_name') || ''}`.trim();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1D3557] mb-2">
          Informations de l'élève
        </h3>
        <p className="text-sm text-gray-600">
          Renseignez les informations personnelles de l'élève
        </p>
      </div>

      {/* Photo de l'élève */}
      <PhotoUpload
        value={form.watch('student_photo') || undefined}
        onChange={(value) => form.setValue('student_photo', value || undefined)}
        studentName={studentName}
      />

      {/* Nom et Prénom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="student_last_name">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student_last_name"
            {...form.register('student_last_name')}
            placeholder="DUPONT"
            className="uppercase"
          />
          {form.formState.errors.student_last_name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.student_last_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="student_postnom">Post-nom</Label>
          <Input
            id="student_postnom"
            {...form.register('student_postnom')}
            placeholder="MBEMBA"
          />
        </div>

        <div>
          <Label htmlFor="student_first_name">
            Prénom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student_first_name"
            {...form.register('student_first_name')}
            placeholder="Jean"
          />
          {form.formState.errors.student_first_name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.student_first_name.message}
            </p>
          )}
        </div>
      </div>

      {/* Sexe et Date de naissance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>
            Sexe <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={form.watch('student_gender')}
            onValueChange={(value) => form.setValue('student_gender', value as 'M' | 'F')}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="M" id="gender-m" />
              <Label htmlFor="gender-m" className="font-normal cursor-pointer">
                Masculin
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="F" id="gender-f" />
              <Label htmlFor="gender-f" className="font-normal cursor-pointer">
                Féminin
              </Label>
            </div>
          </RadioGroup>
          {form.formState.errors.student_gender && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.student_gender.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="student_date_of_birth">
            Date de naissance <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student_date_of_birth"
            type="date"
            {...form.register('student_date_of_birth')}
          />
          {form.formState.errors.student_date_of_birth && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.student_date_of_birth.message}
            </p>
          )}
        </div>
      </div>

      {/* Lieu de naissance et Nationalité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="student_place_of_birth">Lieu de naissance</Label>
          <Input
            id="student_place_of_birth"
            {...form.register('student_place_of_birth')}
            placeholder="Brazzaville"
          />
        </div>

        <div>
          <Label htmlFor="student_nationality">Nationalité</Label>
          <select
            id="student_nationality"
            {...form.register('student_nationality')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Congolaise (RC)">Congolaise (RC)</option>
            <option value="Congolaise (RDC)">Congolaise (RDC)</option>
            <option value="Gabonaise">Gabonaise</option>
            <option value="Camerounaise">Camerounaise</option>
            <option value="Centrafricaine">Centrafricaine</option>
            <option value="Tchadienne">Tchadienne</option>
            <option value="Angolaise">Angolaise</option>
            <option value="Béninoise">Béninoise</option>
            <option value="Burkinabé">Burkinabé</option>
            <option value="Burundaise">Burundaise</option>
            <option value="Ivoirienne">Ivoirienne</option>
            <option value="Guinéenne">Guinéenne</option>
            <option value="Malienne">Malienne</option>
            <option value="Nigériane">Nigériana</option>
            <option value="Nigérienne">Nigérienne</option>
            <option value="Rwandaise">Rwandaise</option>
            <option value="Sénégalaise">Sénégalaise</option>
            <option value="Togolaise">Togolaise</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Identifiant national */}
      <div>
        <Label htmlFor="student_national_id">Identifiant national (optionnel)</Label>
        <Input
          id="student_national_id"
          {...form.register('student_national_id')}
          placeholder="Ex: CNI, Passeport..."
        />
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            {...form.register('address')}
            placeholder="123 Avenue de la Paix"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              {...form.register('city')}
              placeholder="Brazzaville"
            />
          </div>

          <div>
            <Label htmlFor="region">Région/Département</Label>
            <select
              id="region"
              {...form.register('region')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="Brazzaville">Brazzaville</option>
              <option value="Pointe-Noire">Pointe-Noire</option>
              <option value="Bouenza">Bouenza</option>
              <option value="Cuvette">Cuvette</option>
              <option value="Cuvette-Ouest">Cuvette-Ouest</option>
              <option value="Kouilou">Kouilou</option>
              <option value="Lékoumou">Lékoumou</option>
              <option value="Likouala">Likouala</option>
              <option value="Niari">Niari</option>
              <option value="Plateaux">Plateaux</option>
              <option value="Pool">Pool</option>
              <option value="Sangha">Sangha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact élève (optionnel) */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Contact de l'élève (optionnel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student_phone">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone
              </Label>
              <Input
                id="student_phone"
                {...form.register('student_phone')}
                placeholder="+242 06 123 4567"
              />
              {form.formState.errors.student_phone && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.student_phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="student_email">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="student_email"
                type="email"
                {...form.register('student_email')}
                placeholder="eleve@example.cg"
              />
              {form.formState.errors.student_email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.student_email.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
