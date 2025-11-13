/**
 * Page Dashboard - Vue d'ensemble
 * Super Admin : Dashboard classique
 * Admin Groupe : Dashboard moderne optimisé
 * @module DashboardOverview
 */

import { useState, useMemo } from 'react';
import { Home, ChevronRight, RefreshCw, Download, Zap, TrendingUp, AlertCircle, Sparkles, School, Users as UsersIcon, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WelcomeCard } from '../components/WelcomeCard';
import { StatsWidget } from '../components/StatsWidget';
import { DashboardGrid } from '../components/DashboardGrid';
import { DashboardLayoutProvider } from '../hooks/useDashboardLayout';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAIInsights } from '../hooks/useAIInsights';
import { useAuth } from '@/features/auth/store/auth.store';
import GroupDashboard from './GroupDashboard';


/**
 * Composant principal Dashboard Overview - VERSION PREMIUM
 */
export const DashboardOverview = () => {
  const { user } = useAuth();
  
  // Si Admin Groupe, afficher le nouveau dashboard optimisé
  if (user?.role === 'admin_groupe') {
    return <GroupDashboard />;
  }
  
  // Pour Super Admin, continuer avec le dashboard classique
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: stats, refetch } = useDashboardStats();
  const { data: insights, isLoading: insightsLoading } = useAIInsights();
  const navigate = useNavigate();
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Labels adaptés selon le rôle
  const labels = useMemo(() => {
    if (isSuperAdmin) {
      return {
        title: 'Tableau de bord',
        subtitle: 'Vue d\'ensemble de votre plateforme E-Pilot Congo',
        groupsLabel: 'Groupes Scolaires',
        usersLabel: 'Utilisateurs Actifs',
        mrrLabel: 'MRR Global',
        subscriptionsLabel: 'Abonnements',
      };
    }
    return {
      title: 'Tableau de bord',
      subtitle: `Vue d'ensemble de votre groupe scolaire`,
      groupsLabel: 'Écoles',
      usersLabel: 'Utilisateurs Actifs',
      mrrLabel: 'Budget Mensuel',
      subscriptionsLabel: 'Abonnement',
    };
  }, [isSuperAdmin]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // TODO: Implémenter export PDF
    console.log('Export dashboard');
  };

  return (
    <DashboardLayoutProvider>
      <div className="space-y-6 p-6">
        {/* Breadcrumb Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">Tableau de bord</span>
        </motion.nav>

        {/* Header Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            {isSuperAdmin ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-[#E9C46A]" />
                  {labels.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">{labels.subtitle}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {/* Logo du groupe scolaire */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                    {user?.schoolGroupLogo ? (
                      <img 
                        src={user.schoolGroupLogo} 
                        alt={user.schoolGroupName || 'Logo'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-bold text-xl">
                        {user?.schoolGroupName?.[0] || 'G'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {user?.schoolGroupName || 'Groupe Scolaire'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{labels.subtitle}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </Button>
          </div>
        </motion.div>

        {/* Carte de bienvenue avec animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <WelcomeCard />
        </motion.div>

        {/* Statistiques clés (KPI) avec animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatsWidget />
        </motion.div>

        {/* Section Insights & Recommandations IA - UNIQUEMENT SUPER ADMIN */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
          <Card className="p-6 bg-gradient-to-br from-[#2A9D8F]/5 via-white to-[#1D3557]/5 border-[#2A9D8F]/30 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] rounded-xl shadow-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Insights & Recommandations
                    <span className="px-2 py-0.5 bg-[#E9C46A] text-white text-xs font-bold rounded-full animate-pulse">IA</span>
                  </h3>
                  <span className="text-xs text-gray-500">Mis à jour il y a 2 min</span>
                </div>
                
                {insightsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 bg-gray-100 rounded-xl animate-pulse h-24" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights?.map((insight, index) => {
                      const IconComponent = insight.icon === 'TrendingUp' ? TrendingUp 
                        : insight.icon === 'Download' ? Download
                        : insight.icon === 'AlertCircle' ? AlertCircle
                        : insight.icon === 'Sparkles' ? Sparkles
                        : insight.icon === 'Package' ? Package
                        : TrendingUp;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            insight.type === 'alert' && insight.actionUrl
                              ? 'bg-[#E63946]/5 border-[#E63946]/20 hover:shadow-md'
                              : insight.type === 'alert'
                              ? `bg-[${insight.color}]/5 border-[${insight.color}]/20`
                              : 'bg-white border-gray-100 hover:shadow-md'
                          }`}
                          style={{
                            backgroundColor: insight.type === 'alert' && !insight.actionUrl ? `${insight.color}10` : undefined,
                            borderColor: insight.type === 'alert' && !insight.actionUrl ? `${insight.color}33` : undefined,
                          }}
                        >
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${insight.color}1A` }}>
                            <IconComponent className="w-5 h-5" style={{ color: insight.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                            {insight.trend !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ 
                                      width: `${Math.min(Math.abs(insight.trend), 100)}%`,
                                      background: `linear-gradient(90deg, ${insight.color}, ${insight.color}DD)`
                                    }} 
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                  {Math.min(Math.abs(insight.trend), 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            {insight.actionUrl && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-7 text-xs hover:text-white"
                                style={{ 
                                  borderColor: insight.color,
                                  color: insight.color,
                                }}
                                onClick={() => navigate(insight.actionUrl!)}
                              >
                                Gérer maintenant
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
          </motion.div>
        )}

        {/* Grille de widgets personnalisables avec drag & drop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <DashboardGrid />
        </motion.div>
      </div>
    </DashboardLayoutProvider>
  );
};

export default DashboardOverview;
