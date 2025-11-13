/**
 * MODAL PAIEMENT MODERNE - NIVEAU PROFESSIONNEL
 * Popup centré avec design glassmorphism
 * @module ModernPaymentModal
 */

import { X, Receipt, Printer, Download, CheckCircle2, Clock, XCircle, CreditCard, Calendar, Building2, DollarSign, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernPaymentModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice?: () => void;
  onGenerateReceipt?: () => void;
  onValidate?: () => void;
  onRefund?: () => void;
  onSendEmail?: () => void;
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
}: ModernPaymentModalProps) => {
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
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header avec gradient */}
                <div className={`relative bg-gradient-to-r ${statusConfig.gradient} p-6 text-white overflow-hidden`}>
                  {/* Cercles décoratifs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Receipt className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Détails du Paiement</h2>
                        <p className="text-white/80 text-sm mt-1">
                          {payment.invoice_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Statut badge */}
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-semibold">{statusConfig.label}</span>
                  </div>
                </div>

                {/* Contenu scrollable */}
                <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
                  {/* Montant principal */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Montant</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {(payment.amount || 0).toLocaleString()} <span className="text-2xl text-gray-600">{payment.currency || 'FCFA'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Informations en grille */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Groupe Scolaire */}
                    <div className="col-span-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-medium mb-1">Groupe Scolaire</p>
                          <p className="font-semibold text-gray-900">{payment.school_group_name || 'N/A'}</p>
                          {payment.school_group_city && (
                            <p className="text-sm text-gray-600 mt-1">
                              {payment.school_group_city}, {payment.school_group_region}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Méthode de paiement */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600 font-medium mb-1">Méthode</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {payment.payment_method?.replace('_', ' ') || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date de paiement */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">Date de paiement</p>
                          <p className="font-semibold text-gray-900">
                            {payment.paid_at ? format(new Date(payment.paid_at), 'dd MMMM yyyy', { locale: fr }) : 'Non payé'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plan */}
                    {payment.plan_name && (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-amber-600 font-medium mb-1">Plan</p>
                            <p className="font-semibold text-gray-900">{payment.plan_name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Date d'échéance */}
                    {payment.due_date && (
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-600 font-medium mb-1">Échéance</p>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(payment.due_date), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                            {payment.days_overdue > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                En retard de {payment.days_overdue} jour(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {payment.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                      <p className="text-xs text-gray-600 font-medium mb-2">Notes</p>
                      <p className="text-sm text-gray-700">{payment.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {onPrintInvoice && (
                      <Button
                        onClick={onPrintInvoice}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer Facture
                      </Button>
                    )}

                    {onGenerateReceipt && payment.status === 'completed' && (
                      <Button
                        onClick={onGenerateReceipt}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger Reçu
                      </Button>
                    )}

                    {onValidate && payment.status === 'pending' && (
                      <Button
                        onClick={onValidate}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Valider Paiement
                      </Button>
                    )}

                    {onSendEmail && (
                      <Button
                        onClick={onSendEmail}
                        variant="outline"
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer Email
                      </Button>
                    )}

                    {onRefund && payment.status === 'completed' && (
                      <Button
                        onClick={onRefund}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rembourser
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
