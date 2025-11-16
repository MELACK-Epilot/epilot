import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Send,
  Paperclip,
  X,
  Crown,
  Mail,
  AlertCircle,
  CheckCircle2,
  User,
  Users,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  schoolGroupId: string;
}

interface GroupAdmin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
}

export const ContactAdminModal = ({ 
  isOpen, 
  onClose, 
  groupName,
  schoolGroupId
}: ContactAdminModalProps) => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<GroupAdmin[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'info'>('normal');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les admins du groupe
  useEffect(() => {
    if (isOpen && schoolGroupId) {
      loadGroupAdmins();
    }
  }, [isOpen, schoolGroupId]);

  const loadGroupAdmins = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, avatar')
        .eq('school_group_id', schoolGroupId)
        .eq('role', 'admin_groupe')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setAdmins(data || []);
      
      // Sélectionner tous les admins par défaut
      if (data && data.length > 0) {
        setSelectedAdmins(data.map(admin => admin.id));
      }
    } catch (error) {
      console.error('Erreur chargement admins:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les administrateurs du groupe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAdmin = (adminId: string) => {
    setSelectedAdmins(prev =>
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const selectAll = () => {
    if (selectedAdmins.length === filteredAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(filteredAdmins.map(a => a.id));
    }
  };

  const priorityOptions = [
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'info', label: 'Information', color: 'bg-green-100 text-green-800 border-green-200' },
  ];

  const handleFileAttach = () => {
    const newFile: Attachment = {
      id: Date.now().toString(),
      name: `Document_${attachments.length + 1}.pdf`,
      size: Math.floor(Math.random() * 5000000),
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

    if (selectedAdmins.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Veuillez sélectionner au moins un administrateur.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulation d'envoi
    setTimeout(() => {
      const selectedAdminNames = admins
        .filter(a => selectedAdmins.includes(a.id))
        .map(a => `${a.first_name} ${a.last_name}`)
        .join(', ');
      
      toast({
        title: "Message envoyé !",
        description: `Votre message a été envoyé à ${selectedAdmins.length} administrateur(s).`,
      });
      setIsSending(false);
      setSubject('');
      setMessage('');
      setAttachments([]);
      setPriority('normal');
      setSelectedAdmins([]);
      setSearchQuery('');
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Contacter les Administrateurs</DialogTitle>
              <DialogDescription>
                Envoyer un message aux administrateurs de {groupName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection des administrateurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Administrateurs du groupe *</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{selectedAdmins.length} sélectionné(s)</span>
              </div>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un administrateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Liste des administrateurs */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A9D8F] border-t-transparent mx-auto mb-2" />
                  <p>Chargement des administrateurs...</p>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun administrateur trouvé</p>
                </div>
              ) : (
                <>
                  {/* Sélectionner tout */}
                  <div className="sticky top-0 bg-gray-50 border-b p-3">
                    <button
                      onClick={selectAll}
                      className="flex items-center gap-2 text-sm font-medium text-[#2A9D8F] hover:text-[#238b7e]"
                    >
                      <Checkbox
                        checked={selectedAdmins.length === filteredAdmins.length && filteredAdmins.length > 0}
                        onCheckedChange={selectAll}
                      />
                      Sélectionner tout ({filteredAdmins.length})
                    </button>
                  </div>

                  {/* Liste */}
                  <div className="divide-y">
                    {filteredAdmins.map((admin) => (
                      <motion.div
                        key={admin.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleAdmin(admin.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedAdmins.includes(admin.id)}
                            onCheckedChange={() => toggleAdmin(admin.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {admin.avatar ? (
                                <img
                                  src={admin.avatar}
                                  alt={`${admin.first_name} ${admin.last_name}`}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {admin.first_name[0]}{admin.last_name[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {admin.first_name} {admin.last_name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                                {admin.phone && (
                                  <p className="text-xs text-gray-400">{admin.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <Crown className="h-5 w-5 text-[#2A9D8F] flex-shrink-0" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité du message</Label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value as any)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    priority === option.value
                      ? option.color + ' font-medium'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Ex: Demande de budget supplémentaire"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre demande ou question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="text-base resize-none"
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{message.length} caractères</span>
              <span className={message.length < 20 ? 'text-orange-500' : 'text-green-600'}>
                {message.length < 20 ? 'Message trop court' : 'Longueur suffisante'}
              </span>
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pièces jointes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileAttach}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Ajouter un fichier
              </Button>
            </div>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
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
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(file.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Note informative */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium mb-1">
                Communication avec les Administrateurs
              </p>
              <p className="text-xs text-amber-700">
                Votre message sera envoyé aux administrateurs sélectionnés. 
                Vous recevrez une notification lorsqu'ils répondront.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim() || selectedAdmins.length === 0}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6e] gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer à {selectedAdmins.length} admin(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
