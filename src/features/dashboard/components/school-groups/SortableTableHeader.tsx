/**
 * Composant Header de colonne triable
 * @module SortableTableHeader
 */

import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SchoolGroup } from '../../types/dashboard.types';

interface SortableTableHeaderProps {
  field: keyof SchoolGroup;
  label: string;
  sortField: keyof SchoolGroup;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof SchoolGroup) => void;
}

export const SortableTableHeader = ({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
}: SortableTableHeaderProps) => (
  <Button
    variant="ghost"
    onClick={() => onSort(field)}
    className="-ml-4 h-8 data-[state=open]:bg-accent"
  >
    {label}
    {sortField === field ? (
      sortDirection === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      )
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    )}
  </Button>
);
