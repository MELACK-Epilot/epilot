/**
 * Dashboard Proviseur MODERNE - Version Premium
 * Design niveau mondial avec glassmorphism et animations
 * React 19 Best Practices
 * 
 * @module UserDashboardModern
 */

import { memo, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Loader2,
  Sparkles,
  TrendingUp,
  Calendar,
  Bell,
  ArrowRight,
  Activity,
  Users,
  BookOpen,
  DollarSign,
  Award,
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
 * Header moderne avec gradient et informations utilisateur
 */
const ModernHeader = memo(({ user }: { user: any }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f] p-8 shadow-2xl"
    >
      {/* Cercles décoratifs animés */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Salutation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4"
            >
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-white/80 text-lg font-medium">{greeting}</span>
            </motion.div>

            {/* Nom utilisateur */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg"
            >
              {user?.firstName} {user?.lastName}
            </motion.h1>

            {/* Rôle et école */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 text-white/90"
            >
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-4 py-1.5">
                <Award className="h-3.5 w-3.5 mr-1.5" />
                {user?.role === 'proviseur' ? 'Proviseur' : 'Directeur'}
              </Badge>
              <span className="text-sm font-medium">
                {user?.school?.name || 'École'}
              </span>
            </motion.div>
          </div>

          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <Calendar className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Date et heure */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center gap-2 text-white/70 text-sm"
        >
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </motion.div>
      </div>
    </motion.div>
  );
});

ModernHeader.displayName = 'ModernHeader';

/**
 * Section Accès rapide aux modules
 */
const QuickAccessModules = memo(() => {
  const { modules } = useUserModulesContext();

  const quickAccessItems = useMemo(() => {
    const moduleIcons: Record<string, any> = {
      finances: { icon: DollarSign, color: 'from-green-500 to-green-600', path: '/user/finances' },
      classes: { icon: BookOpen, color: 'from-blue-500 to-blue-600', path: '/user/classes' },
      personnel: { icon: Users, color: 'from-purple-500 to-purple-600', path: '/user/staff' },
      eleves: { icon: Activity, color: 'from-orange-500 to-orange-600', path: '/user/students' },
    };

    return modules
      ?.filter(m => moduleIcons[m.slug])
      .slice(0, 4)
      .map(m => ({
        ...m,
        ...moduleIcons[m.slug],
      })) || [];
  }, [modules]);

  if (quickAccessItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Accès rapide</h2>
        <Button variant="ghost" size="sm" className="text-[#2A9D8F]">
          Voir tout
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickAccessItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.a
              key={item.id}
              href={item.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#2A9D8F] group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#2A9D8F] transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.description}
                </p>
              </Card>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
});

QuickAccessModules.displayName = 'QuickAccessModules';

/**
 * Dashboard Proviseur/Directeur MODERNE
 */
const ModernProvisionerDashboard = memo(() => {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-8 pb-8">
      {/* Header moderne */}
      <ModernHeader user={user} />

      {/* Alertes critiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
          <SchoolAlerts />
        </Suspense>
      </motion.div>

      {/* KPIs de l'école */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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

      {/* Accès rapide */}
      <QuickAccessModules />

      {/* Modules disponibles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <AvailableModules />
        </Suspense>
      </motion.div>
    </div>
  );
});

ModernProvisionerDashboard.displayName = 'ModernProvisionerDashboard';

/**
 * Composant principal UserDashboard MODERNE
 */
export const UserDashboardModern = () => {
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
    return <ModernProvisionerDashboard />;
  }

  // Pour les autres rôles, retourner le dashboard par défaut
  return <ModernProvisionerDashboard />;
};
