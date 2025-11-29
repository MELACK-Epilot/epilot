/**
 * Hook de recherche avancée pour gérer 500+ groupes scolaires
 * Recherche optimisée avec debounce et filtres multiples
 */

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export interface SearchFilters {
  query: string;
  schoolGroups: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  priority?: string[];
  category?: string[];
}

export const useAdvancedSearch = <T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[],
  initialFilters: Partial<SearchFilters> = {}
) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    schoolGroups: [],
    ...initialFilters,
  });

  // Debounce de la recherche pour éviter trop de re-renders
  const debouncedQuery = useDebounce(filters.query, 300);

  // Fonction de recherche optimisée
  const searchResults = useMemo(() => {
    return data.filter((item) => {
      // Recherche textuelle
      if (debouncedQuery) {
        const matchesQuery = searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(debouncedQuery.toLowerCase());
          }
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(
              (v) => typeof v === 'string' && v.toLowerCase().includes(debouncedQuery.toLowerCase())
            );
          }
          return false;
        });
        if (!matchesQuery) return false;
      }

      // Filtre par groupes scolaires
      if (filters.schoolGroups.length > 0) {
        const itemSchoolGroup = item.createdBy?.schoolGroup || item.schoolGroup;
        if (!filters.schoolGroups.includes(itemSchoolGroup)) {
          return false;
        }
      }

      // Filtre par statut
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(item.status)) {
          return false;
        }
      }

      // Filtre par priorité
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(item.priority)) {
          return false;
        }
      }

      // Filtre par catégorie
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(item.category)) {
          return false;
        }
      }

      // Filtre par date
      if (filters.dateRange) {
        const itemDate = new Date(item.createdAt || item.sentAt);
        if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [data, debouncedQuery, filters, searchFields]);

  // Fonctions de mise à jour des filtres
  const updateQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const updateSchoolGroups = useCallback((schoolGroups: string[]) => {
    setFilters((prev) => ({ ...prev, schoolGroups }));
  }, []);

  const updateStatus = useCallback((status: string[]) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const updatePriority = useCallback((priority: string[]) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const updateCategory = useCallback((category: string[]) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const updateDateRange = useCallback((dateRange: { start: Date; end: Date } | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      schoolGroups: [],
      status: [],
      priority: [],
      category: [],
      dateRange: undefined,
    });
  }, []);

  return {
    searchResults,
    filters,
    updateQuery,
    updateSchoolGroups,
    updateStatus,
    updatePriority,
    updateCategory,
    updateDateRange,
    resetFilters,
    isSearching: debouncedQuery !== filters.query,
  };
};
