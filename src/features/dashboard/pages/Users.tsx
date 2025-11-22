/**
 * Page Utilisateurs - VERSION REFACTORISÉE
 * Architecture modulaire avec composants réutilisables
 * @module Users
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '../components/DataTable';
import { GroupUserFormDialog } from '../components/users/GroupUserFormDialog';
import { UserProfileDialog } from '../components/users/UserProfileDialog';
import { UserDetailsDialog } from '../components/users/UserDetailsDialog';
import { DeleteUserDialog } from '../components/users/DeleteUserDialog';
import { AnimatedContainer } from '../components/AnimatedCard';
import { UsersStats, UsersFilters, UsersCharts, UsersGridView } from '../components/users';
import { UserModulesDialog } from '../components/users/UserModulesDialog.v5';
import { getUsersColumns } from '../components/users/UsersTableColumns';
import { useUsers, useUserStats, useDeleteUser, useResetPassword, useUsersRealtime, userKeys, useUserEvolutionStats, useUserDistributionStats } from '../hooks/useUsers';
import { useSchools } from '../hooks/useSchools-simple';
import { useSchoolGroups } from '../hooks/useSchoolGroups';
import { useLoginHistory } from '../hooks/useUserProfile';
import type { User } from '../types/dashboard.types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Pagination } from '@/components/ui/pagination';
import type { PaginatedUsers } from '../hooks/useUsers';
import { useAuth } from '@/features/auth/store/auth.store';

export const Users = () => {
  const { user: currentUser } = useAuth();
  
  // Normaliser le rôle pour gérer les alias
  const normalizeRole = (role: string | undefined): string => {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'group_admin': 'admin_groupe',
      'school_admin': 'admin_ecole',
    };
    return roleMap[role] || role;
  };
  
  const normalizedRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = normalizedRole === 'super_admin';
  
  // 1. États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [schoolGroupFilter, setSchoolGroupFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // Vue par défaut : tableau
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUserForModules, setSelectedUserForModules] = useState<User | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // 2. Hooks
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  
  // FILTRAGE AUTOMATIQUE pour Admin Groupe
  const effectiveSchoolGroupId = isSuperAdmin 
    ? (schoolGroupFilter !== 'all' ? schoolGroupFilter : undefined)
    : currentUser?.schoolGroupId;
  
  const { data: paginatedData, isLoading, error, isError } = useUsers({
    query: debouncedSearch,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    schoolGroupId: effectiveSchoolGroupId,
    schoolId: schoolFilter !== 'all' ? schoolFilter : undefined,
    page: currentPage,
    pageSize: pageSize,
  });
  
  const users = (paginatedData as PaginatedUsers)?.users || [];
  const totalCount = (paginatedData as PaginatedUsers)?.total || 0;
  const totalPages = (paginatedData as PaginatedUsers)?.totalPages || 1;
  
  const { data: stats } = useUserStats(effectiveSchoolGroupId);
  const { data: evolutionStats, isLoading: isEvolutionLoading } = useUserEvolutionStats(effectiveSchoolGroupId);
  const { data: distributionStats, isLoading: isDistributionLoading } = useUserDistributionStats(effectiveSchoolGroupId);

  const { data: schools = [] } = useSchools({ 
    school_group_id: effectiveSchoolGroupId 
  });
  
  // Charger les groupes scolaires pour Super Admin
  const { data: schoolGroupsData } = useSchoolGroups();
  const schoolGroups = schoolGroupsData || [];
  
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const queryClient = useQueryClient();
  
  // Charger l'historique de connexion de l'utilisateur sélectionné
  const { data: loginHistoryData } = useLoginHistory(selectedUser?.id, 5);
  
  // Activer le temps réel
  useUsersRealtime({ schoolGroupId: effectiveSchoolGroupId });

  // 3. Handlers
  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  }, []);

  const handleView = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  }, []);

  const handleDelete = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} a été supprimé(e) définitivement`);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  }, [selectedUser, deleteUser]);

  const handleResetPassword = useCallback(async (user: User) => {
    if (confirm(`Envoyer un email de réinitialisation à ${user.email} ?`)) {
      try {
        await resetPassword.mutateAsync(user.email);
        toast.success('Email de réinitialisation envoyé');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de l\'envoi');
      }
    }
  }, [resetPassword]);

  const handleAssignModules = useCallback((user: User) => {
    setSelectedUserForModules(user);
  }, []);

  const handleOpenProfile = useCallback(() => {
    setIsProfileDialogOpen(true);
  }, []);

  const handleExport = (exportFormat: 'csv' | 'excel' | 'pdf') => {
    try {
      if (exportFormat === 'csv') {
        const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Groupe Scolaire'];
        const rows = users.map(u => [
          u.firstName,
          u.lastName,
          u.email,
          u.phone || '',
          u.role,
          u.status,
          u.schoolGroupName || 'N/A'
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `utilisateurs_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success(`Export ${exportFormat.toUpperCase()} réussi ! ${users.length} utilisateur(s) exporté(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('Aucun utilisateur sélectionné');
      return;
    }
    
    const actionLabels = {
      activate: 'activer',
      deactivate: 'désactiver',
      delete: 'supprimer'
    };
    
    if (confirm(`Êtes-vous sûr de vouloir ${actionLabels[action]} ${selectedUsers.length} utilisateur(s) ?`)) {
      toast.success(`${selectedUsers.length} utilisateur(s) ${actionLabels[action]}é(s)`);
      setSelectedUsers([]);
    }
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 4. Prefetching
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPageFilters = {
        query: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        schoolGroupId: effectiveSchoolGroupId,
        schoolId: schoolFilter !== 'all' ? schoolFilter : undefined,
        page: currentPage + 1,
        pageSize: pageSize,
      };
      
      queryClient.prefetchQuery({
        queryKey: userKeys.list(nextPageFilters),
        queryFn: async () => null,
      });
    }
  }, [currentPage, totalPages, debouncedSearch, statusFilter, schoolFilter, effectiveSchoolGroupId, pageSize, queryClient]);

  // 5. Gestion d'erreur
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
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // 6. Colonnes du tableau
  const columns = useMemo(() => getUsersColumns({
    currentUser,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onResetPassword: handleResetPassword,
    onAssignModules: handleAssignModules,
    onOpenProfile: handleOpenProfile
  }), [currentUser, handleView, handleEdit, handleDelete, handleResetPassword, handleAssignModules, handleOpenProfile]);

  // 7. Rendu
  return (
    <AnimatedContainer className="space-y-6 p-6">
      {/* Filtres */}
      <UsersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        schoolFilter={schoolFilter}
        setSchoolFilter={setSchoolFilter}
        schoolGroupFilter={schoolGroupFilter}
        setSchoolGroupFilter={setSchoolGroupFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        isSuperAdmin={isSuperAdmin}
        viewMode={viewMode}
        setViewMode={setViewMode}
        schools={schools}
        schoolGroups={schoolGroups}
        onExport={handleExport}
        onCreateNew={() => setIsCreateDialogOpen(true)}
        selectedCount={selectedUsers.length}
        onBulkAction={handleBulkAction}
      />

      {/* Stats */}
      <UsersStats stats={stats} isLoading={isLoading} />

      {/* Graphiques */}
      <UsersCharts 
        evolutionStats={evolutionStats} 
        distributionStats={distributionStats} 
        isLoading={isEvolutionLoading || isDistributionLoading}
      />

      {/* Vue Tableau ou Cartes */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={users}
          searchKey="firstName"
          searchPlaceholder="Rechercher un utilisateur..."
          isLoading={isLoading}
          onRowClick={handleView}
        />
      ) : (
        <UsersGridView
          users={users}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
      />

      {/* Dialogs */}
      <GroupUserFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      <GroupUserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        mode="edit"
      />

      {/* Dialog Détails - Version Professionnelle */}
      <UserDetailsDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        user={selectedUser}
      />

      {/* Dialog Confirmation Suppression */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedUser={selectedUser}
        confirmDelete={confirmDelete}
        isDeleting={deleteUser.isPending}
      />

      {/* Dialog d'affectation des modules */}
      {selectedUserForModules && (
        <UserModulesDialog
          user={selectedUserForModules}
          isOpen={!!selectedUserForModules}
          onClose={() => setSelectedUserForModules(null)}
        />
      )}

      {/* Dialog Profil Personnel */}
      <UserProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </AnimatedContainer>
  );
};

export default Users;
