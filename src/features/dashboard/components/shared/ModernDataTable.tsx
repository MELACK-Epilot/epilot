/**
 * Table moderne réutilisable avec tri, filtres, sélection et export
 * @module ModernDataTable
 */

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface ModernDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;
  onSelect?: (selected: T[]) => void;
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  onExport?: () => void;
  emptyMessage?: string;
}

export function ModernDataTable<T extends { id: string }>({
  data,
  columns,
  selectable = false,
  onSelect,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  exportable = false,
  onExport,
  emptyMessage = 'Aucune donnée disponible',
}: ModernDataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Gestion sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(item => item.id));
      setSelectedIds(allIds);
      onSelect?.(data);
    } else {
      setSelectedIds(new Set());
      onSelect?.([]);
    }
  };

  const handleSelectRow = (item: T, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(item.id);
    } else {
      newSelected.delete(item.id);
    }
    setSelectedIds(newSelected);
    onSelect?.(data.filter(d => newSelected.has(d.id)));
  };

  // Gestion tri
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filtrage et tri
  let processedData = [...data];

  // Recherche
  if (searchQuery) {
    processedData = processedData.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }

  // Tri
  if (sortKey) {
    processedData.sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      {(searchable || exportable) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          {exportable && onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Tout sélectionner"
                    className={someSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 hover:bg-transparent font-semibold"
                    >
                      {column.label}
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  ) : (
                    <span className="font-semibold">{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-12 text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}
                  `}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={(checked) => handleSelectRow(item, checked as boolean)}
                        aria-label={`Sélectionner ligne ${item.id}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info sélection */}
      {selectable && selectedIds.size > 0 && (
        <div className="text-sm text-gray-600">
          {selectedIds.size} élément{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
