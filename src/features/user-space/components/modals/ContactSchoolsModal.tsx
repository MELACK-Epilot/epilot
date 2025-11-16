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
  MessageSquare,
  Send,
  Paperclip,
  X,
  School,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ContactSchoolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolGroupId: string;
  currentSchoolId?: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
}

export const ContactSchoolsModal = ({ 
  isOpen, 
  onClose, 
  schoolGroupId,
  currentSchoolId 
}: ContactSchoolsModalProps) => {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les écoles du groupe
  useEffect(() => {
    if (isOpen && schoolGroupId) {
      loadSchools();
    }
  }, [isOpen, schoolGroupId]);

  const loadSchools = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, address')
        .eq('school_group_id', schoolGroupId)
        .neq('id', currentSchoolId || '') // Exclure l'école actuelle
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Erreur chargement écoles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les écoles du groupe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSchool = (schoolId: string) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const selectAll = () => {
    if (selectedSchools.length === filteredSchools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(filteredSchools.map(s => s.id));
    }
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

    if (selectedSchools.length === 0) {
      toast({
        title: "Aucune école sélectionnée",
        description: "Veuillez sélectionner au moins une école destinataire.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulation d'envoi
    setTimeout(() => {
      toast({
        title: "Message envoyé !",
        description: `Votre message a été envoyé à ${selectedSchools.length} école(s).`,
      });
      setIsSending(false);
      setSubject('');
      setMessage('');
      setSelectedSchools([]);
      setSearchQuery('');
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Réseau des Écoles</DialogTitle>
              <DialogDescription>
                Communiquer avec les autres établissements de votre groupe
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection des écoles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Écoles destinataires *</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{selectedSchools.length} sélectionnée(s)</span>
              </div>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une école..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Liste des écoles */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A9D8F] border-t-transparent mx-auto mb-2" />
                  <p>Chargement des écoles...</p>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <School className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune école trouvée</p>
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
                        checked={selectedSchools.length === filteredSchools.length && filteredSchools.length > 0}
                        onCheckedChange={selectAll}
                      />
                      Sélectionner tout ({filteredSchools.length})
                    </button>
                  </div>

                  {/* Liste */}
                  <div className="divide-y">
                    {filteredSchools.map((school) => (
                      <motion.div
                        key={school.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleSchool(school.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedSchools.includes(school.id)}
                            onCheckedChange={() => toggleSchool(school.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{school.name}</p>
                            {school.address && (
                              <p className="text-sm text-gray-500">{school.address}</p>
                            )}
                          </div>
                          <School className="h-5 w-5 text-gray-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Ex: Partage de bonnes pratiques pédagogiques"
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
              placeholder="Écrivez votre message aux autres écoles du réseau..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-base resize-none"
            />
            <div className="text-sm text-gray-500">
              {message.length} caractères
            </div>
          </div>

          {/* Note informative */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                Communication inter-écoles
              </p>
              <p className="text-xs text-blue-700">
                Votre message sera envoyé aux directeurs/proviseurs des écoles sélectionnées. 
                Favorisez l'échange et la collaboration au sein de votre réseau.
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
            disabled={isSending || !subject.trim() || !message.trim() || selectedSchools.length === 0}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer à {selectedSchools.length} école(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
