/**
 * Page Dashboard - Vue d'ensemble
 * Super Admin : Dashboard classique
 * Admin Groupe : Dashboard moderne optimisé
 * @module DashboardOverview
 */

import { useState, useMemo } from 'react';
import { Home, ChevronRight, RefreshCw, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WelcomeCard } from '../components/WelcomeCard';
import { StatsWidget } from '../components/StatsWidget';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAuth } from '@/features/auth/store/auth.store';
import { ExportButton } from '../components/ExportButton';
import GroupDashboard from './GroupDashboard';
import SuperAdminAlertsWidget from '../components/widgets/SuperAdminAlertsWidget';


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
  const { data: stats, refetch, isError, error } = useDashboardStats();
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
  }, [user?.role]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      // Attendre 1 seconde avant de désactiver le spinner
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    }
  };

  return (
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

        {/* ✅ CORRECTION: Affichage des erreurs */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erreur de chargement</AlertTitle>
              <AlertDescription>
                Impossible de charger les statistiques du dashboard. 
                {error instanceof Error && ` Détails: ${error.message}`}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

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
            <ExportButton stats={stats} />
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

        {/* Widget Alertes Plateforme - UNIQUEMENT SUPER ADMIN */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SuperAdminAlertsWidget />
          </motion.div>
        )}

      </div>
  );
};

export default DashboardOverview;
