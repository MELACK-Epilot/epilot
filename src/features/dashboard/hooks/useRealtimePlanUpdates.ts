/**
 * Hook Realtime pour Changements de Plan
 * Écoute les changements de plan en temps réel via Supabase Realtime
 * Invalide automatiquement le cache React Query
 * Affiche des notifications toast
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/store/auth.store';

export const useRealtimePlanUpdates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.schoolGroupId) return;

    console.log('🔔 Activation Realtime pour changements de plan');

    // 1. Écouter les changements sur la table subscriptions
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `school_group_id=eq.${user.schoolGroupId}`,
        },
        async (payload) => {
          console.log('🔄 Changement de subscription détecté:', payload);

          // Récupérer les détails du nouveau plan
          const { data: newPlan } = await supabase
            .from('subscription_plans')
            .select('name, slug')
            .eq('id', payload.new.plan_id)
            .single();

          if (newPlan) {
            // Invalider TOUS les caches liés au plan
            queryClient.invalidateQueries({ queryKey: ['school-group-modules'] });
            queryClient.invalidateQueries({ queryKey: ['school-group-categories'] });
            queryClient.invalidateQueries({ queryKey: ['school-group-plan-modules'] });
            queryClient.invalidateQueries({ queryKey: ['current-user-group'] });
            queryClient.invalidateQueries({ queryKey: ['plan-restrictions'] });

            // Notification utilisateur
            toast.success('Plan mis à jour!', {
              description: `Votre plan a été changé vers "${newPlan.name}". Les modules et catégories ont été mis à jour.`,
              duration: 8000,
            });

            console.log('✅ Cache invalidé - Nouveau plan:', newPlan.name);
          }
        }
      )
      .subscribe();

    // 2. Écouter les changements sur plan_modules
    const modulesChannel = supabase
      .channel('plan-modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'plan_modules',
        },
        (payload) => {
          console.log('📦 Changement modules du plan:', payload);

          // Invalider cache modules
          queryClient.invalidateQueries({ queryKey: ['school-group-modules'] });
          queryClient.invalidateQueries({ queryKey: ['school-group-plan-modules'] });

          toast.info('Modules mis à jour', {
            description: 'Les modules disponibles ont été mis à jour par l\'administrateur.',
            duration: 5000,
          });
        }
      )
      .subscribe();

    // 3. Écouter les changements sur plan_categories
    const categoriesChannel = supabase
      .channel('plan-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'plan_categories',
        },
        (payload) => {
          console.log('🏷️ Changement catégories du plan:', payload);

          // Invalider cache catégories
          queryClient.invalidateQueries({ queryKey: ['school-group-categories'] });

          toast.info('Catégories mises à jour', {
            description: 'Les catégories disponibles ont été mises à jour.',
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 Désactivation Realtime');
      subscriptionChannel.unsubscribe();
      modulesChannel.unsubscribe();
      categoriesChannel.unsubscribe();
    };
  }, [user?.schoolGroupId, queryClient]);
};
