/**
 * Composant Toast d'erreur professionnel
 * Affichage clair et élégant des erreurs
 * @module ErrorToast
 */

import { toast } from 'sonner';
import { XCircle, AlertTriangle, Info } from 'lucide-react';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ShowErrorToastOptions {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Affiche un toast d'erreur professionnel
 */
export const showErrorToast = ({
  title,
  message,
  severity = 'error',
  duration = 5000,
  action,
}: ShowErrorToastOptions) => {
  // Nettoyer le message (enlever "Error: Error:" en double)
  const cleanMessage = message.replace(/^Error:\s*/gi, '').trim();
  
  // Choisir l'icône selon la sévérité
  const Icon = severity === 'error' 
    ? XCircle 
    : severity === 'warning' 
    ? AlertTriangle 
    : Info;
  
  // Choisir le titre par défaut selon la sévérité
  const defaultTitle = severity === 'error'
    ? 'Erreur'
    : severity === 'warning'
    ? 'Attention'
    : 'Information';
  
  // Afficher le toast avec le bon style
  const toastFn = severity === 'error' 
    ? toast.error 
    : severity === 'warning'
    ? toast.warning
    : toast.info;
  
  toastFn(title || defaultTitle, {
    description: cleanMessage,
    duration,
    icon: <Icon className="w-5 h-5" />,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
};

/**
 * Affiche un toast d'erreur pour les erreurs de validation
 */
export const showValidationError = (message: string) => {
  showErrorToast({
    title: 'Validation échouée',
    message,
    severity: 'warning',
    duration: 4000,
  });
};

/**
 * Affiche un toast d'erreur pour les erreurs réseau
 */
export const showNetworkError = () => {
  showErrorToast({
    title: 'Erreur de connexion',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    severity: 'error',
    duration: 6000,
    action: {
      label: 'Réessayer',
      onClick: () => window.location.reload(),
    },
  });
};

/**
 * Affiche un toast d'erreur pour les erreurs d'authentification
 */
export const showAuthError = (message?: string) => {
  showErrorToast({
    title: 'Erreur d\'authentification',
    message: message || 'Votre session a expiré. Veuillez vous reconnecter.',
    severity: 'error',
    duration: 5000,
  });
};

/**
 * Affiche un toast d'erreur pour les erreurs de permission
 */
export const showPermissionError = () => {
  showErrorToast({
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    severity: 'warning',
    duration: 4000,
  });
};

/**
 * Affiche un toast d'erreur pour les erreurs de duplication
 */
export const showDuplicateError = (field: string, value: string) => {
  showErrorToast({
    title: 'Doublon détecté',
    message: `${field} "${value}" est déjà utilisé. Veuillez en choisir un autre.`,
    severity: 'warning',
    duration: 5000,
  });
};

/**
 * Parse une erreur et affiche le toast approprié
 */
export const showErrorFromException = (error: any) => {
  // Log en développement
  if (import.meta.env.DEV) {
    console.error('🚨 Exception capturée:', {
      error,
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Extraire le message
  let message = 'Une erreur inattendue est survenue';
  
  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  // Détecter le type d'erreur
  const lowerMessage = message.toLowerCase();
  
  // Erreur 403 (Forbidden) - Session expirée
  if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
    showAuthError('Votre session a expiré. Veuillez vous reconnecter.');
    // Rediriger vers la page de connexion après 2 secondes
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return;
  }
  
  // Erreur réseau
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('failed to load')) {
    showNetworkError();
    return;
  }
  
  // Erreur d'authentification
  if (lowerMessage.includes('auth') || lowerMessage.includes('token') || lowerMessage.includes('session') || lowerMessage.includes('unauthorized')) {
    showAuthError(message);
    return;
  }
  
  // Erreur de permission
  if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    showPermissionError();
    return;
  }
  
  // Erreur de validation
  if (lowerMessage.includes('invalid') || lowerMessage.includes('required') || lowerMessage.includes('must')) {
    showValidationError(message);
    return;
  }
  
  // Erreur de duplication (email déjà utilisé)
  if (lowerMessage.includes('already') || lowerMessage.includes('duplicate') || lowerMessage.includes('exists')) {
    showErrorToast({
      title: 'Doublon détecté',
      message,
      severity: 'warning',
      duration: 5000,
    });
    return;
  }
  
  // Erreur générique
  showErrorToast({
    message,
    severity: 'error',
  });
};
