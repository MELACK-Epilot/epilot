import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Users,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smile,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export const MessageModal = ({ isOpen, onClose, schoolName, schoolId }: MessageModalProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'info'>('normal');
  const [recipients, setRecipients] = useState<string[]>(['all']);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);

  const priorityOptions = [
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'info', label: 'Information', color: 'bg-green-100 text-green-800 border-green-200' },
  ];

  const recipientOptions = [
    { value: 'all', label: 'Tout le personnel', icon: Users },
    { value: 'teachers', label: 'Enseignants', icon: Users },
    { value: 'admin', label: 'Administration', icon: Users },
    { value: 'parents', label: 'Parents', icon: Users },
  ];

  const handleFileAttach = () => {
    // Simulation d'ajout de fichier
    const newFile: Attachment = {
      id: Date.now().toString(),
      name: `Document_${attachments.length + 1}.pdf`,
      size: Math.floor(Math.random() * 5000000),
      type: 'application/pdf',
    };
    setAttachments([...attachments, newFile]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le sujet et le message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulation d'envoi
    setTimeout(() => {
      toast({
        title: "Message envoyé !",
        description: `Votre message a été envoyé à ${schoolName}.`,
      });
      setIsSending(false);
      setSubject('');
      setMessage('');
      setAttachments([]);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Envoyer un message</DialogTitle>
              <DialogDescription>
                Message à l'école : <span className="font-semibold text-[#2A9D8F]">{schoolName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Destinataires */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#2A9D8F]" />
              Destinataires
            </Label>
            <div className="flex flex-wrap gap-2">
              {recipientOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={recipients.includes(option.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (recipients.includes(option.value)) {
                      setRecipients(recipients.filter(r => r !== option.value));
                    } else {
                      setRecipients([...recipients, option.value]);
                    }
                  }}
                  className={recipients.includes(option.value) 
                    ? "bg-[#2A9D8F] hover:bg-[#238b7e]" 
                    : ""}
                >
                  <option.icon className="h-4 w-4 mr-2" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priorité */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#2A9D8F]" />
              Priorité du message
            </Label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <Badge
                  key={option.value}
                  className={`cursor-pointer px-4 py-2 ${
                    priority === option.value 
                      ? option.color 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                  onClick={() => setPriority(option.value as any)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#2A9D8F]" />
              Sujet
            </Label>
            <Input
              id="subject"
              placeholder="Objet du message..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-gray-300 focus:border-[#2A9D8F] focus:ring-[#2A9D8F]"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#2A9D8F]" />
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message ici..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="border-gray-300 focus:border-[#2A9D8F] focus:ring-[#2A9D8F] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2A9D8F]">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2A9D8F]">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-xs text-gray-500">{message.length} / 5000 caractères</span>
            </div>
          </div>

          {/* Pièces jointes */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-[#2A9D8F]" />
              Pièces jointes
            </Label>
            <Button
              variant="outline"
              onClick={handleFileAttach}
              className="w-full border-dashed border-2 hover:border-[#2A9D8F] hover:bg-[#2A9D8F]/5"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Ajouter des fichiers
            </Button>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {attachments.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#2A9D8F]" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(file.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSending}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
