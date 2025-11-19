/**
 * Utilitaires pour le traitement des abonnements
 */

import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';
import { type SortField, type SortOrder, type StatusFilter } from '../types/subscriptions.types';

/**
 * Formate une date en français
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Filtre les abonnements par recherche
 */
export const filterBySearch = (
  subscriptions: PlanSubscription[],
  searchQuery: string
): PlanSubscription[] => {
  if (!searchQuery) return subscriptions;
  
  const query = searchQuery.toLowerCase();
  return subscriptions.filter(sub =>
    sub.school_group_name.toLowerCase().includes(query)
  );
};

/**
 * Filtre les abonnements par statut
 */
export const filterByStatus = (
  subscriptions: PlanSubscription[],
  statusFilter: StatusFilter
): PlanSubscription[] => {
  if (statusFilter === 'all') return subscriptions;
  
  return subscriptions.filter(sub => sub.status === statusFilter);
};

/**
 * Trie les abonnements selon le critère
 */
export const sortSubscriptions = (
  subscriptions: PlanSubscription[],
  sortField: SortField,
  sortOrder: SortOrder
): PlanSubscription[] => {
  return [...subscriptions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.school_group_name.localeCompare(b.school_group_name);
        break;
      case 'date':
        comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        break;
      case 'schools':
        comparison = (a.schools_count || 0) - (b.schools_count || 0);
        break;
      case 'users':
        comparison = (a.users_count || 0) - (b.users_count || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Pagine les abonnements
 */
export const paginateSubscriptions = (
  subscriptions: PlanSubscription[],
  page: number,
  itemsPerPage: number
): PlanSubscription[] => {
  const start = (page - 1) * itemsPerPage;
  return subscriptions.slice(start, start + itemsPerPage);
};

/**
 * Calcule le nombre total de pages
 */
export const calculateTotalPages = (
  totalItems: number,
  itemsPerPage: number
): number => {
  return Math.ceil(totalItems / itemsPerPage);
};
