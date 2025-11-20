/**
 * Filtres pour le tableau comparatif
 */

import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PlanFilters } from '../../../utils/comparison-utils';

interface ComparisonFiltersProps {
  filters: PlanFilters;
  onFiltersChange: (filters: PlanFilters) => void;
  resultCount: number;
  totalCount: number;
}

export const ComparisonFilters = ({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
}: ComparisonFiltersProps) => {
  const hasActiveFilters =
    filters.priceRange !== 'all' ||
    filters.features.length > 0 ||
    filters.minSchools > 0 ||
    filters.searchQuery !== '';

  const resetFilters = () => {
    onFiltersChange({
      priceRange: 'all',
      features: [],
      minSchools: 0,
      searchQuery: '',
    });
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter((f) => f !== feature)
      : [...filters.features, feature];
    onFiltersChange({ ...filters, features: newFeatures });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtres</h3>
          {hasActiveFilters && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {resultCount}/{totalCount} plans
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un plan..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtre par prix */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Prix</label>
          <select
            value={filters.priceRange}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceRange: e.target.value as PlanFilters['priceRange'],
              })
            }
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les prix</option>
            <option value="free">Gratuit</option>
            <option value="low">0 - 200K FCFA</option>
            <option value="medium">200K - 500K FCFA</option>
            <option value="high">&gt; 500K FCFA</option>
          </select>
        </div>

        {/* Filtre par nombre d'écoles */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Nombre d'écoles minimum
          </label>
          <Input
            type="number"
            min="0"
            value={filters.minSchools || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, minSchools: parseInt(e.target.value) || 0 })
            }
            placeholder="Ex: 5"
          />
        </div>

        {/* Filtre par fonctionnalités */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Fonctionnalités
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFeature('apiAccess')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filters.features.includes('apiAccess')
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
              }`}
            >
              Accès API
            </button>
            <button
              onClick={() => toggleFeature('customBranding')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filters.features.includes('customBranding')
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
              }`}
            >
              Branding
            </button>
            <button
              onClick={() => toggleFeature('trial')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filters.features.includes('trial')
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
              }`}
            >
              Essai gratuit
            </button>
          </div>
        </div>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <span className="text-xs text-slate-500">Filtres actifs:</span>
          {filters.priceRange !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Prix: {filters.priceRange}
              <button
                onClick={() => onFiltersChange({ ...filters, priceRange: 'all' })}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature === 'apiAccess'
                ? 'API'
                : feature === 'customBranding'
                ? 'Branding'
                : 'Essai'}
              <button
                onClick={() => toggleFeature(feature)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.minSchools > 0 && (
            <Badge variant="outline" className="text-xs">
              Min {filters.minSchools} écoles
              <button
                onClick={() => onFiltersChange({ ...filters, minSchools: 0 })}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
