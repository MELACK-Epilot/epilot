/**
 * Section des filtres de recherche
 * Recherche, niveau, statut, type
 */

import { Filter, ChevronDown, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NIVEAUX_ENSEIGNEMENT } from '../../types/inscription.types';
import type { InscriptionFilters } from '../../types/inscription.types';

interface InscriptionsFiltersProps {
  filters: InscriptionFilters;
  showFilters: boolean;
  onFiltersChange: (filters: InscriptionFilters) => void;
  onToggleFilters: () => void;
  onResetFilters: () => void;
}

export const InscriptionsFilters = ({
  filters,
  showFilters,
  onFiltersChange,
  onToggleFilters,
  onResetFilters,
}: InscriptionsFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1D3557]" />
            <CardTitle>Filtres</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFilters}
            className="gap-2"
          >
            {showFilters ? 'Masquer' : 'Afficher'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nom, prénom ou numéro..."
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Niveau */}
            <div>
              <Label>Niveau</Label>
              <Select
                value={filters.niveau}
                onValueChange={(value) => onFiltersChange({ ...filters, niveau: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {NIVEAUX_ENSEIGNEMENT.map((niveau) => (
                    <SelectItem key={niveau.value} value={niveau.value}>
                      {niveau.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="refusee">Refusée</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Label>Type</Label>
              <Select
                value={filters.type_inscription}
                onValueChange={(value) => onFiltersChange({ ...filters, type_inscription: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="nouvelle">Nouvelle</SelectItem>
                  <SelectItem value="reinscription">Réinscription</SelectItem>
                  <SelectItem value="transfert">Transfert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
