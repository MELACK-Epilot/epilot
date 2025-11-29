/**
 * DASHBOARD SUPER ADMIN PREMIUM - E-PILOT CONGO
 * Design System Officiel & Animations Modernes
 * @module SuperAdminDashboard
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useFinancialKPIs } from '../hooks/useFinancialKPIs';
import { useRevenueChart } from '../hooks/useRevenueChart';
import { usePlanDistribution } from '../hooks/usePlanDistribution';
import { useAuth } from '@/features/auth/store/auth.store';
import { CountUp } from '@/components/ui/count-up';
import { 
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// Couleurs Officielles E-Pilot
const COLORS = {
  primary: '#1D3557',    // Bleu Institutionnel
  success: '#2A9D8F',    // Vert Positif
  warning: '#E9C46A',    // Or République
  danger: '#E63946',     // Rouge Doux
  background: '#F9F9F9', // Fond Clair
  text: '#1F2937',       // Gris Foncé
  light: '#F3F4F6'       // Gris Clair
};

const PLAN_COLORS = [COLORS.success, COLORS.primary, COLORS.warning, '#6B7280'];

// Variantes d'animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hooks de données
  const { data: stats, refetch: refetchStats } = useDashboardStats();
  const { data: kpis } = useFinancialKPIs(period);
  const { data: revenueData } = useRevenueChart(12);
  const { data: planDistribution } = usePlanDistribution();

  // Fonction de rafraîchissement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Formater les montants
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  // KPIs principaux avec tendances
  const mainKPIs = [
    {
      title: 'MRR Total',
      rawValue: stats?.estimatedMRR || 0,
      value: formatAmount(stats?.estimatedMRR || 0),
      formatter: formatAmount,
      suffix: 'FCFA',
      trend: kpis?.arpu ? '+12.5%' : '+0%',
      isPositive: true,
      icon: DollarSign,
      color: COLORS.success,
      bgGradient: 'from-[#2A9D8F]/10 to-[#2A9D8F]/5',
      description: 'Revenu Mensuel Récurrent',
    },
    {
      title: 'Groupes Actifs',
      rawValue: stats?.totalSchoolGroups || 0,
      value: (stats?.totalSchoolGroups || 0).toString(),
      trend: stats?.trends.schoolGroups ? `${stats.trends.schoolGroups > 0 ? '+' : ''}${stats.trends.schoolGroups.toFixed(1)}%` : '0%',
      isPositive: (stats?.trends.schoolGroups || 0) >= 0,
      icon: Building2,
      color: COLORS.primary,
      bgGradient: 'from-[#1D3557]/10 to-[#1D3557]/5',
      description: 'Réseaux scolaires',
    },
    {
      title: 'Utilisateurs',
      rawValue: stats?.activeUsers || 0,
      value: formatAmount(stats?.activeUsers || 0),
      formatter: formatAmount,
      trend: stats?.trends.users ? `${stats.trends.users > 0 ? '+' : ''}${stats.trends.users.toFixed(1)}%` : '0%',
      isPositive: (stats?.trends.users || 0) >= 0,
      icon: Users,
      color: '#8B5CF6', // Violet pour différencier
      bgGradient: 'from-purple-500/10 to-purple-500/5',
      description: 'Utilisateurs actifs',
    },
    {
      title: 'Conversion',
      rawValue: kpis?.conversionRate || 0,
      value: `${kpis?.conversionRate.toFixed(1) || 0}%`,
      formatter: (v: number) => v.toFixed(1),
      suffix: '%',
      trend: '+2.3%',
      isPositive: true,
      icon: Target,
      color: COLORS.warning,
      bgGradient: 'from-[#E9C46A]/10 to-[#E9C46A]/5',
      description: 'Groupes → Abonnements',
    },
  ];

  // Métriques avancées avec design enrichi
  const advancedMetrics = [
    {
      label: 'Revenu / Groupe',
      rawValue: kpis?.arpu || 0,
      value: `${formatAmount(kpis?.arpu || 0)} FCFA`,
      formatter: formatAmount,
      suffix: ' FCFA',
      description: 'Moyenne par groupe scolaire',
      icon: DollarSign,
      color: 'text-[#2A9D8F]',
      bgIcon: 'bg-[#2A9D8F]/10',
      borderColor: 'hover:border-[#2A9D8F]/30',
      lightGradient: 'from-[#2A9D8F]/5 to-transparent',
    },
    {
      label: 'Taux d\'Attrition',
      rawValue: kpis?.churnRate || 0,
      value: `${kpis?.churnRate.toFixed(1) || 0}%`,
      formatter: (v: number) => v.toFixed(1),
      suffix: '%',
      description: 'Annulations mensuelles',
      icon: TrendingDown,
      color: 'text-[#E63946]',
      bgIcon: 'bg-[#E63946]/10',
      borderColor: 'hover:border-[#E63946]/30',
      lightGradient: 'from-[#E63946]/5 to-transparent',
    },
    {
      label: 'Valeur Vie (LTV)',
      rawValue: kpis?.ltv || 0,
      value: `${formatAmount(kpis?.ltv || 0)} FCFA`,
      formatter: formatAmount,
      suffix: ' FCFA',
      description: 'Revenu estimé par client',
      icon: TrendingUp,
      color: 'text-[#1D3557]',
      bgIcon: 'bg-[#1D3557]/10',
      borderColor: 'hover:border-[#1D3557]/30',
      lightGradient: 'from-[#1D3557]/5 to-transparent',
    },
    {
      label: 'Abonnements',
      rawValue: kpis?.activeSubscriptionsCount || 0,
      value: (kpis?.activeSubscriptionsCount || 0).toString(),
      description: 'Souscriptions actives',
      icon: CheckCircle2,
      color: 'text-[#8B5CF6]',
      bgIcon: 'bg-[#8B5CF6]/10',
      borderColor: 'hover:border-[#8B5CF6]/30',
      lightGradient: 'from-[#8B5CF6]/5 to-transparent',
    },
  ];

  // Alertes intelligentes
  const alerts = [
    {
      type: 'critical',
      count: stats?.criticalSubscriptions || 0,
      label: 'Abonnements expirant',
      description: 'Dans les 7 prochains jours',
      action: 'Voir détails',
      href: '/dashboard/subscriptions?filter=expiring',
    },
    {
      type: 'warning',
      count: kpis?.canceledSubscriptionsCount || 0,
      label: 'Annulations ce mois',
      description: 'Nécessite attention',
      action: 'Analyser',
      href: '/dashboard/subscriptions?filter=canceled',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-12">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto p-6 space-y-8"
      >
        
        {/* Header Premium */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-xl p-2">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1D3557] tracking-tight">
                  Dashboard Super Admin
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-white text-[#2A9D8F] border-[#2A9D8F]/30 font-medium px-2 py-0.5 text-xs">
                    E-Pilot Congo 🇨🇬
                  </Badge>
                  <span className="text-sm text-gray-500">
                    • Bienvenue, {user?.firstName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-gray-200 hover:bg-white hover:text-[#1D3557] transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-[#1D3557] hover:bg-[#152a4d] text-white shadow-lg shadow-[#1D3557]/20 transition-all hover:shadow-[#1D3557]/30 hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              Exporter Rapport
            </Button>
          </div>
        </motion.div>

        {/* KPIs Principaux */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {mainKPIs.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.title}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full">
                  {/* Fond dégradé subtil */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient}`} />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white shadow-sm ring-1 ring-gray-100/50">
                        <Icon className="w-6 h-6" style={{ color: kpi.color }} />
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                        kpi.isPositive 
                          ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' 
                          : 'bg-[#E63946]/10 text-[#E63946]'
                      }`}>
                        {kpi.isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {kpi.trend}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{kpi.title}</p>
                      <div className="flex items-baseline gap-2">
                        {kpi.rawValue !== undefined ? (
                          <CountUp 
                            value={kpi.rawValue} 
                            formatter={kpi.formatter}
                            className="text-3xl font-bold text-[#1D3557] tracking-tight"
                          />
                        ) : (
                          <p className="text-3xl font-bold text-[#1D3557] tracking-tight">
                            {kpi.value}
                          </p>
                        )}
                        {kpi.suffix && (
                          <span className="text-sm font-semibold text-gray-400">{kpi.suffix}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{kpi.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Graphiques et Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Évolution MRR - 2/3 */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="p-6 shadow-md border-0 bg-white hover:shadow-lg transition-shadow h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-[#1D3557] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#2A9D8F]" />
                    Évolution des Revenus
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Analyse sur 12 mois glissants</p>
                </div>
                <Badge variant="outline" className="bg-[#1D3557]/5 text-[#1D3557] border-[#1D3557]/20 px-3 py-1">
                  MRR
                </Badge>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1D3557',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        color: 'white',
                        padding: '12px 16px'
                      }}
                      itemStyle={{ color: 'white', fontWeight: 600 }}
                      labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '12px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenus']}
                      cursor={{ stroke: '#2A9D8F', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2A9D8F" 
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#1D3557' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total 12 mois</p>
                  <p className="text-lg font-bold text-[#1D3557]">
                    {formatAmount(revenueData?.reduce((sum, d) => sum + d.revenue, 0) || 0)} FCFA
                  </p>
                </div>
                <div className="text-center border-l border-r border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Moyenne</p>
                  <p className="text-lg font-bold text-[#1D3557]">
                    {formatAmount((revenueData?.reduce((sum, d) => sum + d.revenue, 0) || 0) / 12)} FCFA
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Croissance</p>
                  <div className="flex items-center justify-center gap-1">
                    <div className="bg-[#2A9D8F]/10 rounded-full p-1">
                      <TrendingUp className="w-3 h-3 text-[#2A9D8F]" />
                    </div>
                    <p className="text-lg font-bold text-[#2A9D8F]">
                      +{stats?.trends.mrr.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Répartition Plans - 1/3 */}
          <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <Card className="p-6 shadow-md border-0 bg-white hover:shadow-lg transition-shadow flex-1">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1D3557] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#E9C46A]" />
                  Plans d'Abonnement
                </h3>
                <p className="text-sm text-gray-500 mt-1">Répartition par volume</p>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={planDistribution as any || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="count"
                      cornerRadius={6}
                    >
                      {(planDistribution || []).map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1D3557',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                      }}
                      itemStyle={{ color: 'white', fontWeight: 600 }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 mt-4">
                {(planDistribution || []).map((plan, index) => (
                  <div key={plan.planSlug} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" 
                        style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-gray-700">{plan.planName}</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400">{plan.percentage}%</span>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold border-0 min-w-[30px] justify-center">
                        {plan.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Métriques Avancées + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Métriques Avancées - 2/3 */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="p-6 shadow-md border-0 bg-white hover:shadow-lg transition-shadow h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1D3557] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#2A9D8F]" />
                  Métriques Avancées
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#2A9D8F] hover:text-[#1D3557] hover:bg-[#2A9D8F]/10"
                  onClick={() => navigate('/dashboard/reports')}
                >
                  Voir rapport complet <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {advancedMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div 
                      key={metric.label} 
                      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${metric.borderColor} bg-white`}
                    >
                      {/* Fond gradient léger */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${metric.lightGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 rounded-xl ${metric.bgIcon} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`w-5 h-5 ${metric.color}`} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-gray-700 transition-colors`}>
                            {metric.label}
                          </span>
                        </div>
                        
                        {metric.rawValue !== undefined ? (
                          <CountUp 
                            value={metric.rawValue} 
                            formatter={metric.formatter}
                            suffix={metric.suffix}
                            className="text-2xl font-bold text-[#1D3557] mb-1 block"
                          />
                        ) : (
                          <p className="text-2xl font-bold text-[#1D3557] mb-1">{metric.value}</p>
                        )}
                        <p className="text-xs font-medium text-gray-500">{metric.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Alertes Intelligentes - 1/3 */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 shadow-md border-0 bg-white hover:shadow-lg transition-shadow h-full flex flex-col">
              <h3 className="text-lg font-bold text-[#1D3557] mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E9C46A]" />
                Alertes Prioritaires
              </h3>

              <div className="space-y-4 flex-1">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${
                      alert.type === 'critical' 
                        ? 'border-[#E63946]' 
                        : 'border-[#E9C46A]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{alert.label}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{alert.description}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          alert.type === 'critical' 
                            ? 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30' 
                            : 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/30'
                        }`}
                      >
                        {alert.count}
                      </Badge>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full text-xs h-8 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                      asChild
                    >
                      <a href={alert.href} className="flex items-center justify-center gap-1">
                        {alert.action}
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Statut Système */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between bg-[#F9F9F9] p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2A9D8F]" />
                    <span className="text-sm font-semibold text-gray-700">État du Système</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A9D8F] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2A9D8F]"></span>
                    </div>
                    <span className="text-xs font-bold text-[#2A9D8F]">Opérationnel</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;
