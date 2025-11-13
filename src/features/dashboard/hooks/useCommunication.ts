/**
 * Hooks React Query pour le module Communication
 * CONNECTÉ À SUPABASE AVEC TEMPS RÉEL ACTIVÉ
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  Ticket, 
  Message, 
  Post,
  SocialFeedStats,
  TicketFilters,
  MessageFilters,
  PostFilters
} from '../types/communication.types';

// Importer les hooks spécialisés
import { 
  useTickets as useTicketsDB,
  useTicketsStats as useTicketsStatsDB
} from './useTickets';

import {
  useMessages as useMessagesDB,
  useMessagingStats as useMessagingStatsDB,
  useConversations as useConversationsDB
} from './useMessaging';

// ============= QUERY KEYS =============
export const communicationKeys = {
  all: ['communication'] as const,
  tickets: () => [...communicationKeys.all, 'tickets'] as const,
  ticketsList: (filters: TicketFilters) => [...communicationKeys.tickets(), 'list', filters] as const,
  ticketsStats: () => [...communicationKeys.tickets(), 'stats'] as const,
  ticket: (id: string) => [...communicationKeys.tickets(), 'detail', id] as const,
  
  messages: () => [...communicationKeys.all, 'messages'] as const,
  messagesList: (filters: MessageFilters) => [...communicationKeys.messages(), 'list', filters] as const,
  messagesStats: () => [...communicationKeys.messages(), 'stats'] as const,
  conversations: () => [...communicationKeys.messages(), 'conversations'] as const,
  
  posts: () => [...communicationKeys.all, 'posts'] as const,
  postsList: (filters: PostFilters) => [...communicationKeys.posts(), 'list', filters] as const,
  postsStats: () => [...communicationKeys.posts(), 'stats'] as const,
};

// ============= TICKETS (Connecté Supabase) =============
export const useTickets = (filters: TicketFilters = {}) => {
  const queryClient = useQueryClient();
  
  // Utiliser le hook connecté
  const query = useTicketsDB(filters);
  
  // Activer le temps réel
  useEffect(() => {
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: communicationKeys.tickets() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return query;
};

// Version mock pour développement (commentée)
const useTicketsMock = (filters: TicketFilters = {}) => {
  return useQuery({
    queryKey: communicationKeys.ticketsList(filters),
    queryFn: async (): Promise<Ticket[]> => {
      return [
        {
          id: '1',
          title: 'Problème de connexion à la plateforme',
          description: 'Impossible de se connecter depuis ce matin. Message d\'erreur "Session expirée".',
          category: 'technique',
          priority: 'high',
          status: 'open',
          createdBy: {
            id: '1',
            name: 'Jean Mukoko',
            avatar: undefined,
            role: 'Administrateur Groupe',
            schoolGroup: 'Groupe Scolaire Les Palmiers'
          },
          comments: [
            {
              id: 'c1',
              ticketId: '1',
              userId: 'sa1',
              userName: 'Super Admin E-Pilot',
              content: 'Nous avons identifié le problème. Correction en cours.',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          title: 'Demande d\'ajout de fonctionnalité',
          description: 'Serait-il possible d\'ajouter un export Excel pour les bulletins ?',
          category: 'pedagogique',
          priority: 'medium',
          status: 'in_progress',
          createdBy: {
            id: '2',
            name: 'Marie Ngoma',
            role: 'Administrateur Groupe',
            schoolGroup: 'Groupe Scolaire Excellence'
          },
          assignedTo: {
            id: 'sa1',
            name: 'Super Admin E-Pilot'
          },
          comments: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: '3',
          title: 'Question sur la facturation',
          description: 'Comment fonctionne le passage du plan Premium au plan Pro ?',
          category: 'financier',
          priority: 'low',
          status: 'resolved',
          createdBy: {
            id: '3',
            name: 'Paul Kongo',
            role: 'Administrateur Groupe',
            schoolGroup: 'Groupe Scolaire Avenir'
          },
          comments: [
            {
              id: 'c2',
              ticketId: '3',
              userId: 'sa1',
              userName: 'Super Admin E-Pilot',
              content: 'Le changement est immédiat. Vous serez facturé au prorata.',
              createdAt: new Date(Date.now() - 172800000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          resolvedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTicketsStats = () => {
  // Utiliser le hook connecté
  return useTicketsStatsDB();
};

// ============= MESSAGES (Connecté Supabase) =============
export const useMessages = (_filters: MessageFilters = {}) => {
  const queryClient = useQueryClient();
  
  // Utiliser le hook connecté
  const query = useMessagesDB();
  
  // Activer le temps réel
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: communicationKeys.messages() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return query;
};

// Version mock pour développement (commentée)
const useMessagesMock = (filters: MessageFilters = {}) => {
  return useQuery({
    queryKey: communicationKeys.messagesList(filters),
    queryFn: async (): Promise<Message[]> => {
      return [
        {
          id: 'm1',
          type: 'direct',
          subject: 'Mise à jour importante de la plateforme',
          content: 'Bonjour, nous avons déployé une nouvelle version avec plusieurs améliorations...',
          senderId: 'sa1',
          senderName: 'Super Admin E-Pilot',
          recipientIds: ['1', '2', '3'],
          recipients: [
            { id: '1', name: 'Jean Mukoko', role: 'Administrateur Groupe', isRead: false },
            { id: '2', name: 'Marie Ngoma', role: 'Administrateur Groupe', isRead: true, readAt: new Date(Date.now() - 3600000).toISOString() },
            { id: '3', name: 'Paul Kongo', role: 'Administrateur Groupe', isRead: false }
          ],
          status: 'delivered',
          isRead: false,
          sentAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'm2',
          type: 'group',
          subject: 'Réunion mensuelle',
          content: 'La réunion mensuelle des administrateurs aura lieu le 15 novembre à 14h.',
          senderId: 'sa1',
          senderName: 'Super Admin E-Pilot',
          recipientIds: ['1', '2', '3', '4', '5'],
          recipients: [],
          status: 'delivered',
          isRead: true,
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          readAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'm3',
          type: 'direct',
          content: 'Merci pour votre retour rapide sur le ticket #1234.',
          senderId: '1',
          senderName: 'Jean Mukoko',
          recipientIds: ['sa1'],
          recipients: [],
          status: 'read',
          isRead: true,
          sentAt: new Date(Date.now() - 172800000).toISOString(),
          readAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useMessagingStats = () => {
  // Utiliser le hook connecté
  return useMessagingStatsDB();
};

export const useConversations = () => {
  // Utiliser le hook connecté
  return useConversationsDB();
};

// ============= SOCIAL FEED (Connecté Supabase) =============
export const usePosts = (filters: PostFilters = {}) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: communicationKeys.postsList(filters),
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('social_feed_posts')
        .select(`
          *,
          reactions:social_feed_reactions(*),
          comments:social_feed_comments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    staleTime: 1000 * 60 * 3,
  });
  
  // Activer le temps réel
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_feed_posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: communicationKeys.posts() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return query;
};

// Version mock pour développement (commentée)
const usePostsMock = (filters: PostFilters = {}) => {
  return useQuery({
    queryKey: communicationKeys.postsList(filters),
    queryFn: async (): Promise<Post[]> => {
      return [
        {
          id: 'p1',
          type: 'announcement',
          content: '🎉 Excellente nouvelle ! E-Pilot vient de franchir le cap des 50 groupes scolaires partenaires en République du Congo. Merci pour votre confiance ! 🇨🇬',
          authorId: 'sa1',
          authorName: 'Super Admin E-Pilot',
          authorRole: 'Super Administrateur',
          isPinned: true,
          isEdited: false,
          reactions: [
            { id: 'r1', postId: 'p1', userId: '1', userName: 'Jean Mukoko', type: 'celebrate', createdAt: new Date().toISOString() },
            { id: 'r2', postId: 'p1', userId: '2', userName: 'Marie Ngoma', type: 'love', createdAt: new Date().toISOString() },
            { id: 'r3', postId: 'p1', userId: '3', userName: 'Paul Kongo', type: 'like', createdAt: new Date().toISOString() }
          ],
          comments: [
            {
              id: 'c1',
              postId: 'p1',
              userId: '1',
              userName: 'Jean Mukoko',
              userRole: 'Administrateur Groupe',
              content: 'Félicitations ! Fier de faire partie de cette aventure 🚀',
              reactions: [],
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'c2',
              postId: 'p1',
              userId: '2',
              userName: 'Marie Ngoma',
              userRole: 'Administrateur Groupe',
              content: 'Bravo à toute l\'équipe E-Pilot ! 👏',
              reactions: [],
              createdAt: new Date(Date.now() - 7200000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'p2',
          type: 'poll',
          content: 'Quelle fonctionnalité souhaiteriez-vous voir en priorité dans la prochaine version ?',
          authorId: 'sa1',
          authorName: 'Super Admin E-Pilot',
          authorRole: 'Super Administrateur',
          isPinned: false,
          isEdited: false,
          poll: {
            question: 'Quelle fonctionnalité souhaiteriez-vous voir en priorité ?',
            options: [
              { id: 'o1', text: 'Application mobile native', votes: 15, voters: ['1', '2', '3'] },
              { id: 'o2', text: 'Export PDF des bulletins', votes: 23, voters: ['4', '5', '6'] },
              { id: 'o3', text: 'Messagerie instantanée', votes: 8, voters: ['7', '8'] },
              { id: 'o4', text: 'Tableau de bord prédictif', votes: 12, voters: ['9', '10'] }
            ],
            endsAt: new Date(Date.now() + 604800000).toISOString() // 7 jours
          },
          reactions: [],
          comments: [],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'p3',
          type: 'event',
          content: 'Rejoignez-nous pour notre webinaire mensuel sur les meilleures pratiques de gestion scolaire.',
          authorId: 'sa1',
          authorName: 'Super Admin E-Pilot',
          authorRole: 'Super Administrateur',
          event: {
            title: 'Webinaire : Optimiser la gestion de votre établissement',
            date: new Date(Date.now() + 604800000).toISOString(),
            location: 'En ligne (Lien Zoom à venir)'
          },
          isPinned: false,
          isEdited: false,
          reactions: [
            { id: 'r4', postId: 'p3', userId: '1', userName: 'Jean Mukoko', type: 'like', createdAt: new Date().toISOString() }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'p4',
          type: 'discussion',
          content: 'Bonjour à tous ! Comment gérez-vous les inscriptions en ligne dans vos établissements ? Avez-vous des conseils à partager ?',
          authorId: '1',
          authorName: 'Jean Mukoko',
          authorRole: 'Administrateur Groupe',
          authorSchoolGroup: 'Groupe Scolaire Les Palmiers',
          isPinned: false,
          isEdited: false,
          reactions: [
            { id: 'r5', postId: 'p4', userId: '2', userName: 'Marie Ngoma', type: 'insightful', createdAt: new Date().toISOString() }
          ],
          comments: [
            {
              id: 'c3',
              postId: 'p4',
              userId: '2',
              userName: 'Marie Ngoma',
              userRole: 'Administrateur Groupe',
              content: 'Nous utilisons un formulaire Google Forms couplé à E-Pilot. Très efficace !',
              reactions: [],
              createdAt: new Date(Date.now() - 43200000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString()
        }
      ];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

export const useSocialFeedStats = () => {
  return useQuery({
    queryKey: communicationKeys.postsStats(),
    queryFn: async (): Promise<SocialFeedStats> => {
      const { data, error } = await supabase
        .from('social_feed_stats')
        .select('*')
        .single();

      if (error) throw error;
      
      // Type assertion pour les données Supabase
      const stats = data as any;
      
      return {
        totalPosts: stats?.total_posts || 0,
        totalComments: stats?.total_comments || 0,
        totalReactions: stats?.total_reactions || 0,
        activeMembers: stats?.active_users || 0
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

// ============= MUTATIONS (Utiliser les hooks spécialisés) =============
// Les mutations sont déjà définies dans useTickets.ts et useMessaging.ts
// Importer directement depuis ces fichiers :
// - useCreateTicket, useUpdateTicket, useAddComment depuis useTickets.ts
// - useSendMessage, useMarkAsRead depuis useMessaging.ts

// Export des hooks spécialisés pour faciliter l'import
export { 
  useCreateTicket,
  useUpdateTicket,
  useUpdateTicketStatus,
  useAddComment,
  useAssignTicket
} from './useTickets';

export {
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
  useSaveDraft
} from './useMessaging';

// Mutation pour créer un post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postData: Partial<Post>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('social_feed_posts')
        .insert({
          content: postData.content,
          type: postData.type || 'discussion',
          author_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.posts() });
      queryClient.invalidateQueries({ queryKey: communicationKeys.postsStats() });
    },
  });
};

// Mutation pour réagir à un post
export const useReactToPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('social_feed_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          type: reaction,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.posts() });
    },
  });
};

// Import useMutation
import { useMutation } from '@tanstack/react-query';
