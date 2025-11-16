/**
 * Skeleton Loader pour la grille de modules
 * Affiche la structure pendant le chargement
 */

import type { ViewMode } from '../types/proviseur-modules.types';

interface ModuleGridSkeletonProps {
  viewMode: ViewMode;
}

export function ModuleGridSkeleton({ viewMode }: ModuleGridSkeletonProps) {
  const skeletonCount = viewMode === 'grid' ? 6 : 4;
  
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
      }
    >
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="animate-pulse space-y-4">
            {/* Icône + Badge */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* Titre */}
            <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
