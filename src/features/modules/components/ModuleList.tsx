/**
 * Liste de modules avec filtres et recherche
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import type { Module } from '../types/module.types';

interface ModuleListProps {
  modules: Module[];
  assignedModuleIds?: Set<string>;
  onToggle?: (moduleId: string, assigned: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
}

export const ModuleList = ({
  modules,
  assignedModuleIds = new Set(),
  onToggle,
  isLoading = false,
  disabled = false,
  emptyMessage = 'Aucun module disponible',
}: ModuleListProps) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Filtrer modules
  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      // Filtre recherche
      const matchSearch = search === '' || 
        module.name.toLowerCase().includes(search.toLowerCase()) ||
        module.description?.toLowerCase().includes(search.toLowerCase());

      // Filtre plan
      const matchPlan = planFilter === 'all' || 
        module.required_plan === planFilter;

      return matchSearch && matchPlan;
    });
  }, [modules, search, planFilter]);

  // Stats par plan
  const planStats = useMemo(() => {
    const stats = {
      all: modules.length,
      gratuit: 0,
      premium: 0,
      pro: 0,
      institutionnel: 0,
    };

    modules.forEach(module => {
      stats[module.required_plan]++;
    });

    return stats;
  }, [modules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtre plan */}
        <div className="flex gap-2">
          <Button
            variant={planFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlanFilter('all')}
            className={planFilter === 'all' ? 'bg-[#2A9D8F]' : ''}
          >
            Tous ({planStats.all})
          </Button>
          <Button
            variant={planFilter === 'gratuit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlanFilter('gratuit')}
            className={planFilter === 'gratuit' ? 'bg-green-600' : ''}
          >
            Gratuit ({planStats.gratuit})
          </Button>
          <Button
            variant={planFilter === 'premium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlanFilter('premium')}
            className={planFilter === 'premium' ? 'bg-blue-600' : ''}
          >
            Premium ({planStats.premium})
          </Button>
        </div>
      </div>

      {/* Résultats */}
      <div className="text-sm text-gray-500">
        {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
      </div>

      {/* Liste */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              isAssigned={assignedModuleIds.has(module.id)}
              onToggle={onToggle || (() => {})}
              disabled={disabled || !onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
