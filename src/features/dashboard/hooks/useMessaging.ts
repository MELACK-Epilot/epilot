// @ts-nocheck
/**
 * Hooks React Query pour la Messagerie
 * Module: Communication - Messagerie interne
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message, MessagingStats } from '../types/communication.types';

// =====================================================
// QUERY KEYS
// =====================================================

export const messagingKeys = {
  all: ['messaging'] as const,
  messages: () => [...messagingKeys.all, 'messages'] as const,
  stats: () => [...messagingKeys.all, 'stats'] as const,
};

// =====================================================
// TYPES
// =====================================================

interface SendMessageData {
  recipientIds: string[];
  subject?: string;
  content: string;
  type: 'direct' | 'group' | 'broadcast';
  attachments?: File[];
}

// =====================================================
// HOOKS - MESSAGES
// =====================================================

/**
 * Hook pour récupérer tous les messages
 */
export const useMessages = () => {
  return useQuery({
    queryKey: messagingKeys.messages(),
    queryFn: async () => {
      // Récupérer les messages avec statut de lecture
      const { data, error } = await supabase
        .from('messages_with_read_status')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        // Fallback sur messages_detailed si la vue n'existe pas encore
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('messages_detailed')
          .select('*')
          .order('sent_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        return (fallbackData || []).map((msg: any) => ({
          id: msg.id,
          subject: msg.subject || 'Sans objet',
          content: msg.content,
          senderId: msg.sender_id,
          senderName: msg.sender_name || 'Utilisateur',
          senderAvatar: msg.sender_avatar,
          senderRole: msg.sender_role || 'user',
          sentAt: msg.sent_at || msg.created_at,
          isRead: false,
          messageType: msg.message_type || 'direct',
          priority: msg.priority || 'normal',
          status: msg.status || 'sent',
          type: msg.message_type || 'direct',
          recipients: [],
          attachments: msg.metadata?.attachments || [],
        })) as Message[];
      }
      
      // Mapper les données avec le vrai statut de lecture
      return (data || []).map((msg: any) => {
        // Fallback spécial pour le Super Admin : Logo E-Pilot
        let avatar = msg.sender_avatar;
        if (!avatar && msg.sender_role === 'super_admin') {
          avatar = '/images/logo/logo.svg';
        }

        return {
          id: msg.id,
          subject: msg.subject || 'Sans objet',
          content: msg.content,
          senderId: msg.sender_id,
          senderName: msg.sender_name || 'Utilisateur',
          senderAvatar: avatar,
          senderRole: msg.sender_role || 'user',
          senderSchoolGroupId: msg.sender_school_group_id,
          senderSchoolGroupName: msg.sender_school_group_name,
          senderSchoolGroupCode: msg.sender_school_group_code,
          senderSchoolGroupCity: msg.sender_school_group_city,
          sentAt: msg.sent_at || msg.created_at,
          isRead: msg.is_read || false, // ✅ Vrai statut de lecture
          readAt: msg.read_at,
          messageType: msg.message_type || 'direct',
          priority: msg.priority || 'normal',
          status: msg.status || 'sent',
          type: msg.message_type || 'direct',
          recipients: [],
          attachments: msg.metadata?.attachments || [],
        };
      }) as Message[];
    },
    staleTime: 1000 * 30, // 30 secondes
  });
};

/**
 * Hook pour envoyer un message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer le message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          message_type: data.type,
          subject: data.subject,
          content: data.content,
          sender_id: user.id,
          status: 'sent',
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Ajouter les destinataires
      const recipients = data.recipientIds.map(id => ({
        message_id: message.id,
        recipient_id: id,
        is_read: false
      }));

      const { error: recipError } = await supabase
        .from('message_recipients')
        .insert(recipients);

      if (recipError) throw recipError;

      // Upload des pièces jointes si présentes
      if (data.attachments && data.attachments.length > 0) {
        const attachmentsMetadata = [];

        for (const file of data.attachments) {
          // Créer un nom de fichier unique: userID/timestamp_filename
          const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          const { error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue; // Passer au fichier suivant en cas d'erreur
          }

          // Récupérer l'URL publique
          const { data: publicData } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName);

          attachmentsMetadata.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicData.publicUrl
          });
        }

        // Mettre à jour les métadonnées du message
        if (attachmentsMetadata.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              metadata: { 
                attachments: attachmentsMetadata,
                has_attachments: true 
              }
            })
            .eq('id', message.id);

          if (updateError) {
            console.error('Error updating message metadata:', updateError);
          }
        }
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer un message
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour marquer un message comme lu
 */
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer plusieurs messages (action groupée)
 */
export const useBulkDeleteMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds);

      if (error) throw error;
      return messageIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour marquer plusieurs messages comme lus (action groupée)
 */
export const useBulkMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('message_id', messageIds)
        .eq('recipient_id', user.id);

      if (error) throw error;
      return messageIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

// =====================================================
// HOOKS - STATISTIQUES
// =====================================================

/**
 * Hook pour récupérer les statistiques des broadcasts
 */
export const useBroadcastStats = () => {
  return useQuery({
    queryKey: [...messagingKeys.all, 'broadcast-stats'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_stats')
        .select('*')
        .limit(1);

      if (error) {
        console.warn('broadcast_stats view error', error);
        return {
          totalBroadcasts: 0,
          totalRecipients: 0,
          totalRead: 0,
          readPercentage: 0,
        };
      }

      const stats = data?.[0];

      return {
        totalBroadcasts: stats?.total_broadcasts || 0,
        totalRecipients: stats?.total_recipients || 0,
        totalRead: stats?.total_read || 0,
        readPercentage: stats?.read_percentage || 0,
      };
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook pour récupérer les statistiques de messagerie
 */
export const useMessagingStats = () => {
  return useQuery({
    queryKey: messagingKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messaging_stats_view')
        .select('*')
        .single();

      if (error) {
        console.warn('messaging_stats_view not found', error);
        return {
          totalReceived: 0,
          totalSent: 0,
          unread: 0,
          drafts: 0,
        } as MessagingStats;
      }

      return {
        totalReceived: 0, // Pas dispo dans la vue actuelle
        totalSent: (data as any)?.total_sent || 0,
        unread: (data as any)?.total_unread || 0,
        drafts: (data as any)?.total_broadcasts || 0,
      } as MessagingStats;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};
