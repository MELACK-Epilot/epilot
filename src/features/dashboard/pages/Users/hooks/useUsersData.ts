/**
 * Hook pour gérer les données des utilisateurs
 * @module Users/hooks/useUsersData
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUsers, useUserStats, userKeys } from '../../../hooks/useUsers';
import { useSchoolGroups } from '../../../hooks/useSchoolGroups';
import type { PaginatedUsers } from '../../../hooks/useUsers';
import type { UsersFilters, UsersPagination } from '../types';

export function useUsersData(
  filters: UsersFilters,
  pagination: UsersPagination
) {
  const queryClient = useQueryClient();
  
  // Debounce de la recherche
  const debouncedSearch = useDebouncedValue(filters.searchQuery, 300);

  // Hooks de données
  const { data: paginatedData, isLoading, error, isError } = useUsers({
    query: debouncedSearch,
    status: filters.statusFilter !== 'all' ? filters.statusFilter as any : undefined,
    schoolGroupId: filters.schoolGroupFilter !== 'all' ? filters.schoolGroupFilter : undefined,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  const { data: stats } = useUserStats(
    filters.schoolGroupFilter !== 'all' ? filters.schoolGroupFilter : undefined
  );
  const { data: schoolGroups } = useSchoolGroups();

  // Extraire les données paginées
  const users = (paginatedData as PaginatedUsers)?.users || [];
  const totalItems = (paginatedData as PaginatedUsers)?.total || 0;
  const totalPages = (paginatedData as PaginatedUsers)?.totalPages || 1;

  // Prefetching de la page suivante
  useEffect(() => {
    if (pagination.currentPage < totalPages) {
      const nextPageFilters = {
        query: debouncedSearch,
        status: filters.statusFilter !== 'all' ? filters.statusFilter as any : undefined,
        schoolGroupId: filters.schoolGroupFilter !== 'all' ? filters.schoolGroupFilter : undefined,
        page: pagination.currentPage + 1,
        pageSize: pagination.pageSize,
      };

      queryClient.prefetchQuery({
        queryKey: userKeys.list(nextPageFilters),
        queryFn: async () => null,
      });
    }
  }, [
    pagination.currentPage,
    totalPages,
    debouncedSearch,
    filters.statusFilter,
    filters.schoolGroupFilter,
    pagination.pageSize,
    queryClient,
  ]);

  return {
    users,
    stats,
    schoolGroups,
    totalItems,
    totalPages,
    isLoading,
    error,
    isError,
  };
}
