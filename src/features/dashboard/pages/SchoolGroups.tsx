/**
 * Page Gestion des Groupes Scolaires - VERSION REFACTORISÉE
 * Architecture modulaire avec hooks personnalisés
 * Respecte la limite de 350 lignes (@[/decouper])
 * @module SchoolGroups
 */

import { useState } from 'react';
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
  useSchoolGroupStats,
} from '../hooks/useSchoolGroups';
import { useSchoolGroupsLogic } from '../hooks/useSchoolGroupsLogic';
import { useSchoolGroupsActions } from '../hooks/useSchoolGroupsActions';
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

  // 2. Hooks métier personnalisés
  const logic = useSchoolGroupsLogic(schoolGroups);
  const actions = useSchoolGroupsActions();

  // 3. États UI locaux
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<SchoolGroup | null>(null);

  // 4. Handlers UI
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
      await actions.deleteSchoolGroup.mutateAsync(groupToDelete.id);
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
      await actions.activateSchoolGroup.mutateAsync(group.id);
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
      await actions.deactivateSchoolGroup.mutateAsync(group.id);
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
      await actions.suspendSchoolGroup.mutateAsync(group.id);
      toast.success('⚠️ Groupe suspendu', {
        description: `${group.name} a été suspendu`,
      });
    } catch (error) {
      toast.error('❌ Erreur', {
        description: error instanceof Error ? error.message : 'Impossible de suspendre le groupe',
      });
    }
  };

  // 5. Rendu - Composition des composants
  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <SchoolGroupsActions
        selectedRows={logic.selectedRows}
        onExport={() => actions.handleExport(logic.filteredData)}
        onBulkDelete={() => actions.handleBulkDelete(logic.selectedRows, () => logic.setSelectedRows([]))}
        onBulkActivate={() => actions.handleBulkActivate(logic.selectedRows, () => logic.setSelectedRows([]))}
        onBulkDeactivate={() => actions.handleBulkDeactivate(logic.selectedRows, () => logic.setSelectedRows([]))}
        onClearSelection={() => logic.setSelectedRows([])}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      {/* Stats Cards */}
      <SchoolGroupsStats stats={stats} isLoading={isLoading} />

      {/* Filtres */}
      <SchoolGroupsFilters
        searchQuery={logic.searchQuery}
        setSearchQuery={logic.setSearchQuery}
        filterStatus={logic.filterStatus}
        setFilterStatus={logic.setFilterStatus}
        filterPlan={logic.filterPlan}
        setFilterPlan={logic.setFilterPlan}
        filterRegion={logic.filterRegion}
        setFilterRegion={logic.setFilterRegion}
        uniqueRegions={logic.uniqueRegions}
        showFilters={logic.showFilters}
        setShowFilters={logic.setShowFilters}
        activeFiltersCount={logic.activeFiltersCount}
        resetFilters={logic.resetFilters}
        handleExport={() => actions.handleExport(logic.filteredData)}
        viewMode={logic.viewMode}
        setViewMode={logic.setViewMode}
        isRefreshing={schoolGroupsQuery.isRefetching}
        onRefresh={() => schoolGroupsQuery.refetch()}
      />

      {/* Affichage conditionnel : Table ou Grid */}
      {logic.viewMode === 'list' ? (
        <SchoolGroupsTable
          data={logic.paginatedData}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onSuspend={handleSuspend}
          onViewModules={handleViewModules}
          selectedRows={logic.selectedRows}
          onSelectionChange={logic.setSelectedRows}
          sortField={logic.sortField}
          sortDirection={logic.sortDirection}
          onSort={logic.handleSort}
          page={logic.page}
          pageSize={logic.pageSize}
          totalPages={logic.totalPages}
          totalItems={logic.sortedData.length}
          onPageChange={logic.setPage}
        />
      ) : (
        <SchoolGroupsGrid
          data={logic.paginatedData}
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
        isDeleting={actions.deleteSchoolGroup.isPending}
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
