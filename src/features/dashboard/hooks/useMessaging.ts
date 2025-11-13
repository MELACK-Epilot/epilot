/**
 * Hooks React Query pour la Messagerie
 * Module: Communication - Messagerie interne
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message, Conversation, MessageDraft } from '../types/communication.types';

// =====================================================
// QUERY KEYS
// =====================================================

export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: () => [...messagingKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messagingKeys.conversations(), id] as const,
  messages: () => [...messagingKeys.all, 'messages'] as const,
  messagesByConversation: (conversationId: string) => [...messagingKeys.messages(), conversationId] as const,
  drafts: () => [...messagingKeys.all, 'drafts'] as const,
  stats: () => [...messagingKeys.all, 'stats'] as const,
};

// =====================================================
// TYPES
// =====================================================

interface SendMessageData {
  conversationId?: string;
  recipientIds: string[];
  subject?: string;
  content: string;
  type: 'direct' | 'group' | 'broadcast';
  attachments?: File[];
}

interface CreateConversationData {
  title?: string;
  type: 'direct' | 'group' | 'broadcast';
  participantIds: string[];
}

interface MessagingStats {
  totalReceived: number;
  totalSent: number;
  unread: number;
  drafts: number;
}

// =====================================================
// HOOKS - CONVERSATIONS
// =====================================================

/**
 * Hook pour récupérer toutes les conversations de l'utilisateur
 */
export const useConversations = () => {
  return useQuery({
    queryKey: messagingKeys.conversations(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations_with_stats')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Conversation[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook pour récupérer une conversation spécifique
 */
export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: messagingKeys.conversation(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            joined_at,
            is_admin,
            is_muted,
            last_read_at,
            unread_count,
            user:users(id, full_name, email, avatar_url, role)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
};

/**
 * Hook pour créer une nouvelle conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConversationData) => {
      // 1. Créer la conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: data.title,
          type: data.type,
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Ajouter les participants
      const participants = data.participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
};

// =====================================================
// HOOKS - MESSAGES
// =====================================================

/**
 * Hook pour récupérer tous les messages d'une conversation
 */
export const useMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: conversationId 
      ? messagingKeys.messagesByConversation(conversationId)
      : messagingKeys.messages(),
    queryFn: async () => {
      let query = supabase
        .from('messages_with_details')
        .select('*')
        .order('sent_at', { ascending: false });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Message[];
    },
    enabled: conversationId !== undefined,
    staleTime: 1000 * 30, // 30 secondes
  });
};

/**
 * Hook pour récupérer les messages reçus
 */
export const useReceivedMessages = () => {
  return useQuery({
    queryKey: [...messagingKeys.messages(), 'received'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages_with_details')
        .select('*')
        .in('id', 
          supabase
            .from('message_recipients')
            .select('message_id')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
        )
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
  });
};

/**
 * Hook pour récupérer les messages envoyés
 */
export const useSentMessages = () => {
  return useQuery({
    queryKey: [...messagingKeys.messages(), 'sent'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages_with_details')
        .select('*')
        .eq('sender_id', user.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
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

      let conversationId = data.conversationId;

      // Si pas de conversation, en créer une
      if (!conversationId) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: data.type,
            title: data.subject,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = conversation.id;

        // Ajouter les participants
        const participants = [
          { conversation_id: conversationId, user_id: user.id },
          ...data.recipientIds.map(id => ({ conversation_id: conversationId, user_id: id }))
        ];

        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (partError) throw partError;
      }

      // Créer le message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          subject: data.subject,
          content: data.content,
          status: 'sent',
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Upload des pièces jointes si présentes
      if (data.attachments && data.attachments.length > 0) {
        for (const file of data.attachments) {
          const filePath = `${conversationId}/${user.id}/${Date.now()}_${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('messages')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('messages')
            .getPublicUrl(filePath);

          await supabase
            .from('message_attachments')
            .insert({
              message_id: message.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_url: publicUrl,
              storage_path: filePath,
            });
        }
      }

      return message;
    },
    onSuccess: (_, variables) => {
      if (variables.conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: messagingKeys.messagesByConversation(variables.conversationId) 
        });
      }
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour marquer un message comme lu
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_recipients')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_recipients')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

// =====================================================
// HOOKS - BROUILLONS
// =====================================================

/**
 * Hook pour récupérer les brouillons
 */
export const useDrafts = () => {
  return useQuery({
    queryKey: messagingKeys.drafts(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('message_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MessageDraft[];
    },
  });
};

/**
 * Hook pour sauvegarder un brouillon
 */
export const useSaveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: Partial<MessageDraft>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('message_drafts')
        .upsert({
          ...draft,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer un brouillon
 */
export const useDeleteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await supabase
        .from('message_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
};

// =====================================================
// HOOKS - STATISTIQUES
// =====================================================

/**
 * Hook pour récupérer les statistiques de messagerie
 */
export const useMessagingStats = () => {
  return useQuery({
    queryKey: messagingKeys.stats(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_messaging_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        totalReceived: data.received_count || 0,
        totalSent: data.sent_count || 0,
        unread: data.unread_count || 0,
        drafts: data.drafts_count || 0,
      } as MessagingStats;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// =====================================================
// HOOKS - TEMPS RÉEL (Subscriptions)
// =====================================================

/**
 * Hook pour s'abonner aux nouveaux messages en temps réel
 */
export const useMessagesSubscription = (conversationId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['messages-subscription', conversationId],
    queryFn: () => {
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
          },
          () => {
            // Invalider les queries pour rafraîchir les données
            if (conversationId) {
              queryClient.invalidateQueries({ 
                queryKey: messagingKeys.messagesByConversation(conversationId) 
              });
            }
            queryClient.invalidateQueries({ queryKey: messagingKeys.messages() });
            queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: false, // Activé manuellement si besoin
  });
};
