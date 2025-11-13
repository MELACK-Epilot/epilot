/**
 * Page Modules Pédagogiques - VERSION COMPLÈTE
 * Architecture modulaire avec composants réutilisables
 * Relation obligatoire : Module → Catégorie
 * @module Modules
 */

import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  ModulesStats,
  ModulesFilters,
  ModulesGrid,
  ModuleFormDialog,
} from '../components/modules';
import {
  useModules,
  useDeleteModule,
  useModuleStats,
} from '../hooks/useModules';
import { useCategories } from '../hooks/useCategories';
import { toast } from 'sonner';

/**
 * Composant principal - Page Modules
 */
export const Modules = () => {
  // 1. Hooks React Query
  const modulesQuery = useModules();
  const modules = modulesQuery.data || [];
  const isLoading = modulesQuery.isLoading;
  const { data: stats } = useModuleStats();
  const { data: categories } = useCategories();
  const deleteModule = useDeleteModule();

  // 2. États locaux
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // 3. Logique de filtrage
  const filteredData = useMemo(() => {
    return modules.filter((module: any) => {
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          module.name.toLowerCase().includes(query) ||
          module.slug.toLowerCase().includes(query) ||
          module.description?.toLowerCase().includes(query) ||
          module.categoryName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtres
      if (filterStatus !== 'all' && module.status !== filterStatus) return false;
      if (filterCategory !== 'all' && module.categoryId !== filterCategory) return false;
      if (filterPlan !== 'all' && module.requiredPlan !== filterPlan) return false;

      return true;
    });
  }, [modules, searchQuery, filterStatus, filterCategory, filterPlan]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterCategory !== 'all') count++;
    if (filterPlan !== 'all') count++;
    return count;
  }, [filterStatus, filterCategory, filterPlan]);

  // 4. Handlers
  const handleView = (module: any) => {
    toast.info('Détails du module', {
      description: `${module.name} - ${module.categoryName}`,
    });
  };

  const handleEdit = (module: any) => {
    setSelectedModule(module);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (module: any) => {
    setModuleToDelete(module);
  };

  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;

    try {
      await deleteModule.mutateAsync(moduleToDelete.id);
      toast.success('✅ Module supprimé', {
        description: `${moduleToDelete.name} a été supprimé avec succès`,
      });
      setModuleToDelete(null);
    } catch (error) {
      toast.error('❌ Erreur', {
        description: 'Impossible de supprimer le module',
      });
    }
  };

  const handleExport = () => {
    toast.info('Export en cours...', {
      description: 'Génération du fichier CSV',
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPlan('all');
  };

  // 5. Rendu - Composition des composants
  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modules Pédagogiques</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les modules disponibles sur la plateforme. Chaque module doit appartenir à une catégorie.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#2A9D8F] hover:bg-[#1D3557]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un module
        </Button>
      </div>

      {/* Stats Cards */}
      <ModulesStats stats={stats} isLoading={isLoading} />

      {/* Filtres */}
      <ModulesFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterPlan={filterPlan}
        setFilterPlan={setFilterPlan}
        categories={categories || []}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
        handleExport={handleExport}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isRefreshing={modulesQuery.isRefetching}
        onRefresh={() => modulesQuery.refetch()}
      />

      {/* Affichage Grid */}
      <ModulesGrid
        data={filteredData}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Modal Création */}
      <ModuleFormDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      {/* Modal Édition */}
      <ModuleFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        module={selectedModule}
        mode="edit"
      />

      {/* AlertDialog Suppression */}
      <AlertDialog open={!!moduleToDelete} onOpenChange={() => setModuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le module "{moduleToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-[#E63946] hover:bg-[#c52030]"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Modules;
