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
import { SchoolGroupsCharts } from '../components/school-groups/SchoolGroupsCharts';
import { AdvancedFilters } from '../components/school-groups/AdvancedFilters';
import type { AdvancedFiltersState } from '../components/school-groups/AdvancedFilters';
import {
  useSchoolGroups,
  useSchoolGroupStats,
} from '../hooks/useSchoolGroups';
import { useSchoolGroupsLogic } from '../hooks/useSchoolGroupsLogic';
import { useSchoolGroupsActions } from '../hooks/useSchoolGroupsActions';
import { useExportPDF } from '../hooks/useExportPDF';
import { useImportCSV, useDownloadCSVTemplate } from '../hooks/useImportCSV';
import type { SchoolGroup } from '../types/dashboard.types';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({});

  // 4. Hooks pour nouvelles fonctionnalités
  const exportPDF = useExportPDF();
  const importCSV = useImportCSV();
  const downloadTemplate = useDownloadCSVTemplate();

  // 5. Handlers pour nouvelles fonctionnalités
  const handleExportPDF = () => {
    exportPDF.mutate({
      data: logic.filteredData,
      options: {
        title: 'Groupes Scolaires - E-Pilot Congo',
        includeStats: true,
        filters: `${logic.activeFiltersCount} filtre(s) actif(s)`,
      },
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importCSV.mutate(file, {
        onSuccess: (result) => {
          toast.success(`✅ Import réussi: ${result.success} groupe(s)`, {
            description: result.errors.length > 0 
              ? `${result.errors.length} erreur(s) détectée(s)` 
              : 'Tous les groupes ont été importés',
          });
          // Rafraîchir la liste
          schoolGroupsQuery.refetch();
        },
        onError: (error) => {
          toast.error('❌ Erreur d\'import', {
            description: error instanceof Error ? error.message : 'Impossible d\'importer le fichier',
          });
        },
      });
    }
  };

  // 6. Handlers UI
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

  // 7. Rendu - Composition des composants
  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions + Nouvelles fonctionnalités */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557]">Groupes Scolaires</h1>
          <p className="text-gray-600 mt-1">Gérez les établissements et leurs administrateurs</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportPDF.isPending}
          >
            <FileText className="w-4 h-4 mr-2" />
            {exportPDF.isPending ? 'Export...' : 'Export PDF'}
          </Button>

          {/* Template CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Template CSV
          </Button>

          {/* Import CSV */}
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importCSV.isPending}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importCSV.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importCSV.isPending ? 'Import...' : 'Import CSV'}
            </Button>
          </div>

          {/* Filtres avancés */}
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onReset={() => setAdvancedFilters({})}
          />
        </div>
      </div>

      {/* Actions groupées */}
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

      {/* Onglets: Liste / Statistiques */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'stats')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Onglet Liste */}
        <TabsContent value="list" className="mt-6">
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
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="stats" className="mt-6">
          <SchoolGroupsCharts data={schoolGroups} />
        </TabsContent>
      </Tabs>

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
