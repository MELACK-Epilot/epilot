/**
 * SortableTableHeader - Header de tableau triable
 * Gère le tri avec icônes visuelles
 * @module SortableTableHeader
 */

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableTableHeaderProps {
  children: React.ReactNode;
  field: string;
  sortField: string;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
  className?: string;
}

export const SortableTableHeader = ({
  children,
  field,
  sortField,
  sortDirection,
  onSort,
  className = '',
}: SortableTableHeaderProps) => {
  const isActive = sortField === field;

  const getSortIcon = () => {
    if (!isActive) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4 text-[#2A9D8F]" />;
    }
    return <ChevronDown className="w-4 h-4 text-[#2A9D8F]" />;
  };

  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className="h-auto p-0 font-medium text-gray-500 hover:text-gray-700 hover:bg-transparent flex items-center gap-1"
      >
        {children}
        {getSortIcon()}
      </Button>
    </th>
  );
};
