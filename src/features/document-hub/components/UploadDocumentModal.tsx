/**
 * Modal pour uploader un document
 */

import { useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { DocumentCategory, DocumentVisibility, UploadDocumentForm } from '../types/document-hub.types';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolGroupId: string;
  schools: Array<{ id: string; name: string }>;
  onUpload: (formData: UploadDocumentForm) => Promise<void>;
}

const CATEGORIES: DocumentCategory[] = [
  'Administratif',
  'Pédagogique',
  'Financier',
  'RH',
  'Technique',
  'Autre',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  schoolGroupId,
  schools,
  onUpload,
}: UploadDocumentModalProps) => {
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Administratif');
  const [visibility, setVisibility] = useState<DocumentVisibility>('group');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 50 MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Fichier manquant",
        description: "Veuillez sélectionner un fichier.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Titre manquant",
        description: "Veuillez saisir un titre.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData: UploadDocumentForm = {
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        visibility,
        school_id: visibility === 'school' ? schoolId : null,
        file,
      };

      await onUpload(formData);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Administratif');
      setVisibility('group');
      setSchoolId(null);
      setTags([]);
      setFile(null);
      
      onClose();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Publier un Document</DialogTitle>
              <DialogDescription>
                Partagez un document avec votre groupe scolaire
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre du document <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Circulaire N°05/2025 - Calendrier scolaire"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le contenu du document..."
              rows={3}
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as DocumentCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibilité */}
          <div className="space-y-2">
            <Label htmlFor="visibility">
              Visibilité <span className="text-red-500">*</span>
            </Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as DocumentVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Tout le groupe scolaire</SelectItem>
                <SelectItem value="school">Une école spécifique</SelectItem>
                <SelectItem value="private">Privé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* École (si visibilité = school) */}
          {visibility === 'school' && (
            <div className="space-y-2">
              <Label htmlFor="school">
                École <span className="text-red-500">*</span>
              </Label>
              <Select value={schoolId || ''} onValueChange={setSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une école" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ajoutez des tags pour faciliter la recherche"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Fichier */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Fichier <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-blue-500" />
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Changer de fichier
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <label
                      htmlFor="file"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Cliquez pour sélectionner
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF, Word, Excel, PowerPoint, Images (Max 50 MB)
                    </p>
                  </div>
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              disabled={isUploading || !file || !title.trim()}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Publication en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publier le document
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
