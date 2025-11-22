/**
 * 🚀 TABLEAU VIRTUALISÉ ULTRA-PERFORMANT
 * Gère 900+ écoles sans ralentissement
 * Utilise @tanstack/react-virtual pour virtualisation
 * @module VirtualizedSchoolsTable
 */

import { useRef, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EPILOT_COLORS } from '@/styles/palette';

interface School {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
}

interface VirtualizedSchoolsTableProps {
  schools: School[];
}

type SortField = 'schoolName' | 'totalRevenue' | 'netProfit' | 'recoveryRate';
type SortDirection = 'asc' | 'desc';

export default function VirtualizedSchoolsTable({ schools }: VirtualizedSchoolsTableProps) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // 🔍 RECHERCHE & TRI
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 🎯 DONNÉES FILTRÉES & TRIÉES (Memoized)
  const filteredAndSortedSchools = useMemo(() => {
    let filtered = schools.filter(school =>
      school.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
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

    return filtered;
  }, [schools, searchTerm, sortField, sortDirection]);

  // 🚀 VIRTUALIZER - Affiche uniquement les lignes visibles
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedSchools.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Hauteur estimée d'une ligne
    overscan: 10, // Nombre de lignes à pré-rendre
  });

  // 🎨 FORMATAGE
  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" style={{ color: EPILOT_COLORS.primary.teal }} />
      : <ArrowDown className="w-4 h-4" style={{ color: EPILOT_COLORS.primary.teal }} />;
  };

  return (
    <Card className="overflow-hidden">
      {/* 🔍 BARRE DE RECHERCHE */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une école..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredAndSortedSchools.length} / {schools.length}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* 📊 HEADER TABLEAU */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-700">
        <div className="col-span-4 flex items-center gap-2 cursor-pointer" onClick={() => handleSort('schoolName')}>
          École {getSortIcon('schoolName')}
        </div>
        <div className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer" onClick={() => handleSort('totalRevenue')}>
          Revenus {getSortIcon('totalRevenue')}
        </div>
        <div className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer" onClick={() => handleSort('netProfit')}>
          Profit {getSortIcon('netProfit')}
        </div>
        <div className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer" onClick={() => handleSort('recoveryRate')}>
          Recouvrement {getSortIcon('recoveryRate')}
        </div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* 🚀 LISTE VIRTUALISÉE */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const school = filteredAndSortedSchools[virtualRow.index];
            const isPositiveProfit = school.netProfit >= 0;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-blue-50 transition-colors cursor-pointer">
                  {/* École */}
                  <div className="col-span-4 font-medium text-gray-900 truncate">
                    {school.schoolName}
                  </div>

                  {/* Revenus */}
                  <div className="col-span-2 text-right font-semibold" style={{ color: EPILOT_COLORS.primary.teal }}>
                    {formatCurrency(school.totalRevenue)} FCFA
                  </div>

                  {/* Profit */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPositiveProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span 
                        className="font-semibold"
                        style={{ color: isPositiveProfit ? EPILOT_COLORS.primary.teal : EPILOT_COLORS.primary.red }}
                      >
                        {formatCurrency(school.netProfit)} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Recouvrement */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(school.recoveryRate, 100)}%`,
                            backgroundColor: EPILOT_COLORS.primary.teal,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {school.recoveryRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/finances/ecole/${school.schoolId}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 FOOTER STATS */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Revenus Totaux</p>
            <p className="text-lg font-bold" style={{ color: EPILOT_COLORS.primary.teal }}>
              {formatCurrency(filteredAndSortedSchools.reduce((sum, s) => sum + s.totalRevenue, 0))} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Profit Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(filteredAndSortedSchools.reduce((sum, s) => sum + s.netProfit, 0))} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Taux Moyen</p>
            <p className="text-lg font-bold text-gray-900">
              {(filteredAndSortedSchools.reduce((sum, s) => sum + s.recoveryRate, 0) / filteredAndSortedSchools.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
