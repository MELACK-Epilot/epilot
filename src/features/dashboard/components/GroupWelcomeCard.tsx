/**
 * WelcomeCard Moderne pour Admin Groupe
 * Card compacte avec identité, stats et actions rapides
 * @module GroupWelcomeCard
 */

import { Plus, Users, Activity } from 'lucide-react';
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
      color: 'bg-[#2A9D8F] hover:bg-[#238276]',
    },
    {
      icon: Users,
      label: 'Ajouter Utilisateur',
      onClick: () => navigate('/dashboard/users?action=create'),
      color: 'bg-[#1D3557] hover:bg-[#152943]',
    },
    {
      icon: Activity,
      label: 'Activité',
      onClick: () => navigate('/dashboard/activity-logs'),
      color: 'bg-[#E9C46A] hover:bg-[#d4af37]',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg p-4">
        {/* Cercles décoratifs subtils */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl bg-[#2A9D8F]/5" />
        <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full blur-xl bg-[#1D3557]/5" />
        
        <div className="relative flex items-center justify-between">
          {/* Gauche : Logo + Identité + Stats */}
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {user?.schoolGroupLogo ? (
                <img
                  src={user.schoolGroupLogo}
                  alt={user.schoolGroupName || 'Logo'}
                  className="w-16 h-16 rounded-xl object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white">
                  {user?.schoolGroupName?.[0] || 'G'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2A9D8F] rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Identité + Stats */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {user?.schoolGroupName || 'Groupe Scolaire'} 🏫
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Bonjour {user?.firstName} • {stats?.totalSchools || 0} école(s) • {stats?.totalStudents || 0} élèves
              </p>
            </div>
          </div>

          {/* Droite : Actions Rapides */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  size="sm"
                  className={`${action.color} text-white gap-2 h-9 shadow-md hover:shadow-lg transition-all`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
