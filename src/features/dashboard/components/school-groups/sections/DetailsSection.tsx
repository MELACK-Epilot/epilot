/**
 * Section des détails du groupe scolaire
 * (Année de création, Description)
 */

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, FileText } from 'lucide-react';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';

interface DetailsSectionProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
  yearsOfExistence: number;
}

export const DetailsSection = ({ form, yearsOfExistence }: DetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <FileText className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Détails</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Année de création */}
        <FormField
          control={form.control}
          name="foundedYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Année de création
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="2010"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : parseInt(value, 10));
                  }}
                  className="border-gray-300 focus:border-[#2A9D8F]"
                />
              </FormControl>
              {yearsOfExistence > 0 && (
                <FormDescription className="text-[#2A9D8F] font-medium">
                  🎉 {yearsOfExistence} an{yearsOfExistence > 1 ? 's' : ''} d'existence
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez l'histoire, la mission et les valeurs du groupe scolaire..."
                  className="min-h-[120px] border-gray-300 focus:border-[#2A9D8F] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Présentation du groupe (minimum 10 caractères)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
