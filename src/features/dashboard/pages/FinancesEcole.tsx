/**
 * Page Finances École - VERSION 3.0 ULTRA-OPTIMISÉE
 * Layout Tabs + Header compact + Animations optimisées
 * @module FinancesEcole
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, AlertCircle, BarChart3, Users, TrendingUp, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useSchoolFinancialDetail } from '../hooks/useSchoolFinances';
import { useSchoolDetails, useSchoolLevelStatsComplete } from '../hooks/useSchoolDetails';
import { useSchoolMonthlyHistory } from '../hooks/useFinancialHistory';
import { useFinancialAlerts } from '../hooks/useFinancialAlerts';
import { useSchoolPersonnel } from '../hooks/useSchoolPersonnel';
import { SchoolFinancialKPIs } from '../components/SchoolFinancialKPIs';
import { SchoolActionsBar } from '../components/SchoolActionsBar';
import { InteractiveLevelsTable } from '../components/InteractiveLevelsTable';
import { FinancialEvolutionChart } from '../components/FinancialEvolutionChart';
import { FinancialForecastPanel } from '../components/FinancialForecastPanel';
import { FinancialAlertsPanel } from '../components/FinancialAlertsPanel';
import { generateMonthlyReport } from '@/utils/pdfReports';
import { exportSchoolDetailsToExcel } from '@/utils/excelExports';
import { toast } from 'sonner';

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
  const { data: personnelData, isLoading: loadingPersonnel } = useSchoolPersonnel(schoolId!);

  // Calculs memoized
  const profitMargin = useMemo(() => 
    schoolStats && schoolStats.totalRevenue > 0
      ? ((schoolStats.netProfit / schoolStats.totalRevenue) * 100)
      : 0,
    [schoolStats]
  );

  // Handlers avec vraies données et feedback
  const handleExportPDF = async () => {
    if (!schoolStats || !schoolDetails) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    try {
      toast.loading('Génération du PDF en cours...');
      
      await generateMonthlyReport(
        schoolDetails.name,
        {
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          profitMargin,
          totalOverdue: schoolStats.overdueAmount,
          globalRecoveryRate: schoolStats.recoveryRate,
          totalSchools: 1,
          monthlyRevenue: schoolStats.totalRevenue / 12,
          monthlyExpenses: schoolStats.totalExpenses / 12,
        },
        [{
          schoolName: schoolDetails.name,
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          overdueAmount: schoolStats.overdueAmount,
          recoveryRate: schoolStats.recoveryRate,
          profitMargin,
        }]
      );

      toast.success('PDF exporté avec succès !', {
        description: `Rapport de ${schoolDetails.name}`,
      });
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
      console.error(error);
    }
  };

  const handleExportExcel = async () => {
    if (!schoolStats || !schoolDetails) {
      toast.error('Données manquantes pour l\'export');
      return;
    }

    try {
      toast.loading('Génération du fichier Excel...');
      
      await exportSchoolDetailsToExcel(
        schoolDetails.name,
        {
          totalRevenue: schoolStats.totalRevenue,
          totalExpenses: schoolStats.totalExpenses,
          netProfit: schoolStats.netProfit,
          overdueAmount: schoolStats.overdueAmount,
          recoveryRate: schoolStats.recoveryRate,
        },
        levelStatsComplete || []
      );

      toast.success('Excel exporté avec succès !', {
        description: `Données de ${schoolDetails.name}`,
      });
    } catch (error) {
      toast.error('Erreur lors de l\'export Excel');
      console.error(error);
    }
  };

  const handlePrint = () => {
    toast.info('Ouverture de l\'aperçu avant impression...');
    setTimeout(() => window.print(), 500);
  };

  const handleSendEmail = () => {
    if (!schoolDetails || !schoolStats) {
      toast.error('Données manquantes');
      return;
    }

    const subject = `Rapport Financier - ${schoolDetails.name}`;
    const body = `
Rapport Financier - ${schoolDetails.name}

📊 Résumé Financier:
- Revenus: ${(schoolStats.totalRevenue / 1000000).toFixed(2)}M FCFA
- Dépenses: ${(schoolStats.totalExpenses / 1000000).toFixed(2)}M FCFA
- Profit: ${(schoolStats.netProfit / 1000000).toFixed(2)}M FCFA
- Marge: ${profitMargin.toFixed(1)}%
- Taux de recouvrement: ${schoolStats.recoveryRate.toFixed(1)}%

📅 Période: ${new Date().toLocaleDateString('fr-FR')}
    `;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success('Client email ouvert');
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
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
              <TabsTrigger value="levels" className="gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Niveaux</span>
                <span className="sm:hidden">Niveaux</span>
              </TabsTrigger>
              <TabsTrigger value="personnel" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Personnel</span>
                <span className="sm:hidden">Staff</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
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

            {/* TAB 2: Analytics */}
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

            {/* TAB 3: Niveaux */}
            <TabsContent value="levels" className="space-y-6">
              <InteractiveLevelsTable
                levels={levelStatsComplete || []}
                schoolId={schoolId!}
                isLoading={loadingLevels}
              />
            </TabsContent>

            {/* TAB 4: Personnel */}
            <TabsContent value="personnel" className="space-y-6">
              {loadingPersonnel ? (
                <Card className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-4">Chargement du personnel...</p>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Personnel de l'école</h3>
                        <p className="text-sm text-gray-600 mt-1">{schoolDetails.name}</p>
                      </div>
                      <Button size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Gérer le personnel
                      </Button>
                    </div>

                    {/* Directeur/Proviseur */}
                    {personnelData?.directeur ? (
                      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {schoolDetails.typeEtablissement === 'lycee' ? 'Proviseur' : 'Directeur'}
                              </h4>
                              <Badge className="bg-blue-600">Direction</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p><strong>Nom:</strong> {personnelData.directeur.firstName} {personnelData.directeur.lastName}</p>
                              <p><strong>Email:</strong> {personnelData.directeur.email}</p>
                              <p><strong>Téléphone:</strong> {personnelData.directeur.phone || 'Non renseigné'}</p>
                              <p><strong>Fonction:</strong> {personnelData.directeur.fonction}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {schoolDetails.typeEtablissement === 'lycee' ? 'Proviseur' : 'Directeur'}
                              </h4>
                              <Badge variant="outline">Non assigné</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Aucun directeur n'est actuellement assigné à cette école.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Statistiques du personnel */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {personnelData?.totalEnseignants || 0}
                        </div>
                        <div className="text-xs text-green-700 mt-1">Enseignants</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {personnelData?.totalAdministratif || 0}
                        </div>
                        <div className="text-xs text-purple-700 mt-1">Personnel Admin</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {personnelData?.totalSupport || 0}
                        </div>
                        <div className="text-xs text-orange-700 mt-1">Personnel Support</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {personnelData?.totalPersonnel || 0}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">Total</div>
                      </div>
                    </div>

                    {/* Message informatif */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-700">
                            <strong>Gestion complète du personnel</strong>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Accédez à la section "Personnel" du menu principal pour gérer les enseignants, 
                            le personnel administratif, les emplois du temps et les salaires.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
}
