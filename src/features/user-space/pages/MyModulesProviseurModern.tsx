/**
 * Interface Moderne pour les Modules du Proviseur - VERSION REFACTORISÉE
 * Design moderne avec composants modulaires
 * @module MyModulesProviseurModern
 */

import { useState, useMemo } from 'react';
import { Package, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { useProviseurModules, type ProviseurModule } from '@/hooks/useProviseurModules';
import { ProviseurKPICards } from '../components/ProviseurKPICards';
import { ModuleFilters } from '../components/ModuleFilters';
import { ModuleGrid } from '../components/ModuleGrid';
import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();
  const { modules, stats, isLoading, error } = useProviseurModules();
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

  // Calculer les stats pour les KPI avec données réelles
  const kpiStats = useMemo(() => ({
    totalModules: stats?.totalModules || modules.length,
    activeModules: stats?.modulesActifs || modules.filter(m => m.is_enabled).length,
    totalAccess: stats?.totalAccess || modules.reduce((sum, m) => sum + m.access_count, 0),
    categoriesCount: stats?.categoriesCount || categories.length,
    lastAccessDate: stats?.lastAccessDate || null,
    growthRate: 12, // TODO: Calculer le vrai taux de croissance
  }), [modules, categories, stats]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Moderne */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-sm hover:shadow-lg transition-all duration-500 relative overflow-hidden group">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-purple-100/20 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-1">
                  Mes Modules
                </h1>
                <p className="text-gray-600 text-lg font-medium">
                  Bienvenue {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            
            {/* Bouton Dashboard Directeur */}
            {user?.role && ['proviseur', 'directeur', 'directeur_etudes'].includes(user.role.toString()) && (
              <Button
                onClick={() => navigate('/user/dashboard-director')}
                className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f] text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Vue d'Ensemble École
              </Button>
            )}
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
