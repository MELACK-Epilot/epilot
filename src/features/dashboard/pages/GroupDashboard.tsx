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

import { useSmartRecommendations } from '../hooks/useSmartRecommendations';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const recommendation = useSmartRecommendations();
  const navigate = useNavigate();

  const RecommendationIcon = recommendation?.icon || TrendingUp;

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

        {/* Activité et Alertes - Disposition 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité Récente - 50% */}
          <motion.div variants={itemVariants} className="min-h-[400px]">
            <RecentActivityFeed />
          </motion.div>

          {/* Alertes - 50% */}
          <motion.div variants={itemVariants} className="min-h-[400px]">
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

          {/* Recommandation Intelligente Dynamique */}
          {recommendation && (
            <Card className="p-6 bg-gradient-to-br from-[#1D3557]/5 to-white border border-[#1D3557]/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Fond animé */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#1D3557]/5 rounded-full blur-2xl group-hover:bg-[#1D3557]/10 transition-colors duration-500" />
              
              <div className="relative flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl shadow-lg text-white ${
                    recommendation.type === 'critical' ? 'bg-[#E63946]' :
                    recommendation.type === 'warning' ? 'bg-[#E9C46A]' :
                    recommendation.type === 'growth' ? 'bg-[#2A9D8F]' :
                    'bg-[#1D3557]'
                  }`}>
                    <RecommendationIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-[#1D3557]">
                        {recommendation.title}
                      </h3>
                      {recommendation.metric && (
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-100 text-xs font-bold text-gray-600 shadow-sm">
                          {recommendation.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {recommendation.message}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(recommendation.route)}
                    className="text-[#1D3557] border-[#1D3557]/20 hover:bg-[#1D3557]/5 gap-2 group-hover:border-[#1D3557]/40 transition-all"
                  >
                    {recommendation.action}
                    <TrendingUp className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
