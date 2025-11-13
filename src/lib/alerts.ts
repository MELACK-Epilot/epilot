/**
 * Système d'alertes professionnel et moderne
 * Utilise Sonner pour des notifications élégantes
 * @module alerts
 */

import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Configuration des icônes pour chaque type d'alerte
 */
const ALERT_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Configuration des couleurs pour chaque type
 */
const ALERT_COLORS = {
  success: '#10B981', // Green
  error: '#EF4444',   // Red
  warning: '#F59E0B', // Orange
  info: '#3B82F6',    // Blue
};

/**
 * Durée par défaut des alertes (en ms)
 */
const DEFAULT_DURATION = 4000;

/**
 * Interface pour les options d'alerte
 */
interface AlertOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

// ============================================================================
// ALERTES GÉNÉRIQUES
// ============================================================================

/**
 * Alerte de succès
 */
export const showSuccess = (message: string, options?: AlertOptions) => {
  toast.success(options?.title || 'Succès', {
    description: message,
    duration: options?.duration || DEFAULT_DURATION,
    action: options?.action,
    cancel: options?.cancel,
  });
};

/**
 * Alerte d'erreur
 */
export const showError = (message: string, options?: AlertOptions) => {
  toast.error(options?.title || 'Erreur', {
    description: message,
    duration: options?.duration || 5000, // Plus long pour les erreurs
    action: options?.action,
    cancel: options?.cancel,
  });
};

/**
 * Alerte d'avertissement
 */
export const showWarning = (message: string, options?: AlertOptions) => {
  toast.warning(options?.title || 'Attention', {
    description: message,
    duration: options?.duration || DEFAULT_DURATION,
    action: options?.action,
    cancel: options?.cancel,
  });
};

/**
 * Alerte d'information
 */
export const showInfo = (message: string, options?: AlertOptions) => {
  toast.info(options?.title || 'Information', {
    description: message,
    duration: options?.duration || DEFAULT_DURATION,
    action: options?.action,
    cancel: options?.cancel,
  });
};

/**
 * Alerte de chargement (avec promesse)
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Mettre à jour une alerte de chargement
 */
export const updateLoading = (
  toastId: string | number,
  type: 'success' | 'error',
  message: string
) => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else {
    toast.error(message, { id: toastId });
  }
};

// ============================================================================
// ALERTES SPÉCIFIQUES - VALIDATION EMAIL
// ============================================================================

/**
 * Email déjà utilisé
 */
export const alertEmailAlreadyExists = (email: string) => {
  showError(
    `L'adresse email ${email} est déjà utilisée. Veuillez utiliser une autre adresse.`,
    {
      title: 'Email déjà utilisé',
      duration: 5000,
      action: {
        label: 'Connexion',
        onClick: () => {
          window.location.href = '/login';
        },
      },
    }
  );
};

/**
 * Email invalide
 */
export const alertInvalidEmail = (email: string) => {
  showError(
    `L'adresse email "${email}" n'est pas valide. Veuillez vérifier le format.`,
    {
      title: 'Email invalide',
      duration: 4000,
    }
  );
};

/**
 * Email requis
 */
export const alertEmailRequired = () => {
  showWarning('Veuillez saisir une adresse email.', {
    title: 'Email requis',
    duration: 3000,
  });
};

// ============================================================================
// ALERTES SPÉCIFIQUES - UTILISATEURS
// ============================================================================

/**
 * Utilisateur créé avec succès
 */
export const alertUserCreated = (userName: string) => {
  showSuccess(
    `L'utilisateur ${userName} a été créé avec succès. Un email de bienvenue a été envoyé.`,
    {
      title: 'Utilisateur créé',
      duration: 4000,
    }
  );
};

/**
 * Utilisateur existe déjà
 */
export const alertUserAlreadyExists = (identifier: string) => {
  showError(
    `Un utilisateur avec cet identifiant (${identifier}) existe déjà dans le système.`,
    {
      title: 'Utilisateur existant',
      duration: 5000,
    }
  );
};

/**
 * Utilisateur mis à jour
 */
export const alertUserUpdated = (userName: string) => {
  showSuccess(`Les informations de ${userName} ont été mises à jour avec succès.`, {
    title: 'Utilisateur modifié',
    duration: 3000,
  });
};

/**
 * Utilisateur supprimé
 */
export const alertUserDeleted = (userName: string) => {
  showSuccess(`L'utilisateur ${userName} a été supprimé avec succès.`, {
    title: 'Utilisateur supprimé',
    duration: 3000,
  });
};

/**
 * Erreur création utilisateur
 */
export const alertUserCreationFailed = (reason?: string) => {
  showError(
    reason || 'Une erreur est survenue lors de la création de l\'utilisateur. Veuillez réessayer.',
    {
      title: 'Échec de création',
      duration: 5000,
      action: {
        label: 'Support',
        onClick: () => {
          window.location.href = '/support';
        },
      },
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - VALIDATION FORMULAIRE
// ============================================================================

/**
 * Validation réussie
 */
export const alertValidationSuccess = (entityName: string = 'formulaire') => {
  showSuccess(`Le ${entityName} a été validé avec succès.`, {
    title: 'Validation réussie',
    duration: 3000,
  });
};

/**
 * Validation échouée
 */
export const alertValidationFailed = (errors: string[]) => {
  const errorList = errors.join(', ');
  showError(
    `Veuillez corriger les erreurs suivantes : ${errorList}`,
    {
      title: 'Validation échouée',
      duration: 6000,
    }
  );
};

/**
 * Champs requis manquants
 */
export const alertRequiredFields = (fields: string[]) => {
  const fieldList = fields.join(', ');
  showWarning(
    `Les champs suivants sont obligatoires : ${fieldList}`,
    {
      title: 'Champs requis',
      duration: 4000,
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - AUTHENTIFICATION
// ============================================================================

/**
 * Connexion réussie
 */
export const alertLoginSuccess = (userName: string) => {
  showSuccess(`Bienvenue ${userName} ! Vous êtes maintenant connecté.`, {
    title: 'Connexion réussie',
    duration: 3000,
  });
};

/**
 * Connexion échouée
 */
export const alertLoginFailed = (reason?: string) => {
  showError(
    reason || 'Email ou mot de passe incorrect. Veuillez réessayer.',
    {
      title: 'Connexion échouée',
      duration: 5000,
      action: {
        label: 'Mot de passe oublié ?',
        onClick: () => {
          window.location.href = '/forgot-password';
        },
      },
    }
  );
};

/**
 * Déconnexion
 */
export const alertLogoutSuccess = () => {
  showInfo('Vous avez été déconnecté avec succès.', {
    title: 'Déconnexion',
    duration: 3000,
  });
};

/**
 * Inscription réussie
 */
export const alertSignupSuccess = (email: string) => {
  showSuccess(
    `Votre compte a été créé avec succès. Un email de confirmation a été envoyé à ${email}.`,
    {
      title: 'Inscription réussie',
      duration: 5000,
    }
  );
};

/**
 * Mot de passe faible
 */
export const alertWeakPassword = () => {
  showWarning(
    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    {
      title: 'Mot de passe faible',
      duration: 5000,
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - LIMITATIONS PLAN
// ============================================================================

/**
 * Limite atteinte
 */
export const alertLimitReached = (
  resourceType: string,
  limit: number,
  planName: string
) => {
  showError(
    `Vous avez atteint la limite de ${limit} ${resourceType} pour le plan ${planName}.`,
    {
      title: 'Limite atteinte',
      duration: 6000,
      action: {
        label: 'Mettre à niveau',
        onClick: () => {
          window.location.href = '/dashboard/plans';
        },
      },
    }
  );
};

/**
 * Proche de la limite
 */
export const alertNearLimit = (
  resourceType: string,
  remaining: number,
  limit: number
) => {
  showWarning(
    `Attention : Il vous reste ${remaining} ${resourceType} sur ${limit} disponibles.`,
    {
      title: 'Proche de la limite',
      duration: 5000,
      action: {
        label: 'Voir les plans',
        onClick: () => {
          window.location.href = '/dashboard/plans';
        },
      },
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - OPÉRATIONS CRUD
// ============================================================================

/**
 * Création réussie
 */
export const alertCreated = (entityName: string, entityLabel: string) => {
  showSuccess(`${entityName} "${entityLabel}" créé(e) avec succès.`, {
    title: 'Création réussie',
    duration: 3000,
  });
};

/**
 * Mise à jour réussie
 */
export const alertUpdated = (entityName: string, entityLabel: string) => {
  showSuccess(`${entityName} "${entityLabel}" mis(e) à jour avec succès.`, {
    title: 'Modification réussie',
    duration: 3000,
  });
};

/**
 * Suppression réussie
 */
export const alertDeleted = (entityName: string, entityLabel: string) => {
  showSuccess(`${entityName} "${entityLabel}" supprimé(e) avec succès.`, {
    title: 'Suppression réussie',
    duration: 3000,
  });
};

/**
 * Opération échouée
 */
export const alertOperationFailed = (
  operation: string,
  entityName: string,
  reason?: string
) => {
  showError(
    reason || `Impossible de ${operation} ${entityName}. Veuillez réessayer.`,
    {
      title: `Échec de ${operation}`,
      duration: 5000,
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - RÉSEAU
// ============================================================================

/**
 * Erreur réseau
 */
export const alertNetworkError = () => {
  showError(
    'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    {
      title: 'Erreur réseau',
      duration: 5000,
      action: {
        label: 'Réessayer',
        onClick: () => {
          window.location.reload();
        },
      },
    }
  );
};

/**
 * Timeout
 */
export const alertTimeout = () => {
  showError(
    'La requête a pris trop de temps. Veuillez réessayer.',
    {
      title: 'Délai dépassé',
      duration: 5000,
    }
  );
};

// ============================================================================
// ALERTES SPÉCIFIQUES - PERMISSIONS
// ============================================================================

/**
 * Accès refusé
 */
export const alertAccessDenied = () => {
  showError(
    'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    {
      title: 'Accès refusé',
      duration: 5000,
    }
  );
};

/**
 * Session expirée
 */
export const alertSessionExpired = () => {
  showWarning(
    'Votre session a expiré. Veuillez vous reconnecter.',
    {
      title: 'Session expirée',
      duration: 5000,
      action: {
        label: 'Se reconnecter',
        onClick: () => {
          window.location.href = '/login';
        },
      },
    }
  );
};

// ============================================================================
// ALERTES AVEC PROMESSE (Pour les opérations async)
// ============================================================================

/**
 * Alerte avec promesse (affiche loading puis success/error)
 */
export const alertPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Fermer toutes les alertes
 */
export const dismissAllAlerts = () => {
  toast.dismiss();
};

/**
 * Fermer une alerte spécifique
 */
export const dismissAlert = (toastId: string | number) => {
  toast.dismiss(toastId);
};
