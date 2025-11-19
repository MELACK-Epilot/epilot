/**
 * Types pour les abonnements de plans
 */

export type SortField = 'name' | 'date' | 'schools' | 'users';
export type SortOrder = 'asc' | 'desc';
export type StatusFilter = 'all' | 'active' | 'trial' | 'cancelled' | 'expired';

export interface SubscriptionFilters {
  searchQuery: string;
  statusFilter: StatusFilter;
  sortField: SortField;
  sortOrder: SortOrder;
}

export interface SubscriptionSelection {
  selectedIds: Set<string>;
  page: number;
  itemsPerPage: number;
}
