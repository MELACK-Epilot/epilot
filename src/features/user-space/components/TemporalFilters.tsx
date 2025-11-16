/**
 * Composant de filtres temporels pour le dashboard
 * Permet de filtrer les données par période (mois, trimestre, année)
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Filter,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  ChevronDown
} from 'lucide-react';

interface TemporalFiltersProps {
  selectedPeriod: 'month' | 'quarter' | 'year';
  selectedRange: string;
  onPeriodChange: (period: 'month' | 'quarter' | 'year') => void;
  onRangeChange: (range: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
  className?: string;
}

const TemporalFilters = memo(({ 
  selectedPeriod, 
  selectedRange,
  onPeriodChange, 
  onRangeChange,
  onRefresh,
  onExport,
  isLoading = false,
  className = '' 
}: TemporalFiltersProps) => {

  const [isExpanded, setIsExpanded] = useState(false);

  // Options de périodes
  const periodOptions = [
    { value: 'month', label: 'Mensuel', icon: Calendar, description: 'Données par mois' },
    { value: 'quarter', label: 'Trimestriel', icon: BarChart3, description: 'Données par trimestre' },
    { value: 'year', label: 'Annuel', icon: TrendingUp, description: 'Données par année' }
  ];

  // Options de plages selon la période sélectionnée
  const getRangeOptions = (period: string) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    switch (period) {
      case 'month':
        return Array.from({ length: 12 }, (_, i) => {
          const monthIndex = (currentMonth - i + 12) % 12;
          const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
          const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
          ];
          return {
            value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
            label: `${monthNames[monthIndex]} ${year}`,
            isCurrent: i === 0
          };
        });
      
      case 'quarter':
        const quarters = [];
        for (let i = 0; i < 8; i++) {
          const quarterIndex = Math.floor((currentMonth - i * 3) / 3);
          const year = currentMonth - i * 3 < 0 ? currentYear - Math.ceil(Math.abs(currentMonth - i * 3) / 12) : currentYear;
          const adjustedQuarter = ((quarterIndex % 4) + 4) % 4;
          quarters.push({
            value: `${year}-Q${adjustedQuarter + 1}`,
            label: `T${adjustedQuarter + 1} ${year}`,
            isCurrent: i === 0
          });
        }
        return quarters;
      
      case 'year':
        return Array.from({ length: 5 }, (_, i) => ({
          value: `${currentYear - i}`,
          label: `Année ${currentYear - i}`,
          isCurrent: i === 0
        }));
      
      default:
        return [];
    }
  };

  const rangeOptions = getRangeOptions(selectedPeriod);
  const currentPeriodOption = periodOptions.find(p => p.value === selectedPeriod);
  const currentRangeOption = rangeOptions.find(r => r.value === selectedRange);

  return (
    <Card className={`p-4 bg-white border-0 shadow-lg rounded-2xl ${className}`}>
      <div className="flex items-center justify-between">
        {/* Section principale */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">Filtres Temporels</h3>
              <p className="text-sm text-gray-600 truncate">
                {currentPeriodOption?.description} • {currentRangeOption?.label}
              </p>
            </div>
          </div>

          {/* Sélecteurs principaux */}
          <div className="flex items-center gap-3">
            {/* Sélecteur de période */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {periodOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={selectedPeriod === option.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPeriodChange(option.value as 'month' | 'quarter' | 'year')}
                    className={`gap-2 ${
                      selectedPeriod === option.value 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Sélecteur de plage */}
            <Select value={selectedRange} onValueChange={onRangeChange}>
              <SelectTrigger className="w-48 bg-white border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.isCurrent && (
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Actuel
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Indicateur de statut */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-600">
              {isLoading ? 'Chargement...' : 'À jour'}
            </span>
          </div>

          {/* Bouton d'expansion pour options avancées */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-blue-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>

          {/* Bouton refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-gray-600 hover:text-blue-600"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Bouton export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Section étendue avec options avancées */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Comparaison */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Comparaison</label>
              <Select defaultValue="previous">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Période précédente</SelectItem>
                  <SelectItem value="same-last-year">Même période année dernière</SelectItem>
                  <SelectItem value="average">Moyenne historique</SelectItem>
                  <SelectItem value="none">Aucune comparaison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Granularité */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Granularité</label>
              <Select defaultValue="auto">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatique</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Métriques */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Métriques</label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les métriques</SelectItem>
                  <SelectItem value="academic">Académiques uniquement</SelectItem>
                  <SelectItem value="financial">Financières uniquement</SelectItem>
                  <SelectItem value="operational">Opérationnelles uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Raccourcis rapides */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Raccourcis rapides</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Ce mois', action: () => onRangeChange(rangeOptions[0]?.value || '') },
                { label: 'Mois dernier', action: () => onRangeChange(rangeOptions[1]?.value || '') },
                { label: 'Ce trimestre', action: () => { onPeriodChange('quarter'); onRangeChange(getRangeOptions('quarter')[0]?.value || ''); } },
                { label: 'Cette année', action: () => { onPeriodChange('year'); onRangeChange(getRangeOptions('year')[0]?.value || ''); } }
              ].map((shortcut) => (
                <Button
                  key={shortcut.label}
                  variant="outline"
                  size="sm"
                  onClick={shortcut.action}
                  className="text-xs text-gray-600 hover:text-blue-600 hover:border-blue-200"
                >
                  {shortcut.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </Card>
  );
});

TemporalFilters.displayName = 'TemporalFilters';

export default TemporalFilters;
