/**
 * UpdatePaymentStatusModal - Modal pour modifier le statut de paiement
 * Permet de changer payment_status d'un abonnement
 * @module UpdatePaymentStatusModal
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateSubscription } from '../../hooks/useSubscriptions';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

interface UpdatePaymentStatusModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatePaymentStatusModal = ({
  subscription,
  isOpen,
  onClose,
}: UpdatePaymentStatusModalProps) => {
  const { toast } = useToast();
  const { mutate: updateSubscription, isPending } = useUpdateSubscription();
  const [paymentStatus, setPaymentStatus] = useState<string>(subscription?.paymentStatus || 'paid');

  const handleSubmit = () => {
    if (!subscription) return;

    updateSubscription(
      {
        id: subscription.id,
        paymentStatus,
      },
      {
        onSuccess: () => {
          toast({
            title: '✅ Statut mis à jour',
            description: 'Le statut de paiement a été modifié avec succès',
          });
          onClose();
        },
        onError: (error) => {
          console.error('Erreur mise à jour statut:', error);
          toast({
            title: '❌ Erreur',
            description: 'Impossible de modifier le statut de paiement',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!subscription) return null;

  const statusOptions = [
    { value: 'paid', label: '✅ Payé', description: 'Le paiement a été effectué', color: 'text-[#2A9D8F]' },
    { value: 'pending', label: '⏳ En attente', description: 'En attente de paiement', color: 'text-[#E9C46A]' },
    { value: 'overdue', label: '⚠️ En retard', description: 'Paiement en retard', color: 'text-[#E63946]' },
    { value: 'failed', label: '❌ Échoué', description: 'Le paiement a échoué', color: 'text-gray-600' },
  ];

  const currentStatus = statusOptions.find(opt => opt.value === paymentStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2A9D8F]" />
            Modifier le Statut de Paiement
          </DialogTitle>
          <DialogDescription>
            Groupe : <strong>{subscription.schoolGroupName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Statut actuel */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Statut actuel</p>
            <p className={`text-base font-semibold ${currentStatus?.color}`}>
              {currentStatus?.label}
            </p>
          </div>

          {/* Sélecteur de statut */}
          <div className="space-y-2">
            <Label htmlFor="payment-status" className="text-base font-semibold">
              Nouveau Statut
            </Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger id="payment-status" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col py-1">
                      <span className={`font-medium ${option.color}`}>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informations abonnement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              <strong>Plan :</strong> {subscription.planName} • <strong>Montant :</strong> {subscription.amount.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || paymentStatus === subscription.paymentStatus}
            className="bg-[#2A9D8F] hover:bg-[#238276]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mettre à Jour
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
