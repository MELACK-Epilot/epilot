/**
 * Définition des colonnes du tableau utilisateurs
 * @module Users/components/UserTableColumns
 */

import { MoreVertical, Edit, Trash2, Key, Eye, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '../../../components/UserAvatar';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { User } from '../../../types/dashboard.types';

interface UserTableColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onViewDetails: (user: User) => void;
}

export function getUserTableColumns({
  onEdit,
  onDelete,
  onResetPassword,
  onViewDetails,
}: UserTableColumnsProps) {
  return [
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
            size="md"
            status={user.status}
          />
        );
      },
    },
    {
      id: 'name',
      header: 'Utilisateur',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <div>
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        );
      },
    },
    {
      id: 'role',
      header: 'Rôle',
      cell: ({ row }: any) => {
        const user = row.original as User;
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin',
          admin_groupe: 'Admin Groupe',
          directeur: 'Directeur',
          enseignant: 'Enseignant',
          cpe: 'CPE',
          comptable: 'Comptable',
          documentaliste: 'Documentaliste',
          surveillant: 'Surveillant',
        };
        return (
          <Badge className={getRoleBadgeClass(user.role)}>
            {roleLabels[user.role] || user.role}
          </Badge>
        );
      },
    },
    {
      id: 'schoolGroup',
      header: 'Groupe Scolaire',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return user.role === 'super_admin' ? (
          <div className="flex items-center gap-2 text-[#1D3557] font-medium">
            <Shield className="h-4 w-4" />
            <span>Administrateur Système E-Pilot</span>
          </div>
        ) : (
          <span className="text-gray-700">{user.schoolGroupName || 'N/A'}</span>
        );
      },
    },
    {
      id: 'school',
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
      id: 'status',
      header: 'Statut',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return <Badge className={getStatusBadgeClass(user.status)}>{user.status}</Badge>;
      },
    },
    {
      id: 'lastLogin',
      header: 'Dernière connexion',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <span className="text-sm text-gray-600">
            {user.lastLogin
              ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: fr })
              : 'Jamais'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => {
        const user = row.original as User;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewDetails(user)}>
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <Key className="w-4 h-4 mr-2" />
                Réinitialiser mot de passe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Désactiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
