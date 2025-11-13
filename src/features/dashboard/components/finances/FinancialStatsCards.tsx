/**
 * Composant Stats Cards pour la page Finances - VERSION GLASSMORPHISM PREMIUM
 * Affiche des KPIs COMPLÉMENTAIRES (pas de redondance avec la page Finances principale)
 * Style identique aux pages Users, Categories et Modules
 */

import { Percent, TrendingDown, DollarSign, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

interface FinancialStatsCardsProps {
  stats: {
    retentionRate: number;
    churnRate: number;
    averageRevenuePerGroup: number;
    lifetimeValue: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    // Comparaisons période précédente (optionnel)
    retentionRatePrevious?: number;
    churnRatePrevious?: number;
    averageRevenuePerGroupPrevious?: number;
    lifetimeValuePrevious?: number;
  } | null;
  paymentStats: {
    completed: number;
    pending: number;
  } | null;
  isLoading: boolean;
}

export const FinancialStatsCards = ({ stats, paymentStats, isLoading }: FinancialStatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Calcul des variations vs période précédente
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const retentionChange = calculateChange(stats?.retentionRate || 0, stats?.retentionRatePrevious);
  const churnChange = calculateChange(stats?.churnRate || 0, stats?.churnRatePrevious);
  const arpuChange = calculateChange(stats?.averageRevenuePerGroup || 0, stats?.averageRevenuePerGroupPrevious);
  const ltvChange = calculateChange(stats?.lifetimeValue || 0, stats?.lifetimeValuePrevious);

  // Objectifs (targets) - À configurer selon vos besoins
  const TARGETS = {
    retentionRate: 95, // Objectif : 95%
    churnRate: 5,      // Objectif : max 5%
    arpu: 30000,       // Objectif : 30,000 FCFA
    ltv: 360000,       // Objectif : 360,000 FCFA
  };

  // KPIs COMPLÉMENTAIRES (pas de redondance avec page Finances)
  const statsCards = [
    {
      title: 'Taux de Rétention',
      value: `${(stats?.retentionRate || 0).toFixed(1)}%`,
      icon: Percent,
      gradient: 'from-[#2A9D8F] to-[#1D8A7E]',
      trend: stats?.retentionRate && stats.retentionRate >= 90 ? 'Excellent' : 'À améliorer',
      trendUp: (stats?.retentionRate || 0) >= 90,
      subtitle: 'clients fidèles',
      change: retentionChange,
      target: TARGETS.retentionRate,
      currentValue: stats?.retentionRate || 0,
    },
    {
      title: 'Taux d\'Attrition (Churn)',
      value: `${(stats?.churnRate || 0).toFixed(1)}%`,
      icon: TrendingDown,
      gradient: 'from-[#E63946] to-[#C52A36]',
      trend: stats?.churnRate && stats.churnRate <= 5 ? 'Bon' : 'Attention',
      trendUp: (stats?.churnRate || 0) <= 5,
      subtitle: 'clients perdus',
      change: churnChange,
      target: TARGETS.churnRate,
      currentValue: stats?.churnRate || 0,
      inverse: true, // Pour le churn, moins c'est mieux
    },
    {
      title: 'Revenu Moyen par Groupe',
      value: `${(stats?.averageRevenuePerGroup || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      gradient: 'from-[#E9C46A] to-[#D4AF37]',
      subtitle: 'par abonnement actif',
      change: arpuChange,
      target: TARGETS.arpu,
      currentValue: stats?.averageRevenuePerGroup || 0,
    },
    {
      title: 'Valeur Vie Client (LTV)',
      value: `${(stats?.lifetimeValue || 0).toLocaleString()} FCFA`,
      icon: Users,
      gradient: 'from-[#457B9D] to-[#2A5F7F]',
      subtitle: 'valeur moyenne',
      change: ltvChange,
      target: TARGETS.ltv,
      currentValue: stats?.lifetimeValue || 0,
    },
  ];

  return (
    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        const gradientClass = `bg-gradient-to-br ${stat.gradient}`;
        return (
          <AnimatedItem key={stat.title}>
            <div className={`relative overflow-hidden ${gradientClass} rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group`}>
              {/* Cercle décoratif animé */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-white/90 text-xs font-semibold bg-white/10 px-2 py-1 rounded-full`}>
                      {stat.trendUp ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.trend}
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-white/70 text-xs mb-2">{stat.subtitle}</p>
                )}
                
                {/* Comparaison période précédente */}
                {stat.change !== null && stat.change !== undefined && (
                  <div className="flex items-center gap-1 mb-2">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-white/80" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-white/80" />
                    )}
                    <span className="text-xs text-white/80 font-medium">
                      {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% vs mois dernier
                    </span>
                  </div>
                )}

                {/* Barre de progression vers l'objectif */}
                {stat.target && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>Objectif</span>
                      <span>
                        {stat.inverse 
                          ? `${((1 - stat.currentValue / stat.target) * 100).toFixed(0)}%`
                          : `${((stat.currentValue / stat.target) * 100).toFixed(0)}%`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div 
                        className="bg-white h-1.5 rounded-full transition-all duration-500" 
                        style={{ 
                          width: stat.inverse
                            ? `${Math.min(100, Math.max(0, (1 - stat.currentValue / stat.target) * 100))}%`
                            : `${Math.min(100, (stat.currentValue / stat.target) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedItem>
        );
      })}
    </AnimatedContainer>
  );
};
