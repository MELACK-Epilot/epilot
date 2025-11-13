/**
 * Page Utilisateurs - Version Refactorisée
 * Gestion des Super Admins et Administrateurs de Groupe
 * @module Users
 */

import { useState, useCallback } from 'react';
import { Plus, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '@/components/ui/pagination';
import { UserFormDialog } from '../../components/UserFormDialog';
import { getUserTableColumns } from './components/UserTableColumns';
import { UserStats } from './components/UserStats';
import { useUsersData } from './hooks/useUsersData';
import { useUsersPagination } from './hooks/useUsersPagination';
import { useUsersActions } from './hooks/useUsersActions';
import type { User } from '../../types/dashboard.types';
import type { UsersFilters, UsersState } from './types';
import { PAGE_SIZE_OPTIONS } from './constants';

export const Users = () => {
  // State - Filtres
  const [filters] = useState<UsersFilters>({
    searchQuery: '',
    statusFilter: 'all',
    schoolGroupFilter: 'all',
    dateFilter: 'all',
  });

  // State - UI
  const [state, setState] = useState<UsersState>({
    isCreateDialogOpen: false,
    isEditDialogOpen: false,
    isDetailDialogOpen: false,
    selectedUser: null,
    selectedUsers: [],
    activeTab: 'all',
  });

  // Hooks personnalisés
  const pagination = useUsersPagination();
  const {
    users,
    stats,
    schoolGroups: _schoolGroups,
    totalItems,
    totalPages,
    isLoading,
    error,
    isError,
  } = useUsersData(filters, {
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    totalItems: 0,
    totalPages: 0,
  });

  const { handleDelete, handleResetPassword, handleExport } = useUsersActions();

  // Handlers - Dialog
  const handleEdit = useCallback((user: User) => {
    setState((prev) => ({
      ...prev,
      selectedUser: user,
      isEditDialogOpen: true,
    }));
  }, []);

  const handleViewDetails = useCallback((user: User) => {
    setState((prev) => ({
      ...prev,
      selectedUser: user,
      isDetailDialogOpen: true,
    }));
  }, []);

  const handleCloseDialogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDetailDialogOpen: false,
      selectedUser: null,
    }));
  }, []);

  // Colonnes du tableau
  const columns = getUserTableColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onResetPassword: handleResetPassword,
    onViewDetails: handleViewDetails,
  });

  // Gestion d'erreur
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Erreur de chargement</h3>
              <p className="text-sm text-red-700">
                {error?.message || 'Impossible de charger les utilisateurs. Veuillez réessayer.'}
              </p>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">
            Gestion de tous les utilisateurs de votre groupe scolaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport(users, 'csv')}>
                📄 Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(users, 'excel')}>
                📊 Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(users, 'pdf')}>
                📋 Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setState((prev) => ({ ...prev, isCreateDialogOpen: true }))}
            className="bg-[#2A9D8F] hover:bg-[#1D3557]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Admin Groupe
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && <UserStats stats={stats} isLoading={isLoading} />}

      {/* TODO: Ajouter UserFilters component */}
      {/* TODO: Ajouter UserCharts component */}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable columns={columns} data={users || []} isLoading={isLoading} />

        {/* Pagination */}
        {!isLoading && users.length > 0 && (
          <div className="border-t border-gray-200 py-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              pageSize={pagination.pageSize}
              totalItems={totalItems}
              onPageChange={pagination.handlePageChange}
              onPageSizeChange={pagination.handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={state.isCreateDialogOpen}
        onOpenChange={(open: boolean) => !open && handleCloseDialogs()}
        mode="create"
      />

      <UserFormDialog
        open={state.isEditDialogOpen}
        onOpenChange={(open: boolean) => !open && handleCloseDialogs()}
        mode="edit"
        user={state.selectedUser || undefined}
      />

      {/* TODO: Ajouter UserDetailDialog component */}
    </div>
  );
};
