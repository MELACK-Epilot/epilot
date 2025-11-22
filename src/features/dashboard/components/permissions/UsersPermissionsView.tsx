/**
 * Vue Utilisateurs pour Permissions & Modules
 * Réutilise les composants existants d'AssignModules
 * @module UsersPermissionsView
 */

import { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '../../hooks/useDebounceValue';
import type { AssignModulesUser, SortConfig } from '../../types/assign-modules.types';
import { toast } from 'sonner';

// Composants réutilisés
import { AssignModulesFilters } from '../assign-modules/AssignModulesFilters';
import { UserTableView } from '../assign-modules/UserTableView';
import { UserModulesDialog } from "../users/UserModulesDialog.v5";
import { DuplicatePermissionsDialog } from '../users/DuplicatePermissionsDialog';
import { ViewPermissionsDialog } from '../users/ViewPermissionsDialog';
import { supabase } from '@/lib/supabase';

interface UsersPermissionsViewProps {
  users: AssignModulesUser[];
  modules: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const UsersPermissionsView = ({
  users,
  isLoading,
  onRefresh,
}: UsersPermissionsViewProps) => {

  // États
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedUser, setSelectedUser] = useState<AssignModulesUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPermissionsOpen, setViewPermissionsOpen] = useState(false);
  const [userForViewPermissions, setUserForViewPermissions] = useState<AssignModulesUser | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [sourceUserForDuplicate, setSourceUserForDuplicate] = useState<AssignModulesUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });

  // Liste des écoles
  const schools = useMemo(() => {
    const schoolsMap = new Map<string, string>();
    users.forEach((u: AssignModulesUser) => {
      if (u.schoolId && u.schoolName) {
        schoolsMap.set(u.schoolId, u.schoolName);
      }
    });
    return Array.from(schoolsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  // Filtrer et trier
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users.filter((user: AssignModulesUser) => {
      // Filtrer super_admin
      const matchSearch = debouncedSearch === '' ||
        user.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchSchool = schoolFilter === 'all' || user.schoolId === schoolFilter;

      return matchSearch && matchRole && matchStatus && matchSchool;
    });

    // Tri
    filtered.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.field) {
        case 'name':
          return direction * (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
        case 'email':
          return direction * a.email.localeCompare(b.email);
        case 'role':
          return direction * a.role.localeCompare(b.role);
        case 'modulesCount':
          return direction * ((a.assignedModulesCount || 0) - (b.assignedModulesCount || 0));
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, debouncedSearch, roleFilter, statusFilter, schoolFilter, sortConfig]);

  const availableRoles = useMemo(() => {
    const roles = new Set(users.map((u: AssignModulesUser) => u.role));
    return Array.from(roles).sort();
  }, [users]);

  // Stats pour filtres
  const stats = useMemo(() => {
    const roleCount: Record<string, number> = {};
    filteredUsers.forEach((user) => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });

    return {
      totalUsers: users.length,
      roleCount,
    };
  }, [users, filteredUsers]);

  // Handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedUsers(filteredUsers.map(u => u.id));
    toast.success(`${filteredUsers.length} utilisateurs sélectionnés`);
  };

  const deselectAll = () => {
    setSelectedUsers([]);
  };

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleAssignModules = (user: AssignModulesUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleViewPermissions = (user: AssignModulesUser) => {
    setUserForViewPermissions(user);
    setViewPermissionsOpen(true);
  };

  const handleBulkAssign = () => {
    if (selectedUsers.length === 0) {
      toast.error('Aucun utilisateur sélectionné');
      return;
    }
    toast.info(`Assignation en masse pour ${selectedUsers.length} utilisateur(s)`);
    // TODO: Implémenter bulk assign
  };

  const handleDuplicatePermissions = (user: AssignModulesUser) => {
    setSourceUserForDuplicate(user);
    setDuplicateDialogOpen(true);
  };

  const handleToggleStatus = async (user: AssignModulesUser) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await (supabase as any)
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`${user.firstName} ${user.lastName} ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
      onRefresh();
    } catch (error: any) {
      toast.error('Erreur lors du changement de statut', {
        description: error.message
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin_groupe: 'Admin Groupe',
      proviseur: 'Proviseur',
      directeur: 'Directeur',
      enseignant: 'Enseignant',
      cpe: 'CPE',
      comptable: 'Comptable',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin_groupe: 'bg-blue-100 text-blue-700 border-blue-200',
      proviseur: 'bg-green-100 text-green-700 border-green-200',
      directeur: 'bg-green-100 text-green-700 border-green-200',
      enseignant: 'bg-orange-100 text-orange-700 border-orange-200',
      cpe: 'bg-purple-100 text-purple-700 border-purple-200',
      comptable: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Actions et Filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedUsers.length > 0 && (
            <>
              <Badge variant="secondary" className="px-3 py-2 text-sm">
                {selectedUsers.length} sélectionné(s)
              </Badge>
              <Button onClick={handleBulkAssign} className="bg-[#2A9D8F] hover:bg-[#238276]">
                <UserPlus className="h-4 w-4 mr-2" />
                Assigner en masse
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                Tout désélectionner
              </Button>
            </>
          )}
        </div>

        <Button onClick={selectAll} variant="outline" size="sm">
          Tout sélectionner
        </Button>
      </div>

      {/* Filtres */}
      <AssignModulesFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        schoolFilter={schoolFilter}
        setSchoolFilter={setSchoolFilter}
        availableRoles={availableRoles}
        schools={schools}
        stats={stats}
        filteredUsersCount={filteredUsers.length}
        selectedUsersCount={selectedUsers.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        getRoleLabel={getRoleLabel}
      />

      {/* Tableau */}
      <UserTableView
        users={filteredUsers}
        selectedUsers={selectedUsers}
        sortConfig={sortConfig}
        isLoading={isLoading}
        onSort={handleSort}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onToggleUserSelection={toggleUserSelection}
        onAssignModules={handleAssignModules}
        onViewPermissions={handleViewPermissions}
        onDuplicatePermissions={handleDuplicatePermissions}
        onToggleStatus={handleToggleStatus}
        getRoleLabel={getRoleLabel}
        getRoleBadgeColor={getRoleBadgeColor}
      />

      {/* Modals */}
      {selectedUser && (
        <UserModulesDialog
          user={selectedUser}
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedUser(null);
            onRefresh();
          }}
        />
      )}

      <ViewPermissionsDialog
        user={userForViewPermissions}
        isOpen={viewPermissionsOpen}
        onClose={() => {
          setViewPermissionsOpen(false);
          setUserForViewPermissions(null);
        }}
      />

      <DuplicatePermissionsDialog
        sourceUser={sourceUserForDuplicate}
        targetUsers={users.filter(u => u.id !== sourceUserForDuplicate?.id)}
        isOpen={duplicateDialogOpen}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setSourceUserForDuplicate(null);
          onRefresh();
        }}
      />
    </div>
  );
};
