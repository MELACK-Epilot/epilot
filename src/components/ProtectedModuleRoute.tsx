/**
 * Composant pour protéger les routes selon les modules assignés
 * React 19 Best Practices + Temps Réel
 * 
 * @module ProtectedModuleRoute
 */

import { type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHasModuleRT } from '@/contexts/UserPermissionsProvider';

/**
 * Props du composant
 */
interface ProtectedModuleRouteProps {
  /** Slug du module requis */
  moduleSlug: string;
  /** Contenu à afficher si autorisé */
  children: ReactNode;
  /** Rediriger au lieu d'afficher un message (optionnel) */
  redirectTo?: string;
  /** Message personnalisé (optionnel) */
  customMessage?: string;
}

/**
 * Composant pour protéger une route selon un module assigné
 * 
 * @example
 * ```tsx
 * <ProtectedModuleRoute moduleSlug="finances">
 *   <FinancesPage />
 * </ProtectedModuleRoute>
 * ```
 */
export const ProtectedModuleRoute = ({
  moduleSlug,
  children,
  redirectTo,
  customMessage,
}: ProtectedModuleRouteProps) => {
  const hasModule = useHasModuleRT(moduleSlug);
  const navigate = useNavigate();

  // Si le module n'est pas assigné
  if (!hasModule) {
    // Option 1 : Redirection
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Option 2 : Message d'erreur élégant
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-2xl border-2 border-orange-200">
            {/* Icône */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-4">
                  <Lock className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            {/* Titre */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Module non accessible
            </h2>

            {/* Message */}
            <p className="text-center text-gray-600 mb-2">
              {customMessage || (
                <>
                  Le module <span className="font-semibold text-orange-600">"{moduleSlug}"</span> ne vous a pas été assigné.
                </>
              )}
            </p>

            <p className="text-center text-sm text-gray-500 mb-6">
              Contactez votre administrateur de groupe pour obtenir l'accès à ce module.
            </p>

            {/* Informations supplémentaires */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Pourquoi ce message ?</p>
                  <p className="text-gray-600">
                    Votre accès aux modules est géré par votre administrateur. 
                    Seuls les modules qui vous ont été assignés sont accessibles.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/user')}
                className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
              
              <Button
                onClick={() => navigate('/user/modules')}
                variant="outline"
                className="flex-1"
              >
                Voir mes modules
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Si autorisé, afficher le contenu
  return <>{children}</>;
};

/**
 * Hook pour vérifier plusieurs modules (au moins un requis)
 */
interface ProtectedMultiModuleRouteProps {
  /** Slugs des modules (au moins un requis) */
  moduleSlugs: string[];
  /** Contenu à afficher si autorisé */
  children: ReactNode;
  /** Rediriger au lieu d'afficher un message (optionnel) */
  redirectTo?: string;
  /** Exiger tous les modules au lieu d'un seul (optionnel) */
  requireAll?: boolean;
}

/**
 * Composant pour protéger une route selon plusieurs modules
 * Par défaut, au moins UN module est requis
 * 
 * @example
 * ```tsx
 * <ProtectedMultiModuleRoute moduleSlugs={['finances', 'comptabilite']}>
 *   <FinancesPage />
 * </ProtectedMultiModuleRoute>
 * ```
 */
export const ProtectedMultiModuleRoute = ({
  moduleSlugs,
  children,
  redirectTo,
  requireAll = false,
}: ProtectedMultiModuleRouteProps) => {
  const navigate = useNavigate();

  // Vérifier chaque module
  const moduleChecks = moduleSlugs.map(slug => ({
    slug,
    hasAccess: useHasModuleRT(slug),
  }));

  // Déterminer si l'accès est autorisé
  const hasAccess = requireAll
    ? moduleChecks.every(m => m.hasAccess)
    : moduleChecks.some(m => m.hasAccess);

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    const missingModules = moduleChecks
      .filter(m => !m.hasAccess)
      .map(m => m.slug)
      .join(', ');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-2xl border-2 border-orange-200">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-4">
                  <Lock className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Modules requis manquants
            </h2>

            <p className="text-center text-gray-600 mb-6">
              {requireAll ? (
                <>Vous devez avoir accès à <span className="font-semibold">tous</span> ces modules :</>
              ) : (
                <>Vous devez avoir accès à <span className="font-semibold">au moins un</span> de ces modules :</>
              )}
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Modules requis :</p>
              <ul className="space-y-1">
                {moduleChecks.map(({ slug, hasAccess }) => (
                  <li key={slug} className="flex items-center gap-2 text-sm">
                    <span className={hasAccess ? 'text-green-600' : 'text-orange-600'}>
                      {hasAccess ? '✓' : '✗'}
                    </span>
                    <span className={hasAccess ? 'text-gray-600' : 'text-gray-900 font-medium'}>
                      {slug}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/user')}
                className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              
              <Button
                onClick={() => navigate('/user/modules')}
                variant="outline"
                className="flex-1"
              >
                Mes modules
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
