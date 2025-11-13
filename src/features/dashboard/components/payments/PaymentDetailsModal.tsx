/**
 * Modal détails d'un paiement avec timeline et actions
 * @module PaymentDetailsModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Receipt,
  Download,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Building2,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PaymentDetailsModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  onGenerateReceipt?: () => void;
  onRefund?: () => void;
  onContact?: () => void;
}

export const PaymentDetailsModal = ({
  payment,
  isOpen,
  onClose,
  onGenerateReceipt,
  onRefund,
  onContact,
}: PaymentDetailsModalProps) => {
  if (!payment) return null;

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Complété' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En attente' },
      failed: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Échoué' },
      refunded: { color: 'bg-gray-100 text-gray-700', icon: RefreshCw, label: 'Remboursé' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">Détails du Paiement</p>
              <p className="text-sm text-gray-500 font-normal">#{payment.id?.slice(0, 8)}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut et Montant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Montant</p>
              <p className="text-2xl font-bold text-blue-900">
                {payment.amount?.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-4 bg-white border rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Statut</p>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Informations Principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Payeur</p>
                  <p className="font-medium">{payment.payerName || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{payment.payerEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">École</p>
                  <p className="font-medium">{payment.schoolName || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Méthode</p>
                  <p className="font-medium">{payment.paymentMethod || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {payment.paymentDate
                      ? format(new Date(payment.paymentDate), 'dd MMMM yyyy', { locale: fr })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Référence</p>
                  <p className="font-medium font-mono text-sm">{payment.reference || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{payment.type || 'Frais scolaires'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {payment.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {payment.description}
                </p>
              </div>
            </>
          )}

          {/* Timeline */}
          <Separator />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Historique</p>
            <div className="space-y-3">
              {payment.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Paiement créé</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
              {payment.validatedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Paiement validé</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.validatedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
              {payment.status === 'completed' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Paiement complété</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.updatedAt || payment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {onGenerateReceipt && (
              <Button
                onClick={onGenerateReceipt}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Générer Reçu
              </Button>
            )}
            {onContact && (
              <Button variant="outline" onClick={onContact} className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Contacter
              </Button>
            )}
            {onRefund && payment.status === 'completed' && (
              <Button variant="outline" onClick={onRefund} className="flex-1 border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="w-4 h-4 mr-2" />
                Rembourser
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
