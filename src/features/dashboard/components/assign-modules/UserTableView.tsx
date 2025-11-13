/**
 * Composant Vue Tableau pour les utilisateurs
 */

import {
  Users as UsersIcon,
  Package,
  ArrowUpDown,
  MoreHorizontal,
  Zap,
  CheckCircle,
  Ban,
  Eye,
  Copy,
  Mail,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AssignModulesUser, SortConfig } from '../../types/assign-modules.types';

interface UserTableViewProps {
  users: AssignModulesUser[];
  isLoading: boolean;
  selectedUsers: string[];
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleUserSelection: (userId: string) => void;
  onAssignModules: (user: AssignModulesUser) => void;
  onViewPermissions: (user: AssignModulesUser) => void;
  onDuplicatePermissions: (user: AssignModulesUser) => void;
  onToggleStatus: (user: AssignModulesUser) => void;
  getRoleLabel: (role: string) => string;
  getRoleBadgeColor: (role: string) => string;
}

export function UserTableView({
  users,
  isLoading,
  selectedUsers,
  sortConfig,
  onSort,
  onSelectAll,
  onDeselectAll,
  onToggleUserSelection,
  onAssignModules,
  onViewPermissions,
  onDuplicatePermissions,
  onToggleStatus,
  getRoleLabel,
  getRoleBadgeColor,
}: UserTableViewProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="text-center py-12">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucun utilisateur trouvé</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={selectedUsers.length > 0 && selectedUsers.length === users.length}
                onChange={(e) => (e.currentTarget.checked ? onSelectAll() : onDeselectAll())}
                className="w-4 h-4 rounded border-gray-300 text-[#2A9D8F] cursor-pointer"
              />
            </TableHead>
            <TableHead onClick={() => onSort('name')} className="cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex items-center gap-1 font-semibold">
                Utilisateur <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead onClick={() => onSort('role')} className="cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex items-center gap-1 font-semibold">
                Rôle <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="font-semibold">École</TableHead>
            <TableHead onClick={() => onSort('modulesCount')} className="cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex items-center gap-1 font-semibold">
                Modules <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="font-semibold">Dernière connexion</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: AssignModulesUser) => (
            <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors border-b">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => onToggleUserSelection(user.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2A9D8F]"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {user.photoUrl || user.avatar ? (
                    <img
                      src={user.photoUrl || user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6e] text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getRoleBadgeColor(user.role)} font-medium`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                {user.schoolName ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">{user.schoolName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Non assigné</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                    <Package className="h-3 w-3" />
                    <span className="text-sm font-semibold">{user.assignedModulesCount || 0}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {user.assignedModulesCount ? 'assigné(s)' : 'aucun'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {user.lastLoginAt ? (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">
                      {new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.lastLoginAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Jamais connecté</span>
                )}
              </TableCell>
              <TableCell>
                {user.status === 'active' ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
                    <CheckCircle className="h-3 w-3 mr-1" /> Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-medium">
                    <Ban className="h-3 w-3 mr-1" /> Inactif
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAssignModules(user)}
                    className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6e] hover:from-[#238276] hover:to-[#165e54] text-white shadow-md"
                  >
                    <Zap className="h-3 w-3 mr-1" /> Assigner
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => onViewPermissions(user)}>
                        <Eye className="h-4 w-4 mr-2" /> Voir les permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicatePermissions(user)}>
                        <Copy className="h-4 w-4 mr-2" /> Dupliquer permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                        <Ban className="h-4 w-4 mr-2" />
                        {user.status === 'active' ? 'Désactiver' : 'Activer'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
