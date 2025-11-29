/**
 * Modal Paiement - Design Simplifié
 * @module ModernPaymentModal
 */

import { X, Printer, Download, CheckCircle2, Clock, XCircle, CreditCard, Calendar, Building2, FileText, Mail, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface ModernPaymentModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice?: () => void;
  onGenerateReceipt?: () => void;
  onValidate?: () => void;
  onRefund?: () => void;
  onSendEmail?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export const ModernPaymentModal = ({
  payment,
  isOpen,
  onClose,
  onPrintInvoice,
  onGenerateReceipt,
  onValidate,
  onRefund,
  onSendEmail,
  onDelete,
  isLoading = false,
}: ModernPaymentModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!payment) return null;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      completed: {
        color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20',
        icon: CheckCircle2,
        label: 'Complété',
        gradient: 'from-[#2A9D8F] to-[#21867A]',
      },
      pending: {
        color: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20',
        icon: Clock,
        label: 'En attente',
        gradient: 'from-[#E9C46A] to-[#D4AF37]',
      },
      overdue: {
        color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20',
        icon: XCircle,
        label: 'En retard',
        gradient: 'from-[#E63946] to-[#C72030]',
      },
      failed: {
        color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20',
        icon: XCircle,
        label: 'Échoué',
        gradient: 'from-[#E63946] to-[#C72030]',
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(payment.detailed_status || payment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal centré */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card principale */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                {/* Header simple */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Paiement {payment.invoice_number}</h2>
                    <Badge className={`${statusConfig.color} mt-1`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Contenu */}
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  {/* Montant */}
                  <div className="text-center py-4 mb-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-gray-900">
                      {(payment.amount || 0).toLocaleString()} <span className="text-lg text-gray-500">{payment.currency || 'FCFA'}</span>
                    </p>
                  </div>

                  {/* Infos en liste simple */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="font-medium text-gray-900">{payment.school_group_name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Méthode</p>
                        <p className="font-medium text-gray-900 capitalize">{payment.payment_method?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>

                    {payment.plan_name && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Plan</p>
                          <p className="font-medium text-gray-900">{payment.plan_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Payé le</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {payment.paid_at ? format(new Date(payment.paid_at), 'dd/MM/yyyy', { locale: fr }) : '-'}
                          </p>
                        </div>
                      </div>
                      {payment.due_date && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Échéance</p>
                            <p className="font-medium text-gray-900 text-sm">
                              {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {payment.days_overdue > 0 && (
                      <p className="text-sm text-red-600 text-center">⚠️ En retard de {payment.days_overdue} jour(s)</p>
                    )}
                  </div>

                  {/* Confirmation suppression */}
                  <AnimatePresence>
                    {showDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-sm text-red-700 mb-2">Supprimer ce paiement ?</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => { onDelete?.(); setShowDeleteConfirm(false); }} disabled={isLoading}>
                            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Confirmer'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {onPrintInvoice && (
                      <Button size="sm" onClick={onPrintInvoice} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-1" /> Imprimer
                      </Button>
                    )}
                    {onGenerateReceipt && payment.status === 'completed' && (
                      <Button size="sm" onClick={onGenerateReceipt} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-1" /> Reçu
                      </Button>
                    )}
                    {onValidate && (payment.status === 'pending' || payment.detailed_status === 'overdue') && (
                      <Button size="sm" onClick={onValidate} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Valider
                      </Button>
                    )}
                    {onSendEmail && (
                      <Button size="sm" variant="outline" onClick={onSendEmail} disabled={isLoading}>
                        <Mail className="w-4 h-4 mr-1" /> Email
                      </Button>
                    )}
                    {onRefund && payment.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={onRefund} disabled={isLoading} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                        <RefreshCw className="w-4 h-4 mr-1" /> Rembourser
                      </Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)} disabled={isLoading || showDeleteConfirm} className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModernPaymentModal;
