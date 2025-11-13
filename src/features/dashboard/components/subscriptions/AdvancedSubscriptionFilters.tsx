/**
 * AdvancedSubscriptionFilters - Filtres avancés pour les abonnements
 * Date, Montant, Nombre d'écoles
 * @module AdvancedSubscriptionFilters
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, School, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdvancedFilters {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  schoolsMin?: number;
  schoolsMax?: number;
}

interface AdvancedSubscriptionFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset: () => void;
}

export const AdvancedSubscriptionFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: AdvancedSubscriptionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof AdvancedFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-3">
      {/* Bouton pour afficher/masquer les filtres */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres Avancés
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-[#2A9D8F] text-white">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Badges des filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dateFrom && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Depuis: {new Date(filters.dateFrom).toLocaleDateString('fr-FR')}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                onClick={() => handleFilterChange('dateFrom', undefined)}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Jusqu'au: {new Date(filters.dateTo).toLocaleDateString('fr-FR')}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                onClick={() => handleFilterChange('dateTo', undefined)}
              />
            </Badge>
          )}
          {(filters.amountMin !== undefined || filters.amountMax !== undefined) && (
            <Badge variant="outline" className="gap-1">
              <DollarSign className="w-3 h-3" />
              Montant: {filters.amountMin || 0} - {filters.amountMax || '∞'} FCFA
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                onClick={() => {
                  handleFilterChange('amountMin', undefined);
                  handleFilterChange('amountMax', undefined);
                }}
              />
            </Badge>
          )}
          {(filters.schoolsMin !== undefined || filters.schoolsMax !== undefined) && (
            <Badge variant="outline" className="gap-1">
              <School className="w-3 h-3" />
              Écoles: {filters.schoolsMin || 0} - {filters.schoolsMax || '∞'}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                onClick={() => {
                  handleFilterChange('schoolsMin', undefined);
                  handleFilterChange('schoolsMax', undefined);
                }}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Panneau des filtres */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filtres de Date */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-[#2A9D8F]" />
                    Période
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="dateFrom" className="text-xs text-gray-600">
                        Date de début (après)
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo" className="text-xs text-gray-600">
                        Date de fin (avant)
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtres de Montant */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="w-4 h-4 text-[#E9C46A]" />
                    Montant (FCFA)
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="amountMin" className="text-xs text-gray-600">
                        Montant minimum
                      </Label>
                      <Input
                        id="amountMin"
                        type="number"
                        placeholder="0"
                        value={filters.amountMin || ''}
                        onChange={(e) => handleFilterChange('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amountMax" className="text-xs text-gray-600">
                        Montant maximum
                      </Label>
                      <Input
                        id="amountMax"
                        type="number"
                        placeholder="∞"
                        value={filters.amountMax || ''}
                        onChange={(e) => handleFilterChange('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtres Nombre d'écoles */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <School className="w-4 h-4 text-[#1D3557]" />
                    Nombre d'écoles
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="schoolsMin" className="text-xs text-gray-600">
                        Minimum d'écoles
                      </Label>
                      <Input
                        id="schoolsMin"
                        type="number"
                        placeholder="0"
                        value={filters.schoolsMin || ''}
                        onChange={(e) => handleFilterChange('schoolsMin', e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="schoolsMax" className="text-xs text-gray-600">
                        Maximum d'écoles
                      </Label>
                      <Input
                        id="schoolsMax"
                        type="number"
                        placeholder="∞"
                        value={filters.schoolsMax || ''}
                        onChange={(e) => handleFilterChange('schoolsMax', e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres rapides */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-600 mb-3">Filtres rapides :</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                      handleFilterChange('dateTo', thirtyDaysFromNow.toISOString().split('T')[0]);
                    }}
                  >
                    Expire dans 30j
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('amountMin', 100000);
                    }}
                  >
                    Montant &gt; 100K
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('schoolsMin', 5);
                    }}
                  >
                    5+ écoles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('schoolsMin', 10);
                    }}
                  >
                    10+ écoles
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
