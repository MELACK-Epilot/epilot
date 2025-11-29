/**
 * Hook pour gérer l'état local du dialogue d'assignation
 * @module assign-profile/hooks/useAssignProfileState
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SimpleUser, UserWithProfile, SelectionStats } from '../types';
import { SEARCH_DEBOUNCE_MS } from '../constants';

interface UseAssignProfileStateProps {
  isOpen: boolean;
  users: SimpleUser[];
  profileCode: string | undefined;
}

/**
 * Gère tout l'état local du dialogue d'assignation
 */
export const useAssignProfileState = ({
  isOpen,
  users,
  profileCode,
}: UseAssignProfileStateProps) => {
  // State de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // State de sélection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [initialSelectedUsers, setInitialSelectedUsers] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // State de confirmation
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [conflictingUsers, setConflictingUsers] = useState<UserWithProfile[]>([]);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialiser la sélection quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && users.length > 0 && profileCode && !isInitialized) {
      setSearchQuery('');
      const usersWithRole = new Set(
        users
          .filter((u) => u.access_profile_code === profileCode)
          .map((u) => u.id)
      );
      setSelectedUsers(usersWithRole);
      setInitialSelectedUsers(usersWithRole);
      setIsInitialized(true);
    }
  }, [isOpen, users, profileCode, isInitialized]);

  // Reset quand le dialog se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUsers(new Set());
      setInitialSelectedUsers(new Set());
      setIsInitialized(false);
      setIsAlertOpen(false);
      setConflictingUsers([]);
    }
  }, [isOpen]);

  // Handlers
  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === users.length && users.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  }, [selectedUsers.size, users]);

  // Calculer les stats
  const stats: SelectionStats = useMemo(
    () => ({
      total: users.length,
      filtered: users.length,
      selected: selectedUsers.size,
      toAdd: [...selectedUsers].filter((id) => !initialSelectedUsers.has(id)).length,
      toRemove: [...initialSelectedUsers].filter((id) => !selectedUsers.has(id)).length,
    }),
    [users.length, selectedUsers, initialSelectedUsers]
  );

  // Calculer les différences pour la mutation
  const getDiffs = useCallback(() => {
    const toAdd = [...selectedUsers].filter((id) => !initialSelectedUsers.has(id));
    const toRemove = [...initialSelectedUsers].filter((id) => !selectedUsers.has(id));
    return { toAdd, toRemove };
  }, [selectedUsers, initialSelectedUsers]);

  // Vérifier les conflits
  const checkConflicts = useCallback(() => {
    if (!profileCode) return [];

    const { toAdd } = getDiffs();
    const conflicts: UserWithProfile[] = [];

    toAdd.forEach((id) => {
      const user = users.find((u) => u.id === id);
      if (user?.access_profile_code && user.access_profile_code !== profileCode) {
        conflicts.push({
          id: user.id,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          currentProfileCode: user.access_profile_code,
        });
      }
    });

    return conflicts;
  }, [profileCode, getDiffs, users]);

  return {
    // Search
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    
    // Selection
    selectedUsers,
    handleToggleUser,
    handleSelectAll,
    
    // Stats
    stats,
    getDiffs,
    
    // Conflicts
    isAlertOpen,
    setIsAlertOpen,
    conflictingUsers,
    setConflictingUsers,
    checkConflicts,
  };
};
