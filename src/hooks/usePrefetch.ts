/**
 * Hook pour le prefetching de données
 * Améliore l'UX en chargeant les données avant qu'elles soient nécessaires
 * @module usePrefetch
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePrefetchOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  delay?: number;
}

/**
 * Hook pour prefetch une requête
 * Utile pour charger la page suivante en avance
 */
export function usePrefetch<T>({
  queryKey,
  queryFn,
  enabled = true,
  delay = 0,
}: UsePrefetchOptions<T>) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [queryClient, queryKey, queryFn, enabled, delay]);
}

/**
 * Hook pour prefetch plusieurs requêtes
 */
export function usePrefetchMultiple<T>(
  queries: UsePrefetchOptions<T>[],
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    queries.forEach(({ queryKey, queryFn, delay = 0 }) => {
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 5 * 60 * 1000,
        });
      }, delay);
    });
  }, [queryClient, queries, enabled]);
}

/**
 * Hook pour prefetch au hover
 * Charge les données quand l'utilisateur survole un élément
 */
export function usePrefetchOnHover<T>({
  queryKey,
  queryFn,
}: Omit<UsePrefetchOptions<T>, 'enabled' | 'delay'>) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
    });
  };

  return { onMouseEnter: prefetch };
}
