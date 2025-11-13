/**
 * Composant de sélection des modules pour un plan
 * @module ModuleSelector
 */

import { useState, useEffect } from 'react';
import { Check, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAvailableModulesByPlan } from '../../hooks/usePlanModules';
import type { SubscriptionPlan } from '../../types/dashboard.types';
import { getLucideIcon } from '../../utils/iconMapper';

interface ModuleSelectorProps {
  planSlug: SubscriptionPlan;
  selectedCategoryIds: string[];
  selectedModuleIds: string[];
  onModuleChange: (moduleIds: string[]) => void;
}

export const ModuleSelector = ({
  planSlug,
  selectedCategoryIds,
  selectedModuleIds,
  onModuleChange,
}: ModuleSelectorProps) => {
  const { data: modules, isLoading } = useAvailableModulesByPlan(planSlug);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filtrer les modules par catégories sélectionnées
  const filteredModules = modules?.filter(m => 
    selectedCategoryIds.includes(m.category_id)
  ) || [];

  // Grouper les modules par catégorie
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    const categoryId = module.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(module);
    return acc;
  }, {} as Record<string, any[]>);

  // Sélectionner tous les modules des catégories sélectionnées par défaut
  useEffect(() => {
    if (filteredModules.length > 0 && selectedModuleIds.length === 0) {
      onModuleChange(filteredModules.map(m => m.id));
    }
  }, [filteredModules.length]);

  const toggleModule = (moduleId: string) => {
    const newSelected = selectedModuleIds.includes(moduleId)
      ? selectedModuleIds.filter(id => id !== moduleId)
      : [...selectedModuleIds, moduleId];
    onModuleChange(newSelected);
  };

  const toggleCategory = (categoryId: string) => {
    const categoryModules = modulesByCategory[categoryId] || [];
    const categoryModuleIds = categoryModules.map(m => m.id);
    const allSelected = categoryModuleIds.every(id => selectedModuleIds.includes(id));

    if (allSelected) {
      // Désélectionner tous les modules de cette catégorie
      onModuleChange(selectedModuleIds.filter(id => !categoryModuleIds.includes(id)));
    } else {
      // Sélectionner tous les modules de cette catégorie
      const newSelected = [...new Set([...selectedModuleIds, ...categoryModuleIds])];
      onModuleChange(newSelected);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (selectedCategoryIds.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Sélectionnez d'abord des catégories</p>
      </Card>
    );
  }

  if (filteredModules.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun module disponible pour les catégories sélectionnées</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {selectedModuleIds.length} / {filteredModules.length} modules sélectionnés
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onModuleChange(filteredModules.map(m => m.id))}
            className="text-xs text-[#2A9D8F] hover:underline"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={() => onModuleChange([])}
            className="text-xs text-gray-500 hover:underline"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {Object.entries(modulesByCategory).map(([categoryId, categoryModules]) => {
        const category = categoryModules[0]?.category;
        if (!category) return null;

        const isExpanded = expandedCategories.has(categoryId);
        const selectedCount = categoryModules.filter(m => selectedModuleIds.includes(m.id)).length;
        const allSelected = selectedCount === categoryModules.length;

        return (
          <Card key={categoryId} className="overflow-hidden">
            {/* Header de la catégorie */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleCategory(categoryId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {getLucideIcon(category.icon, { className: "w-5 h-5", style: { color: category.color } })}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedCount} / {categoryModules.length} modules sélectionnés
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpand(categoryId)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Liste des modules */}
            {isExpanded && (
              <div className="border-t divide-y">
                {categoryModules.map(module => {
                  const isSelected = selectedModuleIds.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`p-3 pl-16 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-[#2A9D8F]/5' : ''
                      }`}
                    >
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <label
                        htmlFor={`module-${module.id}`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{module.name}</span>
                          {module.is_core && (
                            <Badge variant="outline" className="text-xs">
                              Core
                            </Badge>
                          )}
                          {module.is_premium && (
                            <Badge variant="secondary" className="text-xs bg-[#E9C46A] text-white">
                              Premium
                            </Badge>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#2A9D8F]" />}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
