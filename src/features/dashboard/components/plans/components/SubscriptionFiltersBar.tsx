/**
 * Barre de filtres et actions pour les abonnements
 */

import { Search, Filter, ArrowUpDown, CheckSquare, Square, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type SortField, type SortOrder, type StatusFilter } from '../types/subscriptions.types';

interface SubscriptionFiltersBarProps {
  // Filtres
  searchQuery: string;
  statusFilter: StatusFilter;
  sortField: SortField;
  sortOrder: SortOrder;
  
  // Actions filtres
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onSortFieldChange: (field: SortField) => void;
  onToggleSortOrder: () => void;
  
  // Sélection
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  
  // Export
  onExport: () => void;
  onPrint: () => void;
}

export const SubscriptionFiltersBar = ({
  searchQuery,
  statusFilter,
  sortField,
  sortOrder,
  onSearchChange,
  onStatusFilterChange,
  onSortFieldChange,
  onToggleSortOrder,
  selectedCount,
  totalCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onExport,
  onPrint
}: SubscriptionFiltersBarProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 no-print">
      {/* Ligne 1: Recherche + Filtres */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un groupe..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="trial">Essai</SelectItem>
            <SelectItem value="cancelled">Annulés</SelectItem>
            <SelectItem value="expired">Expirés</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortField} onValueChange={onSortFieldChange}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="schools">Écoles</SelectItem>
            <SelectItem value="users">Utilisateurs</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSortOrder}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
      
      {/* Ligne 2: Sélection + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 mr-2" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {selectedCount > 0 ? `${selectedCount} sélectionné(s)` : 'Tout sélectionner'}
            </Button>
          )}
          {selectedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              Désélectionner
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>
    </div>
  );
};
