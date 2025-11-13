/**
 * Tableau interactif des niveaux avec statistiques détaillées
 * Revenus, dépenses, élèves par niveau
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  FileText,
  Users,
  DollarSign,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LevelStat {
  level: string;
  nombreEleves: number;
  nombreClasses: number;
  revenusTotal: number;
  depensesTotal: number;
  revenusParEleve: number;
  tauxRecouvrement: number;
  montantRetards: number;
}

interface InteractiveLevelsTableProps {
  levels: LevelStat[];
  schoolId: string;
  isLoading?: boolean;
}

export const InteractiveLevelsTable = ({
  levels,
  schoolId,
  isLoading = false,
}: InteractiveLevelsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof LevelStat>('level');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M FCFA`;
    }
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  };

  const handleSort = (field: keyof LevelStat) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLevels = [...levels].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (levels.length === 0) {
    return (
      <Card className="p-12 text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Aucune donnée par niveau disponible</p>
      </Card>
    );
  }

  const totals = levels.reduce(
    (acc, level) => ({
      eleves: acc.eleves + level.nombreEleves,
      classes: acc.classes + level.nombreClasses,
      revenus: acc.revenus + level.revenusTotal,
      depenses: acc.depenses + level.depensesTotal,
      retards: acc.retards + level.montantRetards,
    }),
    { eleves: 0, classes: 0, revenus: 0, depenses: 0, retards: 0 }
  );

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Performance par Niveau</h3>
        </div>
        <Badge variant="outline" className="text-sm">
          {levels.length} niveau(x)
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Élèves</p>
          <p className="text-2xl font-bold text-blue-900">{totals.eleves}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium mb-1">Total Classes</p>
          <p className="text-2xl font-bold text-purple-900">{totals.classes}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Revenus Totaux</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(totals.revenus)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-orange-600 font-medium mb-1">Retards</p>
          <p className="text-lg font-bold text-orange-900">{formatCurrency(totals.retards)}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('level')}
              >
                Niveau {sortField === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('nombreEleves')}
              >
                Élèves {sortField === 'nombreEleves' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Classes</TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('revenusTotal')}
              >
                Revenus {sortField === 'revenusTotal' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Dépenses</TableHead>
              <TableHead className="text-right">Rev/Élève</TableHead>
              <TableHead className="text-right">Recouvrement</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLevels.map((level) => {
              const profit = level.revenusTotal - level.depensesTotal;
              const isProfit = profit >= 0;

              return (
                <TableRow
                  key={level.level}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/finances/niveau/${schoolId}/${level.level}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      {level.level}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {level.nombreEleves}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {level.nombreClasses}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 font-semibold">
                    {formatCurrency(level.revenusTotal)}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 font-semibold">
                    {formatCurrency(level.depensesTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{formatCurrency(level.revenusParEleve)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={level.tauxRecouvrement} className="w-16 h-2" />
                        <span className="text-xs font-medium">{level.tauxRecouvrement.toFixed(0)}%</span>
                      </div>
                      {level.montantRetards > 0 && (
                        <p className="text-xs text-orange-600">
                          {formatCurrency(level.montantRetards)} retard
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/finances/niveau/${schoolId}/${level.level}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Exporter PDF
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
    </Card>
  );
};
