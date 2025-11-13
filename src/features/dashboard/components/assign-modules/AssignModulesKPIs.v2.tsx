/**
 * KPIs pour Gestion des Accès - Style Finances avec animations
 * Design harmonisé avec gradients et effets visuels
 */

import { Users as UsersIcon, Package, Shield, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

interface AssignModulesKPIsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalModules: number;
    usersWithModules: number;
    lastAssignmentDate?: string | null;
  };
}

export function AssignModulesKPIs({ stats }: AssignModulesKPIsProps) {
  const assignmentRate = stats.totalUsers > 0 
    ? Math.round((stats.usersWithModules / stats.totalUsers) * 100) 
    : 0;

  const activeRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  // Formater la dernière date d'assignation
  const lastAssignmentDate = stats.lastAssignmentDate 
    ? new Date(stats.lastAssignmentDate)
    : new Date();

  const kpis = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers.toString(),
      subtitle: `${stats.activeUsers} actifs`,
      trend: activeRate,
      icon: UsersIcon,
      gradient: 'from-[#3B82F6] via-[#60A5FA] to-[#2563EB]',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-100',
    },
    {
      title: 'Modules',
      value: stats.totalModules.toString(),
      subtitle: 'Disponibles',
      trend: 0,
      icon: Package,
      gradient: 'from-[#10B981] via-[#34D399] to-[#059669]',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-100',
    },
    {
      title: 'Permissions',
      value: stats.usersWithModules.toString(),
      subtitle: `${assignmentRate}% assignées`,
      trend: assignmentRate,
      icon: Shield,
      gradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-100',
    },
    {
      title: 'Dernière MAJ',
      value: lastAssignmentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      subtitle: lastAssignmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      trend: 0,
      icon: Clock,
      gradient: 'from-[#F59E0B] via-[#FBBF24] to-[#D97706]',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-100',
    },
  ];

  return (
    <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.trend >= 0;
        
        return (
          <AnimatedItem key={kpi.title}>
            <div className={`group relative overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-white/10`}>
              {/* Cercles décoratifs animés */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
              
              {/* Contenu */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${kpi.iconBg} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${kpi.iconColor}`} />
                  </div>
                  {kpi.trend !== 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg">
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5 text-white/90" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-white/90" />
                      )}
                      <span className="text-xs font-bold text-white/90">
                        {isPositive ? '+' : ''}{kpi.trend}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{kpi.title}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-white drop-shadow-lg">{kpi.value}</span>
                </div>
                <p className="text-white/60 text-xs font-medium">{kpi.subtitle}</p>
              </div>
            </div>
          </AnimatedItem>
        );
      })}
    </AnimatedContainer>
  );
}
