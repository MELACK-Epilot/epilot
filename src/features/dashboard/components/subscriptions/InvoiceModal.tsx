/**
 * InvoiceModal - Modal de génération et visualisation de facture
 * Génération automatique depuis abonnement
 * @module InvoiceModal
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, DollarSign, FileText, Download, Send, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (invoiceData: any) => void;
}

export const InvoiceModal = ({
  subscription,
  isOpen,
  onClose,
  onGenerate,
}: InvoiceModalProps) => {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  // Calculer les dates de la période facturée
  const periodStart = new Date(subscription.startDate);
  const periodEnd = new Date(subscription.endDate);

  // Calculer la date d'échéance (30 jours après génération)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Calculer les montants
  const subtotal = subscription.amount;
  const taxRate = 0; // Pas de TVA pour l'instant
  const taxAmount = 0;
  const discountAmount = 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  // Générer le numéro de facture (simulation)
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const invoiceData = {
        subscriptionId: subscription.id,
        schoolGroupId: subscription.schoolGroupId,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        periodStart,
        periodEnd,
        notes: notes.trim() || null,
        items: [
          {
            description: `Abonnement ${subscription.planName} - ${format(periodStart, 'MMMM yyyy', { locale: fr })}`,
            quantity: 1,
            unitPrice: subtotal,
            totalPrice: subtotal,
            referenceType: 'subscription',
            referenceId: subscription.id,
          }
        ]
      };

      await onGenerate(invoiceData);

      toast({
        title: 'Facture générée',
        description: `La facture ${invoiceNumber} a été créée avec succès.`,
      });

      onClose();
      setNotes('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer la facture.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
      setNotes('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2A9D8F]" />
            Générer une Facture
          </DialogTitle>
          <DialogDescription>
            Créer une facture pour l'abonnement de {subscription.schoolGroupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête de la facture */}
          <Card className="p-6 bg-gradient-to-r from-[#2A9D8F]/5 to-[#457B9D]/5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Facture</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Numéro:</span> {invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(), 'dd/MM/yyyy')}</p>
                  <p><span className="font-medium">Échéance:</span> {format(dueDate, 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Client
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{subscription.schoolGroupName}</p>
                  <p>{subscription.schoolGroupCode}</p>
                  <Badge variant="outline" className="mt-1">
                    {subscription.planName}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Période facturée */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#E9C46A]" />
              <h4 className="font-medium">Période facturée</h4>
            </div>
            <div className="text-sm text-gray-600">
              Du {format(periodStart, 'dd MMMM yyyy', { locale: fr })} au {format(periodEnd, 'dd MMMM yyyy', { locale: fr })}
            </div>
          </Card>

          {/* Détail des éléments */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Détail des prestations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex-1">
                  <p className="font-medium">Abonnement {subscription.planName}</p>
                  <p className="text-sm text-gray-600">
                    {format(periodStart, 'MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{subtotal.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500">Qty: 1</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Résumé des montants */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Résumé</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>TVA ({taxRate}%)</span>
                  <span>{taxAmount.toLocaleString()} FCFA</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise</span>
                  <span>-{discountAmount.toLocaleString()} FCFA</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-[#2A9D8F]">{totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des notes à la facture..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions disponibles */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Actions disponibles après génération</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Download className="w-4 h-4 text-[#2A9D8F]" />
                <span>Exporter PDF</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Send className="w-4 h-4 text-[#457B9D]" />
                <span>Envoyer par email</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[#E9C46A]" />
                <span>Marquer payée</span>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
          >
            {isGenerating ? 'Génération...' : 'Générer la Facture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
