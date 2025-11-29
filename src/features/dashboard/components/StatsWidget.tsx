/**
 * Widget des statistiques clés (KPI)
 * Design System Officiel & Animations Modernes
 * @module StatsWidget
 */

import { Users, Building2, DollarSign, AlertTriangle, School, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAdminGroupStats } from '../hooks/useAdminGroupStats';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { useResponsive } from '@/hooks/useResponsive';
import { AnimatedContainer, AnimatedItem } from './AnimatedCard';

// Couleurs Officielles
const COLORS = {
  primary: '#1D3557',
  success: '#2A9D8F',
  warning: '#E9C46A',
  danger: '#E63946',
  white: '#FFFFFF'
};

export const StatsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminGroupe = user?.role === 'admin_groupe';
  
  // Utiliser le hook approprié selon le rôle
  const { data: superAdminStats, isLoading: superAdminLoading } = useDashboardStats();
  const { data: adminGroupStats, isLoading: adminGroupLoading } = useAdminGroupStats();
  
  const isLoading = isAdminGroupe ? adminGroupLoading : superAdminLoading;

  // Stats Super Admin typées
  const saStats = superAdminStats as any;
  // Stats Admin Groupe typées
  const agStats = adminGroupStats as any;

  // Cards adaptées selon le rôle
  const cards = isSuperAdmin ? [
    {
      title: 'Groupes Scolaires',
      value: saStats?.totalSchoolGroups || 0,
      trend: saStats?.trends?.schoolGroups || 0,
      icon: Building2,
      gradient: 'from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]',
      iconBg: 'bg-[#1D3557]/10',
      iconColor: 'text-[#1D3557]',
      route: '/dashboard/school-groups',
    },
    {
      title: 'Utilisateurs Actifs',
      value: saStats?.activeUsers || 0,
      trend: saStats?.trends?.users || 0,
      icon: Users,
      gradient: 'from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]',
      iconBg: 'bg-[#2A9D8F]/10',
      iconColor: 'text-[#2A9D8F]',
      route: '/dashboard/users',
    },
    {
      title: 'MRR Estimé',
      value: `${((saStats?.estimatedMRR || 0) / 1000000).toFixed(1)}M`,
      trend: saStats?.trends?.mrr || 0,
      icon: DollarSign,
      gradient: 'from-[#E9C46A] via-[#F4D06F] to-[#d4a84a]',
      iconBg: 'bg-[#E9C46A]/10',
      iconColor: 'text-[#E9C46A]',
      route: '/dashboard/subscriptions',
      suffix: 'FCFA',
    },
    {
      title: 'Abonnements Critiques',
      value: saStats?.criticalSubscriptions || 0,
      trend: saStats?.trends?.subscriptions || 0,
      icon: AlertTriangle,
      gradient: 'from-[#E63946] via-[#FF4757] to-[#c72f3a]',
      iconBg: 'bg-[#E63946]/10',
      iconColor: 'text-[#E63946]',
      route: '/dashboard/subscriptions?filter=critical',
    },
  ] : [
    {
      title: 'Écoles',
      value: agStats?.totalSchools || 0,
      trend: agStats?.trends?.schools || 0,
      icon: School,
      gradient: 'from-[#1D3557] to-[#2A4A6F]',
      iconBg: 'bg-[#1D3557]/10',
      iconColor: 'text-[#1D3557]',
      route: '/dashboard/schools',
    },
    {
      title: 'Élèves',
      value: agStats?.totalStudents || 0,
      trend: agStats?.trends?.students || 0,
      icon: GraduationCap,
      gradient: 'from-[#2A9D8F] to-[#3FBFAE]',
      iconBg: 'bg-[#2A9D8F]/10',
      iconColor: 'text-[#2A9D8F]',
      route: '/dashboard/schools',
    },
    {
      title: 'Personnel',
      value: agStats?.totalStaff || 0,
      trend: agStats?.trends?.staff || 0,
      icon: Users,
      gradient: 'from-[#8B5CF6] to-[#A78BFA]',
      iconBg: 'bg-[#8B5CF6]/10',
      iconColor: 'text-[#8B5CF6]',
      route: '/dashboard/users',
    },
    {
      title: 'Utilisateurs Actifs',
      value: agStats?.activeUsers || 0,
      trend: agStats?.trends?.users || 0,
      icon: Users,
      gradient: 'from-[#E9C46A] to-[#F4D06F]',
      iconBg: 'bg-[#E9C46A]/10',
      iconColor: 'text-[#E9C46A]',
      route: '/dashboard/users',
    },
  ];

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-10 w-10 bg-gray-100 rounded-xl" />
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <AnimatedContainer 
      className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`} 
      stagger={0.05}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.trend >= 0;

        return (
          <AnimatedItem key={card.title}>
            <button
              onClick={() => navigate(card.route)}
              className="group relative w-full text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Background Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  
                  {card.trend !== 0 && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isPositive 
                        ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' 
                        : 'bg-[#E63946]/10 text-[#E63946]'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{isPositive ? '+' : ''}{card.trend.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold text-[#1D3557] tracking-tight`}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-sm font-semibold text-gray-400">{card.suffix}</span>
                  )}
                </div>
              </div>
            </button>
          </AnimatedItem>
        );
      })}
    </AnimatedContainer>
  );
};
