// @ts-nocheck
/**
 * Hooks React Query pour les Tickets
 * Module: Communication - Système de support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Ticket, TicketComment, TicketPriority, TicketStatus, TicketCategory } from '../types/communication.types';

// =====================================================
// QUERY KEYS
// =====================================================

export const ticketsKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketsKeys.all, 'list'] as const,
  list: (filters?: TicketFilters) => [...ticketsKeys.lists(), filters] as const,
  details: () => [...ticketsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketsKeys.details(), id] as const,
  comments: (ticketId: string) => [...ticketsKeys.all, 'comments', ticketId] as const,
  stats: () => [...ticketsKeys.all, 'stats'] as const,
  myTickets: () => [...ticketsKeys.all, 'my-tickets'] as const,
  assignedToMe: () => [...ticketsKeys.all, 'assigned-to-me'] as const,
};

// =====================================================
// TYPES
// =====================================================

interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
}

interface CreateTicketData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  attachments?: File[];
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
}

interface TicketsStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResolutionTime: number;
}

// =====================================================
// HOOKS - TICKETS
// =====================================================

/**
 * Hook pour récupérer tous les tickets avec filtres
 */
export const useTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: ticketsKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('tickets_detailed')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapper les données vers le format Ticket
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        status: item.status,
        createdBy: {
          id: item.created_by,
          name: item.created_by_name || 'Utilisateur',
          avatar: item.created_by_avatar,
          role: item.created_by_role || 'admin_groupe',
          schoolGroup: item.school_group_name
        },
        assignedTo: item.assigned_to ? {
          id: item.assigned_to,
          name: item.assigned_to_name || 'Admin',
          avatar: item.assigned_to_avatar
        } : undefined,
        comments: [],
        attachments: item.metadata?.attachments || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        resolvedAt: item.resolved_at
      })) as Ticket[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook pour récupérer un ticket spécifique
 */
export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ticketsKeys.detail(ticketId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets_detailed')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      
      // Mapper vers le format Ticket
      const item = data as any;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        status: item.status,
        createdBy: {
          id: item.created_by,
          name: item.created_by_name || 'Utilisateur',
          avatar: item.created_by_avatar,
          role: item.created_by_role || 'admin_groupe',
          schoolGroup: item.school_group_name
        },
        assignedTo: item.assigned_to ? {
          id: item.assigned_to,
          name: item.assigned_to_name || 'Admin',
          avatar: item.assigned_to_avatar
        } : undefined,
        comments: [],
        attachments: item.metadata?.attachments || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        resolvedAt: item.resolved_at
      } as Ticket;
    },
    enabled: !!ticketId,
  });
};

/**
 * Hook pour récupérer les tickets créés par l'utilisateur
 */
export const useMyTickets = () => {
  return useQuery({
    queryKey: ticketsKeys.myTickets(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tickets_with_details')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ticket[];
    },
  });
};

/**
 * Hook pour récupérer les tickets assignés à l'utilisateur
 */
export const useAssignedTickets = () => {
  return useQuery({
    queryKey: ticketsKeys.assignedToMe(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tickets_with_details')
        .select('*')
        .eq('assignee_id', user.id)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ticket[];
    },
  });
};

/**
 * Hook pour créer un nouveau ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer le ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Upload des pièces jointes si présentes
      if (data.attachments && data.attachments.length > 0) {
        for (const file of data.attachments) {
          const filePath = `${ticket.id}/${user.id}/${Date.now()}_${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('tickets')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('tickets')
            .getPublicUrl(filePath);

          await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_url: publicUrl,
              storage_path: filePath,
            });
        }
      }

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.myTickets() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.stats() });
    },
  });
};

/**
 * Hook pour mettre à jour un ticket
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: UpdateTicketData }) => {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .update(data)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return ticket;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.stats() });
    },
  });
};

/**
 * Hook pour changer le statut d'un ticket
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.stats() });
    },
  });
};

/**
 * Hook pour assigner un ticket
 */
export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ assigned_to: userId })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.assignedToMe() });
    },
  });
};

/**
 * Hook pour supprimer un ticket
 */
export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.myTickets() });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer plusieurs tickets (action groupée)
 */
export const useBulkDeleteTickets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketIds: string[]) => {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .in('id', ticketIds);

      if (error) throw error;
      return ticketIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
    },
  });
};

/**
 * Hook pour changer le statut de plusieurs tickets (action groupée)
 */
export const useBulkUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketIds, status }: { ticketIds: string[]; status: string }) => {
      const { error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ticketIds);

      if (error) throw error;
      return ticketIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
    },
  });
};

// =====================================================
// HOOKS - COMMENTAIRES
// =====================================================

/**
 * Hook pour récupérer les commentaires d'un ticket
 */
export const useTicketComments = (ticketId: string) => {
  return useQuery({
    queryKey: ticketsKeys.comments(ticketId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:users(id, full_name, email, avatar_url, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketComment[];
    },
    enabled: !!ticketId,
  });
};

/**
 * Hook pour ajouter un commentaire
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, content, isInternal = false }: { 
      ticketId: string; 
      content: string;
      isInternal?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          content,
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.comments(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
    },
  });
};

/**
 * Hook pour mettre à jour un commentaire
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.comments(data.ticket_id) });
    },
  });
};

/**
 * Hook pour supprimer un commentaire
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, ticketId }: { commentId: string; ticketId: string }) => {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return ticketId;
    },
    onSuccess: (ticketId) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.comments(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
    },
  });
};

// =====================================================
// HOOKS - WATCHERS
// =====================================================

/**
 * Hook pour ajouter un observateur
 */
export const useAddWatcher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('ticket_watchers')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
    },
  });
};

/**
 * Hook pour retirer un observateur
 */
export const useRemoveWatcher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: string; userId: string }) => {
      const { error } = await supabase
        .from('ticket_watchers')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(variables.ticketId) });
    },
  });
};

// =====================================================
// HOOKS - STATISTIQUES
// =====================================================

/**
 * Hook pour récupérer les statistiques globales des tickets
 */
export const useTicketsStats = () => {
  return useQuery({
    queryKey: ticketsKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets_stats_view')
        .select('*')
        .single();

      if (error) {
        // Fallback si la vue n'existe pas
        console.warn('tickets_stats_view not found, using fallback');
        return {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
          avgResolutionTime: 0,
        } as TicketsStats;
      }

      return {
        total: data?.total || 0,
        open: data?.open || 0,
        inProgress: data?.in_progress || 0,
        resolved: data?.resolved || 0,
        closed: data?.closed || 0,
        avgResolutionTime: data?.avg_resolution_hours || 0,
      } as TicketsStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer les statistiques par catégorie
 */
export const useTicketsStatsByCategory = () => {
  return useQuery({
    queryKey: [...ticketsKeys.stats(), 'by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets_stats_by_category')
        .select('*');

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer les statistiques par priorité
 */
export const useTicketsStatsByPriority = () => {
  return useQuery({
    queryKey: [...ticketsKeys.stats(), 'by-priority'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets_stats_by_priority')
        .select('*');

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer les statistiques par utilisateur
 */
export const useTicketsStatsByUser = (userId?: string) => {
  return useQuery({
    queryKey: [...ticketsKeys.stats(), 'by-user', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('tickets_stats_by_user')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId || true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// =====================================================
// HOOKS - TEMPS RÉEL (Subscriptions)
// =====================================================

/**
 * Hook pour s'abonner aux changements de tickets en temps réel
 */
export const useTicketsSubscription = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['tickets-subscription'],
    queryFn: () => {
      const channel = supabase
        .channel('tickets-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
          },
          () => {
            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ticketsKeys.stats() });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_comments',
          },
          (payload) => {
            // Invalider les commentaires du ticket concerné
            const ticketId = (payload.new as any).ticket_id;
            if (ticketId) {
              queryClient.invalidateQueries({ queryKey: ticketsKeys.comments(ticketId) });
              queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
            }
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
