/**
 * WelcomeCard "Cockpit" pour Admin Groupe
 * Design futuriste Top Niveau avec Glassmorphism avancé
 * @module GroupWelcomeCard
 */

import { Plus, Users, Activity, Sparkles, TrendingUp, School } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAdminGroupStats } from '../hooks/useAdminGroupStats';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export const GroupWelcomeCard = () => {
  const { user } = useAuth();
  const { data: stats } = useAdminGroupStats();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Plus,
      label: 'Ajouter École',
      onClick: () => navigate('/dashboard/schools?action=create'),
      gradient: 'from-[#2A9D8F] to-[#21867a]',
      shadow: 'shadow-[#2A9D8F]/25',
    },
    {
      icon: Users,
      label: 'Nouveau Personnel',
      onClick: () => navigate('/dashboard/users?action=create'),
      gradient: 'from-[#1D3557] to-[#152943]',
      shadow: 'shadow-[#1D3557]/25',
    },
    {
      icon: Activity,
      label: 'Flux Activité',
      onClick: () => navigate('/dashboard/activity-logs'),
      gradient: 'from-[#E9C46A] to-[#d4af37]',
      shadow: 'shadow-[#E9C46A]/25',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      {/* Glow Effect Background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2A9D8F]/30 via-[#1D3557]/30 to-[#E9C46A]/30 rounded-2xl blur opacity-30 animate-pulse" />

      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-0">
        {/* Texture de fond "Tech" */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        
        {/* Cercles décoratifs animés */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D3557]/10 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#E9C46A]/10 to-[#E63946]/10 blur-3xl animate-blob animation-delay-2000" />

        <div className="relative flex flex-col md:flex-row items-center justify-between p-5 gap-6">
          
          {/* Section Gauche : Identité & Stats Live */}
          <div className="flex items-center gap-5 flex-1 w-full md:w-auto">
            {/* Logo avec Ring Animé */}
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
              <div className="relative">
                {user?.schoolGroupLogo ? (
                  <img
                    src={user.schoolGroupLogo}
                    alt={user.schoolGroupName || 'Logo'}
                    className="w-20 h-20 rounded-xl object-cover shadow-2xl border-[3px] border-white transform group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-bold text-3xl shadow-2xl border-[3px] border-white transform group-hover:scale-105 transition duration-300">
                    {user?.schoolGroupName?.[0] || 'G'}
                  </div>
                )}
                
                {/* Badge Status Live */}
                <div className="absolute -bottom-2 -right-2 bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">En ligne</span>
                </div>
              </div>
            </div>

            {/* Infos & KPIs */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-[#1D3557] tracking-tight truncate">
                    {user?.schoolGroupName || 'Groupe Scolaire'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#1D3557]/10 to-[#2A9D8F]/10 border border-[#1D3557]/10 text-[10px] font-bold text-[#1D3557] uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <p className="text-gray-500 font-medium flex items-center gap-2 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#E9C46A]" />
                  Bonjour, <span className="text-[#1D3557] font-semibold">{user?.firstName}</span>
                </p>
              </div>

              {/* Mini Stats Pills */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-medium text-gray-600 hover:scale-105 transition-transform cursor-default">
                  <School className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  <span className="font-bold text-[#1D3557]">{stats?.totalSchools || 0}</span> écoles
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-medium text-gray-600 hover:scale-105 transition-transform cursor-default">
                  <Users className="w-3.5 h-3.5 text-[#1D3557]" />
                  <span className="font-bold text-[#1D3557]">{stats?.totalStudents || 0}</span> élèves
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-medium text-gray-600 hover:scale-105 transition-transform cursor-default">
                  <TrendingUp className="w-3.5 h-3.5 text-[#E9C46A]" />
                  <span className="font-bold text-[#1D3557]">{(stats?.activeUsers || 0)}</span> actifs
                </div>
              </div>
            </div>
          </div>

          {/* Section Droite : Actions Rapides "Cockpit" */}
          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  className={`relative group overflow-hidden bg-gradient-to-br ${action.gradient} text-white border-0 ${action.shadow} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    <span className="font-semibold">{action.label}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
