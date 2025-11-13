/**
 * Dashboard Proviseur PARFAIT - Version Expert
 * Design niveau mondial avec disposition optimale
 * React 19 Best Practices
 * 
 * @module UserDashboardPerfect
 */

import { memo, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Bell,
  ArrowRight,
  Activity,
  Clock,
  Award,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { SchoolWidgets } from '../components/SchoolWidgets';
import { AvailableModules } from '../components/AvailableModules';
import { SchoolAlerts } from '../components/SchoolAlerts';
import { useUserModulesContext } from '@/contexts/UserPermissionsProvider';

/**
 * Composant Loading mémorisé
 */
const LoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-12 w-12 text-[#2A9D8F] animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * Composant Error mémorisé
 */
const ErrorState = memo(({ error }: { error: Error | null }) => (
  <Card className="p-6 max-w-2xl mx-auto mt-8">
    <div className="text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
      <p className="text-gray-600 mb-4">
        Impossible de charger vos informations utilisateur.
      </p>
      {error && (
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-gray-500 mb-2">
            Détails techniques
          </summary>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      <Button onClick={() => window.location.reload()} className="mt-4">
        Réessayer
      </Button>
    </div>
  </Card>
));

ErrorState.displayName = 'ErrorState';

/**
 * Widget de bienvenue personnalisé
 */
const WelcomeWidget = memo(({ user }: { user: any }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="col-span-12 lg:col-span-8"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f] border-0 shadow-2xl">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/80 text-lg mb-2"
              >
                {greeting}, {user?.firstName} !
              </motion.p>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-4 drop-shadow-lg"
              >
                Tableau de bord - Direction
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 text-white/90"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm capitalize">{currentDate}</span>
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Award className="h-3 w-3 mr-1" />
                  Proviseur
                </Badge>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden sm:block"
            >
              <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                <Activity className="h-10 w-10 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

WelcomeWidget.displayName = 'WelcomeWidget';

/**
 * Widget école moderne
 */
const SchoolInfoWidget = memo(({ user }: { user: any }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="col-span-12 lg:col-span-4"
  >
    <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">MON ÉCOLE</h3>
            <p className="text-sm text-gray-600">Informations générales</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">
              {user?.school?.name || 'Charles Zackama de sembé'}
            </h4>
            <p className="text-sm text-gray-600">
              {user?.school?.type || 'Sembé Eh École terminale'}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
            <span className="text-sm text-gray-600">Statut</span>
            <Badge className="bg-green-100 text-green-700">
              Actif
            </Badge>
          </div>
        </div>
        
        <Button 
          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          size="sm"
        >
          Voir détails
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  </motion.div>
));

SchoolInfoWidget.displayName = 'SchoolInfoWidget';

/**
 * Accès rapide aux actions
 */
const QuickActionsWidget = memo(() => {
  const { modules } = useUserModulesContext();

  const quickActions = useMemo(() => {
    const actions = [
      { 
        icon: MessageSquare, 
        label: 'Messages', 
        path: '/user/messages', 
        color: 'from-green-500 to-green-600',
        description: '3 nouveaux'
      },
      { 
        icon: Calendar, 
        label: 'Planning', 
        path: '/user/schedule', 
        color: 'from-purple-500 to-purple-600',
        description: 'Aujourd\'hui'
      },
      { 
        icon: BarChart3, 
        label: 'Rapports', 
        path: '/user/reports', 
        color: 'from-orange-500 to-orange-600',
        description: 'Mensuel'
      },
      { 
        icon: Bell, 
        label: 'Alertes', 
        path: '/user/notifications', 
        color: 'from-red-500 to-red-600',
        description: '2 critiques'
      },
    ];

    // Ajouter des modules si disponibles
    if (modules?.length > 0) {
      const moduleActions = modules.slice(0, 2).map(module => ({
        icon: DollarSign, // Icône par défaut, à adapter selon le module
        label: module.name,
        path: `/user/modules/${module.slug}`,
        color: 'from-[#2A9D8F] to-[#238b7e]',
        description: 'Module'
      }));
      actions.splice(2, 0, ...moduleActions);
    }

    return actions.slice(0, 6);
  }, [modules]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="col-span-12"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Actions rapides</h2>
        <Button variant="ghost" size="sm" className="text-[#2A9D8F]">
          Tout voir
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.a
              key={action.label}
              href={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </Card>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';

/**
 * Widget activité récente
 */
const RecentActivityWidget = memo(() => {
  const activities = [
    { icon: Users, text: 'Nouvel enseignant ajouté', time: 'Il y a 2h', color: 'text-blue-600' },
    { icon: BookOpen, text: '3 nouvelles classes créées', time: 'Il y a 4h', color: 'text-green-600' },
    { icon: DollarSign, text: 'Paiement reçu - 150,000 FCFA', time: 'Il y a 6h', color: 'text-purple-600' },
    { icon: Bell, text: 'Réunion programmée', time: 'Hier', color: 'text-orange-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="col-span-12 lg:col-span-6"
    >
      <Card className="h-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#2A9D8F]" />
              Activité récente
            </h3>
            <Button variant="ghost" size="sm">
              Tout voir
            </Button>
          </div>
          
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

RecentActivityWidget.displayName = 'RecentActivityWidget';

/**
 * Dashboard Proviseur/Directeur PARFAIT
 */
const PerfectProvisionerDashboard = memo(() => {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-8 pb-8">
      {/* Grille principale */}
      <div className="grid grid-cols-12 gap-6">
        {/* Widget de bienvenue */}
        <WelcomeWidget user={user} />
        
        {/* Info école */}
        <SchoolInfoWidget user={user} />
      </div>

      {/* Alertes critiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
          <SchoolAlerts />
        </Suspense>
      </motion.div>

      {/* KPIs de l'école */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2A9D8F]" />
            Indicateurs clés
          </h2>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        }>
          <SchoolWidgets />
        </Suspense>
      </motion.div>

      {/* Grille actions + activité */}
      <div className="grid grid-cols-12 gap-6">
        <QuickActionsWidget />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <RecentActivityWidget />
        
        {/* Espace pour un autre widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="col-span-12 lg:col-span-6"
        >
          <Card className="h-full p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques rapides</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux de présence</span>
                <span className="font-semibold text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Notes moyennes</span>
                <span className="font-semibold text-blue-600">14.2/20</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfaction parents</span>
                <span className="font-semibold text-purple-600">4.8/5</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modules disponibles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <AvailableModules />
        </Suspense>
      </motion.div>
    </div>
  );
});

PerfectProvisionerDashboard.displayName = 'PerfectProvisionerDashboard';

/**
 * Composant principal UserDashboard PARFAIT
 */
export const UserDashboardPerfect = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  // État de chargement
  if (isLoading) {
    return <LoadingState />;
  }

  // État d'erreur
  if (error || !user) {
    return <ErrorState error={error} />;
  }

  // Dashboard PROVISEUR/DIRECTEUR
  if (['proviseur', 'directeur', 'directeur_etudes'].includes(user.role)) {
    return <PerfectProvisionerDashboard />;
  }

  // Pour les autres rôles, retourner le dashboard parfait aussi
  return <PerfectProvisionerDashboard />;
};
