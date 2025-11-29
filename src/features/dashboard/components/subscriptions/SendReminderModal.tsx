/**
 * SendReminderModal - Modal pour envoyer une relance de paiement
 * Permet de confirmer l'envoi d'un email de rappel
 * @module SendReminderModal
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, Loader2, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SendReminderModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
}

export const SendReminderModal = ({
  subscription,
  isOpen,
  onClose,
}: SendReminderModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!subscription) return null;

  const handleSend = async () => {
    setIsLoading(true);
    
    // Simulation de l'envoi (à connecter à une API réelle plus tard)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simuler délai réseau
      
      toast({
        title: 'Relance envoyée',
        description: `Un email de rappel a été envoyé à ${subscription.schoolGroupName}.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer la relance.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Mail className="w-5 h-5" />
            Envoyer une Relance
          </DialogTitle>
          <DialogDescription>
            Notifier le groupe scolaire du retard de paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4 border-orange-100 bg-orange-50/50">
            <div className="flex gap-3">
              <div className="p-2 bg-orange-100 rounded-full h-fit">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{subscription.schoolGroupName}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ce groupe a un paiement en retard de <span className="font-bold text-orange-700">{(subscription.planPrice || subscription.amount || 0).toLocaleString()} FCFA</span>.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Message qui sera envoyé :</p>
            <Card className="p-3 text-sm text-gray-600 bg-gray-50 border-gray-200 italic">
              "Bonjour, sauf erreur de notre part, nous n'avons pas encore reçu le paiement de votre abonnement <strong>{subscription.planName}</strong>. Merci de régulariser votre situation rapidement pour éviter une suspension de service."
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer la Relance
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
