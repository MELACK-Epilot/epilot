/**
 * Ligne de profil pour la vue tableau
 * Composant pure UI
 */

import { UserCog, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ProfileActionsMenu } from './ProfileActionsMenu';
import { 
  getRoleColor, 
  countActiveModules 
} from '@/features/dashboard/utils/profile-colors.utils';

interface ProfileRowProps {
  profile: {
    id: string;
    code: string;
    name_fr: string;
    description?: string | null;
    permissions?: Record<string, unknown> | null;
  };
  userCount: number;
  moduleCount?: number;
  onEdit: () => void;
  onAssign: () => void;
  onViewUsers: () => void;
  onDelete: () => void;
}

export const ProfileRow = ({
  profile,
  userCount,
  moduleCount = 0,
  onEdit,
  onAssign,
  onViewUsers,
  onDelete,
}: ProfileRowProps) => {
  const colors = getRoleColor(profile.code);
  // Utiliser moduleCount (depuis access_profile_modules) ou fallback sur permissions JSON
  const permissionsCount = moduleCount > 0 ? moduleCount : countActiveModules(profile.permissions as Record<string, unknown> | null);

  return (
    <TableRow className="hover:bg-gray-50/50 cursor-pointer" onClick={onEdit}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center`}>
            <UserCog className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile.name_fr}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{profile.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{profile.code}</code>
      </TableCell>
      <TableCell>
        <div 
          className="flex items-center gap-2 hover:text-blue-600 cursor-pointer w-fit"
          onClick={(e) => {
            e.stopPropagation();
            onViewUsers();
          }}
        >
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{userCount}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border ${colors.border}`}>
          {permissionsCount} modules
        </Badge>
      </TableCell>
      <TableCell>
        {permissionsCount > 0 ? (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Configuré
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            En attente
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Modifier
          </Button>
          <ProfileActionsMenu
            onConfigureAccess={onEdit}
            onAssignUsers={onAssign}
            onEditInfo={onEdit}
            onViewUsers={onViewUsers}
            onDelete={onDelete}
            compact
          />
        </div>
      </TableCell>
    </TableRow>
  );
};
