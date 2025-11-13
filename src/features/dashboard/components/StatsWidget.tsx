/**
 * Widget des statistiques clés (KPI)
 * @module StatsWidget
 */

import { Users, Building2, DollarSign, AlertTriangle, School, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAdminGroupStats } from '../hooks/useAdminGroupStats';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { AnimatedContainer, AnimatedItem } from './AnimatedCard';

export const StatsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminGroupe = user?.role === 'admin_groupe';
  
  // Utiliser le hook approprié selon le rôle
  const { data: superAdminStats, isLoading: superAdminLoading } = useDashboardStats();
  const { data: adminGroupStats, isLoading: adminGroupLoading } = useAdminGroupStats();
  
  const stats = isAdminGroupe ? adminGroupStats : superAdminStats;
  const isLoading = isAdminGroupe ? adminGroupLoading : superAdminLoading;

  // Cards adaptées selon le rôle
  const cards = isSuperAdmin ? [
    {
      title: 'Groupes Scolaires',
      value: stats?.totalSchoolGroups || 0,
      trend: stats?.trends.schoolGroups || 0,
      icon: Building2,
      gradient: 'from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-100',
      route: '/dashboard/school-groups',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats?.activeUsers || 0,
      trend: stats?.trends.users || 0,
      icon: Users,
      gradient: 'from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-100',
      route: '/dashboard/users',
    },
    {
      title: 'MRR Estimé',
      value: `${((stats?.estimatedMRR || 0) / 1000000).toFixed(1)}M`,
      trend: stats?.trends.mrr || 0,
      icon: DollarSign,
      gradient: 'from-[#E9C46A] via-[#F4D06F] to-[#d4a84a]',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-100',
      route: '/dashboard/subscriptions',
      suffix: 'FCFA',
    },
    {
      title: 'Abonnements Critiques',
      value: stats?.criticalSubscriptions || 0,
      trend: stats?.trends.subscriptions || 0,
      icon: AlertTriangle,
      gradient: 'from-[#E63946] via-[#FF4757] to-[#c72f3a]',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-100',
      route: '/dashboard/subscriptions?filter=critical',
    },
  ] : [
    {
      title: 'Écoles',
      value: (stats as any)?.totalSchools || 0,  // ✅ Noms cohérents
      trend: (stats as any)?.trends.schools || 0,
      icon: School,
      gradient: 'from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-100',
      route: '/dashboard/schools',
    },
    {
      title: 'Élèves',
      value: (stats as any)?.totalStudents || 0,  // ✅ Noms cohérents
      trend: (stats as any)?.trends.students || 0,
      icon: GraduationCap,
      gradient: 'from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-100',
      route: '/dashboard/schools',
    },
    {
      title: 'Personnel',
      value: (stats as any)?.totalStaff || 0,  // ✅ Noms cohérents
      trend: (stats as any)?.trends.staff || 0,
      icon: Users,
      gradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-100',
      route: '/dashboard/users',
    },
    {
      title: 'Utilisateurs Actifs',
      value: (stats as any)?.activeUsers || 0,
      trend: (stats as any)?.trends.users || 0,
      icon: Users,
      gradient: 'from-[#F59E0B] via-[#FBBF24] to-[#D97706]',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-100',
      route: '/dashboard/users',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse min-h-[180px]">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-2 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.trend >= 0;

        return (
          <AnimatedItem key={card.title}>
            <button
              onClick={() => navigate(card.route)}
              className={`group relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] text-left border border-white/10 cursor-pointer w-full h-full min-h-[180px] flex flex-col`}
            >
              {/* Cercles décoratifs animés (sans blur excessif) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
              
              {/* Contenu */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${card.iconBg} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${card.iconColor}`} />
                  </div>
                  {card.trend !== 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg">
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5 text-white/90" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-white/90" />
                      )}
                      <span className="text-xs font-bold text-white/90">
                        {isPositive ? '+' : ''}{card.trend.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-4xl font-extrabold text-white drop-shadow-lg leading-none">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</span>
                  {card.suffix && <span className="text-sm font-medium text-white/70">{card.suffix}</span>}
                </div>
              </div>
            </button>
          </AnimatedItem>
        );
      })}
    </AnimatedContainer>
  );
};
