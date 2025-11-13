/**
 * Composant de sélection des catégories pour un plan
 * @module CategorySelector
 */

import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAvailableCategoriesByPlan } from '../../hooks/usePlanModules';
import type { SubscriptionPlan } from '../../types/dashboard.types';
import { getLucideIcon } from '../../utils/iconMapper';

interface CategorySelectorProps {
  planSlug: SubscriptionPlan;
  selectedCategoryIds: string[];
  onCategoryChange: (categoryIds: string[]) => void;
}

export const CategorySelector = ({
  planSlug,
  selectedCategoryIds,
  onCategoryChange,
}: CategorySelectorProps) => {
  const { data: categories, isLoading } = useAvailableCategoriesByPlan(planSlug);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Sélectionner toutes les catégories par défaut
  useEffect(() => {
    if (categories && categories.length > 0 && selectedCategoryIds.length === 0) {
      onCategoryChange(categories.map(c => c.id));
    }
  }, [categories]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    onCategoryChange(newSelected);
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
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Aucune catégorie disponible pour ce plan</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {selectedCategoryIds.length} / {categories.length} catégories sélectionnées
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange(categories.map(c => c.id))}
            className="text-xs text-[#2A9D8F] hover:underline"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={() => onCategoryChange([])}
            className="text-xs text-gray-500 hover:underline"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {categories.map(category => {
        const isSelected = selectedCategoryIds.includes(category.id);
        const isExpanded = expandedCategories.has(category.id);

        return (
          <Card
            key={category.id}
            className={`p-4 transition-all duration-200 ${
              isSelected ? 'border-[#2A9D8F] bg-[#2A9D8F]/5' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <Checkbox
                id={`category-${category.id}`}
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category.id)}
                className="mt-1"
              />

              {/* Contenu */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icône */}
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {getLucideIcon(category.icon, { className: "w-5 h-5", style: { color: category.color } })}
                    </div>

                    {/* Nom */}
                    <div>
                      <label
                        htmlFor={`category-${category.id}`}
                        className="font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
                      >
                        {category.name}
                        {category.is_core && (
                          <Badge variant="outline" className="text-xs">
                            Essentiel
                          </Badge>
                        )}
                      </label>
                      {isExpanded && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Badge plan requis */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: category.color,
                        color: 'white',
                      }}
                    >
                      {category.required_plan}
                    </Badge>

                    {/* Bouton expand */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(category.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Indicateur de sélection */}
                {isSelected && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-[#2A9D8F]">
                    <Check className="w-4 h-4" />
                    <span>Incluse dans ce plan</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
