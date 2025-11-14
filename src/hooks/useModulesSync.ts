/**
 * Hook pour synchroniser les modules et catégories en temps réel
 * Invalide automatiquement les caches React Query
 * @module useModulesSync
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModulesStore } from '@/stores/modules.store';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour synchroniser les modules en temps réel
 * - Charge les modules et catégories au montage
 * - S'abonne aux changements Realtime
 * - Invalide les caches React Query
 * - Affiche des notifications toast
 */
export function useModulesSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const loadAll = useModulesStore((state) => state.loadAll);
  const subscribeToChanges = useModulesStore((state) => state.subscribeToChanges);
  const unsubscribeFromChanges = useModulesStore((state) => state.unsubscribeFromChanges);

  useEffect(() => {
    console.log('🚀 [useModulesSync] Initialisation...');

    // 1. Charger les données initiales
    loadAll();

    // 2. S'abonner aux changements Realtime
    subscribeToChanges();

    // 3. Écouter les changements du store pour invalider les caches
    const unsubscribeModules = useModulesStore.subscribe(
      (state) => state.modules,
      (modules, previousModules) => {
        if (modules.length !== previousModules.length || 
            JSON.stringify(modules) !== JSON.stringify(previousModules)) {
          
          console.log('🔄 [useModulesSync] Modules changés, invalidation des caches...');
          
          // Invalider tous les caches liés aux modules
          queryClient.invalidateQueries({ queryKey: ['modules'] });
          queryClient.invalidateQueries({ queryKey: ['user-modules'] });
          queryClient.invalidateQueries({ queryKey: ['available-modules'] });
          
          // Notification utilisateur (seulement si ce n'est pas le chargement initial)
          if (previousModules.length > 0) {
            toast({
              title: "📦 Modules mis à jour",
              description: "Les modules ont été actualisés automatiquement",
              duration: 3000,
            });
          }
        }
      }
    );

    const unsubscribeCategories = useModulesStore.subscribe(
      (state) => state.categories,
      (categories, previousCategories) => {
        if (categories.length !== previousCategories.length || 
            JSON.stringify(categories) !== JSON.stringify(previousCategories)) {
          
          console.log('🔄 [useModulesSync] Catégories changées, invalidation des caches...');
          
          // Invalider tous les caches liés aux catégories
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['business-categories'] });
          
          // Notification utilisateur (seulement si ce n'est pas le chargement initial)
          if (previousCategories.length > 0) {
            toast({
              title: "📁 Catégories mises à jour",
              description: "Les catégories ont été actualisées automatiquement",
              duration: 3000,
            });
          }
        }
      }
    );

    // Cleanup
    return () => {
      console.log('🔌 [useModulesSync] Nettoyage...');
      unsubscribeFromChanges();
      unsubscribeModules();
      unsubscribeCategories();
    };
  }, [loadAll, subscribeToChanges, unsubscribeFromChanges, queryClient, toast]);
}
