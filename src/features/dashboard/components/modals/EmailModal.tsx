/**
 * Modal d'envoi d'email moderne avec destinataires multiples
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, X, Loader2, Send, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (emailData: EmailData) => Promise<void>;
  selectedSchools?: string[];
  schoolNames?: string[];
}

export interface EmailData {
  recipients: string[];
  subject: string;
  message: string;
  attachReport: boolean;
  attachDetails: boolean;
}

export const EmailModal = ({
  open,
  onOpenChange,
  onSend,
  selectedSchools = [],
  schoolNames = [],
}: EmailModalProps) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [subject, setSubject] = useState('Rapport Financier - Groupe Scolaire');
  const [message, setMessage] = useState(
    'Bonjour,\n\nVeuillez trouver ci-joint le rapport financier pour la période sélectionnée.\n\nCordialement,'
  );
  const [attachReport, setAttachReport] = useState(true);
  const [attachDetails, setAttachDetails] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const addRecipient = () => {
    if (!currentEmail) {
      setEmailError('Veuillez entrer une adresse email');
      return;
    }
    if (!validateEmail(currentEmail)) {
      setEmailError('Adresse email invalide');
      return;
    }
    if (recipients.includes(currentEmail)) {
      setEmailError('Cette adresse est déjà ajoutée');
      return;
    }
    setRecipients([...recipients, currentEmail]);
    setCurrentEmail('');
    setEmailError('');
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      setEmailError('Ajoutez au moins un destinataire');
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        recipients,
        subject,
        message,
        attachReport,
        attachDetails,
      });
      onOpenChange(false);
      // Reset form
      setRecipients([]);
      setCurrentEmail('');
      setSubject('Rapport Financier - Groupe Scolaire');
      setMessage('Bonjour,\n\nVeuillez trouver ci-joint le rapport financier pour la période sélectionnée.\n\nCordialement,');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      setEmailError('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-6 h-6 text-blue-600" />
            Envoyer le rapport par email
          </DialogTitle>
          <DialogDescription>
            {selectedSchools.length > 0
              ? `Rapport pour ${selectedSchools.length} école(s) sélectionnée(s)`
              : 'Rapport pour toutes les écoles'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Écoles concernées */}
          {schoolNames.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                Écoles concernées :
              </Label>
              <div className="flex flex-wrap gap-2">
                {schoolNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Destinataires */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Destinataires *</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={currentEmail}
                onChange={(e) => {
                  setCurrentEmail(e.target.value);
                  setEmailError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
              />
              <Button onClick={addRecipient} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
            
            {/* Liste des destinataires */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                <AnimatePresence>
                  {recipients.map((email) => (
                    <motion.div
                      key={email}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge className="gap-2 pr-1 bg-blue-600 hover:bg-blue-700">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="hover:bg-blue-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-semibold">
              Sujet *
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-semibold">
              Message *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Pièces jointes */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Pièces jointes</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attach-report"
                  checked={attachReport}
                  onCheckedChange={(checked) => setAttachReport(checked as boolean)}
                />
                <Label htmlFor="attach-report" className="cursor-pointer">
                  Rapport financier complet (PDF)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attach-details"
                  checked={attachDetails}
                  onCheckedChange={(checked) => setAttachDetails(checked as boolean)}
                />
                <Label htmlFor="attach-details" className="cursor-pointer">
                  Détails par école (Excel)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending || recipients.length === 0} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
