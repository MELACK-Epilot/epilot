/**
 * Middleware de synchronisation temps réel pour les abonnements
 * Gère WebSocket + Polling intelligent + React 19 optimizations
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscriptionStore } from '@/stores/subscription.store';
import { supabase } from '@/lib/supabase';

// Configuration du système de synchronisation
const SYNC_CONFIG = {
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  POLLING_INTERVAL: 30000, // 30 secondes
  FAST_POLLING_INTERVAL: 5000, // 5 secondes (mode rapide)
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
};

/**
 * Types pour les événements de synchronisation
 */
export interface SyncEvent {
  type: 'subscription_updated' | 'plan_changed' | 'modules_updated';
  school_group_id: string;
  data: any;
  timestamp: string;
}

/**
 * Hook principal de synchronisation
 * Utilise les bonnes pratiques React 19
 */
export const useSubscriptionSync = (schoolGroupId?: string) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    forceRefresh,
    startSync,
    stopSync,
  } = useSubscriptionStore();

  /**
   * Gestionnaire d'événements WebSocket optimisé
   */
  const handleWebSocketMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const syncEvent: SyncEvent = JSON.parse(event.data);
        
        // Filtrer les événements pour ce groupe scolaire
        if (syncEvent.school_group_id !== schoolGroupId) return;

        console.log('📡 Événement WebSocket reçu:', syncEvent.type);

        switch (syncEvent.type) {
          case 'subscription_updated':
          case 'plan_changed':
            // Mise à jour automatique du plan
            await forceRefresh(queryClient);
            break;
            
          case 'modules_updated':
            // Invalidation ciblée des modules
            await queryClient.invalidateQueries({
              queryKey: ['school-group-modules', schoolGroupId]
            });
            await queryClient.invalidateQueries({
              queryKey: ['school-group-categories', schoolGroupId]
            });
            break;
        }
      } catch (error) {
        console.error('❌ Erreur traitement WebSocket:', error);
      }
    },
    [schoolGroupId, forceRefresh, queryClient]
  );

  /**
   * Connexion WebSocket avec reconnexion automatique
   */
  const connectWebSocket = useCallback(() => {
    if (!SYNC_CONFIG.WEBSOCKET_URL || !schoolGroupId) return;

    try {
      const ws = new WebSocket(
        `${SYNC_CONFIG.WEBSOCKET_URL}?school_group_id=${schoolGroupId}`
      );

      ws.onopen = () => {
        console.log('✅ WebSocket connecté');
        connect();
        wsRef.current = ws;
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        disconnect();
        wsRef.current = null;
        
        // Reconnexion automatique
        if (reconnectAttempts < SYNC_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentative de reconnexion ${reconnectAttempts + 1}...`);
            connectWebSocket();
          }, SYNC_CONFIG.RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        disconnect();
      };

    } catch (error) {
      console.error('❌ Impossible de créer WebSocket:', error);
      // Fallback au polling
      startPolling();
    }
  }, [schoolGroupId, reconnectAttempts, handleWebSocketMessage, connect, disconnect]);

  /**
   * Polling intelligent comme fallback
   */
  const startPolling = useCallback(() => {
    if (!schoolGroupId) return;

    const poll = async () => {
      try {
        // Vérifier s'il y a eu des changements
        const { data: lastUpdate } = await supabase
          .from('subscriptions')
          .select('updated_at')
          .eq('school_group_id', schoolGroupId)
          .eq('status', 'active')
          .single();

        if (lastUpdate) {
          const lastUpdateTime = new Date(lastUpdate.updated_at);
          const lastSync = useSubscriptionStore.getState().lastSync;
          
          // Si mise à jour plus récente que la dernière sync
          if (!lastSync || lastUpdateTime > lastSync) {
            console.log('🔄 Changement détecté via polling');
            await forceRefresh(queryClient);
          }
        }
      } catch (error) {
        console.error('❌ Erreur polling:', error);
      }
    };

    // Polling initial
    poll();
    
    // Polling périodique
    pollingRef.current = setInterval(poll, SYNC_CONFIG.POLLING_INTERVAL);
    
    console.log('⏱️ Polling démarré');
  }, [schoolGroupId, forceRefresh, queryClient]);

  /**
   * Arrêt du polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log('⏹️ Polling arrêté');
    }
  }, []);

  /**
   * Nettoyage des ressources
   */
  const cleanup = useCallback(() => {
    // WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Polling
    stopPolling();
    
    // Timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    disconnect();
    stopSync();
  }, [stopPolling, disconnect, stopSync]);

  /**
   * Effet principal de synchronisation
   * Utilise les bonnes pratiques React 19
   */
  useEffect(() => {
    if (!schoolGroupId) return;

    console.log('🚀 Démarrage synchronisation pour groupe:', schoolGroupId);
    startSync();

    // Tentative WebSocket en premier
    if (SYNC_CONFIG.WEBSOCKET_URL) {
      connectWebSocket();
    } else {
      // Fallback polling si pas de WebSocket
      startPolling();
    }

    // Nettoyage à la déconnexion
    return cleanup;
  }, [schoolGroupId, connectWebSocket, startPolling, cleanup, startSync]);

  /**
   * Synchronisation manuelle
   */
  const manualSync = useCallback(async () => {
    console.log('🔄 Synchronisation manuelle...');
    await forceRefresh(queryClient);
  }, [forceRefresh, queryClient]);

  return {
    isConnected,
    manualSync,
    cleanup,
  };
};

/**
 * Hook pour surveiller les changements d'abonnement
 * Utilise useEffect stable de React 19
 */
export const useSubscriptionWatcher = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Écouter les changements dans le store
    const unsubscribe = useSubscriptionStore.subscribe(
      (state) => state.currentSubscription,
      (currentSubscription, previousSubscription) => {
        // Si le plan a changé
        if (
          currentSubscription?.plan_id !== previousSubscription?.plan_id &&
          currentSubscription?.plan_id
        ) {
          console.log('🔄 Changement de plan détecté, invalidation des caches...');
          
          // Invalidation intelligente des caches
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey[0] as string;
              return key.includes('modules') || key.includes('categories');
            },
          });
        }
      }
    );

    return unsubscribe;
  }, [queryClient]);
};

/**
 * Provider de synchronisation global
 * À utiliser au niveau racine de l'application
 */
export const SubscriptionSyncProvider: React.FC<{
  children: React.ReactNode;
  schoolGroupId?: string;
}> = ({ children, schoolGroupId }) => {
  useSubscriptionSync(schoolGroupId);
  useSubscriptionWatcher();
  
  return <>{children}</>;
};
