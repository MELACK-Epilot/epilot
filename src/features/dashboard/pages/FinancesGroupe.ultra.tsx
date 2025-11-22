/**
 * 🚀 PAGE FINANCES GROUPE - VERSION ULTRA-PERFORMANTE NASA
 * Optimisée pour 900+ écoles avec performances éclair
 * Design minimaliste spatial moderne
 * @module FinancesGroupeUltra
 */

import { useState, lazy, Suspense } from 'react';
import { AlertCircle, DollarSign, CreditCard, Users } from 'lucide-react';
import { useGroupFinancialStats, useSchoolsFinancialSummary, useRefreshFinancialData } from '../hooks/useGroupFinances';
import { useMonthlyFinancialHistory } from '../hooks/useFinancialHistory';
import { useFinanceExport } from '../hooks/useFinanceExport';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/store/auth.store';
import { Navigate } from 'react-router-dom';
import { EPILOT_COLORS } from '@/styles/palette';
import { KPICard } from '../components/finances/KPICard';
import { FinancesHeader } from '../components/finances/FinancesHeader';
import { FinancesErrorState } from '../components/finances/FinancesErrorState';
import { ChartSkeleton } from '../components/skeletons/ChartSkeleton';
import { toast } from 'sonner';

// 🚀 LAZY LOADING - Composants lourds chargés à la demande
const FinancialEvolutionChart = lazy(() => import('../components/FinancialEvolutionChart').then(m => ({ default: m.FinancialEvolutionChart })));
const VirtualizedSchoolsTable = lazy(() => import('@/features/dashboard/components/VirtualizedSchoolsTable'));
const FinancialAlertsPanel = lazy(() => import('../components/FinancialAlertsPanel').then(m => ({ default: m.FinancialAlertsPanel })));

export default function FinancesGroupeUltra() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chartPeriod, setChartPeriod] = useState(12);
  const { exportToCSV } = useFinanceExport();

  // 🔒 Protection Admin Groupe
  if (!user || user.role !== 'admin_groupe') {
    return <Navigate to="/dashboard" replace />;
  }

  // 🔄 REFRESH MUTATION
  const { mutateAsync: refreshData, isPending: isRefreshing } = useRefreshFinancialData();

  // 📊 DATA FETCHING - Optimisé avec React Query
  const { 
    data: stats, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    dataUpdatedAt 
  } = useGroupFinancialStats();

  const { 
    data: schoolsSummary, 
    isLoading: loadingSchools,
    isError: isSchoolsError,
    error: schoolsError,
    refetch: refetchSchools
  } = useSchoolsFinancialSummary();
  
  const { 
    data: chartData, 
    isLoading: isChartLoading 
  } = useMonthlyFinancialHistory(chartPeriod);

  const formatCurrency = (val: number) => `${(val / 1000000).toFixed(1)}M FCFA`;

  const handleExport = () => {
    if (schoolsSummary && schoolsSummary.length > 0) {
      exportToCSV(schoolsSummary, 'finances_ecoles_groupe');
    }
  };

  const handleRefreshAll = async () => {
    try {
      await refreshData();
      await Promise.all([refetch(), refetchSchools()]);
      toast.success('Données financières actualisées');
    } catch (error) {
      console.error('Erreur refresh:', error);
      // Fallback: just refetch queries if RPC fails
      refetch();
      refetchSchools();
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* 🎯 HEADER MINIMALISTE */}
        <FinancesHeader
          groupName={user?.schoolGroupName}
          totalSchools={stats?.totalSchools || 0}
          isLoading={isLoading || isRefreshing}
          onRefresh={handleRefreshAll}
          onExport={handleExport}
          lastUpdated={dataUpdatedAt}
        />

        {/* ⚠️ ERROR STATE - Stats Globale */}
        {isError && (
          <FinancesErrorState
            message={error?.message || "Erreur de chargement des statistiques globales"}
            onRetry={refetch}
          />
        )}

        {/* 📊 KPIs GRID - 4 cartes essentielles pour le pilotage */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-gray-100 border-0 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. REVENUS (Le nerf de la guerre) */}
            <KPICard 
              title="Revenus Encaissés"
              value={formatCurrency(stats?.totalRevenue || 0)}
              trend={stats?.revenueGrowth || 0}
              icon={DollarSign}
              color={EPILOT_COLORS.primary.teal}
              subtext="Cash réel en banque"
            />
            
            {/* 2. DÉPENSES (Le contrôle) */}
            <KPICard 
              title="Dépenses Totales"
              value={formatCurrency(stats?.totalExpenses || 0)}
              trend={-5} // TODO: Connecter à la croissance réelle des dépenses
              icon={CreditCard}
              color={EPILOT_COLORS.primary.red}
              subtext="Sorties de fonds"
            />

            {/* 3. IMPAYÉS (L'urgence) */}
            <KPICard 
              title="Reste à Recouvrer"
              value={formatCurrency(stats?.totalOverdue || 0)}
              trend={8} // TODO: Connecter à la variation des impayés
              icon={AlertCircle}
              color={EPILOT_COLORS.primary.gold}
              subtext="Argent dehors (Urgent)"
            />

            {/* 4. TAUX DE RECOUVREMENT (La performance) */}
            <Card className="p-6 flex flex-col justify-between relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-sm font-medium text-gray-500">Taux de Recouvrement</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {stats?.globalRecoveryRate?.toFixed(1) || 0}%
                  </h3>
                </div>
                <div className={`p-2 rounded-lg ${
                  (stats?.globalRecoveryRate || 0) > 80 ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 z-10">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      (stats?.globalRecoveryRate || 0) > 80 ? 'bg-teal-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(stats?.globalRecoveryRate || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Objectif: 90% global
                </p>
              </div>
              {/* Décoration d'arrière-plan */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50" />
            </Card>
          </div>
        )}

        {/* ⚠️ ERROR STATE - Schools */}
        {isSchoolsError && (
          <FinancesErrorState
            message={schoolsError?.message || "Impossible de charger la liste des écoles"}
            onRetry={refetchSchools}
          />
        )}

        {/* 📑 TABS SIMPLIFIÉS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="schools">
              Écoles ({schoolsSummary?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VUE D'ENSEMBLE */}
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<ChartSkeleton />}>
              <FinancialAlertsPanel />
            </Suspense>
            
            <Suspense fallback={<ChartSkeleton />}>
              <FinancialEvolutionChart 
                data={chartData || []} 
                isLoading={isChartLoading}
                title="Évolution Financière du Groupe"
                selectedPeriod={chartPeriod}
                onPeriodChange={setChartPeriod}
              />
            </Suspense>
          </TabsContent>

          {/* TAB 2: ÉCOLES (VIRTUALISÉ) */}
          <TabsContent value="schools" className="space-y-6">
            {loadingSchools ? (
              <Card className="p-6 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                       style={{ borderColor: EPILOT_COLORS.primary.teal }} />
                  <p className="text-gray-600">Chargement des écoles...</p>
                </div>
              </Card>
            ) : !schoolsSummary || schoolsSummary.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune école
                </h3>
                <p className="text-sm text-gray-600">
                  Créez votre première école pour voir les statistiques.
                </p>
              </Card>
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <VirtualizedSchoolsTable schools={schoolsSummary} />
              </Suspense>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
