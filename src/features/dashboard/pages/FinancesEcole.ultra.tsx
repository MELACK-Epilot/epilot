/**
 * 🚀 PAGE FINANCES ÉCOLE - VERSION ULTRA NASA
 * Optimisée pour le pilotage macroscopique (4000+ élèves)
 * Structure "Drill-Down" : Global -> Niveaux -> Classes
 * @module FinancesEcoleUltra
 */

import { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, DollarSign, CreditCard, Users, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EPILOT_COLORS } from '@/styles/palette';
import { KPICard } from '../components/finances/KPICard';
import { FinancesErrorState } from '../components/finances/FinancesErrorState';
import { ChartSkeleton } from '../components/skeletons/ChartSkeleton';
import { useSchoolFinancialDetail } from '../hooks/useSchoolFinances';
import { useSchoolDetails, useSchoolLevelStatsComplete } from '../hooks/useSchoolDetails';
import { useSchoolMonthlyHistory } from '../hooks/useFinancialHistory';
import { useAcademicYear } from '../hooks/useAcademicYear';
import { SchoolFinanceFilters } from '../components/finances/SchoolFinanceFilters';
import { Badge } from '@/components/ui/badge';
import { generateMonthlyReport } from '@/utils/pdfReports';
import { toast } from 'sonner';

// Lazy loading
const FinancialEvolutionChart = lazy(() => import('../components/FinancialEvolutionChart').then(m => ({ default: m.FinancialEvolutionChart })));
const InteractiveLevelsTable = lazy(() => import('../components/InteractiveLevelsTable').then(m => ({ default: m.InteractiveLevelsTable })));

export default function FinancesEcoleUltra() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const academicYear = useAcademicYear();
  
  // États
  const [activeTab, setActiveTab] = useState('overview');
  const [chartPeriod, setChartPeriod] = useState(12);
  const [activeFilters, setActiveFilters] = useState({ period: 'year', cycle: 'all' });

  // Hooks Data
  const { data: stats, isLoading, isError, error, refetch } = useSchoolFinancialDetail(schoolId!);
  const { data: schoolDetails, isLoading: loadingDetails } = useSchoolDetails(schoolId!);
  const { data: levelStats, isLoading: loadingLevels } = useSchoolLevelStatsComplete(schoolId!);
  const { data: history, isLoading: loadingHistory } = useSchoolMonthlyHistory(schoolId!, chartPeriod);

  const formatCurrency = (val: number) => `${(val / 1000000).toFixed(1)}M FCFA`;

  // Gestion de l'export PDF
  const handleExportPDF = async () => {
    if (!stats || !schoolDetails) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    try {
      toast.loading('Génération du rapport complet...');
      
      const profitMargin = stats.totalRevenue > 0 
        ? ((stats.netProfit / stats.totalRevenue) * 100) 
        : 0;

      await generateMonthlyReport(
        schoolDetails.name,
        {
          totalRevenue: stats.totalRevenue,
          totalExpenses: stats.totalExpenses,
          netProfit: stats.netProfit,
          profitMargin,
          totalOverdue: stats.overdueAmount,
          globalRecoveryRate: stats.recoveryRate,
          totalSchools: 1,
          monthlyRevenue: stats.totalRevenue / 12, // Moyenne approximative
          monthlyExpenses: stats.totalExpenses / 12,
        },
        [{
          schoolName: schoolDetails.name,
          totalRevenue: stats.totalRevenue,
          totalExpenses: stats.totalExpenses,
          netProfit: stats.netProfit,
          overdueAmount: stats.overdueAmount,
          recoveryRate: stats.recoveryRate,
          profitMargin,
        }]
      );

      toast.dismiss();
      toast.success('Rapport téléchargé avec succès !');
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de l\'export du rapport');
      console.error(error);
    }
  };

  // Loading global
  if (isLoading || loadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
             style={{ borderColor: EPILOT_COLORS.primary.teal }} />
      </div>
    );
  }

  if (isError) {
    return <FinancesErrorState message={error?.message || "Erreur de chargement"} onRetry={refetch} />;
  }

  if (!stats || !schoolDetails) return <FinancesErrorState message="École introuvable" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* 🎯 HEADER ULTRA-COMPACT */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard/finances-groupe')}
              className="h-10 w-10 rounded-xl hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${schoolDetails.couleurPrincipale}15` }}
              >
                {schoolDetails.logoUrl ? (
                  <img src={schoolDetails.logoUrl} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="font-bold" style={{ color: schoolDetails.couleurPrincipale }}>
                    {schoolDetails.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {schoolDetails.name}
                  <Badge variant="outline" className="font-normal text-xs">
                    {academicYear}
                  </Badge>
                </h1>
                <p className="text-xs text-gray-500">
                  {schoolDetails.city} • {stats.totalStudents || 0} élèves
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <SchoolFinanceFilters 
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
            <Button 
              size="sm"
              className="text-white shadow-md gap-2"
              style={{ backgroundColor: EPILOT_COLORS.primary.teal }}
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              Rapport Complet
            </Button>
          </div>
        </div>

        {/* 📊 KPIS VITAUX (Top Level) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard 
            title="Revenus Totaux"
            value={formatCurrency(stats.totalRevenue)}
            trend={12} // À connecter
            icon={DollarSign}
            color={EPILOT_COLORS.primary.teal}
            subtext="Encaissé cette année"
          />
          <KPICard 
            title="Reste à Recouvrer"
            value={formatCurrency(stats.overdueAmount)}
            trend={-5}
            icon={AlertCircle}
            color={EPILOT_COLORS.primary.gold}
            subtext="Urgence recouvrement"
          />
          <KPICard 
            title="Dépenses"
            value={formatCurrency(stats.totalExpenses)}
            trend={2}
            icon={CreditCard}
            color={EPILOT_COLORS.primary.red}
            subtext="Budget consommé"
          />
          
          {/* Jauge de Performance */}
          <Card className="p-5 flex flex-col justify-between relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recouvrement</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.recoveryRate.toFixed(1)}%
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${stats.recoveryRate > 90 ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'}`}>
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 z-10">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${stats.recoveryRate > 90 ? 'bg-teal-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(stats.recoveryRate, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 📑 CONTENU PRINCIPAL */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border border-gray-100 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">Vue Globale</TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-gray-100">Par Niveaux</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-100">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne Gauche : Niveaux à problèmes (Top 5) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Alertes par Niveau</h3>
                  <Suspense fallback={<ChartSkeleton />}>
                    <InteractiveLevelsTable 
                      levels={levelStats?.slice(0, 5) || []} // Top 5 seulement ici
                      schoolId={schoolId!}
                      isLoading={loadingLevels}
                    />
                  </Suspense>
                </Card>
              </div>

              {/* Colonne Droite : Répartition Rapide */}
              <div className="space-y-6">
                <Card className="p-6 border-0 shadow-sm h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                  <h3 className="font-bold mb-2">État de Santé</h3>
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Profit Net</span>
                      <span className="text-xl font-bold text-green-400">
                        +{formatCurrency(stats.netProfit)}
                      </span>
                    </div>
                    <div className="w-full h-px bg-gray-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Marge</span>
                      <span className="font-bold">
                        {((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="levels" className="mt-0">
             <Suspense fallback={<ChartSkeleton />}>
                <InteractiveLevelsTable 
                  levels={levelStats || []} 
                  schoolId={schoolId!}
                  isLoading={loadingLevels}
                />
              </Suspense>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Suspense fallback={<ChartSkeleton />}>
              <FinancialEvolutionChart 
                data={history || []} 
                isLoading={loadingHistory}
                title="Évolution Financière"
                selectedPeriod={chartPeriod}
                onPeriodChange={setChartPeriod}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
