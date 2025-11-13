/**
 * Dashboard Analytics avancé pour les plans
 * Métriques business et insights IA
 * @module PlanAnalyticsDashboard
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, 
  DollarSign, Users, Target, Zap, Brain, BarChart3, PieChart,
  ArrowUp, ArrowDown, Minus, Crown, Package, Building2,
  Lightbulb, AlertCircle, ThumbsUp, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlanAnalytics, type PlanAnalytics } from '../../hooks/usePlanAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

interface PlanAnalyticsDashboardProps {
  className?: string;
}

export const PlanAnalyticsDashboard = ({ className = '' }: PlanAnalyticsDashboardProps) => {
  const { data: analytics, isLoading, error } = usePlanAnalytics();
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'subscriptions' | 'churn' | 'growth'>('revenue');
  const [showInsights, setShowInsights] = useState(true);

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Erreur de chargement</h3>
        <p className="text-slate-500">Impossible de charger les analytics des plans.</p>
      </Card>
    );
  }

  // Préparer les données pour les graphiques
  const chartData = analytics.planMetrics.map(plan => ({
    name: plan.planName,
    revenue: plan.monthlyRevenue,
    subscriptions: plan.activeSubscriptions,
    churn: plan.churnRate,
    growth: plan.growthRate30d,
    arpu: plan.averageRevenuePerUser,
  }));

  const pieData = analytics.planMetrics
    .filter(p => p.activeSubscriptions > 0)
    .map((plan, index) => ({
      name: plan.planName,
      value: plan.activeSubscriptions,
      color: ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946'][index % 4],
    }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec métriques globales */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-0 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              Analytics IA des Plans
            </h2>
            <p className="text-slate-600">Insights automatiques et métriques avancées</p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
            🤖 Powered by AI
          </Badge>
        </div>

        {/* KPI Globaux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="MRR Total"
            value={`${(analytics.mrr / 1000).toFixed(0)}K`}
            subtitle="FCFA mensuel"
            icon={DollarSign}
            color="green"
            trend="up"
            change="+12%"
          />
          <MetricCard
            title="ARR Projeté"
            value={`${(analytics.arr / 1000000).toFixed(1)}M`}
            subtitle="FCFA annuel"
            icon={TrendingUp}
            color="blue"
            trend="up"
            change="+8%"
          />
          <MetricCard
            title="Plans Actifs"
            value={analytics.planMetrics.filter(p => p.activeSubscriptions > 0).length}
            subtitle={`sur ${analytics.planMetrics.length} total`}
            icon={Package}
            color="purple"
            trend="neutral"
          />
          <MetricCard
            title="ARPU Moyen"
            value={`${Math.round(analytics.planMetrics.reduce((sum, p) => sum + p.averageRevenuePerUser, 0) / analytics.planMetrics.length / 1000)}K`}
            subtitle="FCFA par utilisateur"
            icon={Users}
            color="amber"
            trend="up"
            change="+5%"
          />
        </div>
      </Card>

      {/* Insights IA */}
      {showInsights && analytics.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Insights IA ({analytics.insights.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInsights(false)}
              className="text-slate-500"
            >
              <Eye className="w-4 h-4 mr-2" />
              Masquer
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Graphiques et métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique principal */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Métriques par Plan</h3>
            <div className="flex gap-2">
              {[
                { key: 'revenue', label: 'Revenus', icon: DollarSign },
                { key: 'subscriptions', label: 'Abonnements', icon: Users },
                { key: 'churn', label: 'Churn', icon: TrendingDown },
                { key: 'growth', label: 'Croissance', icon: TrendingUp },
              ].map(metric => (
                <Button
                  key={metric.key}
                  variant={selectedMetric === metric.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric(metric.key as any)}
                  className="text-xs"
                >
                  <metric.icon className="w-3 h-3 mr-1" />
                  {metric.label}
                </Button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={getMetricColor(selectedMetric)}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition des abonnements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Répartition des Abonnements</h3>
          
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <RechartsPieChart.Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart.Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tableau détaillé des métriques */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Métriques Détaillées par Plan</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 font-semibold text-slate-700">Plan</th>
                <th className="text-center p-3 font-semibold text-slate-700">Abonnements</th>
                <th className="text-center p-3 font-semibold text-slate-700">MRR</th>
                <th className="text-center p-3 font-semibold text-slate-700">ARPU</th>
                <th className="text-center p-3 font-semibold text-slate-700">Churn Rate</th>
                <th className="text-center p-3 font-semibold text-slate-700">Croissance</th>
                <th className="text-center p-3 font-semibold text-slate-700">Position</th>
              </tr>
            </thead>
            <tbody>
              {analytics.planMetrics.map((plan, index) => (
                <motion.tr
                  key={plan.planId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getPlanIcon(plan.planSlug)}
                      <span className="font-medium text-slate-900">{plan.planName}</span>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className="text-lg font-semibold text-slate-900">{plan.activeSubscriptions}</span>
                    {plan.newSubscriptions30d > 0 && (
                      <Badge className="ml-2 bg-green-100 text-green-700 border-0 text-xs">
                        +{plan.newSubscriptions30d}
                      </Badge>
                    )}
                  </td>
                  <td className="text-center p-3">
                    <span className="font-semibold text-slate-900">
                      {(plan.monthlyRevenue / 1000).toFixed(0)}K
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className="text-slate-700">
                      {(plan.averageRevenuePerUser / 1000).toFixed(0)}K
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`font-medium ${plan.churnRate > 15 ? 'text-red-600' : plan.churnRate > 10 ? 'text-amber-600' : 'text-green-600'}`}>
                        {plan.churnRate}%
                      </span>
                      {plan.churnRate > 15 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <div className="flex items-center justify-center gap-1">
                      {plan.growthRate30d > 0 ? (
                        <ArrowUp className="w-4 h-4 text-green-500" />
                      ) : plan.growthRate30d < 0 ? (
                        <ArrowDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={`font-medium ${plan.growthRate30d > 0 ? 'text-green-600' : plan.growthRate30d < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                        {plan.growthRate30d}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <Badge 
                      className={`${getPositionColor(plan.marketPosition)} border-0 text-xs`}
                    >
                      {getPositionLabel(plan.marketPosition)}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Composants utilitaires
const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, change }: any) => {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <Badge className={`${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-0 text-xs`}>
            {change}
          </Badge>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{subtitle}</div>
    </div>
  );
};

const InsightCard = ({ insight }: { insight: PlanAnalytics['insights'][0] }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-amber-200 bg-amber-50';
      case 'warning': return 'border-red-200 bg-red-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`p-4 border-2 ${getInsightColor(insight.type)}`}>
      <div className="flex items-start gap-3">
        {getInsightIcon(insight.type)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-slate-900 text-sm">{insight.title}</h4>
            <Badge className={`text-xs ${insight.impact === 'high' ? 'bg-red-100 text-red-700' : insight.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} border-0`}>
              {insight.impact}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
          {insight.recommendation && (
            <p className="text-xs text-slate-500 italic">💡 {insight.recommendation}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Fonctions utilitaires
const getMetricColor = (metric: string) => {
  switch (metric) {
    case 'revenue': return '#10b981';
    case 'subscriptions': return '#3b82f6';
    case 'churn': return '#ef4444';
    case 'growth': return '#8b5cf6';
    default: return '#6b7280';
  }
};

const getPlanIcon = (slug: string) => {
  const icons = {
    gratuit: <Package className="w-4 h-4 text-slate-600" />,
    premium: <Zap className="w-4 h-4 text-teal-600" />,
    pro: <Crown className="w-4 h-4 text-indigo-600" />,
    institutionnel: <Building2 className="w-4 h-4 text-amber-600" />,
  };
  return icons[slug as keyof typeof icons] || icons.gratuit;
};

const getPositionColor = (position: string) => {
  switch (position) {
    case 'underpriced': return 'bg-blue-100 text-blue-700';
    case 'overpriced': return 'bg-red-100 text-red-700';
    default: return 'bg-green-100 text-green-700';
  }
};

const getPositionLabel = (position: string) => {
  switch (position) {
    case 'underpriced': return 'Sous-évalué';
    case 'overpriced': return 'Surévalué';
    default: return 'Optimal';
  }
};

export default PlanAnalyticsDashboard;
