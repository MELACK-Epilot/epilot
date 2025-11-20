/**
 * Hook pour mutations avec Rate Limiting côté client
 * Première ligne de défense avant même d'appeler l'API
 * @module useRateLimitedMutation
 */

import { useState, useCallback } from 'react';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  action: string;
}

interface RateLimitState {
  requests: number[];
  isLimited: boolean;
  resetAt: number | null;
}

/**
 * Hook pour limiter les mutations côté client
 * Empêche les requêtes excessives avant même d'appeler l'API
 */
export const useRateLimitedMutation = <TData = unknown, TVariables = void, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: RateLimitConfig,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) => {
  const [state, setState] = useState<RateLimitState>({
    requests: [],
    isLimited: false,
    resetAt: null,
  });

  // Fonction pour vérifier et mettre à jour le rate limit
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Nettoyer les anciennes requêtes (hors de la fenêtre)
    const recentRequests = state.requests.filter(
      time => now - time < config.windowMs
    );
    
    // Vérifier si la limite est atteinte
    if (recentRequests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetAt = oldestRequest + config.windowMs;
      const waitTimeMs = resetAt - now;
      const waitTimeSec = Math.ceil(waitTimeMs / 1000);
      
      setState({
        requests: recentRequests,
        isLimited: true,
        resetAt,
      });
      
      // Afficher un toast informatif
      toast.error('⏱️ Trop de requêtes', {
        description: `Action: ${config.action}\nLimite: ${config.maxRequests} par ${Math.ceil(config.windowMs / 1000)}s\nRéessayez dans ${waitTimeSec}s`,
        duration: 5000,
      });
      
      return false;
    }
    
    // Ajouter la requête actuelle
    setState({
      requests: [...recentRequests, now],
      isLimited: false,
      resetAt: null,
    });
    
    return true;
  }, [state.requests, config]);

  // Wrapper de la mutation avec vérification du rate limit
  const rateLimitedMutationFn = useCallback(
    async (variables: TVariables): Promise<TData> => {
      // Vérifier le rate limit avant d'appeler l'API
      if (!checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }
      
      // Appeler la fonction de mutation originale
      return mutationFn(variables);
    },
    [mutationFn, checkRateLimit]
  );

  // Utiliser useMutation avec la fonction wrappée
  const mutation = useMutation<TData, TError, TVariables>({
    ...options,
    mutationFn: rateLimitedMutationFn,
  });

  return {
    ...mutation,
    isRateLimited: state.isLimited,
    resetAt: state.resetAt,
    remaining: Math.max(0, config.maxRequests - state.requests.length),
  };
};

/**
 * Hook simplifié pour actions courantes
 */
export const useRateLimitedAction = <TData = unknown, TVariables = void>(
  action: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) => {
  // Configuration par défaut selon l'action
  const configs: Record<string, RateLimitConfig> = {
    // Authentification
    'auth:login': { maxRequests: 5, windowMs: 15 * 60 * 1000, action: 'Connexion' },
    'auth:reset_password': { maxRequests: 3, windowMs: 60 * 60 * 1000, action: 'Reset password' },
    
    // Création
    'create:school_group': { maxRequests: 10, windowMs: 60 * 60 * 1000, action: 'Création de groupe' },
    'create:school': { maxRequests: 50, windowMs: 60 * 60 * 1000, action: 'Création d\'école' },
    'create:user': { maxRequests: 100, windowMs: 60 * 60 * 1000, action: 'Création d\'utilisateur' },
    
    // Modification
    'update:data': { maxRequests: 50, windowMs: 60 * 1000, action: 'Modification' },
    'delete:data': { maxRequests: 20, windowMs: 60 * 60 * 1000, action: 'Suppression' },
    'bulk:action': { maxRequests: 5, windowMs: 60 * 60 * 1000, action: 'Action en masse' },
    
    // Export
    'export:csv': { maxRequests: 10, windowMs: 60 * 60 * 1000, action: 'Export CSV' },
  };

  const config = configs[action] || {
    maxRequests: 100,
    windowMs: 60 * 1000,
    action: 'Action',
  };

  return useRateLimitedMutation(mutationFn, config, options);
};
