import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Key,
  Eye,
  Shield,
  Package,
  User as UserIcon
} from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
import type { User } from '../../types/dashboard.types';
import type { ColumnDef } from '@tanstack/react-table';

interface UseUsersColumnsProps {
  currentUser: any;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onAssignModules: (user: User) => void;
  onOpenProfile: () => void;
}

export const getUsersColumns = ({
  currentUser,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
  onAssignModules,
  onOpenProfile
}: UseUsersColumnsProps): ColumnDef<User>[] => [
  {
    id: 'avatar',
    header: '',
    cell: ({ row }) => {
      const user = row.original;
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
    cell: ({ row }) => {
      const user = row.original;
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
    cell: ({ row }) => {
      const user = row.original;
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
    accessorKey: 'accessProfileCode',
    header: 'Profil d\'Accès',
    cell: ({ row }) => {
      const user = row.original;
      
      // Pas de profil pour les admins
      if (user.role === 'super_admin' || user.role === 'admin_groupe') {
        return (
          <span className="text-xs text-gray-400 italic">N/A</span>
        );
      }
      
      const profileLabels: Record<string, { label: string; icon: string; color: string }> = {
        chef_etablissement: { 
          label: 'Chef d\'Établissement', 
          icon: '👔',
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        },
        financier_sans_suppression: { 
          label: 'Financier', 
          icon: '💰',
          color: 'bg-green-100 text-green-700 border-green-200'
        },
        administratif_basique: { 
          label: 'Administratif', 
          icon: '📋',
          color: 'bg-purple-100 text-purple-700 border-purple-200'
        },
        enseignant_saisie_notes: { 
          label: 'Enseignant', 
          icon: '👨‍🏫',
          color: 'bg-orange-100 text-orange-700 border-orange-200'
        },
        parent_consultation: { 
          label: 'Parent', 
          icon: '👨‍👩‍👧',
          color: 'bg-pink-100 text-pink-700 border-pink-200'
        },
        eleve_consultation: { 
          label: 'Élève', 
          icon: '🎓',
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        },
      };
      
      const profile = user.accessProfileCode ? profileLabels[user.accessProfileCode] : null;
      
      if (!profile) {
        return (
          <span className="text-xs text-gray-400 italic">Non défini</span>
        );
      }
      
      return (
        <Badge className={`${profile.color} border`}>
          <span className="mr-1">{profile.icon}</span>
          {profile.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'schoolGroupName',
    header: 'Groupe Scolaire',
    cell: ({ row }) => {
      const user = row.original;
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
    cell: ({ row }) => {
      const user = row.original;
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
    cell: ({ row }) => {
      const user = row.original;
      return <Badge className={getStatusBadgeClass(user.status)}>{user.status}</Badge>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original;
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
            
            {/* Menu spécial si c'est l'admin lui-même */}
            {user.id === currentUser?.id ? (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile();
                }}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Mon Profil Personnel
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onResetPassword(user);
                }}>
                  <Key className="h-4 w-4 mr-2" />
                  Changer mon mot de passe
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  disabled
                  className="text-gray-400 cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer (vous-même)
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {/* Menu normal pour les autres utilisateurs */}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onView(user);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(user);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onResetPassword(user);
                }}>
                  <Key className="h-4 w-4 mr-2" />
                  Réinitialiser MDP
                </DropdownMenuItem>
                
                {/* Assigner modules uniquement pour utilisateurs d'école */}
                {user.role !== 'super_admin' && user.role !== 'admin_groupe' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onAssignModules(user);
                  }}>
                    <Package className="h-4 w-4 mr-2" />
                    Assigner modules
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(user);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
