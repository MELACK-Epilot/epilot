/**
 * Composant Filtres Avancés pour Groupes Scolaires
 * Filtres par date, compteurs, etc.
 * @module AdvancedFilters
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SlidersHorizontal, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AdvancedFiltersState {
  createdAfter?: Date;
  createdBefore?: Date;
  schoolCountMin?: number;
  schoolCountMax?: number;
  studentCountMin?: number;
  studentCountMax?: number;
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  onReset: () => void;
}

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  const updateFilter = (key: keyof AdvancedFiltersState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres avancés
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {Object.values(filters).filter(v => v !== undefined).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filtres avancés</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Filtres de date */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date de création</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Après le</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.createdAfter ? (
                        format(filters.createdAfter, 'dd/MM/yyyy', { locale: fr })
                      ) : (
                        <span className="text-gray-400">Sélectionner</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.createdAfter}
                      onSelect={(date) => updateFilter('createdAfter', date)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Avant le</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.createdBefore ? (
                        format(filters.createdBefore, 'dd/MM/yyyy', { locale: fr })
                      ) : (
                        <span className="text-gray-400">Sélectionner</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.createdBefore}
                      onSelect={(date) => updateFilter('createdBefore', date)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filtres de compteurs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Nombre d'écoles</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Minimum</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.schoolCountMin || ''}
                  onChange={(e) => updateFilter('schoolCountMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Maximum</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.schoolCountMax || ''}
                  onChange={(e) => updateFilter('schoolCountMax', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Nombre d'élèves</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Minimum</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.studentCountMin || ''}
                  onChange={(e) => updateFilter('studentCountMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Maximum</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.studentCountMax || ''}
                  onChange={(e) => updateFilter('studentCountMax', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={() => setIsOpen(false)}
          >
            Appliquer les filtres
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
