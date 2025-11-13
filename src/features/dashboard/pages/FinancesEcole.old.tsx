/**
 * Page Finances École - VERSION 2.0 PROFESSIONNELLE
 * Design moderne avec toutes les fonctionnalités
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, MapPin, Phone, Mail, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { generateMonthlyReport } from '@/utils/pdfReports';
import { exportSchoolDetailsToExcel } from '@/utils/excelExports';

export default function FinancesEcoleV2() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(12);

  const { data: schoolStats, isLoading, refetch } = useSchoolFinancialDetail(schoolId!);
  const { data: schoolDetails, isLoading: loadingDetails } = useSchoolDetails(schoolId!);
  const { data: levelStatsComplete, isLoading: loadingLevels } = useSchoolLevelStatsComplete(schoolId!);
  const { data: monthlyHistory, isLoading: loadingHistory } = useSchoolMonthlyHistory(schoolId!, selectedPeriod);
  const { data: alerts } = useFinancialAlerts({ resolved: false, schoolId });

  if (isLoading || loadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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

  const profitMargin = schoolStats.totalRevenue > 0
    ? ((schoolStats.netProfit / schoolStats.totalRevenue) * 100)
    : 0;

  const handleExportPDF = () => {
    if (schoolStats && levelStatsComplete) {
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

  const handlePrint = () => {
    window.print();
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

  const handleSendEmail = () => {
    // TODO: Implémenter envoi email
    const subject = `Rapport Financier - ${schoolDetails.name}`;
    const body = `Rapport financier pour l'école ${schoolDetails.name}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCompare = () => {
    // TODO: Implémenter comparaison périodes
    console.log('Comparaison périodes pour:', schoolDetails.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
        {/* Header Premium avec Logo et Infos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${schoolDetails.couleurPrincipale}dd 0%, ${schoolDetails.couleurPrincipale} 100%)`,
          }}
        >
          <div className="p-8 text-white">
            {/* Bouton Retour */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/finances-groupe')}
              className="mb-6 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au groupe
            </Button>

            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden flex-shrink-0">
                {schoolDetails.logoUrl ? (
                  <img
                    src={schoolDetails.logoUrl}
                    alt={`Logo ${schoolDetails.name}`}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <div className="text-6xl font-bold" style={{ color: schoolDetails.couleurPrincipale }}>
                    {schoolDetails.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{schoolDetails.name}</h1>
                <p className="text-white/90 text-lg mb-4">
                  {schoolDetails.typeEtablissement.charAt(0).toUpperCase() + schoolDetails.typeEtablissement.slice(1)} •{' '}
                  {schoolDetails.niveauEnseignement.join(', ')}
                </p>

                {/* Infos rapides */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {schoolDetails.directeurNomComplet && (
                    <div className="flex items-center gap-2 text-white/90">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-white/70">{schoolDetails.directeurFonction}</p>
                        <p className="text-sm font-medium">{schoolDetails.directeurNomComplet}</p>
                      </div>
                    </div>
                  )}
                  {schoolDetails.city && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-white/70">Localisation</p>
                        <p className="text-sm font-medium">{schoolDetails.city}</p>
                      </div>
                    </div>
                  )}
                  {schoolDetails.telephoneMobile && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Phone className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-white/70">Téléphone</p>
                        <p className="text-sm font-medium">{schoolDetails.telephoneMobile}</p>
                      </div>
                    </div>
                  )}
                  {schoolDetails.emailInstitutionnel && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Mail className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-white/70">Email</p>
                        <p className="text-sm font-medium truncate">{schoolDetails.emailInstitutionnel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges Performance */}
              <div className="flex flex-col gap-2">
                <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                  Marge: {profitMargin.toFixed(1)}%
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                  Recouvrement: {schoolStats.recoveryRate.toFixed(1)}%
                </Badge>
                {schoolStats.netProfit >= 0 ? (
                  <Badge className="bg-green-500 text-white text-sm px-4 py-2">
                    Bénéficiaire
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500 text-white text-sm px-4 py-2">
                    Déficitaire
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Barre d'Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SchoolActionsBar
            schoolName={schoolDetails.name}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
            onSendEmail={handleSendEmail}
            onRefresh={() => refetch()}
            onCompare={handleCompare}
          />
        </motion.div>

        {/* KPIs Enrichis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SchoolFinancialKPIs stats={schoolStats} schoolDetails={schoolDetails} />
        </motion.div>

        {/* Alertes */}
        {alerts && alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <FinancialAlertsPanel schoolId={schoolId} />
          </motion.div>
        )}

        {/* Graphique Évolution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <FinancialEvolutionChart
            data={monthlyHistory || []}
            isLoading={loadingHistory}
            title={`Évolution Financière - ${schoolDetails.name}`}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </motion.div>

        {/* Prévisions IA */}
        {monthlyHistory && monthlyHistory.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <FinancialForecastPanel
              historicalData={monthlyHistory}
              currentStats={{
                totalRevenue: schoolStats.totalRevenue,
                totalExpenses: schoolStats.totalExpenses,
                profitMargin,
              }}
            />
          </motion.div>
        )}

        {/* Tableau Niveaux Interactif */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <InteractiveLevelsTable
            levels={levelStatsComplete || []}
            schoolId={schoolId!}
            isLoading={loadingLevels}
          />
        </motion.div>
      </div>
    </div>
  );
}
