/**
 * Composant Filtres pour la page Utilisateurs
 */

import { Search, Download, Plus, FileText, FileSpreadsheet, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UsersFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  schoolFilter: string;
  setSchoolFilter: (value: string) => void;
  schoolGroupFilter?: string;
  setSchoolGroupFilter?: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  isSuperAdmin?: boolean;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  schools: Array<{ id: string; name: string }>;
  schoolGroups?: Array<{ id: string; name: string }>;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  onCreateNew: () => void;
  selectedCount: number;
  onBulkAction: (action: 'activate' | 'deactivate' | 'delete') => void;
}

export const UsersFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  schoolFilter,
  setSchoolFilter,
  schoolGroupFilter,
  setSchoolGroupFilter,
  dateFilter,
  setDateFilter,
  isSuperAdmin = false,
  viewMode,
  setViewMode,
  schools,
  schoolGroups = [],
  onExport,
  onCreateNew,
  selectedCount,
  onBulkAction,
}: UsersFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les Super Admins et Administrateurs de Groupe
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Vue */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Afficher sous forme de tableau"
              aria-pressed={viewMode === 'table'}
              className={viewMode === 'table' ? 'bg-[#2A9D8F] hover:bg-[#1D8A7E]' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              aria-label="Afficher sous forme de grille"
              aria-pressed={viewMode === 'grid'}
              className={viewMode === 'grid' ? 'bg-[#2A9D8F] hover:bg-[#1D8A7E]' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport('csv')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
                Exporter en Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateNew} className="bg-[#1D3557] hover:bg-[#2A9D8F]">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre groupe scolaire - Visible pour Super Admin */}
        {isSuperAdmin && setSchoolGroupFilter && (
          <Select value={schoolGroupFilter} onValueChange={setSchoolGroupFilter}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filtrer par groupe scolaire">
              <SelectValue placeholder="Groupe scolaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {schoolGroups
                .filter((group) => group.id && group.id.trim() !== '')
                .map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {/* Filtre école - Visible pour Admin Groupe */}
        {!isSuperAdmin && (
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrer par école">
              <SelectValue placeholder="École" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les écoles</SelectItem>
              {schools
                .filter((school) => school.id && school.id.trim() !== '')
                .map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par période">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les dates</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions en masse */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} utilisateur(s) sélectionné(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('activate')}
            >
              Activer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('deactivate')}
            >
              Désactiver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => onBulkAction('delete')}
            >
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
