/**
 * Dashboard Utilisateur École - Version Simplifiée et Moderne
 * Architecture propre avec composants réutilisables
 * 
 * @module UserDashboard
 */

import { memo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  AlertCircle,
  Calendar,
  GraduationCap,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePermissions } from '@/providers/PermissionsProvider';
import { AvailableModules } from '../components/AvailableModules';

// ============================================
// COMPOSANTS UTILITAIRES
// ============================================

/** État de chargement */
const LoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-12 w-12 text-[#2A9D8F] animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
    </div>
  </div>
));
LoadingState.displayName = 'LoadingState';

/** État d'erreur */
const ErrorState = memo(({ error, onRetry }: { error: Error | null; onRetry: () => void }) => (
  <Card className="p-8 max-w-md mx-auto mt-8 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
    <p className="text-gray-600 mb-4">
      {error?.message || 'Impossible de charger vos informations.'}
    </p>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Réessayer
    </Button>
  </Card>
));
ErrorState.displayName = 'ErrorState';

/** État sans modules */
const EmptyModulesState = memo(() => (
  <Card className="p-8 text-center border-dashed border-2 border-gray-200">
    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-700 mb-2">
      Aucun module assigné
    </h3>
    <p className="text-gray-500 max-w-md mx-auto">
      Contactez votre administrateur de groupe pour vous assigner des modules 
      et accéder aux fonctionnalités de la plateforme.
    </p>
  </Card>
));
EmptyModulesState.displayName = 'EmptyModulesState';

// ============================================
// COMPOSANTS PRINCIPAUX
// ============================================

/** En-tête avec salutation */
const WelcomeHeader = memo(({ user }: { user: { firstName: string; lastName: string; role: string } }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const date = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const roleLabels: Record<string, string> = {
    proviseur: 'Proviseur',
    directeur: 'Directeur',
    directeur_etudes: 'Directeur des Études',
    enseignant: 'Enseignant',
    comptable: 'Comptable',
    secretaire: 'Secrétaire',
    cpe: 'CPE',
    surveillant: 'Surveillant',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge className="bg-white/20 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              {roleLabels[user.role] || user.role}
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Calendar className="h-3 w-3 mr-1" />
              <span className="capitalize">{date}</span>
            </Badge>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
WelcomeHeader.displayName = 'WelcomeHeader';

/** Statistiques rapides */
const QuickStats = memo(({ modulesCount }: { modulesCount: number }) => {
  const stats = [
    { label: 'Modules actifs', value: modulesCount, color: 'text-[#2A9D8F]' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="p-4 text-center hover:shadow-md transition-shadow">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});
QuickStats.displayName = 'QuickStats';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const UserDashboard = () => {
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { modules, isLoading: modulesLoading, refreshModules } = usePermissions();

  // État de chargement
  if (userLoading || modulesLoading) {
    return <LoadingState />;
  }

  // État d'erreur
  if (userError || !user) {
    return <ErrorState error={userError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* En-tête de bienvenue */}
      <WelcomeHeader user={user} />

      {/* Statistiques rapides */}
      <QuickStats modulesCount={modules.length} />

      {/* Section Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Vos modules
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshModules}
            className="text-[#2A9D8F]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {modules.length === 0 ? (
          <EmptyModulesState />
        ) : (
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <AvailableModules />
          </Suspense>
        )}
      </div>
    </div>
  );
};

// Export par défaut pour compatibilité
export default UserDashboard;
