/**
 * Hook pour gérer les filtres et le tri des abonnements
 */

import { useState, useMemo } from 'react';
import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';
import { type SortField, type SortOrder, type StatusFilter } from '../types/subscriptions.types';
import {
  filterBySearch,
  filterByStatus,
  sortSubscriptions,
  paginateSubscriptions,
  calculateTotalPages
} from '../utils/subscriptions.utils';

interface UseSubscriptionFiltersProps {
  subscriptions: PlanSubscription[] | undefined;
  itemsPerPage?: number;
}

export const useSubscriptionFilters = ({
  subscriptions,
  itemsPerPage = 12
}: UseSubscriptionFiltersProps) => {
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  // Traitement des données
  const processedSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    let filtered = subscriptions;
    
    // 1. Recherche
    filtered = filterBySearch(filtered, searchQuery);
    
    // 2. Filtre par statut
    filtered = filterByStatus(filtered, statusFilter);
    
    // 3. Tri
    filtered = sortSubscriptions(filtered, sortField, sortOrder);
    
    return filtered;
  }, [subscriptions, searchQuery, statusFilter, sortField, sortOrder]);

  // Pagination
  const paginatedSubscriptions = useMemo(() => {
    return paginateSubscriptions(processedSubscriptions, page, itemsPerPage);
  }, [processedSubscriptions, page, itemsPerPage]);

  const totalPages = calculateTotalPages(processedSubscriptions.length, itemsPerPage);

  // Fonctions de mise à jour
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset à la page 1
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const goToNextPage = () => {
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  const goToPreviousPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  return {
    // États
    searchQuery,
    statusFilter,
    sortField,
    sortOrder,
    page,
    
    // Données traitées
    processedSubscriptions,
    paginatedSubscriptions,
    totalPages,
    
    // Actions
    handleSearchChange,
    handleStatusFilterChange,
    handleSortFieldChange,
    toggleSortOrder,
    goToNextPage,
    goToPreviousPage,
    setPage
  };
};
