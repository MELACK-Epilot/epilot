/**
 * Stats Cards pour la page Écoles - VERSION GLASSMORPHISM PREMIUM
 * Style IDENTIQUE à la page Utilisateurs avec cercle décoratif animé
 */

import { School, Building2, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

interface SchoolsStatsProps {
  stats: {
    totalSchools: number;
    activeSchools: number;
    totalStudents: number;
    totalTeachers: number;
    averageStudentsPerSchool: number;
    schoolsThisYear: number;
    privateSchools: number;
    publicSchools: number;
  } | undefined;
  isLoading: boolean;
}

export const SchoolsStats = ({ stats, isLoading }: SchoolsStatsProps) => {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Total Écoles',
      value: stats?.totalSchools || 0,
      icon: School,
      gradient: 'from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-100',
    },
    {
      title: 'Écoles Actives',
      value: stats?.activeSchools || 0,
      icon: Building2,
      gradient: 'from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]',
      trend: '+8%',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-100',
    },
    {
      title: 'Total Élèves',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      gradient: 'from-purple-600 via-purple-500 to-purple-700',
      trend: '+15%',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-100',
    },
    {
      title: 'Total Enseignants',
      value: stats?.totalTeachers || 0,
      icon: UserCheck,
      gradient: 'from-orange-600 via-orange-500 to-orange-700',
      trend: '+5%',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats principales - Style Utilisateurs */}
      <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const gradientClass = `bg-gradient-to-br ${stat.gradient}`;
          return (
            <AnimatedItem key={stat.title}>
              <div className={`relative overflow-hidden ${gradientClass} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] group cursor-pointer border border-white/10`}>
                {/* Cercle décoratif animé */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
                
                {/* Contenu */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${stat.iconBg || 'bg-white/10'} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-7 w-7 ${stat.iconColor || 'text-white'}`} />
                    </div>
                    {stat.trend && (
                      <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{stat.title}</p>
                  <p className="text-4xl font-extrabold text-white drop-shadow-lg">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </AnimatedItem>
          );
        })}
      </AnimatedContainer>
    </div>
  );
};
