/**
 * Hook pour la logique métier de la page Groupes Scolaires
 * Gère le filtrage, le tri et la pagination
 * @module useSchoolGroupsLogic
 */

import { useState, useMemo } from 'react';
import type { SchoolGroup } from '../types/dashboard.types';

export const useSchoolGroupsLogic = (schoolGroups: SchoolGroup[]) => {
  // États de filtrage
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // États de sélection
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // États de pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // États de tri
  const [sortField, setSortField] = useState<keyof SchoolGroup>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Vue mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Logique de filtrage
  const filteredData = useMemo(() => {
    return schoolGroups.filter((group) => {
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          group.name.toLowerCase().includes(query) ||
          group.code.toLowerCase().includes(query) ||
          group.region.toLowerCase().includes(query) ||
          group.city.toLowerCase().includes(query) ||
          (group.adminName && group.adminName.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Filtres
      if (filterStatus !== 'all' && group.status !== filterStatus) return false;
      if (filterPlan !== 'all' && group.plan !== filterPlan) return false;
      if (filterRegion !== 'all' && group.region !== filterRegion) return false;

      return true;
    });
  }, [schoolGroups, searchQuery, filterStatus, filterPlan, filterRegion]);

  // Régions uniques pour le filtre
  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(schoolGroups.map((g) => g.region)));
  }, [schoolGroups]);

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterPlan !== 'all') count++;
    if (filterRegion !== 'all') count++;
    return count;
  }, [filterStatus, filterPlan, filterRegion]);

  // Tri des données
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handler tri
  const handleSort = (field: keyof SchoolGroup) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filtres
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPlan('all');
    setFilterRegion('all');
  };

  return {
    // États de filtrage
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPlan,
    setFilterPlan,
    filterRegion,
    setFilterRegion,
    showFilters,
    setShowFilters,
    uniqueRegions,
    activeFiltersCount,
    resetFilters,

    // États de sélection
    selectedRows,
    setSelectedRows,

    // États de pagination
    page,
    setPage,
    pageSize,
    totalPages,

    // États de tri
    sortField,
    sortDirection,
    handleSort,

    // Vue mode
    viewMode,
    setViewMode,

    // Données calculées
    filteredData,
    sortedData,
    paginatedData,
  };
};
