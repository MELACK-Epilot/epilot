/**
 * ModifyPlanModal - Modal pour modifier le plan d'un abonnement
 * Changer vers un autre plan existant
 * @module ModifyPlanModal
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, ArrowRight, DollarSign, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModifyPlanModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string, newPlanId: string, reason: string, immediate: boolean) => void;
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
  const [isImmediate, setIsImmediate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Debug: Logger les plans disponibles
  useEffect(() => {
    console.log('🔍 ModifyPlanModal - Plans disponibles:', availablePlans);
    console.log('🔍 ModifyPlanModal - Subscription actuelle:', subscription);
  }, [availablePlans, subscription]);

  if (!subscription) return null;

  // Calculer la différence de prix
  const currentPlan = availablePlans.find(p => p.id === subscription.planId);
  const newPlan = availablePlans.find(p => p.id === selectedPlanId);
  const currentPrice = currentPlan?.price || subscription.planPrice || subscription.amount || 0;
  const newPrice = newPlan?.price || 0;
  const priceDifference = newPrice - currentPrice;

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
      await onConfirm(subscription.id, selectedPlanId, reason.trim(), isImmediate);
      toast({
        title: 'Plan modifié',
        description: 'Le plan de l\'abonnement a été modifié avec succès.',
      });
      handleClose();
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
      setIsImmediate(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                {currentPrice.toLocaleString()} FCFA
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
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{plan.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {plan.price.toLocaleString()} FCFA
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Différence de Prix */}
          {selectedPlanId && (
            <Card className={`p-3 ${priceDifference >= 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${priceDifference >= 0 ? 'text-green-600' : 'text-blue-600'}`} />
                <div>
                  <p className="text-sm font-medium">
                    {priceDifference >= 0 ? 'Augmentation' : 'Réduction'} de prix
                  </p>
                  <p className={`text-lg font-semibold ${priceDifference >= 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    {priceDifference >= 0 ? '+' : ''}{priceDifference.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Date d'effet */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gray-500" />
              <div className="space-y-0.5">
                <Label htmlFor="immediate" className="text-sm font-medium cursor-pointer">Appliquer immédiatement</Label>
                <p className="text-xs text-gray-500">
                  {isImmediate ? "Le changement sera effectif maintenant" : "À la prochaine échéance"}
                </p>
              </div>
            </div>
            <Switch id="immediate" checked={isImmediate} onCheckedChange={setIsImmediate} />
          </div>

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

          {/* Alerte si augmentation immédiate */}
          {selectedPlanId && isImmediate && priceDifference > 0 && (
            <Card className="p-3 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Prorata à facturer</p>
                  <p className="text-yellow-700 text-xs">
                    Une facture de régularisation devra être émise pour la période restante.
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
            {isLoading ? 'Modification...' : 'Confirmer le changement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
