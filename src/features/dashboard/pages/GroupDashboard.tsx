/**
 * Dashboard Moderne pour Admin Groupe
 * Design épuré, fonctionnel et adapté aux besoins réels
 * @module GroupDashboard
 */

import { motion } from 'framer-motion';
import { GroupWelcomeCard } from '../components/GroupWelcomeCard';
import { StatsWidget } from '../components/StatsWidget';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { RecentActivityFeed } from '../components/RecentActivityFeed';
import { AlertsWidget } from '../components/AlertsWidget';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminGroupStats } from '../hooks/useAdminGroupStats';

// Variantes d'animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function GroupDashboard() {
  const { data: stats } = useAdminGroupStats();

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Contenu Principal */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 py-6 space-y-6"
      >
        {/* WelcomeCard Compacte */}
        <motion.div variants={itemVariants}>
          <GroupWelcomeCard />
        </motion.div>

        {/* KPIs Principaux */}
        <motion.div variants={itemVariants}>
          <StatsWidget />
        </motion.div>

        {/* Actions Rapides */}
        <motion.div variants={itemVariants}>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1D3557]">Actions Rapides</h2>
            <p className="text-sm text-gray-600">Accédez rapidement à vos fonctionnalités principales</p>
          </div>
          <QuickActionsGrid />
        </motion.div>

        {/* Activité et Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activité Récente - 2/3 */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <RecentActivityFeed />
          </motion.div>

          {/* Alertes - 1/3 */}
          <motion.div variants={itemVariants}>
            <AlertsWidget />
          </motion.div>
        </div>

        {/* Tendances et Insights */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tendance Élèves - Données Réelles */}
          <Card className={`p-6 bg-gradient-to-br ${(stats?.trends.students || 0) >= 0 ? 'from-[#2A9D8F]/5' : 'from-[#E63946]/5'} to-white border border-${(stats?.trends.students || 0) >= 0 ? '[#2A9D8F]/20' : '[#E63946]/20'} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 ${(stats?.trends.students || 0) >= 0 ? 'bg-[#2A9D8F]' : 'bg-[#E63946]'} rounded-xl shadow-lg text-white`}>
                {(stats?.trends.students || 0) >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#1D3557] mb-1">
                  {(stats?.trends.students || 0) >= 0 ? 'Croissance Positive' : 'Attention Requise'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Vos effectifs {(stats?.trends.students || 0) >= 0 ? 'augmentent' : 'diminuent'} de{' '}
                  <span className={`font-bold ${(stats?.trends.students || 0) >= 0 ? 'text-[#2A9D8F]' : 'text-[#E63946]'}`}>
                    {(stats?.trends.students || 0) >= 0 ? '+' : ''}{(stats?.trends.students || 0).toFixed(1)}%
                  </span>{' '}
                  ce mois
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#1D3557]"></div>
                    <span className="font-semibold text-[#1D3557]">{stats?.totalStudents || 0}</span> élèves
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#E9C46A]"></div>
                    <span className="font-semibold text-[#1D3557]">{stats?.totalStaff || 0}</span> personnel
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommandation Intelligente */}
          <Card className="p-6 bg-gradient-to-br from-[#1D3557]/5 to-white border border-[#1D3557]/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#1D3557] rounded-xl shadow-lg text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#1D3557] mb-1">
                  Recommandation
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {(stats?.totalSchools || 0) < 3 
                    ? "Ajoutez plus d'écoles pour développer votre groupe"
                    : (stats?.totalStudents || 0) / (stats?.totalStaff || 1) > 30
                    ? "Envisagez de recruter plus de personnel (ratio élèves/staff élevé)"
                    : "Excellent équilibre ! Continuez à optimiser vos processus"
                  }
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="px-2 py-1 bg-[#1D3557]/10 rounded text-[#1D3557]">
                    <span className="font-semibold">{stats?.totalSchools || 0}</span> écoles
                  </div>
                  <div className="px-2 py-1 bg-[#1D3557]/10 rounded text-[#1D3557]">
                    Ratio: <span className="font-semibold">{((stats?.totalStudents || 0) / (stats?.totalStaff || 1)).toFixed(1)}</span> élèves/staff
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
