/**
 * Composant Table pour la page Groupes Scolaires - VERSION REFACTORISÉE
 * Respecte la limite de 350 lignes (@[/decouper])
 * @module SchoolGroupsTable
 */

import { DataTable } from '../DataTable';
import { SchoolGroupTablePagination } from './SchoolGroupTablePagination';
import { useSchoolGroupTableColumns } from './useSchoolGroupTableColumns';
import type { SchoolGroup } from '../../types/dashboard.types';

interface SchoolGroupsTableProps {
  data: SchoolGroup[];
  isLoading: boolean;
  onView: (group: SchoolGroup) => void;
  onEdit: (group: SchoolGroup) => void;
  onDelete: (group: SchoolGroup) => void;
  onActivate?: (group: SchoolGroup) => void;
  onDeactivate?: (group: SchoolGroup) => void;
  onSuspend?: (group: SchoolGroup) => void;
  onViewModules?: (group: SchoolGroup) => void;
  selectedRows: string[];
  onSelectionChange: (ids: string[]) => void;
  sortField: keyof SchoolGroup;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof SchoolGroup) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const SchoolGroupsTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onSuspend,
  onViewModules,
  selectedRows,
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
}: SchoolGroupsTableProps) => {
  // Utiliser le hook pour les colonnes
  const columns = useSchoolGroupTableColumns({
    data,
    selectedRows,
    onSelectionChange,
    sortField,
    sortDirection,
    onSort,
    onView,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    onSuspend,
    onViewModules,
  });

  return (
    <div className="space-y-4">
      {/* Tableau */}
      <DataTable columns={columns} data={data} isLoading={isLoading} />
      
      {/* Pagination */}
      <SchoolGroupTablePagination
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        selectedRows={selectedRows}
        onPageChange={onPageChange}
      />
    </div>
  );
};
