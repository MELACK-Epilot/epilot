/**
 * Barre de recherche et statistiques
 * @module assign-profile/components/AssignProfileSearch
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { SelectionStats } from '../types';

interface AssignProfileSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stats: SelectionStats;
  isAllSelected: boolean;
  onSelectAll: () => void;
  disabled: boolean;
}

export const AssignProfileSearch = ({
  searchQuery,
  onSearchChange,
  stats,
  isAllSelected,
  onSelectAll,
  disabled,
}: AssignProfileSearchProps) => {
  return (
    <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher parmi les utilisateurs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            disabled={disabled}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium leading-none cursor-pointer text-gray-600"
          >
            Tout sélectionner ({stats.filtered})
          </label>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">{stats.selected} sélectionné(s)</span>
          {stats.toAdd > 0 && (
            <Badge className="bg-green-100 text-green-700 text-[10px]">
              +{stats.toAdd}
            </Badge>
          )}
          {stats.toRemove > 0 && (
            <Badge className="bg-red-100 text-red-700 text-[10px]">
              -{stats.toRemove}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
