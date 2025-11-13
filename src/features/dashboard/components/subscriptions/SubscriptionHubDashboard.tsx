/**
 * SubscriptionHubDashboard - Dashboard avancé du Hub Abonnements
 * Design premium avec glassmorphism et gradients 3 couleurs
 * @module SubscriptionHubDashboard
 */

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  Package
} from 'lucide-react';
import { SubscriptionHubKPIs } from '../../hooks/useSubscriptionHubKPIs';

interface SubscriptionHubDashboardProps {
  kpis?: SubscriptionHubKPIs;
  isLoading?: boolean;
  actions?: React.ReactNode;
}

export const SubscriptionHubDashboard = ({ kpis, isLoading, actions }: SubscriptionHubDashboardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  };

  const kpiCards = [
    {
      title: 'MRR',
      value: `${formatCurrency(kpis.mrr)} FCFA`,
      subtitle: 'Revenu Mensuel Récurrent',
      icon: DollarSign,
      gradient: 'from-[#3B82F6] via-[#60A5FA] to-[#2563EB]',
      trend: kpis.mrr > 0 ? { value: '+12%', positive: true } : undefined,
    },
    {
      title: 'ARR',
      value: `${formatCurrency(kpis.arr)} FCFA`,
      subtitle: 'Revenu Annuel Récurrent',
      icon: TrendingUp,
      gradient: 'from-[#1D3557] via-[#2E5A7D] to-[#0F1F35]',
      trend: kpis.arr > 0 ? { value: '+15%', positive: true } : undefined,
    },
    {
      title: 'Taux de Renouvellement',
      value: `${kpis.renewalRate}%`,
      subtitle: 'Abonnements renouvelés',
      icon: CheckCircle2,
      gradient: 'from-[#10B981] via-[#34D399] to-[#059669]',
      trend: kpis.renewalRate >= 80 ? { value: 'Excellent', positive: true } : 
             kpis.renewalRate >= 60 ? { value: 'Bon', positive: true } : 
             { value: 'À améliorer', positive: false },
    },
    {
      title: 'Valeur Moyenne',
      value: `${formatCurrency(kpis.averageSubscriptionValue)} FCFA`,
      subtitle: 'Par abonnement',
      icon: BarChart3,
      gradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]',
    },
    {
      title: 'Expire dans 30j',
      value: kpis.expiringIn30Days.toString(),
      subtitle: 'Abonnements à renouveler',
      icon: AlertTriangle,
      gradient: 'from-[#E63946] via-[#EF4444] to-[#C72030]',
      alert: kpis.expiringIn30Days > 0,
    },
    {
      title: 'Expire dans 60j',
      value: kpis.expiringIn60Days.toString(),
      subtitle: 'Abonnements à surveiller',
      icon: Clock,
      gradient: 'from-[#F59E0B] via-[#FBBF24] to-[#D97706]',
    },
    {
      title: 'Expire dans 90j',
      value: kpis.expiringIn90Days.toString(),
      subtitle: 'Abonnements à anticiper',
      icon: Calendar,
      gradient: 'from-[#F4A261] via-[#FB923C] to-[#E76F51]',
    },
    {
      title: 'Paiements en Retard',
      value: kpis.overduePayments.toString(),
      subtitle: `${formatCurrency(kpis.overdueAmount)} FCFA`,
      icon: AlertTriangle,
      gradient: 'from-[#DC2626] via-[#EF4444] to-[#991B1B]',
      alert: kpis.overduePayments > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Titre de section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#2A9D8F]" />
            Dashboard Hub Abonnements
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble des métriques clés et indicateurs de performance
          </p>
        </div>
        {actions && <div>{actions}</div>}
      </div>

      {/* Grille des KPIs - Design Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full"
            >
              <Card 
                className={`group relative p-6 overflow-hidden border-0 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-gradient-to-br ${kpi.gradient} min-h-[200px] flex flex-col justify-between h-full`}
              >
                {/* Cercles décoratifs animés */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative z-10 space-y-3">
                  {/* Header avec icône glassmorphism */}
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white/90" />
                    </div>
                    {kpi.trend && (
                      <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-white/90" />
                        <span className="text-xs font-bold text-white/90">{kpi.trend.value}</span>
                      </div>
                    )}
                    {kpi.alert && (
                      <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg animate-pulse">
                        <span className="text-xs font-bold text-white/90">⚠ Action</span>
                      </div>
                    )}
                  </div>

                  {/* Titre */}
                  <div>
                    <p className="text-white/70 text-sm font-semibold tracking-wide uppercase">{kpi.title}</p>
                    <p className="text-4xl font-extrabold text-white drop-shadow-lg mt-2">{kpi.value}</p>
                  </div>

                  {/* Sous-titre */}
                  <p className="text-white/60 text-xs font-medium">{kpi.subtitle}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
