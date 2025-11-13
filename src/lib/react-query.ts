/**
 * Configuration React Query (TanStack Query)
 * Optimisation du cache et des requêtes avec gestion automatique des erreurs 403
 * @module ReactQueryConfig
 */

import { createQueryClientWithErrorHandling } from './react-query-error-handler';

/**
 * Instance du QueryClient avec gestion automatique des erreurs
 * Gère automatiquement les erreurs 403 (session expirée) et redirige vers /login
 */
export const queryClient = createQueryClientWithErrorHandling();

/**
 * Query keys pour une meilleure organisation
 */
export const queryKeys = {
  // Dashboard
  dashboardStats: ['dashboard-stats'] as const,
  dashboardCharts: ['dashboard-charts'] as const,
  
  // Groupes scolaires
  schoolGroups: ['school-groups'] as const,
  schoolGroup: (id: string) => ['school-group', id] as const,
  
  // Utilisateurs
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  
  // Catégories
  categories: ['categories'] as const,
  category: (id: string) => ['category', id] as const,
  
  // Plans
  plans: ['plans'] as const,
  plan: (id: string) => ['plan', id] as const,
  
  // Abonnements
  subscriptions: ['subscriptions'] as const,
  subscription: (id: string) => ['subscription', id] as const,
  
  // Modules
  modules: ['modules'] as const,
  module: (id: string) => ['module', id] as const,
  
  // Communication
  messages: ['messages'] as const,
  message: (id: string) => ['message', id] as const,
  notifications: ['notifications'] as const,
  
  // Logs
  activityLogs: ['activity-logs'] as const,
  
  // Corbeille
  trash: ['trash'] as const,
};

/**
 * Fonction helper pour invalider plusieurs queries
 */
export const invalidateQueries = async (keys: string[][]) => {
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
};

/**
 * Fonction helper pour préfetch des données
 */
export const prefetchQuery = async <T>(
  queryKey: string[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

export default queryClient;
