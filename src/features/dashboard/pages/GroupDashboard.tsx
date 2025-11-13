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

export default function GroupDashboard() {
  const { data: stats } = useAdminGroupStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenu Principal */}
      <div className="px-6 py-6 space-y-6">
        {/* WelcomeCard Compacte */}
        <GroupWelcomeCard />
        {/* KPIs Principaux */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsWidget />
        </motion.div>

        {/* Actions Rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Actions Rapides</h2>
            <p className="text-sm text-gray-600">Accédez rapidement à vos fonctionnalités principales</p>
          </div>
          <QuickActionsGrid />
        </motion.div>

        {/* Activité et Alertes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Activité Récente - 2/3 */}
          <div className="lg:col-span-2">
            <RecentActivityFeed />
          </div>

          {/* Alertes - 1/3 */}
          <div>
            <AlertsWidget />
          </div>
        </motion.div>

        {/* Tendances et Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tendance Élèves - Données Réelles */}
          <Card className={`p-6 bg-gradient-to-br ${(stats?.trends.students || 0) >= 0 ? 'from-[#2A9D8F]/5' : 'from-[#E63946]/5'} to-white border-${(stats?.trends.students || 0) >= 0 ? '[#2A9D8F]' : '[#E63946]'}/20`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 ${(stats?.trends.students || 0) >= 0 ? 'bg-[#2A9D8F]' : 'bg-[#E63946]'} rounded-xl shadow-lg`}>
                {(stats?.trends.students || 0) >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-white" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
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
                  <div>
                    <span className="font-semibold text-gray-900">{stats?.totalStudents || 0}</span> élèves
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{stats?.totalStaff || 0}</span> personnel
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommandation Intelligente */}
          <Card className="p-6 bg-gradient-to-br from-[#1D3557]/5 to-white border-[#1D3557]/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#1D3557] rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
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
                  <div className="px-2 py-1 bg-[#1D3557]/10 rounded">
                    <span className="font-semibold">{stats?.totalSchools || 0}</span> écoles
                  </div>
                  <div className="px-2 py-1 bg-[#1D3557]/10 rounded">
                    Ratio: <span className="font-semibold">{((stats?.totalStudents || 0) / (stats?.totalStaff || 1)).toFixed(1)}</span> élèves/staff
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
