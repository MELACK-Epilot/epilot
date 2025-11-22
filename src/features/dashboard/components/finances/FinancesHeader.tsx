/**
 * 🎯 Header Page Finances
 * En-tête avec titre, stats, contexte temporel et actions
 * @module FinancesHeader
 */

import { DollarSign, RefreshCw, Download, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EPILOT_COLORS } from '@/styles/palette';
import { useAcademicYear } from '../../hooks/useAcademicYear';

interface FinancesHeaderProps {
  groupName?: string;
  totalSchools: number;
  isLoading: boolean;
  onRefresh: () => void;
  onExport?: () => void;
  lastUpdated?: number;
}

export const FinancesHeader = ({ 
  groupName, 
  totalSchools, 
  isLoading, 
  onRefresh,
  onExport,
  lastUpdated
}: FinancesHeaderProps) => {
  const academicYear = useAcademicYear();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${EPILOT_COLORS.primary.teal}15` }}
          >
            <DollarSign className="w-7 h-7" style={{ color: EPILOT_COLORS.primary.teal }} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Finances du Groupe
          </h1>
          <Badge variant="outline" className="ml-2 gap-1 bg-white">
            <Calendar className="w-3 h-3" />
            {academicYear}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{groupName} • {totalSchools} école{totalSchools > 1 ? 's' : ''}</span>
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Mis à jour à {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onExport}
          className="bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
        
        <Button 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: EPILOT_COLORS.primary.teal }}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
    </div>
  );
};
