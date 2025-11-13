/**
 * Système de notifications temps réel pour les changements d'abonnement
 * Toast notifications + Status indicators
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Wifi, WifiOff } from 'lucide-react';
import { useSubscriptionStore, subscriptionSelectors } from '@/stores/subscription.store';
import { useSubscriptionSync } from '@/lib/subscription-sync.middleware';
import { toast } from 'sonner';

interface NotificationProps {
  schoolGroupId?: string;
}

/**
 * Composant principal des notifications d'abonnement
 */
export const SubscriptionNotifications: React.FC<NotificationProps> = ({
  schoolGroupId,
}) => {
  const [lastPlanId, setLastPlanId] = useState<string | null>(null);
  
  // État du store
  const currentSubscription = useSubscriptionStore((state) => state.currentSubscription);
  const isLoading = useSubscriptionStore(subscriptionSelectors.isLoading);
  const error = useSubscriptionStore(subscriptionSelectors.error);
  const lastSync = useSubscriptionStore(subscriptionSelectors.lastSync);
  
  // Synchronisation
  const { isConnected } = useSubscriptionSync(schoolGroupId);

  /**
   * Notifications pour changement de plan
   */
  useEffect(() => {
    if (currentSubscription?.plan_id && currentSubscription.plan_id !== lastPlanId) {
      if (lastPlanId) {
        // Notification de changement réussi
        toast.success('Plan mis à jour !', {
          description: `Votre plan a été changé vers "${currentSubscription.plan.name}"`,
          duration: 5000,
          action: {
            label: 'Voir les modules',
            onClick: () => window.location.href = '/mes-modules',
          },
        });
      }
      setLastPlanId(currentSubscription.plan_id);
    }
  }, [currentSubscription?.plan_id, lastPlanId]);

  /**
   * Notifications d'erreur
   */
  useEffect(() => {
    if (error) {
      toast.error('Erreur d\'abonnement', {
        description: error,
        duration: 8000,
      });
    }
  }, [error]);

  /**
   * Notifications de connexion
   */
  useEffect(() => {
    if (isConnected) {
      toast.success('Synchronisation activée', {
        description: 'Les mises à jour se feront en temps réel',
        duration: 3000,
      });
    }
  }, [isConnected]);

  return (
    <>
      {/* Indicateur de statut de synchronisation */}
      <SyncStatusIndicator 
        isConnected={isConnected}
        isLoading={isLoading}
        lastSync={lastSync}
      />
      
      {/* Notifications flottantes pour les mises à jour */}
      <AnimatePresence>
        {isLoading && (
          <LoadingNotification />
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Indicateur de statut de synchronisation
 */
interface SyncStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  lastSync: Date | null;
}

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({
  isConnected,
  isLoading,
  lastSync,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-500';
    if (isConnected) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (isLoading) return 'Synchronisation...';
    if (isConnected) return 'Temps réel actif';
    return 'Mode hors ligne';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg border p-3 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className={`h-4 w-4 ${getStatusColor()}`} />
          ) : (
            <WifiOff className={`h-4 w-4 ${getStatusColor()}`} />
          )}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t text-xs text-gray-500"
            >
              {lastSync ? (
                <div>
                  Dernière sync: {lastSync.toLocaleTimeString()}
                </div>
              ) : (
                <div>Aucune synchronisation</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

/**
 * Notification de chargement flottante
 */
const LoadingNotification = () => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-20 right-4 z-40"
  >
    <div className="bg-blue-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
      <div>
        <div className="font-medium">Mise à jour en cours...</div>
        <div className="text-sm opacity-90">Synchronisation des modules</div>
      </div>
    </div>
  </motion.div>
);
