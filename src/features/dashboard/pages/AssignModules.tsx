/**
 * Page Assignation des Modules - VERSION 3.0 REFACTORISÉE
 * Code découplé en composants réutilisables + Design harmonisé
 * @module AssignModules
 */

import { useState, useMemo } from 'react';
import { Shield, UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useUsers } from '../hooks/useUsers';
import { useSchoolGroupModules } from '../hooks/useSchoolGroupModules';
import { useAssignmentStats } from '../hooks/useAssignmentStats';
import { UserModulesDialog } from '../components/users/UserModulesDialog.v5';
import { DuplicatePermissionsDialog } from '../components/users/DuplicatePermissionsDialog';
import { ViewPermissionsDialog } from '../components/users/ViewPermissionsDialog';
import { useAuth } from '@/features/auth/store/auth.store';
import { useDebounce } from '../hooks/useDebounceValue';
import { supabase } from '@/lib/supabase';
import type { AssignModulesUser, SortConfig } from '../types/assign-modules.types';
import { toast } from 'sonner';

// Composants découplés
import { AssignModulesKPIs } from '../components/assign-modules/AssignModulesKPIs.v2';
import { AssignModulesFilters } from '../components/assign-modules/AssignModulesFilters';
import { UserTableView } from '../components/assign-modules/UserTableView';

export default function AssignModules() {
  const { user } = useAuth();
  
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

  // Data
  const { data: usersData, isLoading: usersLoading, refetch } = useUsers({
    schoolGroupId: user?.schoolGroupId,
  });
  
  // Récupérer les modules disponibles selon le plan du groupe
  const { data: modulesData } = useSchoolGroupModules(user?.schoolGroupId);
  const modules = modulesData?.availableModules || [];

  // Récupérer les vraies statistiques d'assignation
  const { data: assignmentStats } = useAssignmentStats(user?.schoolGroupId);

  const users = usersData?.users || [];

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
      if (user.role === 'super_admin') return false;

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

  // Stats - Utiliser les vraies données de la base
  const stats = useMemo(() => {
    const totalUsers = users.length; // Tous les users, pas seulement filtrés
    const totalModules = modules?.length || 0;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const usersWithModules = assignmentStats?.usersWithModules || 0; // Vraies données
    const lastAssignmentDate = assignmentStats?.lastAssignmentDate || null;

    const roleCount: Record<string, number> = {};
    filteredUsers.forEach((user) => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });

    return { totalUsers, totalModules, activeUsers, usersWithModules, roleCount, lastAssignmentDate };
  }, [users, modules, assignmentStats, filteredUsers]);

  const availableRoles = useMemo(() => {
    const roles = new Set(users.map((u: AssignModulesUser) => u.role).filter(r => r !== 'super_admin'));
    return Array.from(roles).sort();
  }, [users]);

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
      refetch();
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
    <div className="space-y-6 p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#2A9D8F]" />
              Gestion des Accès
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Assignez et gérez les permissions de votre équipe
            </p>
          </div>
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
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* KPIs - Design harmonisé avec Finances */}
      <AssignModulesKPIs stats={stats} />

      {/* Filtres */}
      <AssignModulesFilters
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          schoolFilter={schoolFilter}
          setSchoolFilter={setSchoolFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          availableRoles={availableRoles}
          schools={schools}
          stats={stats}
          filteredUsersCount={filteredUsers.length}
          selectedUsersCount={selectedUsers.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          getRoleLabel={getRoleLabel}
      />

      {/* Vue Tableau Unique */}
      <AnimatedSection delay={0.1}>
        <UserTableView
          users={filteredUsers}
          isLoading={usersLoading}
          selectedUsers={selectedUsers}
          sortConfig={sortConfig}
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
      </AnimatedSection>

      {/* Dialog Assignation */}
      {selectedUser && (
        <UserModulesDialog
          user={selectedUser}
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            refetch();
          }}
        />
      )}

      {/* Dialog Duplication */}
      <DuplicatePermissionsDialog
        sourceUser={sourceUserForDuplicate}
        targetUsers={users}
        isOpen={duplicateDialogOpen}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setSourceUserForDuplicate(null);
          refetch();
        }}
      />

      {/* Dialog Voir Permissions */}
      <ViewPermissionsDialog
        user={userForViewPermissions}
        isOpen={viewPermissionsOpen}
        onClose={() => {
          setViewPermissionsOpen(false);
          setUserForViewPermissions(null);
        }}
        onEditPermissions={() => {
          if (userForViewPermissions) {
            handleAssignModules(userForViewPermissions);
          }
        }}
      />
    </div>
  );
}
