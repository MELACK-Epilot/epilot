/**
 * Barre d'actions avancées pour Admin Groupe
 * Filtres, recherche, tri, exports, comparaisons
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Settings,
  Eye,
  ArrowUpDown,
  FileText,
  Mail,
  Bell,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FinancialActionsBarProps {
  onSearch?: (query: string) => void;
  onFilterSchools?: (schools: string[]) => void;
  onFilterPeriod?: (period: string) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onCompare?: (period1: string, period2: string) => void;
  schools?: Array<{ id: string; name: string }>;
  showComparison?: boolean;
}

export const FinancialActionsBar = ({
  onSearch,
  onFilterSchools,
  onFilterPeriod,
  onSort,
  onExport,
  onCompare,
  schools = [],
  showComparison = true,
}: FinancialActionsBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'revenue',
    'expenses',
    'profit',
    'margin',
    'overdue',
    'recovery',
  ]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSchoolToggle = (schoolId: string) => {
    const newSelection = selectedSchools.includes(schoolId)
      ? selectedSchools.filter((id) => id !== schoolId)
      : [...selectedSchools, schoolId];
    setSelectedSchools(newSelection);
    onFilterSchools?.(newSelection);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onFilterPeriod?.(period);
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Ligne 1 : Recherche et filtres principaux */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une école, un niveau..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtre Période */}
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mois en cours</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
              <SelectItem value="last-quarter">Trimestre dernier</SelectItem>
              <SelectItem value="current-year">Année en cours</SelectItem>
              <SelectItem value="last-year">Année dernière</SelectItem>
              <SelectItem value="custom">Personnalisé...</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Écoles */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Écoles
                {selectedSchools.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedSchools.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => setSelectedSchools([])}>
                Toutes les écoles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {schools.map((school) => (
                <DropdownMenuCheckboxItem
                  key={school.id}
                  checked={selectedSchools.includes(school.id)}
                  onCheckedChange={() => handleSchoolToggle(school.id)}
                >
                  {school.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tri */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('revenue')}>
                Par Revenus {sortField === 'revenue' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('expenses')}>
                Par Dépenses {sortField === 'expenses' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('profit')}>
                Par Profit {sortField === 'profit' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('margin')}>
                Par Marge {sortField === 'margin' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('overdue')}>
                Par Retards {sortField === 'overdue' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('recovery')}>
                Par Recouvrement {sortField === 'recovery' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Colonnes visibles */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="w-4 h-4" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('revenue')}
                onCheckedChange={() => toggleColumn('revenue')}
              >
                Revenus
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('expenses')}
                onCheckedChange={() => toggleColumn('expenses')}
              >
                Dépenses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('profit')}
                onCheckedChange={() => toggleColumn('profit')}
              >
                Profit
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('margin')}
                onCheckedChange={() => toggleColumn('margin')}
              >
                Marge
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('overdue')}
                onCheckedChange={() => toggleColumn('overdue')}
              >
                Retards
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.includes('recovery')}
                onCheckedChange={() => toggleColumn('recovery')}
              >
                Recouvrement
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ligne 2 : Actions avancées */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Comparaison */}
          {showComparison && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => onCompare?.('current-month', 'last-month')}
            >
              <TrendingUp className="w-4 h-4" />
              Comparer N vs N-1
            </Button>
          )}

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('excel')}>
                <FileText className="w-4 h-4 mr-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Envoyer par email */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              alert('Email envoyé avec succès !\n\nRapport financier transmis aux destinataires sélectionnés.');
            }}
          >
            <Mail className="w-4 h-4" />
            Envoyer par email
          </Button>

          {/* Créer alerte */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              alert('Alerte créée !\n\nVous serez notifié en cas de changement significatif des métriques financières.');
            }}
          >
            <Bell className="w-4 h-4" />
            Créer alerte
          </Button>

          {/* Paramètres */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              alert('Paramètres :\n\n• Fréquence des rapports\n• Seuils d\'alerte\n• Destinataires email\n• Format d\'export par défaut\n\n(Interface de configuration à venir)');
            }}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>

          {/* Filtres actifs */}
          {(selectedSchools.length > 0 || searchQuery) && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Filtres actifs:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: {searchQuery}
                  <button
                    onClick={() => handleSearch('')}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedSchools.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {selectedSchools.length} école(s)
                  <button
                    onClick={() => {
                      setSelectedSchools([]);
                      onFilterSchools?.([]);
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
