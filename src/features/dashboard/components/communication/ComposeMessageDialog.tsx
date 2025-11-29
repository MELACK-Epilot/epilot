/**
 * Modal de composition de message
 * Design moderne avec couleurs E-Pilot
 * Restreint aux communications Super Admin <-> Admin Groupe
 */

import { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

interface ComposeMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: MessageData) => void;
}

interface MessageData {
  recipientIds: string[]; // UUIDs
  subject: string;
  content: string;
  attachments: File[];
  type: 'direct' | 'group' | 'broadcast';
}

interface UserOption {
  id: string;
  label: string;
  role: string;
}

export const ComposeMessageDialog = ({ isOpen, onClose, onSend }: ComposeMessageDialogProps) => {
  const [selectedRecipients, setSelectedRecipients] = useState<UserOption[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<UserOption[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [messageType, setMessageType] = useState<'direct' | 'group' | 'broadcast'>('direct');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les destinataires autorisés (Admin Groupe uniquement)
  useEffect(() => {
    if (isOpen) {
      const fetchRecipients = async () => {
        setIsLoadingRecipients(true);
        try {
          // Récupérer uniquement les Admin Groupe et Super Admin
          // Exclure les écoles, parents, élèves
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, school_group:school_groups(name)')
            .in('role', ['admin_groupe', 'super_admin'])
            .order('full_name');

          if (error) throw error;

          const options = (data || []).map((user: any) => ({
            id: user.id,
            label: user.full_name || user.email,
            role: user.role === 'super_admin' ? 'Super Admin' : `Admin Groupe (${user.school_group?.name || 'N/A'})`
          }));

          setAvailableRecipients(options);
        } catch (err) {
          console.error('Erreur chargement destinataires:', err);
          setError('Impossible de charger la liste des destinataires');
        } finally {
          setIsLoadingRecipients(false);
        }
      };

      fetchRecipients();
    }
  }, [isOpen]);

  const handleSelectRecipient = (recipient: UserOption) => {
    if (!selectedRecipients.find(r => r.id === recipient.id)) {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
    setOpenCombobox(false);
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipientId));
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
    if (selectedRecipients.length === 0 && messageType !== 'broadcast') {
      setError('Veuillez sélectionner au moins un destinataire');
      return;
    }
    if (!content.trim()) {
      setError('Le message ne peut pas être vide');
      return;
    }

    onSend({
      recipientIds: selectedRecipients.map(r => r.id),
      subject,
      content,
      attachments,
      type: messageType
    });

    // Reset form
    setSelectedRecipients([]);
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
                variant={messageType === 'broadcast' ? 'default' : 'outline'}
                onClick={() => setMessageType('broadcast')}
                className={messageType === 'broadcast' ? 'bg-[#2A9D8F] hover:bg-[#1d7a6f]' : ''}
              >
                <Send className="w-4 h-4 mr-2" />
                Diffusion (Tous)
              </Button>
            </div>
          </div>

          {/* Destinataires (sauf si broadcast) */}
          {messageType !== 'broadcast' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Destinataires (Admin Groupe uniquement) *
              </Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    Sélectionner un destinataire...
                    <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un admin..." />
                    <CommandList>
                      <CommandEmpty>Aucun administrateur trouvé.</CommandEmpty>
                      <CommandGroup>
                        {isLoadingRecipients ? (
                          <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Chargement...
                          </div>
                        ) : (
                          availableRecipients.map((recipient) => (
                            <CommandItem
                              key={recipient.id}
                              value={recipient.label}
                              onSelect={() => handleSelectRecipient(recipient)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedRecipients.find(r => r.id === recipient.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{recipient.label}</span>
                                <span className="text-xs text-gray-500">{recipient.role}</span>
                              </div>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecipients.map((recipient) => (
                    <Badge key={recipient.id} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1">
                      <span className="font-medium">{recipient.label}</span>
                      <span className="text-xs text-gray-500 border-l border-gray-300 pl-1 ml-1">
                        {recipient.role}
                      </span>
                      <button
                        onClick={() => handleRemoveRecipient(recipient.id)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

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
