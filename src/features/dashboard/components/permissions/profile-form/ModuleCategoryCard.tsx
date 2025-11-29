/**
 * Carte de catégorie avec liste de modules
 * Composant pure UI (dumb component)
 */

import { Switch } from '@/components/ui/switch';
import { getModuleIcon } from '@/features/dashboard/constants/roles.constants';
import type { Category } from '@/features/dashboard/hooks/useGroupAvailableModules';

interface ModuleCategoryCardProps {
  category: Category;
  permissions: Record<string, boolean>;
  isFullyChecked: boolean;
  onToggleCategory: (checked: boolean) => void;
  onToggleModule: (moduleSlug: string, checked: boolean) => void;
}

export const ModuleCategoryCard = ({
  category,
  permissions,
  isFullyChecked,
  onToggleCategory,
  onToggleModule,
}: ModuleCategoryCardProps) => {
  const Icon = getModuleIcon(category.icon);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Catégorie */}
      <div className="flex items-center justify-between p-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm">
            <Icon className="h-4 w-4" style={{ color: category.color || '#6B7280' }} />
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">{category.name}</h4>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            Tout
          </span>
          <Switch
            checked={isFullyChecked}
            onCheckedChange={onToggleCategory}
            className="scale-75 data-[state=checked]:bg-[#1D3557]"
          />
        </div>
      </div>

      {/* Liste Modules */}
      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        {category.modules.map((module) => {
          const isChecked = permissions[module.slug] || false;
          
          return (
            <div 
              key={module.id} 
              className={`flex items-center justify-between p-2.5 rounded-md border transition-all duration-200 ${
                isChecked 
                  ? 'bg-blue-50/40 border-blue-100' 
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Switch
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggleModule(module.slug, checked)}
                  className="scale-75 data-[state=checked]:bg-[#2A9D8F] mr-1 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                    {module.name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
