/**
 * Onglet Modules & Catégories du formulaire de plan
 * Sélection des catégories et modules inclus
 * @module PlanFormModules
 */

import { Layers, Package } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CategorySelector } from '../CategorySelector';
import { ModuleSelector } from '../ModuleSelector';
import type { PlanFormModulesTabProps } from '../PlanForm.types';

export const PlanFormModules = ({
  form,
  selectedCategoryIds,
  setSelectedCategoryIds,
  selectedModuleIds,
  setSelectedModuleIds,
  searchQuery,
  setSearchQuery,
  validSelectedModules,
}: PlanFormModulesTabProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Catégories & Modules
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez les catégories et modules inclus dans ce plan. Les modules seront automatiquement assignés aux groupes scolaires qui souscrivent à ce plan.
        </p>

        {/* Barre de recherche */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Rechercher des catégories ou modules
          </Label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sélection des catégories */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Catégories incluses *
          </Label>
          <CategorySelector
            planSlug={form.watch('planType') || 'gratuit'}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryChange={setSelectedCategoryIds}
          />
        </div>

        {/* Sélection des modules */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Modules inclus *
          </Label>
          <ModuleSelector
            planSlug={form.watch('planType') || 'gratuit'}
            selectedCategoryIds={selectedCategoryIds}
            selectedModuleIds={selectedModuleIds}
            onModuleChange={setSelectedModuleIds}
          />
        </div>

        {/* Résumé */}
        <div className="p-4 bg-[#2A9D8F]/10 rounded-lg border border-[#2A9D8F]/30">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900">Résumé de la sélection :</span>
            <div className="flex gap-4">
              <span className="text-[#2A9D8F] font-bold">
                {selectedCategoryIds.length} {selectedCategoryIds.length > 1 ? 'catégories' : 'catégorie'}
              </span>
              <span className="text-[#1D3557] font-bold">
                {validSelectedModules.length} {validSelectedModules.length > 1 ? 'modules' : 'module'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
