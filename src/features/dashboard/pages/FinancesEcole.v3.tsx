/**
 * Page Finances École - VERSION 3.0 ULTRA-OPTIMISÉE
 * Layout Tabs + Header compact + Animations optimisées
 * @module FinancesEcole
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, AlertCircle, BarChart3, Users, TrendingUp, Building2, CreditCard, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useSchoolFinancialDetail } from '../hooks/useSchoolFinances';
import { useSchoolDetails, useSchoolLevelStatsComplete } from '../hooks/useSchoolDetails';
import { useSchoolMonthlyHistory } from '../hooks/useFinancialHistory';
import { useFinancialAlerts } from '../hooks/useFinancialAlerts';
import { SchoolFinancialKPIs } from '../components/SchoolFinancialKPIs';
import { SchoolActionsBar } from '../components/SchoolActionsBar';
import { InteractiveLevelsTable } from '../components/InteractiveLevelsTable';
import { FinancialEvolutionChart } from '../components/FinancialEvolutionChart';
import { FinancialForecastPanel } from '../components/FinancialForecastPanel';
import { FinancialAlertsPanel } from '../components/FinancialAlertsPanel';
import { PaymentsDetailTable } from '../components/PaymentsDetailTable';
import { SchoolBenchmarkPanel } from '../components/SchoolBenchmarkPanel';
import { MonthlyObjectivePanel } from '../components/MonthlyObjectivePanel';
import { generateMonthlyReport } from '@/utils/pdfReports';
import { exportSchoolDetailsToExcel } from '@/utils/excelExports';

export default function FinancesEcoleV3() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  
  // États
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks data
  const { data: schoolStats, isLoading, refetch } = useSchoolFinancialDetail(schoolId!);
  const { data: schoolDetails, isLoading: loadingDetails } = useSchoolDetails(schoolId!);
  const { data: levelStatsComplete, isLoading: loadingLevels } = useSchoolLevelStatsComplete(schoolId!);
  const { data: monthlyHistory, isLoading: loadingHistory } = useSchoolMonthlyHistory(schoolId!, selectedPeriod);
  const { data: alerts } = useFinancialAlerts({ resolved: false, schoolId });

  // Calculs memoized
  const profitMargin = useMemo(() => 
    schoolStats && schoolStats.totalRevenue > 0
      ? ((schoolStats.netProfit / schoolStats.totalRevenue) * 100)
      : 0,
    [schoolStats]
  );

  // Handlers
  const handleExportPDF = () => {
    if (schoolStats && levelStatsComplete && schoolDetails) {
      generateMonthlyReport(
        schoolDetails.name,
        {
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          profitMargin,
          totalOverdue: schoolStats.overdueAmount,
          globalRecoveryRate: schoolStats.recoveryRate,
          totalSchools: 1,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
        },
        [{
          schoolName: schoolDetails.name,
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          overdueAmount: schoolStats.overdueAmount,
          recoveryRate: schoolStats.recoveryRate,
        }]
      );
    }
  };

  const handleExportExcel = () => {
    if (schoolStats && schoolDetails) {
      exportSchoolDetailsToExcel(
        schoolDetails.name,
        {
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          overdueAmount: schoolStats.overdueAmount,
          recoveryRate: schoolStats.recoveryRate,
        },
        levelStatsComplete
      );
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = () => {
    if (schoolDetails) {
      const subject = `Rapport Financier - ${schoolDetails.name}`;
      const body = `Rapport financier pour l'école ${schoolDetails.name}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  // Loading state
  if (isLoading || loadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (!schoolStats || !schoolDetails) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">École non trouvée</h3>
          <Button onClick={() => navigate('/dashboard/finances-groupe')}>
            Retour aux finances du groupe
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="space-y-6 p-6 max-w-[1800px] mx-auto">
        {/* Header Compact */}
        <AnimatedSection>
          <Card 
            className="overflow-hidden"
            style={{
              borderTop: `4px solid ${schoolDetails.couleurPrincipale}`,
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard/finances-groupe')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au groupe
                </Button>

                {/* Badges Performance */}
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-sm">
                    Marge: {profitMargin.toFixed(1)}%
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Recouvrement: {schoolStats.recoveryRate.toFixed(1)}%
                  </Badge>
                  <Badge 
                    className={schoolStats.netProfit >= 0 ? 'bg-green-500' : 'bg-orange-500'}
                  >
                    {schoolStats.netProfit >= 0 ? 'Bénéficiaire' : 'Déficitaire'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Logo Compact */}
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: `${schoolDetails.couleurPrincipale}20` }}
                >
                  {schoolDetails.logoUrl ? (
                    <img
                      src={schoolDetails.logoUrl}
                      alt={`Logo ${schoolDetails.name}`}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: schoolDetails.couleurPrincipale }}
                    >
                      {schoolDetails.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Infos Compactes */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{schoolDetails.name}</h1>
                  <p className="text-sm text-gray-600">
                    {schoolDetails.typeEtablissement.charAt(0).toUpperCase() + schoolDetails.typeEtablissement.slice(1)} •{' '}
                    {schoolDetails.city || 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </AnimatedSection>

        {/* Actions Bar */}
        <AnimatedSection delay={0.05}>
          <SchoolActionsBar
            schoolName={schoolDetails.name}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
            onSendEmail={handleSendEmail}
            onRefresh={() => refetch()}
          />
        </AnimatedSection>

        {/* KPIs */}
        <AnimatedSection delay={0.1}>
          <SchoolFinancialKPIs stats={schoolStats} schoolDetails={schoolDetails} />
        </AnimatedSection>

        {/* Tabs Layout */}
        <AnimatedSection delay={0.15}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Vue</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Paiements</span>
                <span className="sm:hidden">Paie</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="levels" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Niveaux</span>
                <span className="sm:hidden">Niveaux</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Benchmark</span>
                <span className="sm:hidden">Bench</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              {/* Objectif Mensuel */}
              <MonthlyObjectivePanel 
                schoolId={schoolId!} 
                onActionClick={(action) => {
                  if (action === 'view-overdue') {
                    setActiveTab('payments');
                  }
                }}
              />

              {/* Benchmarking */}
              <SchoolBenchmarkPanel schoolId={schoolId!} />

              {/* Alertes */}
              {alerts && alerts.length > 0 && (
                <FinancialAlertsPanel schoolId={schoolId} />
              )}

              {/* Message si pas d'alertes */}
              {(!alerts || alerts.length === 0) && (
                <Card className="p-8 text-center">
                  <div className="text-green-500 mb-2">
                    <Building2 className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Aucune alerte active
                  </h3>
                  <p className="text-sm text-gray-600">
                    La situation financière de l'école est saine
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: Paiements */}
            <TabsContent value="payments" className="space-y-6">
              <PaymentsDetailTable schoolId={schoolId!} />
            </TabsContent>

            {/* TAB 3: Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Graphique Évolution */}
              <FinancialEvolutionChart
                data={monthlyHistory || []}
                isLoading={loadingHistory}
                title={`Évolution Financière - ${schoolDetails.name}`}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />

              {/* Prévisions IA */}
              {monthlyHistory && monthlyHistory.length >= 3 && (
                <FinancialForecastPanel
                  historicalData={monthlyHistory}
                  currentStats={{
                    totalRevenue: schoolStats.totalRevenue,
                    totalExpenses: schoolStats.totalExpenses,
                    profitMargin,
                  }}
                />
              )}

              {/* Message si pas assez de données */}
              {(!monthlyHistory || monthlyHistory.length < 3) && (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Données insuffisantes
                  </h3>
                  <p className="text-sm text-gray-600">
                    Au moins 3 mois de données sont nécessaires pour les prévisions
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: Niveaux */}
            <TabsContent value="levels" className="space-y-6">
              <InteractiveLevelsTable
                levels={levelStatsComplete || []}
                schoolId={schoolId!}
                isLoading={loadingLevels}
              />
            </TabsContent>

            {/* TAB 5: Benchmark */}
            <TabsContent value="benchmark" className="space-y-6">
              <SchoolBenchmarkPanel schoolId={schoolId!} />
              
              <MonthlyObjectivePanel 
                schoolId={schoolId!}
                onActionClick={(action) => {
                  if (action === 'view-overdue') {
                    setActiveTab('payments');
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
}
