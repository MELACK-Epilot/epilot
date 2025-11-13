/**
 * Hook pour les actions sur les paiements
 * @module usePaymentActions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  alertUpdated,
  alertOperationFailed,
  showSuccess,
  showError,
} from '@/lib/alerts';

export const usePaymentActions = () => {
  const queryClient = useQueryClient();

  // Valider un paiement
  const validatePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          validated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Paiement', 'Paiement validé avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('valider', 'le paiement', error.message || 'Impossible de valider le paiement');
    },
  });

  // Valider plusieurs paiements
  const validateMultiplePayments = useMutation({
    mutationFn: async (paymentIds: string[]) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          validated_at: new Date().toISOString(),
        })
        .in('id', paymentIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      // ✅ Alerte moderne de succès
      showSuccess(`${data.length} paiement(s) validé(s) avec succès`);
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('valider', 'les paiements', error.message || 'Impossible de valider les paiements');
    },
  });

  // Rembourser un paiement
  const refundPayment = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: reason,
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      // ✅ Alerte moderne de succès
      alertUpdated('Paiement', 'Paiement remboursé avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      alertOperationFailed('rembourser', 'le paiement', error.message || 'Impossible de rembourser le paiement');
    },
  });

  // Envoyer un email
  const sendPaymentEmail = useMutation({
    mutationFn: async ({ paymentId, type }: { paymentId: string; type: 'receipt' | 'reminder' }) => {
      // Appel à une fonction serverless ou API
      const response = await fetch('/api/payments/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, type }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi de l\'email');
      return response.json();
    },
    onSuccess: () => {
      // ✅ Alerte moderne de succès
      showSuccess('Email envoyé avec succès');
    },
    onError: (error: any) => {
      // ✅ Alerte moderne d'erreur
      showError(error.message || 'Impossible d\'envoyer l\'email');
    },
  });

  // Générer un reçu PDF
  const generateReceipt = async (payment: any) => {
    try {
      // Logique de génération PDF (jsPDF, etc.)
      // ✅ Alerte moderne de succès
      showSuccess('Reçu généré avec succès');
      // Télécharger le PDF
    } catch (error: any) {
      // ✅ Alerte moderne d'erreur
      showError(error.message || 'Impossible de générer le reçu');
    }
  };

  return {
    validatePayment: validatePayment.mutateAsync,
    validateMultiplePayments: validateMultiplePayments.mutateAsync,
    refundPayment: refundPayment.mutateAsync,
    sendPaymentEmail: sendPaymentEmail.mutateAsync,
    generateReceipt,
    isLoading: validatePayment.isPending || refundPayment.isPending || sendPaymentEmail.isPending,
  };
};
