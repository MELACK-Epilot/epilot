/**
 * Page Finances du Groupe Scolaire - VERSION 2.0 OPTIMISÉE
 * Layout Tabs + Animations optimisées + Code nettoyé
 * @module FinancesGroupe
 */

import { useState, useMemo } from 'react';
import { DollarSign, RefreshCw, BarChart3, School, TrendingUp } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useAuth } from '@/features/auth/store/auth.store';
import { Navigate, useNavigate } from 'react-router-dom';

export default function FinancesGroupeV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Hooks data
  const { data: stats, isLoading, refetch } = useGroupFinancialStats();
  const { data: schoolsSummary, isLoading: loadingSchools } = useSchoolsFinancialSummary();
  const { data: revenueByCategory } = useRevenueByCategory();
  const { data: expensesByCategory } = useExpensesByCategory();
  const { data: alerts } = useFinancialAlerts({ resolved: false });
  const { data: monthlyHistory, isLoading: loadingHistory } = useMonthlyFinancialHistory(selectedPeriod);
  const { data: previousYearStats } = usePreviousYearGroupStats();
  
  // Debounce search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Préparer données donut (memoized)
  const revenueDonutData = useMemo(() => 
    revenueByCategory?.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: cat.percentage
    })) || [], 
    [revenueByCategory]
  );

  const expenseDonutData = useMemo(() => 
    expensesByCategory?.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: cat.percentage
    })) || [], 
    [expensesByCategory]
  );

  // Handlers
  const handleExportExcel = () => {
    if (schoolsSummary) {
      exportSchoolsToExcel(
        schoolsSummary.map(school => ({
          schoolName: school.schoolName,
          totalRevenue: school.totalRevenue,
          totalExpenses: school.totalExpenses,
          netProfit: school.netProfit,
          overdueAmount: school.overdueAmount,
          recoveryRate: school.recoveryRate,
          profitMargin: school.totalRevenue > 0 
            ? ((school.netProfit / school.totalRevenue) * 100) 
            : 0,
        })),
        user?.schoolGroupName || 'Groupe Scolaire'
      );
    }
  };

  // Vérifier accès Admin Groupe
  if (!user || user.role !== 'admin_groupe') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between">
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
        </div>
      </AnimatedSection>

      {/* KPIs Globaux */}
      <AnimatedSection delay={0.05}>
        <FinancialKPIs stats={stats} isLoading={isLoading} schools={schoolsSummary} />
      </AnimatedSection>

      {/* Tabs Layout */}
      <AnimatedSection delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-2">
              <School className="w-4 h-4" />
              <span className="hidden sm:inline">Écoles</span>
              <span className="sm:hidden">Écoles</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Alertes */}
            {alerts && alerts.length > 0 && (
              <FinancialAlertsPanel />
            )}

            {/* Statistiques Avancées */}
            {stats && schoolsSummary && (
              <AdvancedStatsPanel stats={stats} schools={schoolsSummary} />
            )}

            {/* Comparaison N vs N-1 */}
            {showComparison && stats && previousYearStats && (
              <PeriodComparisonPanel
                currentStats={stats}
                previousStats={previousYearStats}
              />
            )}

            {/* Toggle Comparaison */}
            <div className="flex justify-center">
              <Button
                variant={showComparison ? 'default' : 'outline'}
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Masquer' : 'Afficher'} Comparaison N vs N-1
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Graphique Évolution */}
            <FinancialEvolutionChart 
              data={monthlyHistory || []} 
              isLoading={loadingHistory}
              title="Évolution Financière du Groupe"
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />

            {/* Prévisions IA */}
            {monthlyHistory && monthlyHistory.length >= 3 && stats && (
              <FinancialForecastPanel 
                historicalData={monthlyHistory}
                currentStats={{
                  totalRevenue: stats.totalRevenue,
                  totalExpenses: stats.totalExpenses,
                  profitMargin: stats.profitMargin
                }}
              />
            )}

            {/* Graphiques Donut */}
            <FinancialDonutCharts 
              revenueData={revenueDonutData}
              expenseData={expenseDonutData}
            />
          </TabsContent>

          {/* TAB 3: Écoles */}
          <TabsContent value="schools" className="space-y-6">
            {/* Barre d'Actions */}
            <FinancialActionsBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSchools={selectedSchools}
              onSchoolsChange={setSelectedSchools}
              schools={schoolsSummary || []}
              onComparisonToggle={() => setShowComparison(!showComparison)}
              showComparison={showComparison}
              onExportExcel={handleExportExcel}
              stats={stats}
            />

            {/* Tableau Interactif */}
            {loadingSchools ? (
              <Card className="p-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
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
          </TabsContent>
        </Tabs>
      </AnimatedSection>
    </div>
  );
}
