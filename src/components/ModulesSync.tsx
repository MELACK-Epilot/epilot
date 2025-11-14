/**
 * Composant invisible pour gérer la synchronisation des modules en temps réel
 * Doit être placé au niveau racine de l'application
 * @module ModulesSync
 */

import { useModulesSync } from '@/hooks/useModulesSync';

/**
 * Composant de synchronisation des modules
 * - Charge les modules et catégories
 * - S'abonne aux changements Realtime
 * - Invalide les caches automatiquement
 * - Affiche des notifications
 * 
 * @example
 * ```tsx
 * <App>
 *   <ModulesSync />
 *   <Router>...</Router>
 * </App>
 * ```
 */
export function ModulesSync() {
  // Le hook fait tout le travail
  useModulesSync();

  // Composant invisible (ne rend rien)
  return null;
}
