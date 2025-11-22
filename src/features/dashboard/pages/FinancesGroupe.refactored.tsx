/**
 * 🚀 PAGE FINANCES GROUPE - VERSION REFACTORISÉE
 * Code découpé en composants modulaires
 * Optimisée pour 900+ écoles avec performances éclair
 * @module FinancesGroupeRefactored
 */

import { useState, lazy, Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/store/auth.store';
import { Navigate } from 'react-router-dom';
import { useGroupFinancialStats, useSchoolsFinancialSummary } from '../hooks/useGroupFinances';
import { useFinancesKPIs } from '../hooks/useFinancesKPIs';
import { KPICard } from '../components/finances/KPICard';
import { FinancesHeader } from '../components/finances/FinancesHeader';
import { FinancesErrorState } from '../components/finances/FinancesErrorState';
import { ChartSkeleton } from '../components/skeletons/ChartSkeleton';
import { EPILOT_COLORS } from '@/styles/palette';

// 🚀 LAZY LOADING - Composants lourds chargés à la demande
const FinancialEvolutionChart = lazy(() => import('../components/FinancialEvolutionChart').then(m => ({ default: m.FinancialEvolutionChart })));
const VirtualizedSchoolsTable = lazy(() => import('../components/VirtualizedSchoolsTable'));
const FinancialAlertsPanel = lazy(() => import('../components/FinancialAlertsPanel').then(m => ({ default: m.FinancialAlertsPanel })));

export default function FinancesGroupeRefactored() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🔒 Protection Admin Groupe
  if (!user || user.role !== 'admin_groupe') {
    return <Navigate to="/dashboard" replace />;
  }

  // 📊 DATA FETCHING - Optimisé avec React Query
  const { 
    data: stats, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGroupFinancialStats();
  
  const { 
    data: schoolsSummary, 
    isLoading: loadingSchools,
    isError: isSchoolsError,
    error: schoolsError 
  } = useSchoolsFinancialSummary();

  // 🎯 KPIs ESSENTIELS (4 uniquement - NASA style)
  const kpis = useFinancesKPIs(stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* 🎯 HEADER MINIMALISTE */}
        <FinancesHeader
          groupName={user?.schoolGroupName}
          totalSchools={stats?.totalSchools || 0}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* ⚠️ ERROR STATE - Stats */}
        {isError && (
          <FinancesErrorState
            message={error?.message}
            onRetry={refetch}
          />
        )}

        {/* ⚠️ ERROR STATE - Schools */}
        {isSchoolsError && (
          <FinancesErrorState
            message={schoolsError?.message}
            onRetry={refetch}
          />
        )}

        {/* 📊 KPIs GRID - 4 cartes essentielles */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-40 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KPICard key={kpi.title} {...kpi} />
            ))}
          </div>
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
                data={[]} 
                isLoading={false}
                title="Évolution 12 mois"
              />
            </Suspense>
          </TabsContent>

          {/* TAB 2: ÉCOLES (VIRTUALISÉ) */}
          <TabsContent value="schools" className="space-y-6">
            {loadingSchools ? (
              <Card className="p-6 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                    style={{ borderColor: EPILOT_COLORS.primary.teal }} 
                  />
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
