/**
 * Hook pour les actions sur les paiements
 * @module usePaymentActions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

  // Envoyer un email via Edge Function Supabase
  const sendPaymentEmail = useMutation({
    mutationFn: async ({ paymentId, type }: { paymentId: string; type: 'receipt' | 'reminder' | 'overdue' }) => {
      const { data, error } = await supabase.functions.invoke('send-payment-email', {
        body: { paymentId, type },
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de l\'envoi de l\'email');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
      // ✅ Alerte moderne de succès
      showSuccess('Email envoyé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur action:', error);
      // ✅ Alerte moderne d'erreur
      showError(error.message || 'Impossible d\'envoyer l\'email');
    },
  });

  // Supprimer un paiement
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      return paymentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-monthly-stats'] });
      showSuccess('Paiement supprimé avec succès');
    },
    onError: (error: any) => {
      alertOperationFailed('supprimer', 'le paiement', error.message || 'Impossible de supprimer le paiement');
    },
  });

  // Imprimer une facture (ouvre une fenêtre d'impression)
  const printInvoice = (payment: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showError('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les popups.');
      return;
    }

    const formatDate = (date: string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const statusLabel = {
      completed: 'Payé',
      pending: 'En attente',
      overdue: 'En retard',
      failed: 'Échoué',
      refunded: 'Remboursé',
    }[payment.status] || payment.status;

    const statusColor = {
      completed: '#2A9D8F',
      pending: '#E9C46A',
      overdue: '#E63946',
      failed: '#E63946',
      refunded: '#6B7280',
    }[payment.status] || '#6B7280';

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${payment.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .invoice { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1D3557; }
          .logo { font-size: 28px; font-weight: bold; color: #1D3557; }
          .logo span { color: #2A9D8F; }
          .company-info { text-align: right; font-size: 12px; color: #666; }
          .invoice-title { text-align: center; margin-bottom: 30px; }
          .invoice-title h1 { font-size: 32px; color: #1D3557; margin-bottom: 10px; }
          .invoice-number { font-size: 16px; color: #666; }
          .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: bold; color: white; background: ${statusColor}; margin-top: 10px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .detail-box { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #1D3557; }
          .detail-box h3 { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
          .detail-box p { font-size: 16px; font-weight: 600; color: #333; }
          .amount-section { background: linear-gradient(135deg, #1D3557, #2A9D8F); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 40px; }
          .amount-section h2 { font-size: 14px; opacity: 0.8; margin-bottom: 10px; }
          .amount-section .amount { font-size: 48px; font-weight: bold; }
          .amount-section .currency { font-size: 24px; opacity: 0.8; }
          .footer { text-align: center; padding-top: 30px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .footer p { margin-bottom: 5px; }
          @media print { body { padding: 20px; } .invoice { max-width: 100%; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="logo">E-<span>Pilot</span> Congo</div>
              <p style="color: #666; margin-top: 5px;">Plateforme de Gestion Éducative</p>
            </div>
            <div class="company-info">
              <p><strong>E-Pilot Congo SARL</strong></p>
              <p>Brazzaville, République du Congo</p>
              <p>contact@e-pilot.cg</p>
              <p>+242 06 XXX XX XX</p>
            </div>
          </div>

          <div class="invoice-title">
            <h1>FACTURE</h1>
            <p class="invoice-number">${payment.invoice_number}</p>
            <div class="status-badge">${statusLabel}</div>
          </div>

          <div class="details-grid">
            <div class="detail-box">
              <h3>Client</h3>
              <p>${payment.school_group_name || 'N/A'}</p>
            </div>
            <div class="detail-box">
              <h3>Plan d'abonnement</h3>
              <p>${payment.plan_name || 'N/A'}</p>
            </div>
            <div class="detail-box">
              <h3>Méthode de paiement</h3>
              <p>${payment.payment_method?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div class="detail-box">
              <h3>Date d'émission</h3>
              <p>${formatDate(payment.created_at)}</p>
            </div>
            <div class="detail-box">
              <h3>Date d'échéance</h3>
              <p>${formatDate(payment.due_date)}</p>
            </div>
            <div class="detail-box">
              <h3>Date de paiement</h3>
              <p>${formatDate(payment.paid_at)}</p>
            </div>
          </div>

          <div class="amount-section">
            <h2>MONTANT TOTAL</h2>
            <p class="amount">${(payment.amount || 0).toLocaleString('fr-FR')} <span class="currency">${payment.currency || 'FCFA'}</span></p>
          </div>

          <div class="footer">
            <p><strong>E-Pilot Congo SARL</strong> - Brazzaville, République du Congo</p>
            <p>RCCM: CG-BZV-01-2024-XXXXX | NIF: XXXXXXXXXX</p>
            <p>Cette facture a été générée automatiquement par E-Pilot.</p>
            <p style="margin-top: 15px; font-style: italic;">Merci pour votre confiance !</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Générer et télécharger un reçu PDF
  const generateReceipt = (payment: any) => {
    // Création d'un reçu simplifié en HTML puis téléchargement
    const formatDate = (date: string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Reçu ${payment.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #2A9D8F; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #1D3557; }
          .logo span { color: #2A9D8F; }
          h1 { color: #2A9D8F; margin: 20px 0; }
          .info { margin: 15px 0; }
          .info label { color: #666; font-size: 12px; display: block; }
          .info p { font-size: 16px; font-weight: bold; margin: 5px 0 0 0; }
          .amount { background: #f0f9f7; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .amount p { font-size: 32px; color: #2A9D8F; font-weight: bold; margin: 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">E-<span>Pilot</span> Congo</div>
          <p>Brazzaville, République du Congo</p>
        </div>
        <h1>REÇU DE PAIEMENT</h1>
        <div class="info"><label>Numéro de facture</label><p>${payment.invoice_number}</p></div>
        <div class="info"><label>Client</label><p>${payment.school_group_name || 'N/A'}</p></div>
        <div class="info"><label>Plan</label><p>${payment.plan_name || 'N/A'}</p></div>
        <div class="info"><label>Date de paiement</label><p>${formatDate(payment.paid_at)}</p></div>
        <div class="amount"><p>${(payment.amount || 0).toLocaleString('fr-FR')} ${payment.currency || 'FCFA'}</p></div>
        <div class="footer">
          <p>Ce reçu confirme le paiement effectué.</p>
          <p>E-Pilot Congo SARL - Brazzaville, République du Congo</p>
        </div>
      </body>
      </html>
    `;

    // Créer un blob et télécharger
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recu_${payment.invoice_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Reçu téléchargé avec succès');
  };

  return {
    validatePayment: validatePayment.mutateAsync,
    validateMultiplePayments: validateMultiplePayments.mutateAsync,
    refundPayment: refundPayment.mutateAsync,
    sendPaymentEmail: sendPaymentEmail.mutateAsync,
    deletePayment: deletePayment.mutateAsync,
    printInvoice,
    generateReceipt,
    isLoading: validatePayment.isPending || refundPayment.isPending || sendPaymentEmail.isPending || deletePayment.isPending,
  };
};
