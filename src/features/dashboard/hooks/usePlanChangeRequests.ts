/**
 * Hooks React Query pour les demandes de changement de plan
 * Permet aux Admin Groupe de demander un upgrade au Super Admin
 * @module usePlanChangeRequests
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';
import {
  alertUpdated,
  alertOperationFailed,
} from '@/lib/alerts';

/**
 * Types
 */
export interface PlanChangeRequest {
  id: string;
  schoolGroupId: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
  currentPlanSlug: string | null;
  currentPlanPrice: number | null;
  requestedPlanId: string;
  requestedPlanName: string;
  requestedPlanSlug: string;
  requestedPlanPrice: number;
  reason: string | null;
  desiredDate: string | null;
  estimatedCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanChangeRequestData {
  requestedPlanId: string;
  reason?: string;
  desiredDate?: string;
}

export interface ReviewPlanChangeRequestData {
  requestId: string;
  reviewNotes?: string;
}

/**
 * Hook pour récupérer toutes les demandes (Super Admin)
 */
export const usePlanChangeRequests = (status?: 'pending' | 'approved' | 'rejected' | 'cancelled') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-change-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('plan_change_requests_detailed')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        schoolGroupId: item.school_group_id,
        schoolGroupName: item.school_group_name,
        schoolGroupCode: item.school_group_code,
        requestedBy: item.requested_by,
        requestedByName: item.requested_by_name,
        requestedByEmail: item.requested_by_email,
        currentPlanId: item.current_plan_id,
        currentPlanName: item.current_plan_name,
        currentPlanSlug: item.current_plan_slug,
        currentPlanPrice: item.current_plan_price,
        requestedPlanId: item.requested_plan_id,
        requestedPlanName: item.requested_plan_name,
        requestedPlanSlug: item.requested_plan_slug,
        requestedPlanPrice: item.requested_plan_price,
        reason: item.reason,
        desiredDate: item.desired_date,
        estimatedCost: item.estimated_cost,
        status: item.status,
        reviewedBy: item.reviewed_by,
        reviewedByName: item.reviewed_by_name,
        reviewedAt: item.reviewed_at,
        reviewNotes: item.review_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as PlanChangeRequest[];
    },
    enabled: !!user && user.role === 'super_admin',
    staleTime: 30 * 1000, // 30 secondes
  });
};

/**
 * Hook pour récupérer les demandes du groupe de l'utilisateur (Admin Groupe)
 */
export const useMyPlanChangeRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-plan-change-requests', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('User not associated with a school group');
      }

      const { data, error } = await supabase
        .from('plan_change_requests_detailed')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        schoolGroupId: item.school_group_id,
        schoolGroupName: item.school_group_name,
        schoolGroupCode: item.school_group_code,
        requestedBy: item.requested_by,
        requestedByName: item.requested_by_name,
        requestedByEmail: item.requested_by_email,
        currentPlanId: item.current_plan_id,
        currentPlanName: item.current_plan_name,
        currentPlanSlug: item.current_plan_slug,
        currentPlanPrice: item.current_plan_price,
        requestedPlanId: item.requested_plan_id,
        requestedPlanName: item.requested_plan_name,
        requestedPlanSlug: item.requested_plan_slug,
        requestedPlanPrice: item.requested_plan_price,
        reason: item.reason,
        desiredDate: item.desired_date,
        estimatedCost: item.estimated_cost,
        status: item.status,
        reviewedBy: item.reviewed_by,
        reviewedByName: item.reviewed_by_name,
        reviewedAt: item.reviewed_at,
        reviewNotes: item.review_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as PlanChangeRequest[];
    },
    enabled: !!user?.schoolGroupId && (user?.role === 'admin_groupe' || user?.role === 'group_admin'),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook pour créer une demande de changement de plan
 */
export const useCreatePlanChangeRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePlanChangeRequestData) => {
      if (!user?.id || !user?.schoolGroupId) {
        throw new Error('User not authenticated or not associated with a school group');
      }

      const { data: result, error } = await supabase.rpc('create_plan_change_request', {
        p_school_group_id: user.schoolGroupId,
        p_requested_by: user.id,
        p_requested_plan_id: data.requestedPlanId,
        p_reason: data.reason || null,
        p_desired_date: data.desiredDate || null,
      });

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-plan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests'] });
    },
  });
};

/**
 * Hook pour approuver une demande (Super Admin)
 */
export const useApprovePlanChangeRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ReviewPlanChangeRequestData) => {
      if (!user?.id || user?.role !== 'super_admin') {
        throw new Error('Unauthorized');
      }

      const { data: result, error } = await supabase.rpc('approve_plan_change_request', {
        p_request_id: data.requestId,
        p_reviewed_by: user.id,
        p_review_notes: data.reviewNotes || null,
      });

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-plan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-group'] });
      queryClient.invalidateQueries({ queryKey: ['school-groups'] });
      
      // ✅ Alerte moderne de succès
      alertUpdated('Demande', 'Demande approuvée avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('approuver', 'la demande', error.message || 'Impossible d\'approuver la demande');
    },
  });
};

/**
 * Hook pour refuser une demande (Super Admin)
 */
export const useRejectPlanChangeRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ReviewPlanChangeRequestData) => {
      if (!user?.id || user?.role !== 'super_admin') {
        throw new Error('Unauthorized');
      }

      const { data: result, error } = await supabase.rpc('reject_plan_change_request', {
        p_request_id: data.requestId,
        p_reviewed_by: user.id,
        p_review_notes: data.reviewNotes || null,
      });

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-plan-change-requests'] });
      
      // ✅ Alerte moderne de succès
      alertUpdated('Demande', 'Demande refusée');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('refuser', 'la demande', error.message || 'Impossible de refuser la demande');
    },
  });
};

/**
 * Hook pour annuler une demande (Admin Groupe)
 */
export const useCancelPlanChangeRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase.rpc('cancel_plan_change_request', {
        p_request_id: requestId,
        p_user_id: user.id,
      });

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-plan-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['plan-change-requests'] });
      
      // ✅ Alerte moderne de succès
      alertUpdated('Demande', 'Demande annulée');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('annuler', 'la demande', error.message || 'Impossible d\'annuler la demande');
    },
  });
};

/**
 * Hook pour obtenir les statistiques des demandes (Super Admin)
 */
export const usePlanChangeRequestsStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-change-requests-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_change_requests')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter((r: any) => r.status === 'pending').length || 0,
        approved: data?.filter((r: any) => r.status === 'approved').length || 0,
        rejected: data?.filter((r: any) => r.status === 'rejected').length || 0,
        cancelled: data?.filter((r: any) => r.status === 'cancelled').length || 0,
      };

      return stats;
    },
    enabled: !!user && user.role === 'super_admin',
    staleTime: 60 * 1000, // 1 minute
  });
};
