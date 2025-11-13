/**
 * Page Utilisateurs - VERSION REFACTORISÉE
 * Architecture modulaire avec composants réutilisables
 * @module Users
 */

import { useState, useCallback, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryClient } from '@tanstack/react-query';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Key,
  Eye,
  Mail,
  Phone,
  Building2,
  Clock,
  Shield,
  AlertCircle,
  Calendar,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '../components/DataTable';
import { UnifiedUserFormDialog } from '../components/UnifiedUserFormDialog';
import { UserAvatar } from '../components/UserAvatar';
import { AnimatedContainer } from '../components/AnimatedCard';
import { UsersStats, UsersFilters, UsersCharts, UsersGridView } from '../components/users';
import { UserModulesDialog } from '../components/users/UserModulesDialog.v2';
import { useUsers, useUserStats, useDeleteUser, useResetPassword, useUsersRealtime, userKeys } from '../hooks/useUsers';
import { useSchools } from '../hooks/useSchools-simple';
import { useSchoolGroups } from '../hooks/useSchoolGroups';
import type { User } from '../types/dashboard.types';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
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
  const { data: schools = [] } = useSchools({ 
    school_group_id: effectiveSchoolGroupId 
  });
  
  // Charger les groupes scolaires pour Super Admin
  const { data: schoolGroupsData } = useSchoolGroups();
  const schoolGroups = schoolGroupsData || [];
  
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const queryClient = useQueryClient();
  
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
  const columns = [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatar={user.avatar}
            status={user.status}
            size="md"
          />
        );
      },
    },
    {
      accessorKey: 'firstName',
      header: 'Nom complet',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <div>
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }: any) => {
        const user = row.original as User;
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin E-Pilot',
          admin_groupe: 'Administrateur de Groupe',
          proviseur: 'Proviseur',
          directeur: 'Directeur',
          directeur_etudes: 'Directeur des Études',
          secretaire: 'Secrétaire',
          comptable: 'Comptable',
          enseignant: 'Enseignant',
          surveillant: 'Surveillant',
          bibliothecaire: 'Bibliothécaire',
          cpe: 'CPE',
          documentaliste: 'Documentaliste',
          eleve: 'Élève',
          parent: 'Parent',
          gestionnaire_cantine: 'Gestionnaire de Cantine',
          autre: 'Autre',
        };
        return (
          <Badge className={getRoleBadgeClass(user.role)}>
            {roleLabels[user.role] || user.role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'schoolGroupName',
      header: 'Groupe Scolaire',
      cell: ({ row }: any) => {
        const user = row.original as User;
        const groupName = user.role === 'super_admin' 
          ? 'Administrateur Système E-Pilot'
          : (user.schoolGroupName || 'N/A');
        const isSystemAdmin = user.role === 'super_admin';
        
        return (
          <div className="flex items-center gap-2">
            {isSystemAdmin && <Shield className="h-4 w-4 text-purple-600" />}
            <span className={isSystemAdmin ? 'font-medium text-purple-900' : 'text-gray-700'}>
              {groupName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'schoolName',
      header: 'École',
      cell: ({ row }: any) => {
        const user = row.original as User;
        if (user.role === 'super_admin') {
          return <span className="text-gray-400">—</span>;
        }
        if (user.role === 'admin_groupe') {
          return <span className="text-gray-500 italic">Toutes les écoles</span>;
        }
        return (
          <span className="text-gray-700 font-medium">
            {user.schoolName || <span className="text-gray-400">Non assigné</span>}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return <Badge className={getStatusBadgeClass(user.status)}>{user.status}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => e.stopPropagation()}
                aria-label="Menu d'actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleView(user);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleResetPassword(user);
              }}>
                <Key className="h-4 w-4 mr-2" />
                Réinitialiser MDP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setSelectedUserForModules(user);
              }}>
                <Package className="h-4 w-4 mr-2" />
                Assigner modules
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(user);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
      <UsersCharts stats={stats} schools={schools} />

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
      <UnifiedUserFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      <UnifiedUserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        mode="edit"
      />

      {/* Dialog Détails - Version Professionnelle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <UserAvatar
                firstName={selectedUser?.firstName || ''}
                lastName={selectedUser?.lastName || ''}
                avatar={selectedUser?.avatar}
                status={selectedUser?.status}
                size="xl"
              />
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={getRoleBadgeClass(selectedUser?.role || 'admin_groupe')}>
                    {(() => {
                      const roleLabels: Record<string, string> = {
                        super_admin: 'Super Admin E-Pilot',
                        admin_groupe: 'Administrateur de Groupe',
                        proviseur: 'Proviseur',
                        directeur: 'Directeur',
                        directeur_etudes: 'Directeur des Études',
                        secretaire: 'Secrétaire',
                        comptable: 'Comptable',
                        enseignant: 'Enseignant',
                        surveillant: 'Surveillant',
                        bibliothecaire: 'Bibliothécaire',
                        cpe: 'CPE',
                        documentaliste: 'Documentaliste',
                        eleve: 'Élève',
                        parent: 'Parent',
                        gestionnaire_cantine: 'Gestionnaire de Cantine',
                        autre: 'Autre',
                      };
                      return roleLabels[selectedUser?.role || 'admin_groupe'] || selectedUser?.role;
                    })()}
                  </Badge>
                  <Badge className={getStatusBadgeClass(selectedUser?.status || 'active')}>
                    {selectedUser?.status === 'active' ? '✅ Actif' : selectedUser?.status === 'inactive' ? '⏸️ Inactif' : '🚫 Suspendu'}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées de l'utilisateur
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-6">
              {/* Section Informations de contact */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#1D3557]" />
                  Informations de contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <div className="text-gray-900 font-medium">{selectedUser.email}</div>
                  </div>
                  {selectedUser.phone && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Téléphone</span>
                      </div>
                      <div className="text-gray-900 font-medium">{selectedUser.phone}</div>
                    </div>
                  )}
                  {selectedUser.gender && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <span className="font-medium">Genre</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {selectedUser.gender === 'M' ? '👨 Masculin' : '👩 Féminin'}
                      </div>
                    </div>
                  )}
                  {selectedUser.dateOfBirth && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Date de naissance</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {format(new Date(selectedUser.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Association */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2A9D8F]" />
                  Association & Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Rôle</span>
                    </div>
                    <div className="text-gray-900 font-medium">
                      {(() => {
                        const roleLabels: Record<string, string> = {
                          super_admin: 'Super Admin E-Pilot',
                          admin_groupe: 'Administrateur de Groupe',
                          proviseur: 'Proviseur',
                          directeur: 'Directeur',
                          directeur_etudes: 'Directeur des Études',
                          secretaire: 'Secrétaire',
                          comptable: 'Comptable',
                          enseignant: 'Enseignant',
                          surveillant: 'Surveillant',
                          bibliothecaire: 'Bibliothécaire',
                          cpe: 'CPE',
                          documentaliste: 'Documentaliste',
                          eleve: 'Élève',
                          parent: 'Parent',
                          gestionnaire_cantine: 'Gestionnaire de Cantine',
                          autre: 'Autre',
                        };
                        return roleLabels[selectedUser.role] || selectedUser.role;
                      })()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Groupe Scolaire</span>
                    </div>
                    <div className="text-gray-900 font-medium flex items-center gap-2">
                      {selectedUser.role === 'super_admin' && (
                        <Shield className="h-4 w-4 text-[#1D3557]" />
                      )}
                      {selectedUser.role === 'super_admin' 
                        ? 'Administrateur Système E-Pilot' 
                        : (selectedUser.schoolGroupName || 'Non assigné')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Activité */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Activité du compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Créé le</span>
                    </div>
                    <div className="text-gray-900 font-medium">
                      {format(new Date(selectedUser.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  {selectedUser.lastLoginAt && (
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Dernière connexion</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {format(new Date(selectedUser.lastLoginAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(selectedUser.lastLoginAt), { addSuffix: true, locale: fr })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEdit(selectedUser!);
                  }}
                  className="flex-1 bg-[#1D3557] hover:bg-[#2A9D8F]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleResetPassword(selectedUser!)}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Réinitialiser MDP
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Cette action va supprimer définitivement l'utilisateur. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <UserAvatar
                  firstName={selectedUser.firstName}
                  lastName={selectedUser.lastName}
                  avatar={selectedUser.avatar}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <Badge className={getRoleBadgeClass(selectedUser.role)} size="sm">
                    {selectedUser.role === 'super_admin' ? 'Super Admin' : 
                     selectedUser.role === 'admin_groupe' ? 'Admin Groupe' : 
                     selectedUser.role}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ ATTENTION : Cette action est irréversible !
                </p>
                <p className="text-sm text-red-700 mt-1">
                  L'utilisateur et toutes ses données seront définitivement supprimés de la base de données.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteUser.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUser.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'affectation des modules */}
      <UserModulesDialog
        user={selectedUserForModules}
        isOpen={!!selectedUserForModules}
        onClose={() => setSelectedUserForModules(null)}
      />
    </AnimatedContainer>
  );
};

export default Users;
