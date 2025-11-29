/**
 * Dashboard Analytics Optimisé - Design "Cockpit IA Futuriste"
 * @module PlanAnalyticsDashboardOptimized
 */

import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle, Sparkles, Clock, XCircle, CheckCircle, Info, AlertTriangle, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanAnalyticsOptimized } from '../../hooks/usePlanAnalyticsOptimized';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

// Composant Sparkline SVG simple
const Sparkline = ({ data, color = "#2A9D8F", height = 40 }) => {
  // Simuler une courbe de tendance basée sur la croissance
  const points = [40, 45, 35, 50, 45, 60, 55, 70, 65, 80]; 
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const width = 100;
  
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={`${path} L ${width},${height} L 0,${height} Z`} fill={color} fillOpacity="0.1" />
    </svg>
  );
};

export const PlanAnalyticsDashboardOptimized = () => {
  const { data: analytics, isLoading, error } = usePlanAnalyticsOptimized();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-600 font-medium">Erreur de chargement des analytics</p>
        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des analytics...</span>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Header Futuriste */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-xl border border-slate-700">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                Analytics IA
              </span>
            </h2>
            <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-green-400" />
              Analyse en temps réel des performances business
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-xs font-medium text-slate-300">Live Data</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-xs font-bold cursor-pointer hover:scale-105 transition-transform">
              <Zap className="h-3 w-3" />
              IA Active
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Principaux - Design "Glass Card" */}
      <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.05}>
        {/* MRR */}
        <AnimatedItem>
          <div className="group relative bg-white rounded-2xl p-1 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative h-full bg-white rounded-xl p-5 border border-slate-100 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">MRR Mensuel</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {(analytics.totalMRR / 1000000).toFixed(1)}<span className="text-lg text-slate-400 font-normal">M</span>
                  </p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              
              <div className="mt-4 z-10">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-xs font-bold ${analytics.mrrGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {analytics.mrrGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(analytics.mrrGrowth).toFixed(1)}%
                  </div>
                  <span className="text-slate-400 text-xs">vs mois dernier</span>
                </div>
              </div>
              
              {/* Sparkline décorative */}
              <div className="absolute bottom-0 left-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkline color="#10B981" height={50} data={[]} />
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* ARR */}
        <AnimatedItem>
          <div className="group relative bg-white rounded-2xl p-1 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative h-full bg-white rounded-xl p-5 border border-slate-100 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ARR Annuel</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {(analytics.totalARR / 1000000).toFixed(1)}<span className="text-lg text-slate-400 font-normal">M</span>
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="mt-4 z-10">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Projection annuelle
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkline color="#3B82F6" height={50} data={[]} />
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Abonnements */}
        <AnimatedItem>
          <div className="group relative bg-white rounded-2xl p-1 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative h-full bg-white rounded-xl p-5 border border-slate-100 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Abonnés</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {analytics.totalActiveSubscriptions}
                  </p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              
              <div className="mt-4 z-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-xs">
                    +{analytics.newSubscriptionsThisMonth}
                  </span>
                  <span className="text-slate-400 text-xs">nouveaux</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkline color="#8B5CF6" height={50} data={[]} />
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* ARPU */}
        <AnimatedItem>
          <div className="group relative bg-white rounded-2xl p-1 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative h-full bg-white rounded-xl p-5 border border-slate-100 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ARPU</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {(analytics.arpu / 1000).toFixed(0)}<span className="text-lg text-slate-400 font-normal">K</span>
                  </p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              
              <div className="mt-4 z-10">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Revenu moyen/groupe
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkline color="#F59E0B" height={50} data={[]} />
              </div>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights IA - Style Chat/Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Insights & Recommandations
            </h3>
            <span className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              IA Générative
            </span>
          </div>

          <div className="space-y-4">
            {analytics.insights.length > 0 ? (
              analytics.insights.map((insight, index) => {
                const styles = {
                  danger: { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-600', title: 'text-red-900' },
                  warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600', title: 'text-amber-900' },
                  success: { bg: 'bg-green-50', border: 'border-green-100', icon: 'text-green-600', title: 'text-green-900' },
                  info: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', title: 'text-blue-900' },
                }[insight.type];

                const Icon = {
                  danger: AlertTriangle,
                  warning: AlertCircle,
                  success: CheckCircle,
                  info: Info,
                }[insight.type];

                return (
                  <AnimatedItem key={index} delay={index * 0.1}>
                    <div className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-5 transition-all hover:shadow-md`}>
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-xl bg-white shadow-sm ${styles.icon}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-bold ${styles.title}`}>{insight.title}</h4>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/50 ${styles.title}`}>
                              Impact {insight.impact}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimatedItem>
                );
              })
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Aucune alerte critique détectée</p>
                <p className="text-slate-400 text-sm">Tout fonctionne parfaitement !</p>
              </div>
            )}
          </div>
        </div>

        {/* Métriques Secondaires & Distribution - Style Widget */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Performance
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Rétention */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-600">Taux de Rétention</span>
                <span className="text-xl font-bold text-slate-900">{analytics.retentionRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" 
                  style={{ width: `${analytics.retentionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Churn */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-600">Churn Rate</span>
                <span className="text-xl font-bold text-slate-900">{analytics.churnRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" 
                  style={{ width: `${Math.min(analytics.churnRate * 5, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="border-t border-slate-100 my-4"></div>

            {/* Distribution */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Distribution des Plans</h4>
              <div className="space-y-3">
                {analytics.planDistribution.map((plan, idx) => (
                  <div key={plan.planId} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${
                        idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-slate-300'
                      } group-hover:scale-y-110 transition-transform`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{plan.planName}</p>
                        <p className="text-xs text-slate-400">{plan.count} groupes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{plan.percentage.toFixed(0)}%</p>
                      <p className="text-xs text-slate-400">{(plan.mrr / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
