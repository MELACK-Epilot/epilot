/**
 * Section KPIs Globaux de l'école
 */

import { memo } from 'react';
import { Users, BookOpen, GraduationCap, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { KPICard } from './KPICard';

interface GlobalKPIsSectionProps {
  kpiGlobaux: {
    eleves: number;
    classes: number;
    enseignants: number;
    taux_reussite: number;
    revenus: number;
  };
}

export const GlobalKPIsSection = memo(({ kpiGlobaux }: GlobalKPIsSectionProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl rounded-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vue d'Ensemble</h2>
        <p className="text-gray-600">Indicateurs clés de performance de l'établissement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="TOTAL ÉLÈVES"
          value={kpiGlobaux.eleves}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          gradient="from-blue-600 via-blue-700 to-blue-800"
          iconBg="bg-blue-600/20"
          iconColor="text-blue-100"
        />

        <KPICard
          title="TOTAL CLASSES"
          value={kpiGlobaux.classes}
          icon={BookOpen}
          gradient="from-emerald-600 via-emerald-700 to-emerald-800"
          iconBg="bg-emerald-600/20"
          iconColor="text-emerald-100"
        />

        <KPICard
          title="TOTAL ENSEIGNANTS"
          value={kpiGlobaux.enseignants}
          icon={GraduationCap}
          gradient="from-purple-600 via-purple-700 to-purple-800"
          iconBg="bg-purple-600/20"
          iconColor="text-purple-100"
        />

        <KPICard
          title="TAUX MOYEN"
          value={`${kpiGlobaux.taux_reussite}%`}
          icon={Target}
          trend={{ value: 3, isPositive: true }}
          gradient="from-orange-600 via-orange-700 to-orange-800"
          iconBg="bg-orange-600/20"
          iconColor="text-orange-100"
        />

        <KPICard
          title="REVENUS TOTAUX"
          value={formatCurrency(kpiGlobaux.revenus)}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          gradient="from-green-600 via-green-700 to-green-800"
          iconBg="bg-green-600/20"
          iconColor="text-green-100"
        />

        <KPICard
          title="CROISSANCE"
          value="+8%"
          icon={BarChart3}
          trend={{ value: 8, isPositive: true }}
          gradient="from-indigo-600 via-indigo-700 to-indigo-800"
          iconBg="bg-indigo-600/20"
          iconColor="text-indigo-100"
        />
      </div>
    </Card>
  );
});

GlobalKPIsSection.displayName = 'GlobalKPIsSection';
