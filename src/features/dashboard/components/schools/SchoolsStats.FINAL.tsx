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
    averageStudentsPerSchool?: number;
    schoolsThisYear?: number;
    privateSchools?: number;
    publicSchools?: number;
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
      gradient: 'from-[#1D3557] to-[#0d1f3d]',
    },
    {
      title: 'Écoles Actives',
      value: stats?.activeSchools || 0,
      icon: Building2,
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]',
      trend: '+8%',
    },
    {
      title: 'Total Élèves',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      gradient: 'from-purple-500 to-purple-600',
      trend: '+15%',
    },
    {
      title: 'Total Enseignants',
      value: stats?.totalTeachers || 0,
      icon: UserCheck,
      gradient: 'from-orange-500 to-orange-600',
      trend: '+5%',
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
              <div className={`relative overflow-hidden ${gradientClass} rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group`}>
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
                  <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </AnimatedItem>
          );
        })}
      </AnimatedContainer>
    </div>
  );
};
