/**
 * Composant de garde pour les permissions
 * Affiche le contenu uniquement si l'utilisateur a les permissions requises
 * 
 * @module PermissionGuard
 */

import { type ReactNode } from 'react';
import { usePermissions, type PermissionDomain, type PermissionAction } from '@/hooks/usePermissions';
import { AlertCircle, Lock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================
// TYPES
// ============================================

interface PermissionGuardProps {
  /** Domaine requis */
  domain: PermissionDomain;
  /** Action requise (défaut: 'read') */
  action?: PermissionAction;
  /** Contenu à afficher si autorisé */
  children: ReactNode;
  /** Contenu alternatif si non autorisé (optionnel) */
  fallback?: ReactNode;
  /** Afficher un message d'erreur si non autorisé (défaut: false) */
  showError?: boolean;
  /** Message d'erreur personnalisé */
  errorMessage?: string;
  /** Afficher un loader pendant le chargement */
  showLoader?: boolean;
}

interface MultiPermissionGuardProps {
  /** Liste des permissions requises (toutes doivent être satisfaites) */
  permissions: Array<{ domain: PermissionDomain; action: PermissionAction }>;
  /** Mode: 'all' = toutes requises, 'any' = au moins une */
  mode?: 'all' | 'any';
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
  showLoader?: boolean;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Garde de permission simple
 * 
 * @example
 * ```tsx
 * <PermissionGuard domain="finances" action="write">
 *   <FinanceEditForm />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard = ({
  domain,
  action = 'read',
  children,
  fallback,
  showError = false,
  errorMessage,
  showLoader = true,
}: PermissionGuardProps): ReactNode => {
  const { can, isLoading, profileName } = usePermissions();

  // Afficher le loader pendant le chargement
  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Vérifier la permission
  const hasPermission = can(domain, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  // Afficher le fallback ou l'erreur
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    return (
      <Alert variant="destructive" className="my-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Accès refusé</AlertTitle>
        <AlertDescription>
          {errorMessage || `Vous n'avez pas la permission "${action}" sur "${domain}".`}
          {profileName && (
            <span className="block text-xs mt-1 opacity-75">
              Profil actuel: {profileName}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

/**
 * Garde de permissions multiples
 * 
 * @example
 * ```tsx
 * <MultiPermissionGuard 
 *   permissions={[
 *     { domain: 'finances', action: 'read' },
 *     { domain: 'administration', action: 'write' }
 *   ]}
 *   mode="all"
 * >
 *   <AdminFinancePanel />
 * </MultiPermissionGuard>
 * ```
 */
export const MultiPermissionGuard = ({
  permissions,
  mode = 'all',
  children,
  fallback,
  showError = false,
  errorMessage,
  showLoader = true,
}: MultiPermissionGuardProps): ReactNode => {
  const { can, isLoading, profileName } = usePermissions();

  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Vérifier les permissions selon le mode
  const results = permissions.map(p => can(p.domain, p.action));
  const hasPermission = mode === 'all' 
    ? results.every(Boolean) 
    : results.some(Boolean);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    const missingPerms = permissions
      .filter((_, i) => !results[i])
      .map(p => `${p.domain}:${p.action}`)
      .join(', ');

    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permissions insuffisantes</AlertTitle>
        <AlertDescription>
          {errorMessage || `Permissions manquantes: ${missingPerms}`}
          {profileName && (
            <span className="block text-xs mt-1 opacity-75">
              Profil actuel: {profileName}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

/**
 * HOC pour protéger un composant entier
 * 
 * @example
 * ```tsx
 * const ProtectedFinancePage = withPermission(FinancePage, 'finances', 'read');
 * ```
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  domain: PermissionDomain,
  action: PermissionAction = 'read'
) => {
  const WrappedComponent = (props: P) => (
    <PermissionGuard domain={domain} action={action} showError>
      <Component {...props} />
    </PermissionGuard>
  );

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook pour vérifier si un élément doit être affiché
 * 
 * @example
 * ```tsx
 * const { visible, disabled } = usePermissionVisibility('finances', 'write');
 * 
 * return (
 *   <Button disabled={disabled} style={{ display: visible ? 'block' : 'none' }}>
 *     Modifier
 *   </Button>
 * );
 * ```
 */
export const usePermissionVisibility = (
  domain: PermissionDomain,
  action: PermissionAction
): { visible: boolean; disabled: boolean } => {
  const { can, canAccess } = usePermissions();
  
  return {
    visible: canAccess(domain), // Peut voir si a au moins read
    disabled: !can(domain, action), // Désactivé si n'a pas l'action spécifique
  };
};
