/**
 * Composant Stats Cards pour la page Groupes Scolaires - VERSION GLASSMORPHISM PREMIUM
 * Style identique aux pages Users et Categories avec cercle décoratif animé
 */

import { Building2, Users, GraduationCap, TrendingUp, Shield } from 'lucide-react';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

interface SchoolGroupsStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  } | undefined;
  isLoading: boolean;
}

export const SchoolGroupsStats = ({ stats, isLoading }: SchoolGroupsStatsProps) => {
  const statsCards = [
    {
      title: 'Total Groupes',
      value: stats?.total || 0,
      icon: Building2,
      gradient: 'from-[#1D3557] to-[#0d1f3d]',
    },
    {
      title: 'Actifs',
      value: stats?.active || 0,
      icon: Users,
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]',
      trend: '+12%',
    },
    {
      title: 'Inactifs',
      value: stats?.inactive || 0,
      icon: GraduationCap,
      gradient: 'from-gray-500 to-gray-600',
    },
    {
      title: 'Suspendus',
      value: stats?.suspended || 0,
      icon: Shield,
      gradient: 'from-[#E63946] to-[#c52030]',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
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
                    <div className="flex items-center gap-1 text-white/90 text-xs font-semibold bg-white/10 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </AnimatedItem>
        );
      })}
    </AnimatedContainer>
  );
};
