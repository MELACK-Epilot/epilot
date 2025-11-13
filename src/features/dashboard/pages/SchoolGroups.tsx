/**
 * Page Gestion des Groupes Scolaires - VERSION REFACTORISÉE
 * Architecture modulaire avec composants réutilisables
 * @module SchoolGroups
 */

import { useState, useMemo } from 'react';
import {
  SchoolGroupFormDialog,
  SchoolGroupsStats,
  SchoolGroupsFilters,
  SchoolGroupsTable,
  SchoolGroupsGrid,
  SchoolGroupDetailsDialog,
  SchoolGroupsActions,
  DeleteConfirmDialog,
} from '../components/school-groups';
import { SchoolGroupModulesDialog } from '../components/school-groups/SchoolGroupModulesDialog';
import {
  useSchoolGroups,
  useDeleteSchoolGroup,
  useActivateSchoolGroup,
  useDeactivateSchoolGroup,
  useSuspendSchoolGroup,
  useSchoolGroupStats,
} from '../hooks/useSchoolGroups';
import type { SchoolGroup } from '../types/dashboard.types';
import { toast } from 'sonner';

/**
 * Composant principal - Page Groupes Scolaires
 */
export const SchoolGroups = () => {
  // 1. Hooks React Query
  const schoolGroupsQuery = useSchoolGroups();
  const schoolGroups = schoolGroupsQuery.data || [];
  const isLoading = schoolGroupsQuery.isLoading;
  const { data: stats } = useSchoolGroupStats();
  const deleteSchoolGroup = useDeleteSchoolGroup();
  const activateSchoolGroup = useActivateSchoolGroup();
  const deactivateSchoolGroup = useDeactivateSchoolGroup();
  const suspendSchoolGroup = useSuspendSchoolGroup();

  // 2. États locaux
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<SchoolGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 3. Logique de filtrage
  const filteredData = useMemo(() => {
    return schoolGroups.filter((group) => {
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          group.name.toLowerCase().includes(query) ||
          group.code.toLowerCase().includes(query) ||
          group.region.toLowerCase().includes(query) ||
          group.city.toLowerCase().includes(query) ||
          group.adminName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtres
      if (filterStatus !== 'all' && group.status !== filterStatus) return false;
      if (filterPlan !== 'all' && group.plan !== filterPlan) return false;
      if (filterRegion !== 'all' && group.region !== filterRegion) return false;

      return true;
    });
  }, [schoolGroups, searchQuery, filterStatus, filterPlan, filterRegion]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(schoolGroups.map((g) => g.region)));
  }, [schoolGroups]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterPlan !== 'all') count++;
    if (filterRegion !== 'all') count++;
    return count;
  }, [filterStatus, filterPlan, filterRegion]);

  // 4. Handlers
  const handleView = (group: SchoolGroup) => {
    setSelectedGroup(group);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (group: SchoolGroup) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleViewModules = (group: SchoolGroup) => {
    setSelectedGroup(group);
    setIsModulesDialogOpen(true);
  };

  const handleDeleteClick = (group: SchoolGroup) => {
    setGroupToDelete(group);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    try {
      await deleteSchoolGroup.mutateAsync(groupToDelete.id);
      toast.success('✅ Groupe supprimé', {
        description: `${groupToDelete.name} a été supprimé définitivement`,
      });
      setGroupToDelete(null);
    } catch (error) {
      toast.error('❌ Erreur', {
        description: error instanceof Error ? error.message : 'Impossible de supprimer le groupe',
      });
    }
  };

  const handleActivate = async (group: SchoolGroup) => {
    try {
      await activateSchoolGroup.mutateAsync(group.id);
      toast.success('✅ Groupe activé', {
        description: `${group.name} est maintenant actif`,
      });
    } catch (error) {
      toast.error('❌ Erreur', {
        description: error instanceof Error ? error.message : 'Impossible d\'activer le groupe',
      });
    }
  };

  const handleDeactivate = async (group: SchoolGroup) => {
    try {
      await deactivateSchoolGroup.mutateAsync(group.id);
      toast.success('✅ Groupe désactivé', {
        description: `${group.name} a été désactivé`,
      });
    } catch (error) {
      toast.error('❌ Erreur', {
        description: error instanceof Error ? error.message : 'Impossible de désactiver le groupe',
      });
    }
  };

  const handleSuspend = async (group: SchoolGroup) => {
    try {
      await suspendSchoolGroup.mutateAsync(group.id);
      toast.success('⚠️ Groupe suspendu', {
        description: `${group.name} a été suspendu`,
      });
    } catch (error) {
      toast.error('❌ Erreur', {
        description: error instanceof Error ? error.message : 'Impossible de suspendre le groupe',
      });
    }
  };

  const handleExport = () => {
    // Export CSV
    const csvContent = [
      ['Nom', 'Code', 'Région', 'Ville', 'Admin', 'Plan', 'Statut'].join(','),
      ...filteredData.map(g => 
        [g.name, g.code, g.region, g.city, g.adminName, g.plan, g.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groupes_scolaires_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('✅ Export réussi', {
      description: `${filteredData.length} groupe(s) exporté(s)`,
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPlan('all');
    setFilterRegion('all');
  };

  const handleBulkDelete = () => {
    toast.info('Suppression en masse en cours...');
  };

  const handleBulkActivate = () => {
    toast.info('Activation en masse en cours...');
  };

  const handleBulkDeactivate = () => {
    toast.info('Désactivation en masse en cours...');
  };

  // 5. Rendu - Composition des composants
  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <SchoolGroupsActions
        selectedRows={selectedRows}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onClearSelection={() => setSelectedRows([])}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      {/* Stats Cards */}
      <SchoolGroupsStats stats={stats} isLoading={isLoading} />

      {/* Filtres */}
      <SchoolGroupsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPlan={filterPlan}
        setFilterPlan={setFilterPlan}
        filterRegion={filterRegion}
        setFilterRegion={setFilterRegion}
        uniqueRegions={uniqueRegions}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
        handleExport={handleExport}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isRefreshing={schoolGroupsQuery.isRefetching}
        onRefresh={() => schoolGroupsQuery.refetch()}
      />

      {/* Affichage conditionnel : Table ou Grid */}
      {viewMode === 'list' ? (
        <SchoolGroupsTable
          data={filteredData}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onSuspend={handleSuspend}
          onViewModules={handleViewModules}
        />
      ) : (
        <SchoolGroupsGrid
          data={filteredData}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onSuspend={handleSuspend}
        />
      )}

      {/* Dialog Détails */}
      <SchoolGroupDetailsDialog
        group={selectedGroup}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedGroup(null);
        }}
        onEdit={handleEdit}
      />

      {/* Modal Création */}
      <SchoolGroupFormDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      {/* Modal Édition */}
      <SchoolGroupFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        schoolGroup={selectedGroup}
        mode="edit"
      />

      {/* Dialog Suppression Professionnel */}
      <DeleteConfirmDialog
        group={groupToDelete}
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteSchoolGroup.isPending}
      />

      {/* Dialog Modules & Catégories */}
      <SchoolGroupModulesDialog
        schoolGroup={selectedGroup}
        isOpen={isModulesDialogOpen}
        onClose={() => {
          setIsModulesDialogOpen(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
};

export default SchoolGroups;
