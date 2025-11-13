/**
 * Section des informations de base du groupe scolaire
 * (Nom, Code, Région, Ville)
 */

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Hash, MapPin, Map } from 'lucide-react';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';
import { CONGO_DEPARTMENTS, CONGO_CITIES } from '@/features/dashboard/constants/congo-locations';

interface BasicInfoSectionProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
}

export const BasicInfoSection = ({ form }: BasicInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Building2 className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Informations de base</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom du groupe */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nom du groupe *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Groupe Scolaire Excellence"
                  {...field}
                  className="border-gray-300 focus:border-[#2A9D8F]"
                />
              </FormControl>
              <FormDescription>
                Nom officiel du groupe scolaire
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Code du groupe */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Code *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly
                  disabled
                  className="border-gray-300 bg-gray-50 font-mono text-[#1D3557] font-semibold cursor-not-allowed"
                />
              </FormControl>
              <FormDescription>
                Code unique généré automatiquement (E-PILOT-XXX)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Région */}
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Région *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-300 focus:border-[#2A9D8F]">
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONGO_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Département du Congo-Brazzaville
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ville */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ville *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-300 focus:border-[#2A9D8F]">
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {CONGO_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Ville du Congo-Brazzaville
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
