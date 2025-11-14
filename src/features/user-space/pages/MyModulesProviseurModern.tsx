/**
 * Interface Moderne pour les Modules du Proviseur - VERSION REFACTORISÉE
 * Design moderne avec composants modulaires
 * @module MyModulesProviseurModern
 */

import { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { useProviseurModules, type ProviseurModule } from '@/hooks/useProviseurModules';
import { ProviseurKPICards } from '../components/ProviseurKPICards';
import { ModuleFilters } from '../components/ModuleFilters';
import { ModuleGrid } from '../components/ModuleGrid';
import { mapIconNameToComponent, getModuleIcon, getCategoryColor, getModuleDescription } from '../utils/module-helpers';
import { useModuleNavigation } from '../utils/module-navigation';
import type { ModuleEnrichi, ViewMode, SortOption } from '../types/proviseur-modules.types';

/**
 * Fonction pour vérifier si un module est nouveau (< 7 jours)
 */
function isModuleNew(assignedAt: string): boolean {
  const assignedDate = new Date(assignedAt);
  const daysSinceAssigned = (Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceAssigned < 7;
}

/**
 * Fonction pour enrichir un module avec les métadonnées d'affichage
 */
function enrichModule(module: ProviseurModule): ModuleEnrichi {
  const iconFromName = mapIconNameToComponent(module.module_icon);
  const finalIcon = iconFromName || getModuleIcon(module.module_slug);
  
  return {
    ...module,
    name: module.module_name,
    slug: module.module_slug,
    description: module.module_description || getModuleDescription(module.module_slug),
    icon: finalIcon,
    color: module.category_color || getCategoryColor(module.category_name),
    isNew: isModuleNew(module.assigned_at),
    isPopular: module.access_count > 20,
  };
}

/**
 * Fonction pour trier les modules
 */
function sortModules(a: ModuleEnrichi, b: ModuleEnrichi, sortBy: SortOption): number {
  switch (sortBy) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'recent':
      return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
    case 'popular':
      return b.access_count - a.access_count;
    default:
      return 0;
  }
}

/**
 * Page principale des modules du Proviseur
 */
export default function MyModulesProviseurModern() {
  const { user } = useAuth();
  const { modules, isLoading, error } = useProviseurModules();
  const { navigateToModule } = useModuleNavigation();
  
  // États pour l'interface
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Enrichir les modules avec les métadonnées d'affichage
  const modulesEnrichis = useMemo<ModuleEnrichi[]>(() => {
    return modules.map(enrichModule);
  }, [modules]);

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    return Array.from(new Set(modules.map(m => m.category_name))).sort();
  }, [modules]);

  // Filtrer et trier les modules
  const filteredModules = useMemo(() => {
    return modulesEnrichis
      .filter(module => {
        const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            module.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || module.category_name === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => sortModules(a, b, sortBy));
  }, [modulesEnrichis, searchQuery, selectedCategory, sortBy]);

  // Calculer les stats pour les KPI
  const kpiStats = useMemo(() => ({
    totalModules: modules.length,
    activeModules: modules.filter(m => m.is_enabled).length,
    totalAccess: modules.reduce((sum, m) => sum + m.access_count, 0),
    categoriesCount: categories.length,
  }), [modules, categories]);

  // Gérer le clic sur un module avec navigation automatique
  const handleModuleClick = (module: ModuleEnrichi) => {
    console.log('🎯 [MyModules] Module cliqué:', module.name);
    navigateToModule(module); // ⭐ Navigation avec contexte automatique (école + groupe)
  };

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
        <p className="text-gray-600 text-center max-w-md">{String(error)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mes Modules
              </h1>
              <p className="text-gray-600">
                Bienvenue {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <ProviseurKPICards {...kpiStats} />

        {/* Filtres */}
        <ModuleFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={filteredModules.length}
        />

        {/* Grille de modules */}
        <ModuleGrid
          modules={filteredModules}
          viewMode={viewMode}
          onModuleClick={handleModuleClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
