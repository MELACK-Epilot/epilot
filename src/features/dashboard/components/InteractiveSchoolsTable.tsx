/**
 * Tableau interactif des écoles avec actions multiples
 * Sélection, tri, filtres, actions en masse
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Eye,
  FileText,
  Mail,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Archive,
  Edit,
  Search,
  Filter,
  Calendar,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';

interface School {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
  totalStudents?: number;
}

interface InteractiveSchoolsTableProps {
  schools: School[];
  onSchoolClick?: (schoolId: string) => void;
  onExport?: (schoolIds: string[]) => void;
  onSendEmail?: (schoolIds: string[]) => void;
  onCreateAlert?: (schoolIds: string[]) => void;
}

type SortField = 'schoolName' | 'totalRevenue' | 'totalExpenses' | 'netProfit' | 'recoveryRate';
type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export const InteractiveSchoolsTable = ({
  schools,
  onSchoolClick,
  onExport,
  onSendEmail,
  onCreateAlert,
}: InteractiveSchoolsTableProps) => {
  const navigate = useNavigate();
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [sortField, setSortField] = useState<SortField>('schoolName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'schoolName', label: 'École', visible: true },
    { key: 'totalRevenue', label: 'Revenus', visible: true },
    { key: 'totalExpenses', label: 'Dépenses', visible: true },
    { key: 'netProfit', label: 'Profit', visible: true },
    { key: 'margin', label: 'Marge', visible: true },
    { key: 'overdueAmount', label: 'Retards', visible: true },
    { key: 'recoveryRate', label: 'Recouvrement', visible: true },
  ]);

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const toggleSchool = (schoolId: string) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const toggleAll = () => {
    setSelectedSchools(
      selectedSchools.length === schools.length ? [] : schools.map((s) => s.schoolId)
    );
  };

  const toggleFavorite = (schoolId: string) => {
    setFavorites((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  // Filtrage et tri des écoles
  const filteredAndSortedSchools = useMemo(() => {
    let filtered = schools.filter(school =>
      school.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [schools, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const handleBulkAction = (action: 'export' | 'email' | 'alert') => {
    if (selectedSchools.length === 0) return;

    switch (action) {
      case 'export':
        onExport?.(selectedSchools);
        break;
      case 'email':
        onSendEmail?.(selectedSchools);
        break;
      case 'alert':
        onCreateAlert?.(selectedSchools);
        break;
    }
  };

  const toggleColumn = (key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };

  const isColumnVisible = (key: string) => {
    return columns.find(col => col.key === key)?.visible ?? true;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une école, un niveau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mois en cours</SelectItem>
              <SelectItem value="last">Mois dernier</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu open={showColumnSettings} onOpenChange={setShowColumnSettings}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuItem
                  key={column.key}
                  onClick={() => toggleColumn(column.key)}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={column.visible}
                    onChange={() => toggleColumn(column.key)}
                  />
                  {column.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header avec actions en masse */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Écoles ({filteredAndSortedSchools.length}/{schools.length})
            </h3>
            {selectedSchools.length > 0 && (
              <Badge variant="secondary">
                {selectedSchools.length} sélectionnée(s)
              </Badge>
            )}
          </div>

          {/* Actions en masse */}
          <div className="flex items-center gap-2">
            {selectedSchools.length > 0 ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Exporter ({selectedSchools.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF Détaillé
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <FileText className="w-4 h-4 mr-2" />
                      CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('email')}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer par email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('alert')}
                  className="gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Créer alerte
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSchools([])}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtres
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Paramètres
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedSchools.length === filteredAndSortedSchools.length && filteredAndSortedSchools.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('schoolName')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    École
                    {getSortIcon('schoolName')}
                  </Button>
                </TableHead>
                {isColumnVisible('totalRevenue') && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('totalRevenue')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Revenus
                      {getSortIcon('totalRevenue')}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible('totalExpenses') && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('totalExpenses')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Dépenses
                      {getSortIcon('totalExpenses')}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible('netProfit') && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('netProfit')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Profit
                      {getSortIcon('netProfit')}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible('margin') && (
                  <TableHead className="text-right">Marge</TableHead>
                )}
                {isColumnVisible('overdueAmount') && (
                  <TableHead className="text-right">Retards</TableHead>
                )}
                {isColumnVisible('recoveryRate') && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('recoveryRate')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Recouvrement
                      {getSortIcon('recoveryRate')}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSchools.map((school) => {
                const margin =
                  school.totalRevenue > 0
                    ? ((school.netProfit / school.totalRevenue) * 100)
                    : 0;
                const isFavorite = favorites.includes(school.schoolId);

                return (
                  <TableRow
                    key={school.schoolId}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedSchools.includes(school.schoolId) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedSchools.includes(school.schoolId)}
                        onCheckedChange={() => toggleSchool(school.schoolId)}
                      />
                    </TableCell>

                    {/* Favori */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFavorite(school.schoolId)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    </TableCell>

                    {/* Nom école */}
                    <TableCell
                      className="font-medium"
                      onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                    >
                      <div className="flex items-center gap-2">
                        {school.schoolName}
                        {school.totalStudents && (
                          <Badge variant="outline" className="text-xs">
                            {school.totalStudents} élèves
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Revenus */}
                    {isColumnVisible('totalRevenue') && (
                      <TableCell
                        className="text-right text-[#2A9D8F] font-semibold"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        {formatCurrency(school.totalRevenue)}
                      </TableCell>
                    )}

                    {/* Dépenses */}
                    {isColumnVisible('totalExpenses') && (
                      <TableCell
                        className="text-right text-[#E63946] font-semibold"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        {formatCurrency(school.totalExpenses)}
                      </TableCell>
                    )}

                    {/* Profit */}
                    {isColumnVisible('netProfit') && (
                      <TableCell
                        className="text-right"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {school.netProfit >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={school.netProfit >= 0 ? 'text-[#2A9D8F]' : 'text-[#E63946]'}
                          >
                            {formatCurrency(school.netProfit)}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {/* Marge */}
                    {isColumnVisible('margin') && (
                      <TableCell
                        className="text-right"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        <Badge
                          variant={
                            margin >= 20 ? 'default' : margin >= 10 ? 'secondary' : 'destructive'
                          }
                        >
                          {formatPercentage(margin)}
                        </Badge>
                      </TableCell>
                    )}

                    {/* Retards */}
                    {isColumnVisible('overdueAmount') && (
                      <TableCell
                        className="text-right"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        {school.overdueAmount > 0 ? (
                          <span className="text-[#E63946] font-semibold">
                            {formatCurrency(school.overdueAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}

                    {/* Recouvrement */}
                    {isColumnVisible('recoveryRate') && (
                      <TableCell
                        className="text-right"
                        onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2A9D8F] rounded-full transition-all"
                              style={{ width: `${Math.min(school.recoveryRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {formatPercentage(school.recoveryRate)}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onExport?.([school.schoolId])}>
                            <FileText className="w-4 h-4 mr-2" />
                            Exporter PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSendEmail?.([school.schoolId])}>
                            <Mail className="w-4 h-4 mr-2" />
                            Envoyer email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCreateAlert?.([school.schoolId])}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Créer alerte
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};
