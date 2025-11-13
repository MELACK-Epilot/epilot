/**
 * Hook pour le workflow d'approbation des dépenses
 * @module useExpenseApproval
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  alertCreated,
  alertUpdated,
  alertOperationFailed,
} from '@/lib/alerts';
import { useAuth } from '@/hooks/useAuth';

interface ApprovalAction {
  expenseId: string;
  comment?: string;
}

export const useExpenseApproval = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Récupérer l'historique d'approbation
  const useApprovalHistory = (expenseId: string) => {
    return useQuery({
      queryKey: ['approval-history', expenseId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('expense_approvals')
          .select(`
            *,
            user:users(first_name, last_name, role)
          `)
          .eq('expense_id', expenseId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
      },
      enabled: !!expenseId,
    });
  };

  // Soumettre pour approbation
  const submitForApproval = useMutation({
    mutationFn: async ({ expenseId, comment }: ApprovalAction) => {
      // Mettre à jour le statut de la dépense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({ 
          status: 'pending_approval',
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id,
        })
        .eq('id', expenseId);

      if (expenseError) throw expenseError;

      // Créer l'entrée d'approbation
      const { data, error } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          user_id: user?.id,
          action: 'submitted',
          comment,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      // ✅ Alerte moderne de succès
      alertCreated('Dépense', 'Dépense soumise pour approbation');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('soumettre', 'la dépense', error.message || 'Impossible de soumettre la dépense');
    },
  });

  // Approuver une dépense
  const approve = useMutation({
    mutationFn: async ({ expenseId, comment }: ApprovalAction) => {
      // Mettre à jour le statut de la dépense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', expenseId);

      if (expenseError) throw expenseError;

      // Créer l'entrée d'approbation
      const { data, error } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          user_id: user?.id,
          action: 'approved',
          comment,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification au demandeur
      // TODO: Implémenter système de notifications

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Dépense', 'Dépense approuvée avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('approuver', 'la dépense', error.message || 'Impossible d\'approuver la dépense');
    },
  });

  // Refuser une dépense
  const reject = useMutation({
    mutationFn: async ({ expenseId, comment }: ApprovalAction) => {
      if (!comment) {
        throw new Error('Un commentaire est requis pour refuser une dépense');
      }

      // Mettre à jour le statut de la dépense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id,
          rejection_reason: comment,
        })
        .eq('id', expenseId);

      if (expenseError) throw expenseError;

      // Créer l'entrée d'approbation
      const { data, error } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          user_id: user?.id,
          action: 'rejected',
          comment,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification au demandeur
      // TODO: Implémenter système de notifications

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Dépense', 'Dépense refusée');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('refuser', 'la dépense', error.message || 'Impossible de refuser la dépense');
    },
  });

  // Ajouter un commentaire
  const addComment = useMutation({
    mutationFn: async ({ expenseId, comment }: ApprovalAction) => {
      const { data, error } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          user_id: user?.id,
          action: 'commented',
          comment,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      // ✅ Alerte moderne de succès
      alertCreated('Commentaire', 'Commentaire ajouté avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('ajouter', 'le commentaire', error.message || 'Impossible d\'ajouter le commentaire');
    },
  });

  return {
    useApprovalHistory,
    submitForApproval: submitForApproval.mutateAsync,
    approve: approve.mutateAsync,
    reject: reject.mutateAsync,
    addComment: addComment.mutateAsync,
    isLoading: submitForApproval.isPending || approve.isPending || reject.isPending || addComment.isPending,
  };
};
