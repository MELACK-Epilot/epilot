/**
 * Section de configuration des modules
 * Affiche les catégories et modules disponibles
 */

import { Loader2, Box, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/features/dashboard/hooks/useGroupAvailableModules';
import { 
  isCategoryFullyChecked, 
  toggleCategoryModules 
} from '@/features/dashboard/utils/permissions.utils';
import { ModuleCategoryCard } from './ModuleCategoryCard';

interface ProfileModulesSectionProps {
  categories: Category[] | undefined;
  permissions: Record<string, boolean>;
  setPermissions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeCount: number;
  isLoading: boolean;
}

export const ProfileModulesSection = ({
  categories,
  permissions,
  setPermissions,
  activeCount,
  isLoading,
}: ProfileModulesSectionProps) => {
  const queryClient = useQueryClient();
  
  const handleToggleModule = (moduleSlug: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleSlug]: checked
    }));
  };
  
  const handleToggleCategory = (category: Category, checked: boolean) => {
    setPermissions(prev => toggleCategoryModules(category.modules, prev, checked));
  };
  
  return (
    <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
          <Box className="w-4 h-4" />
          Configuration des Modules
        </h3>
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          {activeCount} modules sélectionnés
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl border border-dashed border-gray-300">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p>Aucun module disponible.</p>
          <Button 
            variant="link" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['all-modules-categories'] })}
            className="mt-2"
          >
            Réessayer le chargement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <ModuleCategoryCard
              key={category.id}
              category={category}
              permissions={permissions}
              isFullyChecked={isCategoryFullyChecked(category.modules, permissions)}
              onToggleCategory={(checked) => handleToggleCategory(category, checked)}
              onToggleModule={handleToggleModule}
            />
          ))}
        </div>
      )}
    </div>
  );
};
