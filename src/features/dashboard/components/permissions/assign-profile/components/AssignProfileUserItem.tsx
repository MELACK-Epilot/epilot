/**
 * Item utilisateur dans la liste d'assignation
 * Composant pure UI (dumb component)
 * @module assign-profile/components/AssignProfileUserItem
 */

import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SimpleUser } from '../types';

interface AssignProfileUserItemProps {
  user: SimpleUser;
  isSelected: boolean;
  currentProfileCode: string;
  onToggle: (userId: string) => void;
  style: React.CSSProperties;
}

export const AssignProfileUserItem = memo(({
  user,
  isSelected,
  currentProfileCode,
  onToggle,
  style,
}: AssignProfileUserItemProps) => {
  const fullName = `${user.first_name} ${user.last_name}`;
  const hasExistingProfile = user.access_profile_code && user.access_profile_code !== currentProfileCode;

  return (
    <div style={style} className="px-2">
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 h-[60px] ${
          isSelected ? 'bg-blue-50/50 border-blue-200' : 'border-transparent'
        }`}
        onClick={() => onToggle(user.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(user.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>{user.first_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none truncate">{fullName}</p>
          <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] text-gray-400 bg-white">
            {user.role}
          </Badge>
          {hasExistingProfile && (
            <Badge variant="secondary" className="text-[9px] bg-amber-50 text-amber-600">
              {user.access_profile_code}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

AssignProfileUserItem.displayName = 'AssignProfileUserItem';
