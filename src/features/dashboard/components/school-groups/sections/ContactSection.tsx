/**
 * Section des coordonnées du groupe scolaire
 * (Adresse, Téléphone, Site web)
 */

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Globe } from 'lucide-react';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';

interface ContactSectionProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
}

export const ContactSection = ({ form }: ContactSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Phone className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Coordonnées</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Adresse */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse complète
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Avenue de l'Indépendance, Quartier Moungali"
                  {...field}
                  className="border-gray-300 focus:border-[#2A9D8F]"
                />
              </FormControl>
              <FormDescription>
                Adresse physique du siège du groupe
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Téléphone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Ex: +242 06 123 45 67"
                    {...field}
                    className="border-gray-300 focus:border-[#2A9D8F]"
                  />
                </FormControl>
                <FormDescription>
                  Numéro de téléphone principal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Site web */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web <span className="text-gray-400 text-xs">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="Ex: https://www.exemple.cg"
                    {...field}
                    className="border-gray-300 focus:border-[#2A9D8F]"
                  />
                </FormControl>
                <FormDescription>
                  Site web officiel du groupe (optionnel)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
