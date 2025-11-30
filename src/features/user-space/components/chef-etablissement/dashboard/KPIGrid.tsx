/**
 * KPIGrid - Grille des indicateurs clés de performance
 * Affiche les 4 KPIs principaux du Chef d'Établissement
 * 
 * @module ChefEtablissement/Components
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SchoolKPIs, KPICardData, TrendDirection } from '../../../types/chef-etablissement.types';

interface KPIGridProps {
  readonly kpis: SchoolKPIs;
}

/**
 * Formater un nombre avec séparateur de milliers
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

/**
 * Formater un montant en FCFA
 */
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return formatNumber(value);
};

/**
 * Obtenir l'icône de tendance
 */
const TrendIcon = ({ trend }: { trend: TrendDirection }) => {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="h-3.5 w-3.5" />;
    case 'down':
      return <ArrowDownRight className="h-3.5 w-3.5" />;
    default:
      return <Minus className="h-3.5 w-3.5" />;
  }
};

/**
 * Obtenir les classes de couleur pour la tendance
 */
const getTrendClasses = (trend: TrendDirection): string => {
  switch (trend) {
    case 'up':
      return 'bg-green-100 text-green-700';
    case 'down':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

/**
 * Composant carte KPI individuelle
 */
const KPICard = memo<{ kpi: KPICardData; index: number }>(({ kpi, index }) => {
  const Icon = kpi.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card 
        className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        style={{
          background: `linear-gradient(135deg, ${kpi.bgColor}15 0%, ${kpi.bgColor}05 100%)`,
        }}
      >
        {/* Cercle décoratif */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: kpi.color }}
        />

        <CardContent className="p-5 relative z-10">
          {/* Header: Icon + Trend */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="p-3 rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${kpi.color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color: kpi.color }} />
            </div>

            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getTrendClasses(kpi.trend)}`}>
              <TrendIcon trend={kpi.trend} />
              <span>{kpi.changeLabel}</span>
            </div>
          </div>

          {/* Value */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {kpi.title}
            </p>
            <p className="text-3xl font-bold" style={{ color: kpi.color }}>
              {kpi.value}
              {kpi.unit && (
                <span className="text-lg font-normal text-gray-500 ml-1">
                  {kpi.unit}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

KPICard.displayName = 'KPICard';

/**
 * Grille des KPIs
 */
export const KPIGrid = memo<KPIGridProps>(({ kpis }) => {
  const kpiCards = useMemo((): KPICardData[] => [
    {
      id: 'students',
      title: 'Effectif Total',
      value: formatNumber(kpis.totalStudents),
      changeLabel: kpis.trends.students === 'up' ? '+15 ce mois' : 'Stable',
      trend: kpis.trends.students,
      icon: GraduationCap,
      color: '#3B82F6',
      bgColor: '#3B82F6',
    },
    {
      id: 'teachers',
      title: 'Enseignants',
      value: formatNumber(kpis.totalTeachers),
      changeLabel: `${kpis.totalStaff} personnel`,
      trend: 'stable',
      icon: Users,
      color: '#8B5CF6',
      bgColor: '#8B5CF6',
    },
    {
      id: 'success',
      title: 'Taux de Réussite',
      value: `${kpis.successRate.toFixed(1)}`,
      unit: '%',
      changeLabel: kpis.trends.success === 'up' ? '+2.5%' : 'Stable',
      trend: kpis.trends.success,
      icon: TrendingUp,
      color: '#10B981',
      bgColor: '#10B981',
    },
    {
      id: 'revenue',
      title: 'Revenus du Mois',
      value: formatCurrency(kpis.monthlyRevenue),
      unit: 'FCFA',
      changeLabel: `${kpis.recoveryRate.toFixed(0)}% recouvré`,
      trend: kpis.trends.revenue,
      icon: Wallet,
      color: '#F59E0B',
      bgColor: '#F59E0B',
    },
  ], [kpis]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {kpiCards.map((kpi, index) => (
        <KPICard key={kpi.id} kpi={kpi} index={index} />
      ))}
    </div>
  );
});

KPIGrid.displayName = 'KPIGrid';

export default KPIGrid;
