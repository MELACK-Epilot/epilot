/**
 * Composant Filtres pour la page Groupes Scolaires
 */

import { Search, Filter, X, Download, RefreshCw, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SchoolGroupsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterPlan: string;
  setFilterPlan: (value: string) => void;
  filterRegion: string;
  setFilterRegion: (value: string) => void;
  uniqueRegions: string[];
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  activeFiltersCount: number;
  resetFilters: () => void;
  handleExport: () => void;
  viewMode: 'list' | 'grid';
  setViewMode: (value: 'list' | 'grid') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const SchoolGroupsFilters = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPlan,
  setFilterPlan,
  filterRegion,
  setFilterRegion,
  uniqueRegions,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  resetFilters,
  handleExport,
  viewMode,
  setViewMode,
  isRefreshing,
  onRefresh,
}: SchoolGroupsFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>

          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filtres</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Statut
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Plan
              </label>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="gratuit">Gratuit</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="institutionnel">Institutionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Région
              </label>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
