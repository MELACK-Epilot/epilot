/**
 * Liste virtualisée des utilisateurs
 * Optimisée pour 8900+ utilisateurs
 * @module assign-profile/components/AssignProfileUserList
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, AlertCircle } from 'lucide-react';
import { AssignProfileUserItem } from './AssignProfileUserItem';
import type { SimpleUser } from '../types';
import { ITEM_HEIGHT } from '../constants';

interface AssignProfileUserListProps {
  users: SimpleUser[];
  selectedUsers: Set<string>;
  currentProfileCode: string;
  isLoading: boolean;
  searchQuery: string;
  onToggleUser: (userId: string) => void;
}

export const AssignProfileUserList = ({
  users,
  selectedUsers,
  currentProfileCode,
  isLoading,
  searchQuery,
  onToggleUser,
}: AssignProfileUserListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
        <p>Aucun utilisateur trouvé.</p>
        {searchQuery && (
          <p className="text-xs mt-1">Essayez une autre recherche.</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto"
      style={{ minHeight: '300px', maxHeight: '400px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const user = users[virtualRow.index];
          return (
            <AssignProfileUserItem
              key={user.id}
              user={user}
              isSelected={selectedUsers.has(user.id)}
              currentProfileCode={currentProfileCode}
              onToggle={onToggleUser}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
