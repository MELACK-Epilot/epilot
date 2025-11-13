/**
 * Types et interfaces pour la page Users
 * @module Users/types
 */

import type { User } from '../../types/dashboard.types';

export interface UsersFilters {
  searchQuery: string;
  statusFilter: string;
  schoolGroupFilter: string;
  dateFilter: string;
}

export interface UsersPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UsersState {
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDetailDialogOpen: boolean;
  selectedUser: User | null;
  selectedUsers: string[];
  activeTab: string;
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type BulkAction = 'activate' | 'deactivate' | 'delete';
