/**
 * Modale pour afficher une liste de paiements filtrés par type (en retard, en attente, échoués)
 * @module PaymentListModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Clock, XCircle, CheckCircle2, Mail } from 'lucide-react';
import { usePaymentActions } from '../../hooks/usePaymentActions';

interface PaymentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'overdue' | 'pending' | 'failed' | null;
  payments: any[];
  onRefresh?: () => void;
}

export const PaymentListModal = ({
  isOpen,
  onClose,
  type,
  payments,
  onRefresh
}: PaymentListModalProps) => {
  const { validatePayment, sendPaymentEmail } = usePaymentActions();

  if (!type) return null;

  const config = {
    overdue: {
      title: 'Paiements en retard',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      description: 'Liste des paiements dont la date d\'échéance est dépassée.',
    },
    pending: {
      title: 'Paiements en attente',
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      badge: 'bg-yellow-100 text-yellow-700',
      description: 'Paiements en attente de validation ou de traitement.',
    },
    failed: {
      title: 'Paiements échoués',
      icon: XCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      badge: 'bg-orange-100 text-orange-700',
      description: 'Paiements ayant échoué lors de la transaction.',
    },
  }[type];

  const Icon = config.icon;

  const handleAction = async (payment: any, action: 'validate' | 'reminder') => {
    try {
      if (action === 'validate') {
        await validatePayment(payment.id);
      } else if (action === 'reminder') {
        await sendPaymentEmail({ paymentId: payment.id, type: 'reminder' });
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur action:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bg}`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                {config.title}
                <Badge className={config.badge}>{payments.length}</Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {config.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mt-4">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucun paiement dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{payment.school_group_name}</h4>
                      <span className="font-bold text-gray-900">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Ref: {payment.invoice_number}</span>
                      <span>•</span>
                      <span>{payment.plan_name || 'Plan inconnu'}</span>
                      <span>•</span>
                      <span>{payment.due_date ? format(new Date(payment.due_date), 'dd MMM yyyy', { locale: fr }) : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 border-l pl-4">
                    {type === 'pending' && (
                      <Button 
                        size="sm" 
                        className="bg-[#2A9D8F] hover:bg-[#238276]"
                        onClick={() => handleAction(payment, 'validate')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Valider
                      </Button>
                    )}
                    
                    {(type === 'overdue' || type === 'failed') && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-[#E63946] border-[#E63946] hover:bg-[#E63946]/10"
                        onClick={() => handleAction(payment, 'reminder')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Relancer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
