/**
 * Widget aperçu financier avec graphique
 * @module FinancialOverviewWidget
 */

import { useState } from 'react';
import { TrendingUp, Calendar, Download, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMonthlyRevenue } from '../../hooks/useMonthlyRevenue';

// Périodes disponibles
type Period = '6months' | '12months';

const PERIODS: { value: Period; label: string }[] = [
  { value: '6months', label: '6 derniers mois' },
  { value: '12months', label: '12 derniers mois' },
];

const FinancialOverviewWidget = () => {
  const [period, setPeriod] = useState<Period>('6months');
  const [showExpenses, setShowExpenses] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Utiliser les données réelles depuis le hook
  const months = period === '6months' ? 6 : 12;
  const { data: revenueData, isLoading, isError, error, refetch } = useMonthlyRevenue(months);
  
  const data = revenueData?.data || [];
  const totalRevenue = revenueData?.totalRevenue || 0;
  const totalExpenses = revenueData?.totalExpenses || 0;
  const totalProfit = revenueData?.totalProfit || 0;
  const achievement = revenueData?.achievement.toFixed(1) || '0.0';
  
  const handleExport = () => {
    // TODO: Implémenter export CSV/Excel
    console.log('Export des données financières');
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="group relative bg-white rounded border border-gray-200 p-4 h-full hover:border-[#2A9D8F]/30 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header avec actions */}
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1D3557] flex items-center gap-2">
          <div className="p-1.5 bg-[#2A9D8F]/10 rounded group-hover:scale-110 group-hover:bg-[#2A9D8F]/20 transition-all duration-300">
            <TrendingUp className="h-3.5 w-3.5 text-[#2A9D8F] group-hover:translate-y-[-2px] transition-transform duration-300" />
          </div>
          Revenus Mensuels
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleExport}
          >
            <Download className="h-3 w-3" />
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">{PERIODS.find(p => p.value === period)?.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            
            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-8 z-10 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[180px]">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPeriod(p.value);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      period === p.value ? 'bg-[#2A9D8F]/10 text-[#2A9D8F] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ✅ CORRECTION: Affichage des erreurs */}
      {isError && (
        <div className="relative mb-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Impossible de charger les revenus mensuels.</p>
              {error instanceof Error && (
                <p className="text-xs">Détails: {error.message}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isError && (
        <div className="relative mb-3">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      )}

      {/* Stats résumé */}
      {!isError && !isLoading && (
        <div className="relative grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-[#2A9D8F]/5 rounded">
            <p className="text-xs text-gray-500">Revenus</p>
            <p className="text-sm font-semibold text-[#1D3557]">{(totalRevenue / 1000000).toFixed(1)}M</p>
          </div>
          <div className="text-center p-2 bg-[#E63946]/5 rounded">
            <p className="text-xs text-gray-500">Dépenses</p>
            <p className="text-sm font-semibold text-[#1D3557]">{(totalExpenses / 1000000).toFixed(1)}M</p>
          </div>
          <div className="text-center p-2 bg-[#E9C46A]/5 rounded">
            <p className="text-xs text-gray-500">Profit</p>
            <p className="text-sm font-semibold text-[#1D3557]">{(totalProfit / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      )}

      {/* Filtres d'affichage */}
      {!isError && !isLoading && (
        <div className="relative flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowExpenses(!showExpenses)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showExpenses ? 'bg-[#E63946]/10 text-[#E63946]' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-2 h-2 rounded-sm bg-[#E63946]" />
            Dépenses
          </button>
          <button
            onClick={() => setShowProfit(!showProfit)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showProfit ? 'bg-[#E9C46A]/10 text-[#E9C46A]' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-2 h-2 rounded-sm bg-[#E9C46A]" />
            Profit
          </button>
        </div>
      )}

      {/* Graphique */}
      {!isError && !isLoading && (
        <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={192}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '8px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  revenue: 'Revenus',
                  expenses: 'Dépenses',
                  profit: 'Profit',
                };
                return [`${(value / 1000000).toFixed(2)}M FCFA`, labels[name] || name];
              }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.revenue >= entry.target ? '#2A9D8F' : '#E9C46A'}
                />
              ))}
            </Bar>
            {showExpenses && (
              <Bar dataKey="expenses" fill="#E63946" radius={[4, 4, 0, 0]} opacity={0.7} />
            )}
            {showProfit && (
              <Bar dataKey="profit" fill="#E9C46A" radius={[4, 4, 0, 0]} opacity={0.7} />
            )}
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}

      {/* Footer avec taux d'atteinte */}
      {!isError && !isLoading && (
        <div className="relative mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-[#2A9D8F]" />
              <span className="text-gray-500">Objectif atteint</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-[#E9C46A]" />
              <span className="text-gray-500">En dessous</span>
            </div>
          </div>
          <div className="px-2 py-1 bg-[#2A9D8F]/10 rounded">
            <span className="text-xs font-semibold text-[#2A9D8F]">{achievement}% atteint</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverviewWidget;
