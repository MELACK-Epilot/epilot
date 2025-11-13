/**
 * HOC pour protéger l'accès aux modules selon les permissions
 */

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';
import { useHasModuleAccess } from '../hooks/useUserModules';
import { useNavigate } from 'react-router-dom';

interface ProtectedModuleProps {
  moduleSlug: string;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const ProtectedModule = ({
  moduleSlug,
  children,
  fallback,
  showFallback = true,
}: ProtectedModuleProps) => {
  const { hasAccess, isLoading } = useHasModuleAccess(moduleSlug);
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

  // Access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied - Custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Access denied - Default fallback
  if (showFallback) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès Restreint
          </h2>

          <p className="text-gray-600 mb-6">
            Vous n'avez pas accès à ce module. Contactez votre administrateur de groupe pour obtenir les permissions nécessaires.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Module requis : {moduleSlug}
                </p>
                <p className="text-xs text-amber-700">
                  Ce module doit vous être assigné par un administrateur pour y accéder.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/user')}
              className="flex-1"
            >
              Retour au Dashboard
            </Button>
            <Button
              onClick={() => navigate('/user/profile')}
              className="flex-1 bg-[#2A9D8F] hover:bg-[#238276]"
            >
              Mon Profil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // No fallback - return null
  return null;
};

/**
 * Hook helper pour vérifier l'accès avant navigation
 */
export const useRequireModuleAccess = (moduleSlug: string) => {
  const { hasAccess, isLoading } = useHasModuleAccess(moduleSlug);
  const navigate = useNavigate();

  const checkAccess = () => {
    if (!isLoading && !hasAccess) {
      navigate('/user');
      return false;
    }
    return hasAccess;
  };

  return { hasAccess, isLoading, checkAccess };
};
