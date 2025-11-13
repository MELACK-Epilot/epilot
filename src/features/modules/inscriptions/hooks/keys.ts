/**
 * Query Keys pour Inscriptions
 * Centralisées selon les best practices TanStack Query
 */

export const inscriptionKeys = {
  all: ['inscriptions'] as const,
  lists: () => [...inscriptionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...inscriptionKeys.lists(), filters] as const,
  details: () => [...inscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...inscriptionKeys.details(), id] as const,
  stats: () => [...inscriptionKeys.all, 'stats'] as const,
};
