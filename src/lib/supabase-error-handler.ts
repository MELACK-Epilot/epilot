/**
 * Gestionnaire d'erreurs Supabase centralisé
 * Gère les erreurs 403, 401, et autres erreurs d'authentification
 * @module supabase-error-handler
 */

import { showAuthError } from '@/components/ui/error-toast';

/**
 * Vérifie si une erreur est une erreur d'authentification
 */
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status || error?.statusCode || 0;
  
  // Erreurs HTTP d'authentification
  if (errorStatus === 401 || errorStatus === 403) {
    return true;
  }
  
  // Messages d'erreur Supabase Auth
  if (
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('session') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('not authenticated')
  ) {
    return true;
  }
  
  return false;
};

/**
 * Gère une erreur d'authentification
 * Affiche un toast et redirige vers la page de connexion
 */
export const handleAuthError = (error?: any) => {
  // Afficher le toast d'erreur
  showAuthError('Votre session a expiré. Redirection vers la page de connexion...');
  
  // Log en développement
  if (import.meta.env.DEV) {
    console.error('🔒 Erreur d\'authentification détectée:', {
      error,
      status: error?.status || error?.statusCode,
      message: error?.message,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Nettoyer le localStorage
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-refresh-token');
  
  // Rediriger vers la page de connexion après 2 secondes
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
};

/**
 * Intercepteur pour les requêtes Supabase
 * À utiliser dans les hooks React Query
 */
export const handleSupabaseError = (error: any) => {
  // Vérifier si c'est une erreur d'authentification
  if (isAuthError(error)) {
    handleAuthError(error);
    throw error; // Re-throw pour que React Query puisse gérer l'état
  }
  
  // Pour les autres erreurs, les laisser passer
  throw error;
};

/**
 * Wrapper pour les requêtes Supabase avec gestion d'erreur automatique
 */
export const withAuthErrorHandling = async <T>(
  queryFn: () => Promise<T>
): Promise<T> => {
  try {
    return await queryFn();
  } catch (error) {
    handleSupabaseError(error);
    throw error; // Ne sera jamais atteint si c'est une erreur auth
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 * Redirige vers login si non authentifié
 */
export const requireAuth = () => {
  const authStorage = localStorage.getItem('auth-storage');
  
  if (!authStorage) {
    handleAuthError();
    return false;
  }
  
  try {
    const auth = JSON.parse(authStorage);
    if (!auth?.state?.isAuthenticated || !auth?.state?.token) {
      handleAuthError();
      return false;
    }
    return true;
  } catch {
    handleAuthError();
    return false;
  }
};
