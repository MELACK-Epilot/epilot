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
  User as UserIcon
} from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
import type { User } from '../../types/dashboard.types';
import type { ColumnDef } from '@tanstack/react-table';

/** Type pour les profils d'accès (passés en paramètre) */
interface AccessProfileInfo {
  code: string;
  name_fr: string;
  icon?: string | null;
}

/** Couleurs par défaut pour les profils */
const PROFILE_COLORS: Record<string, string> = {
  chef_etablissement: 'bg-blue-100 text-blue-700 border-blue-200',
  financier_sans_suppression: 'bg-green-100 text-green-700 border-green-200',
  administratif_basique: 'bg-purple-100 text-purple-700 border-purple-200',
  enseignant_saisie_notes: 'bg-orange-100 text-orange-700 border-orange-200',
  parent_consultation: 'bg-pink-100 text-pink-700 border-pink-200',
  eleve_consultation: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

/** Icônes par défaut pour les profils */
const PROFILE_ICONS: Record<string, string> = {
  chef_etablissement: '👔',
  financier_sans_suppression: '💰',
  administratif_basique: '📋',
  enseignant_saisie_notes: '👨‍🏫',
  parent_consultation: '👨‍👩‍👧',
  eleve_consultation: '🎓',
};

interface UseUsersColumnsProps {
  currentUser: any;
  accessProfiles?: AccessProfileInfo[]; // Profils dynamiques depuis la BDD
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onOpenProfile: () => void;
}

export const getUsersColumns = ({
  currentUser,
  accessProfiles = [],
  onView,
  onEdit,
  onDelete,
  onResetPassword,
  onOpenProfile
}: UseUsersColumnsProps): ColumnDef<User>[] => {
  // Créer un map pour accès rapide aux profils par code
  const profilesMap = new Map(accessProfiles.map(p => [p.code, p]));
  
  return [
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
      
      // Pas de code de profil
      if (!user.accessProfileCode) {
        return (
          <span className="text-xs text-gray-400 italic">Non défini</span>
        );
      }
      
      // Récupérer le profil depuis le map (dynamique depuis BDD)
      const profileData = profilesMap.get(user.accessProfileCode);
      
      // Utiliser le nom dynamique ou fallback sur le code
      const label = profileData?.name_fr || user.accessProfileCode;
      const icon = profileData?.icon || PROFILE_ICONS[user.accessProfileCode] || '🔐';
      const color = PROFILE_COLORS[user.accessProfileCode] || 'bg-gray-100 text-gray-700 border-gray-200';
      
      return (
        <Badge className={`${color} border`}>
          <span className="mr-1">{icon}</span>
          {label}
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
};
