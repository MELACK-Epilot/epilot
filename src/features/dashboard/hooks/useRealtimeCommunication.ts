/**
 * Hook pour la synchronisation temps réel de la communication
 * Gère +500 groupes scolaires avec Supabase Realtime
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ticketsKeys } from './useTickets';
import { messagingKeys } from './useMessaging';

/**
 * Hook pour s'abonner aux changements en temps réel sur les tickets
 */
export const useRealtimeTickets = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Canal pour les tickets
    const ticketsChannel = supabase
      .channel('realtime-tickets')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('🎫 Ticket changed:', payload);
          
          // Invalider toutes les queries de tickets pour rafraîchir
          queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
        }
      )
      .subscribe();

    // Nettoyage
    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [queryClient]);
};

/**
 * Hook pour s'abonner aux changements en temps réel sur les messages
 */
export const useRealtimeMessages = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Canal pour les messages
    const messagesChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('💬 New message:', payload);
          
          // Invalider les queries de messages
          queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
          queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_recipients',
        },
        (payload) => {
          console.log('📬 Message read status changed:', payload);
          
          // Rafraîchir les stats de messagerie
          queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
        }
      )
      .subscribe();

    // Nettoyage
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [queryClient]);
};

/**
 * Hook combiné pour activer tout le temps réel
 */
export const useRealtimeCommunication = () => {
  useRealtimeTickets();
  useRealtimeMessages();
};
