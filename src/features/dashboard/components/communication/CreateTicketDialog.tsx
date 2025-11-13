/**
 * Modal de création de ticket
 * Design moderne avec couleurs E-Pilot
 */

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import type { TicketPriority, TicketCategory } from '../../types/communication.types';

interface CreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: TicketData) => void;
}

interface TicketData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  attachments: File[];
}

export const CreateTicketDialog = ({ isOpen, onClose, onCreate }: CreateTicketDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technique');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'technique', label: 'Technique', icon: AlertCircle },
    { value: 'pedagogique', label: 'Pédagogique', icon: CheckCircle2 },
    { value: 'financier', label: 'Financier', icon: Clock },
    { value: 'administratif', label: 'Administratif', icon: FileText },
    { value: 'autre', label: 'Autre', icon: AlertTriangle },
  ];

  const priorities = [
    { value: 'low', label: 'Faible', color: 'text-gray-600', icon: Clock },
    { value: 'medium', label: 'Moyenne', color: 'text-blue-600', icon: AlertCircle },
    { value: 'high', label: 'Haute', color: 'text-orange-600', icon: AlertTriangle },
    { value: 'urgent', label: 'Urgente', color: 'text-red-600', icon: XCircle },
  ];

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

  const handleCreate = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!description.trim()) {
      setError('La description est obligatoire');
      return;
    }

    onCreate({
      title,
      description,
      category,
      priority,
      attachments
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('technique');
    setPriority('medium');
    setAttachments([]);
    setError(null);
    onClose();
  };

  const selectedPriority = priorities.find(p => p.value === priority);
  const PriorityIcon = selectedPriority?.icon || AlertCircle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            Créer un Ticket
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

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Titre du ticket *
            </Label>
            <Input
              id="title"
              placeholder="Résumez votre problème en quelques mots..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Catégorie et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Catégorie *
              </Label>
              <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                Priorité *
              </Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((prio) => {
                    const Icon = prio.icon;
                    return (
                      <SelectItem key={prio.value} value={prio.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${prio.color}`} />
                          <span className={prio.color}>{prio.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description détaillée *
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre problème en détail. Plus vous donnez d'informations, plus nous pourrons vous aider rapidement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-gray-500">
              Incluez toutes les informations pertinentes : étapes pour reproduire le problème, messages d'erreur, etc.
            </p>
          </div>

          {/* Pièces jointes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Pièces jointes (captures d'écran, documents...)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
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
              Ajouter des fichiers (max 10MB par fichier)
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

          {/* Aperçu de la priorité */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                priority === 'urgent' ? 'from-red-500 to-red-600' :
                priority === 'high' ? 'from-orange-500 to-orange-600' :
                priority === 'medium' ? 'from-blue-500 to-blue-600' :
                'from-gray-400 to-gray-500'
              } flex items-center justify-center`}>
                <PriorityIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Priorité sélectionnée</p>
                <p className={`text-lg font-bold ${selectedPriority?.color}`}>
                  {selectedPriority?.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-[#E9C46A] to-[#d4a84f] hover:from-[#1D3557] hover:to-[#0d1f3d] text-white"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Créer le ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
