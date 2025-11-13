/**
 * Modal de composition de message
 * Design moderne avec couleurs E-Pilot
 */

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  X, 
  Users, 
  User,
  FileText,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface ComposeMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: MessageData) => void;
}

interface MessageData {
  recipients: string[];
  subject: string;
  content: string;
  attachments: File[];
  type: 'direct' | 'group' | 'broadcast';
}

export const ComposeMessageDialog = ({ isOpen, onClose, onSend }: ComposeMessageDialogProps) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [messageType, setMessageType] = useState<'direct' | 'group' | 'broadcast'>('direct');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !recipients.includes(recipientInput.trim())) {
      setRecipients([...recipients, recipientInput.trim()]);
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setRecipients(recipients.filter(r => r !== recipient));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      
      const validFiles = newFiles.filter(file => {
        if (file.size > MAX_SIZE) {
          setError(`${file.name} est trop volumineux (max 10MB)`);
          return false;
        }
        return true;
      });
      
      setAttachments([...attachments, ...validFiles]);
      setError(null);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (recipients.length === 0) {
      setError('Veuillez ajouter au moins un destinataire');
      return;
    }
    if (!content.trim()) {
      setError('Le message ne peut pas être vide');
      return;
    }

    onSend({
      recipients,
      subject,
      content,
      attachments,
      type: messageType
    });

    // Reset form
    setRecipients([]);
    setSubject('');
    setContent('');
    setAttachments([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            Nouveau Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Type de message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type de message</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={messageType === 'direct' ? 'default' : 'outline'}
                onClick={() => setMessageType('direct')}
                className={messageType === 'direct' ? 'bg-[#2A9D8F] hover:bg-[#1d7a6f]' : ''}
              >
                <User className="w-4 h-4 mr-2" />
                Direct
              </Button>
              <Button
                type="button"
                variant={messageType === 'group' ? 'default' : 'outline'}
                onClick={() => setMessageType('group')}
                className={messageType === 'group' ? 'bg-[#2A9D8F] hover:bg-[#1d7a6f]' : ''}
              >
                <Users className="w-4 h-4 mr-2" />
                Groupe
              </Button>
              <Button
                type="button"
                variant={messageType === 'broadcast' ? 'default' : 'outline'}
                onClick={() => setMessageType('broadcast')}
                className={messageType === 'broadcast' ? 'bg-[#2A9D8F] hover:bg-[#1d7a6f]' : ''}
              >
                <Send className="w-4 h-4 mr-2" />
                Diffusion
              </Button>
            </div>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <Label htmlFor="recipients" className="text-sm font-medium text-gray-700">
              Destinataires *
            </Label>
            <div className="flex gap-2">
              <Input
                id="recipients"
                placeholder="Nom ou email du destinataire..."
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddRecipient} variant="outline">
                Ajouter
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((recipient, index) => (
                  <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                    {recipient}
                    <button
                      onClick={() => handleRemoveRecipient(recipient)}
                      className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
              Sujet
            </Label>
            <Input
              id="subject"
              placeholder="Objet du message..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Message *
            </Label>
            <Textarea
              id="content"
              placeholder="Écrivez votre message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Pièces jointes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Pièces jointes</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Ajouter des fichiers
            </Button>
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6f] hover:from-[#1D3557] hover:to-[#0d1f3d] text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
