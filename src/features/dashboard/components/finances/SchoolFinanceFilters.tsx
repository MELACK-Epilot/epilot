/**
 * Composant de filtres pour les finances école
 * Permet de filtrer par période et cycle
 * @module SchoolFinanceFilters
 */

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SchoolFinanceFiltersProps {
  onFilterChange: (filters: { period: string; cycle: string }) => void;
  activeFilters: { period: string; cycle: string };
}

export function SchoolFinanceFilters({ onFilterChange, activeFilters }: SchoolFinanceFiltersProps) {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(activeFilters);

  const handleApply = () => {
    onFilterChange(tempFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters = { period: 'year', cycle: 'all' };
    setTempFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setOpen(false);
  };

  const activeFilterCount = (activeFilters.period !== 'year' ? 1 : 0) + (activeFilters.cycle !== 'all' ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-teal-600 text-white text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold leading-none">Filtres Financiers</h4>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto p-0 text-xs text-gray-500">
              Réinitialiser
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Période</Label>
            <Select 
              value={tempFilters.period} 
              onValueChange={(v) => setTempFilters(prev => ({ ...prev, period: v }))}
            >
              <SelectTrigger id="period">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Sélectionner une période" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Année Scolaire en cours</SelectItem>
                <SelectItem value="trimester_1">1er Trimestre</SelectItem>
                <SelectItem value="trimester_2">2ème Trimestre</SelectItem>
                <SelectItem value="trimester_3">3ème Trimestre</SelectItem>
                <SelectItem value="month">Mois courant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cycle">Cycle / Niveau</Label>
            <Select 
              value={tempFilters.cycle} 
              onValueChange={(v) => setTempFilters(prev => ({ ...prev, cycle: v }))}
            >
              <SelectTrigger id="cycle">
                <SelectValue placeholder="Tous les cycles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cycles</SelectItem>
                <SelectItem value="college">Collège</SelectItem>
                <SelectItem value="lycee">Lycée</SelectItem>
                <SelectItem value="primaire">Primaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={handleApply}>
            Appliquer les filtres
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
