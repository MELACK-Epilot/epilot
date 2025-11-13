/**
 * Filtres avancés pour les paiements
 * @module PaymentFilters
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PaymentFiltersProps {
  filters: {
    status?: string;
    method?: string;
    schoolId?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date;
    endDate?: Date;
  };
  onFiltersChange: (filters: any) => void;
  schools?: Array<{ id: string; name: string }>;
}

const PAYMENT_STATUSES = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'completed', label: 'Complétés' },
  { value: 'pending', label: 'En attente' },
  { value: 'failed', label: 'Échoués' },
  { value: 'refunded', label: 'Remboursés' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'Toutes les méthodes' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'check', label: 'Chèque' },
];

export const PaymentFilters = ({ filters, onFiltersChange, schools = [] }: PaymentFiltersProps) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== 'all');

  const handleReset = () => {
    onFiltersChange({
      status: 'all',
      method: 'all',
      schoolId: 'all',
      minAmount: undefined,
      maxAmount: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtres</h3>
          {hasActiveFilters && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Actifs
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statut */}
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Méthode */}
        <div className="space-y-2">
          <Label>Méthode de paiement</Label>
          <Select
            value={filters.method || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, method: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* École */}
        {schools.length > 0 && (
          <div className="space-y-2">
            <Label>École</Label>
            <Select
              value={filters.schoolId || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, schoolId: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Montant Min */}
        <div className="space-y-2">
          <Label>Montant minimum</Label>
          <Input
            type="number"
            placeholder="0"
            value={filters.minAmount || ''}
            onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        {/* Montant Max */}
        <div className="space-y-2">
          <Label>Montant maximum</Label>
          <Input
            type="number"
            placeholder="1000000"
            value={filters.maxAmount || ''}
            onChange={(e) => onFiltersChange({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        {/* Date début */}
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => onFiltersChange({ ...filters, startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date fin */}
        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => onFiltersChange({ ...filters, endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
