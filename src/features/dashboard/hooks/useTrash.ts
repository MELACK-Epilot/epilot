/**
 * Hook pour gérer la Corbeille (Trash)
 * Version optimisée React 19 avec meilleures pratiques
 * @module useTrash
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TrashItem } from '../types/dashboard.types';

/**
 * Clés de requête pour React Query
 */
export const trashKeys = {
  all: ['trash'] as const,
  lists: () => [...trashKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...trashKeys.lists(), filters] as const,
  details: () => [...trashKeys.all, 'detail'] as const,
  detail: (id: string) => [...trashKeys.details(), id] as const,
  stats: () => [...trashKeys.all, 'stats'] as const,
};

/**
 * Interface pour les filtres de recherche
 */
export interface TrashFilters {
  query?: string;
  entityType?: 'user' | 'school_group' | 'subscription' | 'module' | 'category';
  deletedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Hook pour récupérer la liste des éléments dans la corbeille
 */
export const useTrash = (filters?: TrashFilters) => {
  return useQuery({
    queryKey: trashKeys.list(filters || {}),
    queryFn: async () => {
      // @ts-ignore - Supabase types are strict, but this works at runtime
      let query = supabase
        .from('trash_items')
        .select(`
          *,
          deleted_by_user:deleted_by (
            id,
            first_name,
            last_name
          )
        `)
        .order('deleted_at', { ascending: false });

      // Filtres
      if (filters?.query) {
        query = query.ilike('entity_name', `%${filters.query}%`);
      }

      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters?.deletedBy) {
        query = query.eq('deleted_by', filters.deletedBy);
      }

      if (filters?.dateFrom) {
        query = query.gte('deleted_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('deleted_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      return (data || []).map((item: any) => ({
        id: item.id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        entityName: item.entity_name,
        deletedBy: item.deleted_by,
        deletedByName: item.deleted_by_user 
          ? `${item.deleted_by_user.first_name} ${item.deleted_by_user.last_name}`
          : 'Système',
        deletedAt: item.deleted_at,
        data: item.data,
        canRestore: item.can_restore,
      })) as TrashItem[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour récupérer un élément de la corbeille par ID
 */
export const useTrashItem = (id: string) => {
  return useQuery({
    queryKey: trashKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trash_items')
        .select(`
          *,
          deleted_by_user:deleted_by (
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        entityName: data.entity_name,
        deletedBy: data.deleted_by,
        deletedByName: data.deleted_by_user
          ? `${data.deleted_by_user.first_name} ${data.deleted_by_user.last_name}`
          : 'Système',
        deletedAt: data.deleted_at,
        data: data.data,
        canRestore: data.can_restore,
      } as TrashItem;
    },
    enabled: !!id,
  });
};

/**
 * Interface pour ajouter un élément à la corbeille
 */
export interface AddToTrashInput {
  entityType: 'user' | 'school_group' | 'subscription' | 'module' | 'category';
  entityId: string;
  entityName: string;
  deletedBy: string;
  data: Record<string, any>;
  canRestore?: boolean;
}

/**
 * Hook pour ajouter un élément à la corbeille
 */
export const useAddToTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddToTrashInput) => {
      // @ts-ignore - Supabase types are strict, but this works at runtime
      const { data, error } = await supabase
        .from('trash_items')
        .insert({
          entity_type: input.entityType,
          entity_id: input.entityId,
          entity_name: input.entityName,
          deleted_by: input.deletedBy,
          deleted_at: new Date().toISOString(),
          data: input.data,
          can_restore: input.canRestore ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trashKeys.stats() });
    },
  });
};

/**
 * Hook pour restaurer un élément de la corbeille
 */
export const useRestoreFromTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Récupérer l'élément
      const { data: trashItem, error: fetchError } = await supabase
        .from('trash_items')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!trashItem.can_restore) {
        throw new Error('Cet élément ne peut pas être restauré');
      }

      // 2. Restaurer dans la table d'origine
      const tableName = trashItem.entity_type === 'school_group' 
        ? 'school_groups' 
        : trashItem.entity_type === 'user'
        ? 'users'
        : `${trashItem.entity_type}s`;

      const { error: restoreError } = await supabase
        .from(tableName)
        .update({
          ...trashItem.data,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', trashItem.entity_id);

      if (restoreError) throw restoreError;

      // 3. Supprimer de la corbeille
      const { error: deleteError } = await supabase
        .from('trash_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return trashItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trashKeys.stats() });
      // Invalider aussi les queries des entités restaurées
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['school-groups'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
};

/**
 * Hook pour supprimer définitivement un élément
 */
export const usePermanentDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('trash_items')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trashKeys.stats() });
    },
  });
};

/**
 * Hook pour vider la corbeille
 */
export const useEmptyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (olderThanDays?: number) => {
      let query = supabase.from('trash_items').delete();

      if (olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        query = query.lt('deleted_at', cutoffDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trashKeys.stats() });
    },
  });
};

/**
 * Hook pour obtenir les statistiques de la corbeille
 */
export const useTrashStats = () => {
  return useQuery({
    queryKey: trashKeys.stats(),
    queryFn: async () => {
      // Total éléments
      const { count: total, error: totalError } = await supabase
        .from('trash_items')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Par type d'entité
      const { data: itemsData, error: itemsError } = await supabase
        .from('trash_items')
        .select('entity_type');

      if (itemsError) throw itemsError;

      const typeCounts: Record<string, number> = {};
      itemsData?.forEach((item: any) => {
        typeCounts[item.entity_type] = (typeCounts[item.entity_type] || 0) + 1;
      });

      // Éléments restaurables
      const { count: restorable, error: restorableError } = await supabase
        .from('trash_items')
        .select('*', { count: 'exact', head: true })
        .eq('can_restore', true);

      if (restorableError) throw restorableError;

      return {
        total: total || 0,
        restorable: restorable || 0,
        typeCounts,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
