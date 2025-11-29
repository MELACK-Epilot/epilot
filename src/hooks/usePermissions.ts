/**
 * Hook unifié pour gérer toutes les permissions utilisateur
 * Combine profils d'accès + modules + rôle
 * 
 * @module usePermissions
 */

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/store/auth.store';
import { 
  useProfilePermissions,
  type DomainPermissions 
} from '@/contexts/UserPermissionsProvider';

// ============================================
// TYPES
// ============================================

/** Rôles admin qui ont tous les droits */
const ADMIN_ROLES = ['super_admin', 'admin_groupe'] as const;

/** Domaines disponibles */
export type PermissionDomain = 
  | 'pedagogie'
  | 'finances'
  | 'administration'
  | 'communication'
  | 'scolarite'
  | 'rh'
  | 'vie_scolaire'
  | 'services'
  | 'securite'
  | 'documents';

/** Actions possibles */
export type PermissionAction = 'read' | 'write' | 'delete' | 'export';

/** Résultat du hook */
export interface UsePermissionsResult {
  /** L'utilisateur est-il admin ? */
  isAdmin: boolean;
  /** L'utilisateur a-t-il un profil assigné ? */
  hasProfile: boolean;
  /** Nom du profil */
  profileName: string | null;
  /** Code du profil */
  profileCode: string | null;
  /** Scope des permissions */
  scope: 'own' | 'school' | 'group' | 'platform';
  /** Chargement en cours */
  isLoading: boolean;
  /** Vérifie une permission */
  can: (domain: PermissionDomain, action: PermissionAction) => boolean;
  /** Vérifie l'accès à un domaine (read) */
  canAccess: (domain: PermissionDomain) => boolean;
  /** Récupère toutes les permissions d'un domaine */
  getPermissions: (domain: PermissionDomain) => DomainPermissions;
  /** Force le rafraîchissement */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook unifié pour les permissions
 * 
 * @example
 * ```tsx
 * const { can, canAccess, isAdmin } = usePermissions();
 * 
 * // Vérifier une permission spécifique
 * if (can('finances', 'write')) {
 *   // Peut modifier les finances
 * }
 * 
 * // Vérifier l'accès à un domaine
 * if (canAccess('pedagogie')) {
 *   // Peut voir la pédagogie
 * }
 * 
 * // Les admins ont tous les droits
 * if (isAdmin) {
 *   // Accès total
 * }
 * ```
 */
export const usePermissions = (): UsePermissionsResult => {
  const { user } = useAuth();
  const {
    profile,
    profileCode,
    isLoading,
    hasPermission,
    canAccessDomain,
    getDomainPermissions,
    getScope,
    refresh,
    hasProfile,
  } = useProfilePermissions();

  // Vérifier si l'utilisateur est admin
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    return ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number]);
  }, [user?.role]);

  // Fonction can avec fallback admin
  const can = useMemo(() => {
    return (domain: PermissionDomain, action: PermissionAction): boolean => {
      // Les admins ont tous les droits
      if (isAdmin) return true;
      
      // Sinon, vérifier le profil
      return hasPermission(domain, action);
    };
  }, [isAdmin, hasPermission]);

  // Fonction canAccess avec fallback admin
  const canAccess = useMemo(() => {
    return (domain: PermissionDomain): boolean => {
      if (isAdmin) return true;
      return canAccessDomain(domain);
    };
  }, [isAdmin, canAccessDomain]);

  // Fonction getPermissions avec fallback admin
  const getPermissions = useMemo(() => {
    return (domain: PermissionDomain): DomainPermissions => {
      if (isAdmin) {
        return { read: true, write: true, delete: true, export: true };
      }
      return getDomainPermissions(domain);
    };
  }, [isAdmin, getDomainPermissions]);

  // Scope avec fallback admin
  const scope = useMemo(() => {
    if (isAdmin) return 'platform' as const;
    return getScope();
  }, [isAdmin, getScope]);

  return {
    isAdmin,
    hasProfile,
    profileName: profile?.name_fr ?? null,
    profileCode,
    scope,
    isLoading,
    can,
    canAccess,
    getPermissions,
    refresh,
  };
};

// ============================================
// HOOKS SPÉCIALISÉS
// ============================================

/**
 * Hook pour vérifier une permission spécifique
 */
export const useCan = (domain: PermissionDomain, action: PermissionAction): boolean => {
  const { can } = usePermissions();
  return can(domain, action);
};

/**
 * Hook pour vérifier l'accès à un domaine
 */
export const useCanAccess = (domain: PermissionDomain): boolean => {
  const { canAccess } = usePermissions();
  return canAccess(domain);
};

/**
 * Hook pour les permissions finances
 */
export const useFinancePermissions = () => {
  const { getPermissions, isAdmin } = usePermissions();
  return { ...getPermissions('finances'), isAdmin };
};

/**
 * Hook pour les permissions pédagogie
 */
export const usePedagogiePermissions = () => {
  const { getPermissions, isAdmin } = usePermissions();
  return { ...getPermissions('pedagogie'), isAdmin };
};

/**
 * Hook pour les permissions administration
 */
export const useAdminPermissions = () => {
  const { getPermissions, isAdmin } = usePermissions();
  return { ...getPermissions('administration'), isAdmin };
};

/**
 * Hook pour les permissions communication
 */
export const useCommunicationPermissions = () => {
  const { getPermissions, isAdmin } = usePermissions();
  return { ...getPermissions('communication'), isAdmin };
};
