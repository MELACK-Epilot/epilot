/**
 * Composant Grille pour afficher les modules
 * @module ModuleGrid
 */

import { ModuleCard } from './ModuleCard';
import type { ModuleEnrichi, ViewMode } from '../types/proviseur-modules.types';

interface ModuleGridProps {
  modules: ModuleEnrichi[];
  viewMode: ViewMode;
  onModuleClick?: (module: ModuleEnrichi) => void;
  isLoading?: boolean;
}

export function ModuleGrid({ modules, viewMode, onModuleClick, isLoading }: ModuleGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Aucun module trouvé
        </h3>
        <p className="text-gray-500">
          Essayez de modifier vos filtres de recherche
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
      }
    >
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onClick={() => onModuleClick?.(module)}
        />
      ))}
    </div>
  );
}
