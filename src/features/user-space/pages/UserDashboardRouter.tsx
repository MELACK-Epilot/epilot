/**
 * UserDashboardRouter - Router intelligent selon le profil d'accès
 * Affiche le dashboard approprié selon le profil de l'utilisateur
 * 
 * @module UserSpace/Pages
 */

import { memo, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';

// Lazy loading des dashboards par profil
const ChefDashboard = lazy(() => 
  import('./chef-etablissement/ChefDashboard').then(m => ({ default: m.ChefDashboard }))
);

const DefaultDashboard = lazy(() => 
  import('./UserDashboard').then(m => ({ default: m.UserDashboard }))
);

// TODO: Ajouter les autres dashboards par profil
// const ComptableDashboard = lazy(() => import('./comptable/ComptableDashboard'));
// const SecretaireDashboard = lazy(() => import('./secretaire/SecretaireDashboard'));
// const EnseignantDashboard = lazy(() => import('./enseignant/EnseignantDashboard'));

/**
 * Composant de chargement
 */
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Loader2 className="h-12 w-12 text-[#2A9D8F] animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

/**
 * Mapping des profils d'accès vers les dashboards
 */
const PROFILE_DASHBOARDS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  chef_etablissement: ChefDashboard,
  // financier_sans_suppression: ComptableDashboard,
  // administratif_basique: SecretaireDashboard,
  // enseignant_saisie_notes: EnseignantDashboard,
  // parent_consultation: ParentDashboard,
  // eleve_consultation: EleveDashboard,
};

/**
 * Mapping des rôles vers les dashboards (fallback si pas de profil)
 */
const ROLE_DASHBOARDS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  proviseur: ChefDashboard,
  directeur: ChefDashboard,
  directeur_etudes: ChefDashboard,
  // comptable: ComptableDashboard,
  // secretaire: SecretaireDashboard,
  // enseignant: EnseignantDashboard,
};

/**
 * Router de Dashboard selon le profil
 */
export const UserDashboardRouter = memo(() => {
  const { data: user, isLoading } = useCurrentUser();

  // Chargement
  if (isLoading) {
    return <LoadingFallback />;
  }

  // Déterminer le dashboard à afficher
  let DashboardComponent: React.LazyExoticComponent<React.ComponentType> = DefaultDashboard;
  let dashboardType = 'default';

  if (user) {
    // Priorité 1: Profil d'accès
    if (user.accessProfileCode && PROFILE_DASHBOARDS[user.accessProfileCode]) {
      DashboardComponent = PROFILE_DASHBOARDS[user.accessProfileCode];
      dashboardType = `profile:${user.accessProfileCode}`;
    }
    // Priorité 2: Rôle
    else if (user.role && ROLE_DASHBOARDS[user.role]) {
      DashboardComponent = ROLE_DASHBOARDS[user.role];
      dashboardType = `role:${user.role}`;
    }

    // Log pour debug
    console.log('🎯 UserDashboardRouter:', {
      userId: user.id,
      role: user.role,
      accessProfileCode: user.accessProfileCode,
      dashboardType,
    });
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardComponent />
    </Suspense>
  );
});

UserDashboardRouter.displayName = 'UserDashboardRouter';

export default UserDashboardRouter;
