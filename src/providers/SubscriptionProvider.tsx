/**
 * Provider principal pour le système d'abonnement temps réel
 * Intégration complète dans l'application
 */

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/store/auth.store';
import { useSubscriptionStore } from '@/stores/subscription.store';
import { SubscriptionSyncProvider } from '@/lib/subscription-sync.middleware';
import { SubscriptionNotifications } from '@/components/notifications/SubscriptionNotifications';
import { supabase } from '@/lib/supabase';

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

/**
 * Provider principal à intégrer au niveau racine de l'app
 */
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { setCurrentSubscription, setAvailablePlans } = useSubscriptionStore();

  /**
   * Initialisation de l'abonnement au montage
   */
  useEffect(() => {
    const initializeSubscription = async () => {
      if (!user?.schoolGroupId) return;

      try {
        // Charger l'abonnement actuel
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select(`
            *,
            subscription_plans:plan_id(*)
          `)
          .eq('school_group_id', user.schoolGroupId)
          .eq('status', 'active')
          .single();

        if (subscription) {
          setCurrentSubscription(subscription as any);
        }

        // Charger les plans disponibles
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('status', 'active')
          .order('price');

        if (plans) {
          setAvailablePlans(plans as any);
        }

      } catch (error) {
        console.error('Erreur initialisation abonnement:', error);
      }
    };

    initializeSubscription();
  }, [user?.schoolGroupId, setCurrentSubscription, setAvailablePlans]);

  return (
    <SubscriptionSyncProvider schoolGroupId={user?.schoolGroupId}>
      {children}
      <SubscriptionNotifications schoolGroupId={user?.schoolGroupId} />
    </SubscriptionSyncProvider>
  );
};
