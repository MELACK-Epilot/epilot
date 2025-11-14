/**
 * Route protégée optimisée avec gestion des rôles et permissions
 * @module ProtectedRoute
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '@/stores/auth.store';
import { permissionManager } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { LoadingSpinner } from '@/components/LoadingState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
  requireAuth?: boolean;
  fallback?: ReactNode;
}

/**
 * Composant de route protégée
 */
export function ProtectedRouteOptimized({
  children,
  roles,
  requireAuth = true,
  fallback,
}: ProtectedRouteProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // 1. Attendre la vérification de l'authentification
  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  // 2. Vérifier l'authentification
  if (requireAuth && !isAuthenticated) {
    logger.warn('Unauthenticated access attempt', {
      path: location.pathname,
    });

    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Vérifier les rôles
  if (roles && roles.length > 0 && user) {
    const hasRequiredRole = roles.includes(user.role);

    if (!hasRequiredRole) {
      logger.warn('Unauthorized access attempt', {
        userRole: user.role,
        requiredRoles: roles,
        path: location.pathname,
      });

      // Fallback personnalisé ou page d'accès refusé
      if (fallback) {
        return <>{fallback}</>;
      }

      return <AccessDenied userRole={user.role} requiredRoles={roles} />;
    }
  }

  // 4. Autoriser l'accès
  return <>{children}</>;
}

/**
 * Page d'accès refusé
 */
function AccessDenied({
  userRole,
  requiredRoles,
}: {
  userRole: UserRole;
  requiredRoles: UserRole[];
}) {
  const goBack = () => {
    window.history.back();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Accès refusé</AlertTitle>
          <AlertDescription className="mt-2">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </AlertDescription>
        </Alert>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès non autorisé
            </h2>
            <p className="text-gray-600 mb-4">
              Cette page est réservée aux utilisateurs avec les rôles suivants :
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {requiredRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                >
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Votre rôle actuel : <strong>{getRoleLabel(userRole)}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={goBack}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={goHome}
              className="flex-1 bg-[#2A9D8F] hover:bg-[#238276]"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Obtenir le label d'un rôle
 */
function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Administrateur',
    admin_groupe: 'Administrateur de Groupe',
    proviseur: 'Proviseur',
    directeur: 'Directeur',
    enseignant: 'Enseignant',
    secretaire: 'Secrétaire',
    cpe: 'CPE',
    comptable: 'Comptable',
  };

  return labels[role] || role;
}

/**
 * Hook pour vérifier si l'utilisateur a un rôle
 */
export function useHasRole(roles: UserRole[]): boolean {
  const user = useAuthStore((state) => state.user);
  return user ? roles.includes(user.role) : false;
}

/**
 * Hook pour vérifier si l'utilisateur a une permission
 */
export function useHasPermission(resource: string, action: string): boolean {
  const user = useAuthStore((state) => state.user);
  
  if (!user) return false;
  
  return permissionManager.canAccess(
    user.role,
    resource,
    action as 'view' | 'create' | 'update' | 'delete'
  );
}

/**
 * Composant pour afficher conditionnellement selon le rôle
 */
export function ShowForRoles({
  roles,
  children,
  fallback,
}: {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasRole = useHasRole(roles);

  if (hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
