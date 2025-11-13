/**
 * Barre d'actions avancées pour Admin Groupe - VERSION 2.0
 * Filtres, recherche, tri, exports, comparaisons
 * Compatible avec nouvelle architecture
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  GitCompare,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface School {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
}

interface FinancialActionsBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSchools: string[];
  onSchoolsChange: (schools: string[]) => void;
  schools: School[];
  showComparison: boolean;
  onComparisonToggle: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  stats?: any;
}

export const FinancialActionsBarV2 = ({
  searchTerm,
  onSearchChange,
  selectedSchools,
  onSchoolsChange,
  schools,
  showComparison,
  onComparisonToggle,
  onExportExcel,
  onExportPDF,
  stats,
}: FinancialActionsBarProps) => {
  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleClearSelection = () => {
    onSchoolsChange([]);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Ligne 1: Recherche + Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher une école..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* Comparaison */}
            <Button
              variant={showComparison ? 'default' : 'outline'}
              size="sm"
              onClick={onComparisonToggle}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Comparer</span>
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exporter en Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exporter en CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Ligne 2: Filtres actifs */}
        {(searchTerm || selectedSchools.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Filtres actifs:</span>
            
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Recherche: "{searchTerm}"
                <button onClick={handleClearSearch} className="ml-1 hover:text-gray-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {selectedSchools.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {selectedSchools.length} école(s) sélectionnée(s)
                <button onClick={handleClearSelection} className="ml-1 hover:text-gray-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Stats rapides */}
        {stats && (
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Total écoles:</span> {schools.length}
            </div>
            {searchTerm && (
              <div>
                <span className="font-medium">Résultats:</span>{' '}
                {schools.filter(s => 
                  s.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
                ).length}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
