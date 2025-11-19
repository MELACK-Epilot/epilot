/**
 * Dashboard Analytics pour les plans
 * Métriques business avancées
 * @module PlanAnalyticsDashboard
 */

import { TrendingUp, DollarSign, Users, Target, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAllActiveSubscriptions } from '../../hooks/usePlanSubscriptions';
import { useAllPlansWithContent } from '../../hooks/usePlanWithContent';
import { usePlanAnalytics } from '../../hooks/usePlanAnalytics';

export const PlanAnalyticsDashboard = () => {
  const { data: subscriptions } = useAllActiveSubscriptions();
  const { data: plans } = useAllPlansWithContent();
  const { data: analytics } = usePlanAnalytics();

  // Calculer métriques
  const totalMRR = subscriptions?.reduce((sum, sub) => {
    return sum + (sub.price || 0);
  }, 0) || 0;

  const totalARR = totalMRR * 12;

  // Distribution par plan
  const planDistribution = plans?.map(plan => {
    const count = subscriptions?.filter(s => s.plan_id === plan.id).length || 0;
    const revenue = subscriptions
      ?.filter(s => s.plan_id === plan.id)
      .reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    
    return {
      name: plan.name,
      slug: plan.slug,
      count,
      revenue,
      percentage: subscriptions?.length ? (count / subscriptions.length) * 100 : 0,
    };
  }) || [];

  const arpu = subscriptions?.length ? totalMRR / subscriptions.length : 0;

  return (
    <div className="space-y-6">
      {/* Titre Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#2A9D8F]" />
          Analytics IA - Métriques avancées
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Analyse détaillée des performances et tendances
        </p>
      </div>

      {/* KPIs Principaux - Style Catégories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">MRR Total</p>
            <p className="text-3xl font-bold text-white">{(totalMRR / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-white/70 mt-1">FCFA/mois</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">ARR Total</p>
            <p className="text-3xl font-bold text-white">{(totalARR / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-white/70 mt-1">FCFA/an</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Abonnements</p>
            <p className="text-3xl font-bold text-white">{subscriptions?.length || 0}</p>
            <p className="text-xs text-white/70 mt-1">Groupes actifs</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#457B9D] to-[#2c5a7a] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">ARPU</p>
            <p className="text-3xl font-bold text-white">{(arpu / 1000).toFixed(0)}K</p>
            <p className="text-xs text-white/70 mt-1">FCFA/groupe</p>
          </div>
        </div>
      </div>

      {/* Distribution par Plan */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Distribution par Plan</h3>
        </div>

        <div className="space-y-4">
          {planDistribution.map((plan, index) => {
            const colors = [
              { bg: 'bg-blue-100', bar: 'bg-blue-500', text: 'text-blue-700' },
              { bg: 'bg-green-100', bar: 'bg-green-500', text: 'text-green-700' },
              { bg: 'bg-purple-100', bar: 'bg-purple-500', text: 'text-purple-700' },
              { bg: 'bg-orange-100', bar: 'bg-orange-500', text: 'text-orange-700' },
            ];
            const color = colors[index % colors.length];

            return (
              <div key={plan.slug} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${color.bar} rounded-full`} />
                    <span className="font-medium text-slate-900">{plan.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${color.text}`}>{plan.count} groupes</span>
                    <span className="text-slate-500">{plan.percentage.toFixed(1)}%</span>
                    <span className="font-semibold text-slate-900">
                      {(plan.revenue / 1000).toFixed(0)}K/mois
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${color.bar} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Métriques Avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Taux de Conversion</h4>
          <div className="text-3xl font-bold text-[#2A9D8F] mb-2">
            {analytics?.planMetrics[0]?.conversionRate?.toFixed(1) || '0.0'}%
          </div>
          <div className="text-sm text-slate-500">Essai → Payant</div>
          <div className="mt-4 text-xs text-[#2A9D8F]">
            {(analytics?.planMetrics[0]?.conversionRate || 0) > 5 ? '↑ Bon taux' : '→ À améliorer'}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Churn Rate</h4>
          <div className="text-3xl font-bold text-[#E63946] mb-2">
            {analytics?.planMetrics[0]?.churnRate?.toFixed(1) || '0.0'}%
          </div>
          <div className="text-sm text-slate-500">
            {(analytics?.planMetrics[0]?.churnRate || 0) < 5 ? 'Excellent' : 'À surveiller'}
          </div>
          <div className="mt-4 text-xs text-[#2A9D8F]">
            Rétention: {analytics?.planMetrics[0]?.retentionRate?.toFixed(1) || '0'}%
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 mb-4">ARPU Moyen</h4>
          <div className="text-3xl font-bold text-[#1D3557] mb-2">
            {((analytics?.planMetrics[0]?.averageRevenuePerUser || 0) / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-slate-500">FCFA par groupe</div>
          <div className="mt-4 text-xs text-[#E9C46A]">Average Revenue Per User</div>
        </Card>
      </div>
    </div>
  );
};
