/**
 * Page Finances du Groupe Scolaire
 * Vue d'ensemble financière pour Admin Groupe
 * @module FinancesGroupe
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw } from 'lucide-react';
import { useGroupFinancialStats, useSchoolsFinancialSummary, useRevenueByCategory, useExpensesByCategory } from '../hooks/useGroupFinances';
import { FinancialKPIs } from '../components/FinancialKPIs';
import { FinancialAlertsPanel } from '../components/FinancialAlertsPanel';
import { FinancialEvolutionChart } from '../components/FinancialEvolutionChart';
import { FinancialForecastPanel } from '../components/FinancialForecastPanel';
import { FinancialDonutCharts } from '../components/FinancialDonutCharts';
import { AdvancedStatsPanel } from '../components/AdvancedStatsPanel';
import { ExportPDFButton } from '../components/ExportPDFButton';
import { FinancialActionsBar } from '../components/FinancialActionsBar';
import { PeriodComparisonPanel } from '../components/PeriodComparisonPanel';
import { InteractiveSchoolsTable } from '../components/InteractiveSchoolsTable';
import { useMonthlyFinancialHistory } from '../hooks/useFinancialHistory';
import { useFinancialAlerts } from '../hooks/useFinancialAlerts';
import { usePreviousYearGroupStats } from '../hooks/usePreviousYearStats';
import { useDebounce } from '@/hooks/useDebounce';
import { exportSchoolsToExcel } from '@/utils/excelExports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/store/auth.store';
import { Navigate, useNavigate } from 'react-router-dom';

export default function FinancesGroupe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch } = useGroupFinancialStats();
  const { data: schoolsSummary, isLoading: loadingSchools } = useSchoolsFinancialSummary();
  const { data: revenueByCategory } = useRevenueByCategory();
  const { data: expensesByCategory } = useExpensesByCategory();
  const { data: alerts } = useFinancialAlerts({ resolved: false });
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const { data: monthlyHistory, isLoading: loadingHistory } = useMonthlyFinancialHistory(selectedPeriod);
  const { data: previousYearStats } = usePreviousYearGroupStats();
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Préparer les données pour les graphiques donut
  const revenueDonutData = revenueByCategory?.map(cat => ({
    category: cat.category,
    amount: cat.amount,
    percentage: cat.percentage
  })) || [];

  const expenseDonutData = expensesByCategory?.map(cat => ({
    category: cat.category,
    amount: cat.amount,
    percentage: cat.percentage
  })) || [];

  // Vérifier accès Admin Groupe
  if (!user || user.role !== 'admin_groupe') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-[#2A9D8F]" />
            Finances du Groupe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble financière - {user?.schoolGroupName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          {stats && schoolsSummary && (
            <ExportPDFButton 
              groupName={user?.schoolGroupName || 'Groupe Scolaire'}
              stats={stats}
              schools={schoolsSummary}
              alerts={alerts || []}
            />
          )}
        </div>
      </motion.div>

      {/* KPIs + Sélecteur École */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FinancialKPIs stats={stats} isLoading={isLoading} schools={schoolsSummary} />
      </motion.div>

      {/* Barre d'Actions Avancées */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <FinancialActionsBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedSchools={selectedSchools}
          onSchoolsChange={setSelectedSchools}
          schools={schoolsSummary || []}
          onComparisonToggle={() => setShowComparison(!showComparison)}
          showComparison={showComparison}
        />
      </motion.div>

      {/* Comparaison Périodes (si activée) */}
      {showComparison && stats && previousYearStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <PeriodComparisonPanel
            currentStats={stats}
            previousStats={previousYearStats}
          />
        </motion.div>
      )}

      {/* Alertes Financières */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <FinancialAlertsPanel />
      </motion.div>

      {/* Statistiques Avancées */}
      {stats && schoolsSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <AdvancedStatsPanel stats={stats} schools={schoolsSummary} />
        </motion.div>
      )}

      {/* Graphique Évolution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <FinancialEvolutionChart 
          data={monthlyHistory || []} 
          isLoading={loadingHistory}
          title="Évolution Financière du Groupe"
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </motion.div>

      {/* Prévisions IA */}
      {monthlyHistory && monthlyHistory.length >= 3 && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <FinancialForecastPanel 
            historicalData={monthlyHistory}
            currentStats={{
              totalRevenue: stats.totalRevenue,
              totalExpenses: stats.totalExpenses,
              profitMargin: stats.profitMargin
            }}
          />
        </motion.div>
      )}

      {/* Graphiques Donut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <FinancialDonutCharts 
          revenueData={revenueDonutData}
          expenseData={expenseDonutData}
        />
      </motion.div>


      {/* Tableau Interactif par École */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {loadingSchools ? (
          <Card className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          </Card>
        ) : (
          <InteractiveSchoolsTable
            schools={schoolsSummary || []}
            onSchoolClick={(schoolId) => navigate(`/dashboard/finances/ecole/${schoolId}`)}
          />
        )}
      </motion.div>
    </div>
  );
}
