/**
 * Système d'alertes professionnel et moderne
 * Utilise Sonner pour des notifications élégantes
 * @module alerts
 */

import { toast, type ExternalToast } from 'sonner';

/**
 * Durée par défaut des alertes (en ms)
 */
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 5000;
const WARNING_DURATION = 4000;

/**
 * Interface pour les options d'alerte (compatible Sonner)
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

/**
 * Convertit nos options en options Sonner avec types corrects
 */
const toSonnerOptions = (options?: AlertOptions): ExternalToast => {
  if (!options) return {};
  
  const sonnerOpts: ExternalToast = {
    duration: options.duration,
  };
  
  // Wrapper pour convertir notre onClick simple en onClick Sonner
  if (options.action) {
    sonnerOpts.action = {
      label: options.action.label,
      onClick: () => options.action?.onClick(),
    };
  }
  
  if (options.cancel) {
    sonnerOpts.cancel = {
      label: options.cancel.label,
      onClick: () => options.cancel?.onClick?.(),
    };
  }
  
  return sonnerOpts;
};

// ============================================================================
// ALERTES GÉNÉRIQUES
// ============================================================================

/**
 * Alerte de succès
 */
export const showSuccess = (message: string, options?: AlertOptions) => {
  const sonnerOpts = toSonnerOptions(options);
  toast.success(options?.title || 'Succès', {
    description: message,
    duration: options?.duration || DEFAULT_DURATION,
    ...sonnerOpts,
  });
};

/**
 * Alerte d'erreur
 */
export const showError = (message: string, options?: AlertOptions) => {
  const sonnerOpts = toSonnerOptions(options);
  toast.error(options?.title || 'Erreur', {
    description: message,
    duration: options?.duration || ERROR_DURATION,
    ...sonnerOpts,
  });
};

/**
 * Alerte d'avertissement
 */
export const showWarning = (message: string, options?: AlertOptions) => {
  const sonnerOpts = toSonnerOptions(options);
  toast.warning(options?.title || 'Attention', {
    description: message,
    duration: options?.duration || WARNING_DURATION,
    ...sonnerOpts,
  });
};

/**
 * Alerte d'information
 */
export const showInfo = (message: string, options?: AlertOptions) => {
  const sonnerOpts = toSonnerOptions(options);
  toast.info(options?.title || 'Information', {
    description: message,
    duration: options?.duration || DEFAULT_DURATION,
    ...sonnerOpts,
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
 * Email déjà utilisé - avec détails sur l'utilisateur existant
 */
export const alertEmailAlreadyExists = (email: string, userName?: string, status?: string) => {
  const statusText = status === 'active' ? '(compte actif)' : 
                     status === 'inactive' ? '(compte inactif)' : 
                     status === 'suspended' ? '(compte suspendu)' : '';
  
  const userInfo = userName ? `par "${userName}" ${statusText}` : '';
  
  showError(
    `L'adresse email "${email}" est déjà utilisée ${userInfo}. Choisissez une autre adresse ou réactivez le compte existant.`,
    {
      title: '⚠️ Email déjà utilisé',
      duration: 8000,
      action: {
        label: 'Voir les utilisateurs',
        onClick: () => {
          window.location.href = `/dashboard/users?search=${encodeURIComponent(email)}`;
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
 * Note: toast.promise retourne un ID, pas la promesse elle-même
 */
export const alertPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> => {
  // toast.promise affiche le toast mais retourne un ID
  // On retourne la promesse originale pour permettre le chaînage
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
  
  return promise;
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
