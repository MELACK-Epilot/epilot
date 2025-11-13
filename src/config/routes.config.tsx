/**
 * Configuration des Routes avec Lazy Loading - E-Pilot Congo
 * Chargement différé des features pour optimiser les performances
 */

import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { isFeatureEnabled } from './features.config';
import { hasPermission, RESOURCES } from './permissions.config';

// Composant de chargement
const FeatureLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-lg">Chargement du module...</span>
    </div>
  }>
    {children}
  </Suspense>
);

// Lazy loading des features principales
const SuperAdminFeature = lazy(() => 
  import('@/features/super-admin').then(module => ({
    default: module.SuperAdminDashboard || (() => <div>Super Admin en développement</div>)
  }))
);

const AdminGroupeFeature = lazy(() => 
  import('@/features/admin-groupe').then(module => ({
    default: module.GroupDashboard || (() => <div>Admin Groupe en développement</div>)
  }))
);

const UserSpaceFeature = lazy(() => 
  import('@/features/user-space').then(module => ({
    default: module.UserDashboard || (() => <div>Espace utilisateur</div>)
  }))
);

// Lazy loading des modules métier
const StudentsModule = lazy(() => 
  import('@/features/modules/students').then(module => ({
    default: module.StudentsPage || (() => <div>Module Élèves</div>)
  }))
);

const FinancialModule = lazy(() => 
  import('@/features/modules/financial').then(module => ({
    default: module.FinancialPage || (() => <div>Module Financier</div>)
  }))
);

const CommunicationModule = lazy(() => 
  import('@/features/modules/communication').then(module => ({
    default: module.CommunicationPage || (() => <div>Module Communication</div>)
  }))
);

const AnalyticsModule = lazy(() => 
  import('@/features/modules/analytics').then(module => ({
    default: module.AnalyticsPage || (() => <div>Module Analytics</div>)
  }))
);

// Composant de protection des routes
const ProtectedRoute = ({ 
  children, 
  requiredPermission,
  featureFlag,
  fallback = <div>Accès non autorisé</div>
}: {
  children: React.ReactNode;
  requiredPermission?: { resource: string; action: string };
  featureFlag?: string;
  fallback?: React.ReactNode;
}) => {
  // TODO: Intégrer avec le système d'auth réel
  const userRole = 'directeur-ecole';
  const userId = 'user-123';
  
  // Vérification des feature flags
  if (featureFlag && !isFeatureEnabled(featureFlag as any, userRole)) {
    return <>{fallback}</>;
  }
  
  // Vérification des permissions
  if (requiredPermission) {
    const hasAccess = hasPermission(
      userRole,
      requiredPermission.resource,
      requiredPermission.action as any,
      { userId }
    );
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
};

/**
 * Configuration des routes avec lazy loading et protection
 */
export const routesConfig: RouteObject[] = [
  // Route racine - Redirection intelligente selon le rôle
  {
    path: '/',
    element: <UserSpaceRedirect />,
  },
  
  // Super Admin Routes (Niveau 1)
  {
    path: '/super-admin',
    element: (
      <ProtectedRoute 
        featureFlag="SUPER_ADMIN_LEVEL"
        requiredPermission={{ resource: RESOURCES.SYSTEM_SETTINGS, action: 'read' }}
      >
        <FeatureLoader>
          <SuperAdminFeature />
        </FeatureLoader>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <FeatureLoader>
            <SuperAdminFeature />
          </FeatureLoader>
        ),
      },
      {
        path: 'system-settings',
        element: (
          <ProtectedRoute requiredPermission={{ resource: RESOURCES.SYSTEM_SETTINGS, action: 'update' }}>
            <FeatureLoader>
              <SuperAdminFeature />
            </FeatureLoader>
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // Admin Groupe Routes (Niveau 2)
  {
    path: '/admin-groupe',
    element: (
      <ProtectedRoute 
        featureFlag="ADMIN_GROUPE_LEVEL"
        requiredPermission={{ resource: RESOURCES.SCHOOLS, action: 'read' }}
      >
        <FeatureLoader>
          <AdminGroupeFeature />
        </FeatureLoader>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <FeatureLoader>
            <AdminGroupeFeature />
          </FeatureLoader>
        ),
      },
      {
        path: 'schools',
        element: (
          <ProtectedRoute requiredPermission={{ resource: RESOURCES.SCHOOLS, action: 'read' }}>
            <FeatureLoader>
              <AdminGroupeFeature />
            </FeatureLoader>
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // User Space Routes (Niveau 3)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute featureFlag="USER_SPACE_LEVEL">
        <FeatureLoader>
          <UserSpaceFeature />
        </FeatureLoader>
      </ProtectedRoute>
    ),
  },
  
  // Modules Routes
  {
    path: '/students',
    element: (
      <ProtectedRoute 
        featureFlag="STUDENT_MANAGEMENT"
        requiredPermission={{ resource: RESOURCES.STUDENTS, action: 'read' }}
      >
        <FeatureLoader>
          <StudentsModule />
        </FeatureLoader>
      </ProtectedRoute>
    ),
  },
  
  {
    path: '/financial',
    element: (
      <ProtectedRoute 
        featureFlag="FINANCIAL_MODULE"
        requiredPermission={{ resource: RESOURCES.FEES, action: 'read' }}
      >
        <FeatureLoader>
          <FinancialModule />
        </FeatureLoader>
      </ProtectedRoute>
    ),
  },
  
  {
    path: '/communication',
    element: (
      <ProtectedRoute 
        featureFlag="COMMUNICATION_MODULE"
        requiredPermission={{ resource: RESOURCES.MESSAGES, action: 'read' }}
      >
        <FeatureLoader>
          <CommunicationModule />
        </FeatureLoader>
      </ProtectedRoute>
    ),
  },
  
  {
    path: '/analytics',
    element: (
      <ProtectedRoute 
        featureFlag="ANALYTICS_MODULE"
        requiredPermission={{ resource: RESOURCES.ANALYTICS, action: 'read' }}
      >
        <FeatureLoader>
          <AnalyticsModule />
        </FeatureLoader>
      </ProtectedRoute>
    ),
  },
  
  // Route 404
  {
    path: '*',
    element: <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-600">404</h1>
      <p className="text-gray-500">Page non trouvée</p>
    </div>,
  },
];

/**
 * Composant de redirection intelligente selon le rôle
 */
const UserSpaceRedirect = () => {
  // TODO: Intégrer avec le système d'auth réel
  const userRole = 'directeur-ecole';
  
  // Redirection selon le niveau d'accès
  if (userRole === 'super-admin' && isFeatureEnabled('SUPER_ADMIN_LEVEL', userRole)) {
    window.location.href = '/super-admin/dashboard';
  } else if (userRole === 'admin-groupe' && isFeatureEnabled('ADMIN_GROUPE_LEVEL', userRole)) {
    window.location.href = '/admin-groupe/dashboard';
  } else {
    window.location.href = '/dashboard';
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-lg">Redirection...</span>
    </div>
  );
};

/**
 * Utilitaire pour générer des liens de navigation sécurisés
 */
export const getSecureNavigationLinks = (userRole: string) => {
  const links = [];
  
  // Dashboard principal
  if (isFeatureEnabled('USER_SPACE_LEVEL', userRole)) {
    links.push({ path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' });
  }
  
  // Modules selon les permissions
  if (isFeatureEnabled('STUDENT_MANAGEMENT', userRole) && 
      hasPermission(userRole, RESOURCES.STUDENTS, 'read', {})) {
    links.push({ path: '/students', label: 'Élèves', icon: 'students' });
  }
  
  if (isFeatureEnabled('FINANCIAL_MODULE', userRole) && 
      hasPermission(userRole, RESOURCES.FEES, 'read', {})) {
    links.push({ path: '/financial', label: 'Finances', icon: 'money' });
  }
  
  if (isFeatureEnabled('COMMUNICATION_MODULE', userRole) && 
      hasPermission(userRole, RESOURCES.MESSAGES, 'read', {})) {
    links.push({ path: '/communication', label: 'Communication', icon: 'message' });
  }
  
  if (isFeatureEnabled('ANALYTICS_MODULE', userRole) && 
      hasPermission(userRole, RESOURCES.ANALYTICS, 'read', {})) {
    links.push({ path: '/analytics', label: 'Analytics', icon: 'chart' });
  }
  
  // Niveaux supérieurs
  if (isFeatureEnabled('ADMIN_GROUPE_LEVEL', userRole)) {
    links.push({ path: '/admin-groupe', label: 'Gestion Groupe', icon: 'group' });
  }
  
  if (isFeatureEnabled('SUPER_ADMIN_LEVEL', userRole)) {
    links.push({ path: '/super-admin', label: 'Super Admin', icon: 'admin' });
  }
  
  return links;
};
