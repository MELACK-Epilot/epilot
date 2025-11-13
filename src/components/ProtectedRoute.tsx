/**
 * Composant de protection des routes selon le rôle
 * React 19 - Best Practices
 * Utilise la configuration centralisée des rôles
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { normalizeRole, getRoleLabel } from '@/config/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // 🔍 DEBUG: Logs de vérification
  console.log('🛡️ ProtectedRoute Check:', {
    path: window.location.pathname,
    user: user ? `${user.email} (${user.role})` : 'absent',
    isAuthenticated,
    isLoading,
    hasToken: !!localStorage.getItem('auth-token'),
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2A9D8F] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Normaliser le rôle de l'utilisateur
  const normalizedUserRole = normalizeRole(user.role);
  
  // Normaliser AUSSI les rôles autorisés pour cohérence
  const normalizedAllowedRoles = roles?.map(r => normalizeRole(r)) || [];
  
  // Check roles if specified
  if (roles && !normalizedAllowedRoles.includes(normalizedUserRole)) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              Rôle requis: {normalizedAllowedRoles.map(r => getRoleLabel(r)).join(' ou ')}
              <br />
              Votre rôle: {getRoleLabel(normalizedUserRole)}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
}
