/**
 * Wrapper React Query avec gestion automatique des erreurs 403
 * @module react-query-error-handler
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { handleSupabaseError, isAuthError } from './supabase-error-handler';
import { showErrorFromException } from '@/components/ui/error-toast';
import { formatError } from './error-utils';

/**
 * Configuration du QueryClient avec gestion d'erreurs automatique
 */
export const createQueryClientWithErrorHandling = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log en développement (condensé)
        if (import.meta.env.DEV) {
          console.error('🚨 Query Error:', query.queryKey[0] ?? 'unknown', formatError(error));
        }

        // Gérer les erreurs d'authentification
        if (isAuthError(error)) {
          handleSupabaseError(error);
          return;
        }

        // Pour les autres erreurs, NE PAS afficher de toast ici
        // Le toast sera géré dans le composant ou par showErrorFromException
        // Cela évite les doublons
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Log en développement (condensé)
        if (import.meta.env.DEV) {
          console.error('🚨 Mutation Error:', mutation.options.mutationKey?.[0] ?? 'unknown', formatError(error));
        }

        // Gérer les erreurs d'authentification
        if (isAuthError(error)) {
          handleSupabaseError(error);
          return;
        }

        // Pour les mutations, NE PAS afficher de toast ici
        // Le composant gère déjà l'erreur avec showErrorFromException
        // Cela évite les doublons
      },
    }),
    defaultOptions: {
      queries: {
        retry: (_failureCount, error) => {
          // Ne pas retry les erreurs d'authentification
          if (isAuthError(error)) {
            return false;
          }
          // Retry max 2 fois pour les autres erreurs
          return _failureCount < 2;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (_failureCount, error) => {
          // Ne jamais retry les mutations en cas d'erreur auth
          if (isAuthError(error)) {
            return false;
          }
          // Ne pas retry les mutations par défaut
          return false;
        },
      },
    },
  });
};

/**
 * Wrapper pour les query functions avec gestion d'erreur
 */
export const withErrorHandling = async <T>(
  queryFn: () => Promise<T>,
  context?: { queryKey?: unknown[] }
): Promise<T> => {
  try {
    return await queryFn();
  } catch (error) {
    // Log en développement
    if (import.meta.env.DEV && context?.queryKey) {
      console.error('🚨 Query Function Error:', {
        queryKey: context.queryKey,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    // Gérer les erreurs d'authentification
    if (isAuthError(error)) {
      handleSupabaseError(error);
    }

    // Re-throw pour que React Query puisse gérer l'état
    throw error;
  }
};

/**
 * Hook personnalisé pour gérer les erreurs dans les composants
 */
export const useQueryErrorHandler = () => {
  const handleError = (error: unknown) => {
    if (isAuthError(error)) {
      handleSupabaseError(error);
      return;
    }
    showErrorFromException(error);
  };

  return { handleError };
};
