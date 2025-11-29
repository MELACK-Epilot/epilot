/**
 * Menu d'actions pour un profil
 * Composant pure UI réutilisable
 */

import { 
  MoreHorizontal, 
  Trash2, 
  Search, 
  Shield, 
  Users,
  UserCog 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProfileActionsMenuProps {
  onConfigureAccess: () => void;
  onAssignUsers: () => void;
  onEditInfo: () => void;
  onViewUsers: () => void;
  onDelete: () => void;
  compact?: boolean;
}

export const ProfileActionsMenu = ({
  onConfigureAccess,
  onAssignUsers,
  onEditInfo,
  onViewUsers,
  onDelete,
  compact = false,
}: ProfileActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className={compact ? "h-8 w-8" : "h-8 w-8 -mr-2 hover:bg-gray-100 rounded-full"}
        >
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={compact ? "" : "w-56"}>
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onConfigureAccess(); }} 
          className="cursor-pointer font-medium"
        >
          <Shield className="mr-2 h-4 w-4 text-blue-600" /> Configurer accès
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onAssignUsers(); }} 
          className="cursor-pointer"
        >
          <Users className="mr-2 h-4 w-4 text-green-600" /> Assigner utilisateurs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onEditInfo(); }} 
          className="cursor-pointer"
        >
          <UserCog className="mr-2 h-4 w-4" /> Modifier infos
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onViewUsers(); }} 
          className="cursor-pointer"
        >
          <Search className="mr-2 h-4 w-4" /> Voir qui a ce rôle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
