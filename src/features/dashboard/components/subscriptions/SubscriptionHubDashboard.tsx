/**
 * SubscriptionHubDashboard - Dashboard avancé du Hub Abonnements
 * Design simplifié et focus sur les métriques essentielles (Actionable Metrics)
 * @module SubscriptionHubDashboard
 */

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  DollarSign,
  CheckCircle2,
  Package,
  Users,
  Activity
} from 'lucide-react';
import { SubscriptionHubKPIs } from '../../hooks/useSubscriptionHubKPIs';

import { Button } from '@/components/ui/button';

interface SubscriptionHubDashboardProps {
  kpis?: SubscriptionHubKPIs;
  isLoading?: boolean;
  actions?: React.ReactNode;
  onActionClick?: (type: 'overdue' | 'expiring') => void;
}

export const SubscriptionHubDashboard = ({ kpis, isLoading, actions, onActionClick }: SubscriptionHubDashboardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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

  // Calcul des alertes totales (Expirations proches + Retards)
  const totalAlerts = kpis.expiringIn30Days + kpis.overduePayments;

  const kpiCards = [
    {
      title: 'MRR Mensuel',
      value: `${formatCurrency(kpis.mrr)} FCFA`,
      subtitle: 'Revenu Récurrent',
      icon: DollarSign,
      gradient: 'from-blue-600 to-blue-800',
      shadow: 'shadow-blue-500/20',
      info: 'Santé financière',
    },
    {
      title: 'Abonnements Actifs',
      value: kpis.totalActive.toString(),
      subtitle: 'Clients payants & actifs',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-500/20',
      info: 'Base client active',
    },
    {
      title: 'Taux de Rétention',
      value: `${kpis.renewalRate}%`,
      subtitle: 'Fidélité client',
      icon: Activity,
      gradient: 'from-violet-500 to-violet-700',
      shadow: 'shadow-violet-500/20',
      info: kpis.renewalRate >= 80 ? 'Excellent' : 'À surveiller',
    },
    {
      title: 'Centre d\'Action',
      value: totalAlerts.toString(),
      subtitle: 'Actions requises',
      icon: AlertTriangle,
      gradient: totalAlerts > 0 ? 'from-red-500 to-red-700' : 'from-gray-500 to-gray-700',
      shadow: totalAlerts > 0 ? 'shadow-red-500/20' : 'shadow-gray-500/20',
      isAlert: true,
      details: [
        { label: 'Expire < 30j', value: kpis.expiringIn30Days, color: 'text-red-100' },
        { label: 'Paiements retard', value: kpis.overduePayments, color: 'text-red-100' }
      ]
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
            Vue synthétique des performances et actions prioritaires
          </p>
        </div>
        {actions && <div>{actions}</div>}
      </div>

      {/* Grille des KPIs - Design Épuré et Professionnel */}
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
                className={`relative p-6 overflow-hidden border-0 shadow-lg ${kpi.shadow} bg-gradient-to-br ${kpi.gradient} text-white h-full flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300`}
              >
                {/* Design de fond subtil */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {kpi.isAlert && totalAlerts > 0 && (
                      <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full animate-pulse">
                        <span className="text-xs font-bold">Attention</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/80 uppercase tracking-wide">{kpi.title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-3xl font-bold text-white">{kpi.value}</h3>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{kpi.subtitle}</p>
                  </div>

                  {/* Détails pour la carte d'alerte */}
                  {kpi.details && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="space-y-1">
                        {kpi.details.map((detail, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-white/80">{detail.label}</span>
                            <span className="font-bold text-white">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                      
                      {kpi.isAlert && totalAlerts > 0 && onActionClick && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="w-full text-xs h-7 bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => onActionClick('overdue')}
                        >
                          Gérer les alertes
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Info pour les autres cartes */}
                  {kpi.info && !kpi.details && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-xs font-medium text-white/90 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {kpi.info}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
