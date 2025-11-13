/**
 * AddNoteModal - Modal pour ajouter une note à un abonnement
 * Commentaire interne pour suivi
 * @module AddNoteModal
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddNoteModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string, note: string, type: string) => void;
}

const NOTE_TYPES = [
  { value: 'general', label: 'Général', color: 'bg-blue-100 text-blue-800' },
  { value: 'payment', label: 'Paiement', color: 'bg-green-100 text-green-800' },
  { value: 'technical', label: 'Technique', color: 'bg-purple-100 text-purple-800' },
  { value: 'complaint', label: 'Réclamation', color: 'bg-red-100 text-red-800' },
  { value: 'upgrade', label: 'Mise à niveau', color: 'bg-yellow-100 text-yellow-800' },
];

export const AddNoteModal = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
}: AddNoteModalProps) => {
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  const handleConfirm = async () => {
    if (!note.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une note.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(subscription.id, note.trim(), noteType);
      toast({
        title: 'Note ajoutée',
        description: 'La note a été ajoutée avec succès.',
      });
      onClose();
      setNote('');
      setNoteType('general');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la note.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setNote('');
      setNoteType('general');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#457B9D]" />
            Ajouter une Note
          </DialogTitle>
          <DialogDescription>
            Ajouter un commentaire interne pour l'abonnement de {subscription.schoolGroupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informations de l'abonnement */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{subscription.schoolGroupName}</span>
              <span>•</span>
              <span>{subscription.planName}</span>
            </div>
          </div>

          {/* Type de note */}
          <div className="space-y-2">
            <Label htmlFor="noteType">Type de note</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 ${type.color}`}>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contenu de la note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Saisissez votre note ou commentaire..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {note.length}/500 caractères
            </p>
          </div>

          {/* Aperçu du type sélectionné */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Type :</span>
            {NOTE_TYPES.find(t => t.value === noteType) && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${NOTE_TYPES.find(t => t.value === noteType)?.color}`}>
                {NOTE_TYPES.find(t => t.value === noteType)?.label}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!note.trim() || isLoading}
            className="bg-[#457B9D] hover:bg-[#3A5F7A]"
          >
            {isLoading ? 'Ajout...' : 'Ajouter la Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
