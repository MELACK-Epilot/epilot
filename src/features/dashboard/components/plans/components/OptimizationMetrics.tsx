/**
 * Métriques d'impact potentiel des recommandations
 */

import { TrendingUp, Users, Target } from 'lucide-react';
import type { OptimizationMetrics as MetricsType } from '../../../types/optimization.types';

interface OptimizationMetricsProps {
  metrics: MetricsType;
}

export const OptimizationMetrics = ({ metrics }: OptimizationMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Impact MRR */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Impact MRR Potentiel</p>
          <p className="text-3xl font-bold text-white">
            +{metrics.mrrImpact >= 1000000 
              ? `${(metrics.mrrImpact / 1000000).toFixed(1)}M` 
              : `${Math.round(metrics.mrrImpact / 1000)}K`}
          </p>
          <p className="text-xs text-white/70 mt-1">FCFA si appliqué</p>
        </div>
      </div>

      {/* Nouveaux Clients */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Nouveaux Clients</p>
          <p className="text-3xl font-bold text-white">+{metrics.newClients}/mois</p>
          <p className="text-xs text-white/70 mt-1">Optimisations marketing</p>
        </div>
      </div>

      {/* Réduction Churn */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Réduction Churn</p>
          <p className="text-3xl font-bold text-white">
            {metrics.churnReduction > 0 ? `-${metrics.churnReduction.toFixed(1)}%` : '0%'}
          </p>
          <p className="text-xs text-white/70 mt-1">Amélioration rétention</p>
        </div>
      </div>
    </div>
  );
};
