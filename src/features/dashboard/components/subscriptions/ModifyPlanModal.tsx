/**
 * ModifyPlanModal - Modal pour modifier le plan d'un abonnement
 * Changer vers un autre plan existant
 * @module ModifyPlanModal
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModifyPlanModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string, newPlanId: string, reason: string) => void;
  availablePlans?: any[];
}

export const ModifyPlanModal = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  availablePlans = [],
}: ModifyPlanModalProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  // Calculer la différence de prix
  const currentPlan = availablePlans.find(p => p.id === subscription.planId);
  const newPlan = availablePlans.find(p => p.id === selectedPlanId);
  const priceDifference = newPlan && currentPlan ? newPlan.price - currentPlan.price : 0;

  const handleConfirm = async () => {
    if (!selectedPlanId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un nouveau plan.',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez indiquer la raison du changement.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(subscription.id, selectedPlanId, reason.trim());
      toast({
        title: 'Plan modifié',
        description: 'Le plan de l\'abonnement a été modifié avec succès.',
      });
      onClose();
      setSelectedPlanId('');
      setReason('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le plan.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setSelectedPlanId('');
      setReason('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-[#2A9D8F]" />
            Modifier le Plan
          </DialogTitle>
          <DialogDescription>
            Changer le plan de l'abonnement de {subscription.schoolGroupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Actuel */}
          <Card className="p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Plan actuel</p>
                <p className="text-lg font-semibold text-[#2A9D8F]">{subscription.planName}</p>
              </div>
              <Badge variant="outline" className="text-[#2A9D8F] border-[#2A9D8F]">
                {currentPlan?.price || subscription.amount} FCFA
              </Badge>
            </div>
          </Card>

          {/* Nouveau Plan */}
          <div className="space-y-2">
            <Label htmlFor="newPlan">Nouveau plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un nouveau plan" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans
                  .filter(plan => plan.id !== subscription.planId)
                  .map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{plan.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {plan.price} FCFA
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Différence de Prix */}
          {selectedPlanId && (
            <Card className={`p-3 ${priceDifference >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm font-medium">
                    {priceDifference >= 0 ? 'Augmentation' : 'Réduction'} de prix
                  </p>
                  <p className={`text-lg font-semibold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceDifference >= 0 ? '+' : ''}{priceDifference} FCFA
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du changement</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez la raison du changement de plan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Alerte si différence de prix */}
          {priceDifference > 0 && (
            <Card className="p-3 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Augmentation de prix</p>
                  <p className="text-yellow-700">
                    Le nouveau plan coûte {priceDifference} FCFA de plus par période.
                    L'abonnement sera mis à jour immédiatement.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlanId || !reason.trim() || isLoading}
            className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
          >
            {isLoading ? 'Modification...' : 'Modifier le Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
