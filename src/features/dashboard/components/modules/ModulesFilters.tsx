/**
 * Composant Filtres pour la page Modules
 */

import { Search, RefreshCw, Download, Grid3x3, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModulesFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterPlan: string;
  setFilterPlan: (value: string) => void;
  categories: Array<{ id: string; name: string }>;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  activeFiltersCount: number;
  resetFilters: () => void;
  handleExport: () => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const ModulesFilters = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  filterPlan,
  setFilterPlan,
  categories,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  resetFilters,
  handleExport,
  viewMode,
  setViewMode,
  isRefreshing,
  onRefresh,
}: ModulesFiltersProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Boutons actions */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export */}
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>

          {/* Toggle Filtres */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-[#2A9D8F] text-white px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Toggle Vue */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
          {/* Filtre Catégorie */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtre Statut */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="beta">Beta</SelectItem>
              <SelectItem value="deprecated">Déprécié</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Plan */}
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Plan requis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les plans</SelectItem>
              <SelectItem value="gratuit">Gratuit</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="institutionnel">Institutionnel</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton Reset */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="sm:col-span-3"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
