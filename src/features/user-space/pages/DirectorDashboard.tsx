/**
 * Dashboard Proviseur - Version Refactorisée
 * Composants modulaires < 200 lignes chacun
 */

import { memo, useMemo, useState } from 'react';
import { GraduationCap, BookOpen, Building2 } from 'lucide-react';
import { useDirectorDashboard } from '../hooks/useDirectorDashboard';

// Composants dashboard
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { GlobalKPIsSection } from '../components/dashboard/GlobalKPIsSection';
import { NiveauSection } from '../components/dashboard/NiveauSection';
import { EmptyState } from '../components/dashboard/EmptyState';

// Composants existants
import AlertSystem from '../components/AlertSystem';
import TrendChart from '../components/TrendChart';
import TemporalComparison from '../components/TemporalComparison';
import TemporalFilters from '../components/TemporalFilters';
import NiveauDetailModal from '../components/NiveauDetailModal';

/**
 * Types
 */
interface NiveauEducatif {
  id: string;
  nom: string;
  couleur: string;
  icone: any;
  kpis: {
    eleves: number;
    classes: number;
    enseignants: number;
    taux_reussite: number;
    revenus: number;
    trend: 'up' | 'down' | 'stable';
  };
}

/**
 * Helper: Convertir nom d'icône en composant
 */
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    BookOpen,
    Building2,
    GraduationCap,
    Baby: GraduationCap
  };
  return icons[iconName] || GraduationCap;
};

/**
 * Composant Principal
 */
export const DirectorDashboard = memo(() => {
  // Hook données réelles
  const {
    schoolLevels,
    globalKPIs,
    trendData: realTrendData,
    isLoading,
    error,
    refreshData
  } = useDirectorDashboard();

  // États locaux
  const [selectedNiveau, setSelectedNiveau] = useState<NiveauEducatif | null>(null);
  const [isNiveauModalOpen, setIsNiveauModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedRange, setSelectedRange] = useState('2025-11');
  const [comparisonType, setComparisonType] = useState<'previous' | 'same-last-year'>('previous');

  // Transformation données: schoolLevels → niveauxEducatifs
  const niveauxEducatifs = useMemo(() => 
    schoolLevels.map(level => ({
      id: level.id,
      nom: level.name,
      couleur: level.color,
      icone: getIconComponent(level.icon),
      kpis: {
        eleves: level.students_count,
        classes: level.classes_count,
        enseignants: level.teachers_count,
        taux_reussite: level.success_rate,
        revenus: level.revenue,
        trend: level.trend
      }
    })), 
  [schoolLevels]);

  // Transformation données: globalKPIs → kpiGlobaux
  const kpiGlobaux = useMemo(() => ({
    eleves: globalKPIs.totalStudents,
    classes: globalKPIs.totalClasses,
    enseignants: globalKPIs.totalTeachers,
    taux_reussite: globalKPIs.averageSuccessRate,
    revenus: globalKPIs.totalRevenue
  }), [globalKPIs]);

  // Transformation données: realTrendData → trendData
  const trendData = useMemo(() => 
    realTrendData.map(data => ({
      period: data.period,
      eleves: data.students,
      taux_reussite: data.success_rate,
      revenus: data.revenue,
      enseignants: data.teachers
    })), [realTrendData]);

  // Données comparaison temporelle
  const currentPeriodData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    return {
      period: currentMonth,
      label: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      data: {
        eleves: kpiGlobaux.eleves,
        classes: kpiGlobaux.classes,
        enseignants: kpiGlobaux.enseignants,
        taux_reussite: kpiGlobaux.taux_reussite,
        revenus: kpiGlobaux.revenus
      }
    };
  }, [kpiGlobaux]);

  const previousPeriodData = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPeriod = lastMonth.toISOString().slice(0, 7);
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const lastMonthData = trendData.find(t => t.period === lastMonthPeriod);
    
    if (lastMonthData) {
      return {
        period: lastMonthPeriod,
        label: `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
        data: {
          eleves: lastMonthData.eleves,
          classes: Math.round(lastMonthData.eleves / 25),
          enseignants: lastMonthData.enseignants,
          taux_reussite: lastMonthData.taux_reussite,
          revenus: lastMonthData.revenus
        }
      };
    }
    
    return {
      period: lastMonthPeriod,
      label: `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
      data: {
        eleves: 0,
        classes: 0,
        enseignants: 0,
        taux_reussite: 0,
        revenus: 0
      }
    };
  }, [trendData]);

  // Handlers
  const handleNiveauClick = (niveau: NiveauEducatif) => {
    setSelectedNiveau(niveau);
    setIsNiveauModalOpen(true);
  };

  const handleCloseNiveauModal = () => {
    setIsNiveauModalOpen(false);
    setSelectedNiveau(null);
  };

  const handleClearCache = () => {
    console.log('🧹 Nettoyage du cache d\'authentification...');
    localStorage.removeItem('e-pilot-auth');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-refresh-token');
    console.log('✅ Cache vidé - Rechargement de la page...');
    window.location.reload();
  };

  const handlePeriodChange = (period: 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period);
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
  };

  const handleExport = () => {
    console.log('📥 Export des données...');
    // TODO: Implémenter export CSV
  };

  // Rendu: Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // Rendu: Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de Chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshData}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Rendu: Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* Header */}
        <DashboardHeader />

        {/* Contenu principal */}
        {niveauxEducatifs.length === 0 ? (
          <EmptyState 
            onRefresh={refreshData}
            onClearCache={handleClearCache}
          />
        ) : (
          <>
            {/* KPIs Globaux */}
            <GlobalKPIsSection kpiGlobaux={kpiGlobaux} />

            {/* Sections par Niveau */}
            {niveauxEducatifs.map(niveau => (
              <NiveauSection
                key={niveau.id}
                niveau={niveau}
                onNiveauClick={handleNiveauClick}
              />
            ))}

            {/* Filtres Temporels */}
            <TemporalFilters
              selectedPeriod={selectedPeriod}
              selectedRange={selectedRange}
              onPeriodChange={handlePeriodChange}
              onRangeChange={handleRangeChange}
              onRefresh={refreshData}
              onExport={handleExport}
              isLoading={isLoading}
            />

            {/* Alertes & Recommandations */}
            <AlertSystem
              kpiData={kpiGlobaux}
              niveauxData={niveauxEducatifs}
              onDismissAlert={() => {}}
            />

            {/* Graphique Tendances */}
            <TrendChart
              data={trendData}
              title="Évolution des Indicateurs Clés"
              period={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />

            {/* Comparaisons Temporelles */}
            <TemporalComparison
              currentPeriod={currentPeriodData}
              previousPeriod={previousPeriodData}
              comparisonType={comparisonType}
              onComparisonTypeChange={setComparisonType}
            />
          </>
        )}

        {/* Modal Détail Niveau */}
        <NiveauDetailModal
          niveau={selectedNiveau}
          isOpen={isNiveauModalOpen}
          onClose={handleCloseNiveauModal}
        />
      </div>
    </div>
  );
});

DirectorDashboard.displayName = 'DirectorDashboard';

// Export par défaut pour compatibilité
export default DirectorDashboard;
