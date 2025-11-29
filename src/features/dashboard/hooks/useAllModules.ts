/**
 * @deprecated Utilisez useGroupAvailableModules ou useAllSystemModules à la place
 * Ce fichier est conservé pour la rétrocompatibilité
 * 
 * IMPORTANT: useAllModules récupère TOUS les modules sans filtrer par plan
 * Pour respecter les restrictions d'abonnement, utilisez useGroupAvailableModules
 */

// Re-export depuis le nouveau fichier pour la rétrocompatibilité
export { 
  useAllSystemModules as useAllModules,
  useGroupAvailableModules,
  useAllSystemModules,
  type Module,
  type Category 
} from './useGroupAvailableModules';
