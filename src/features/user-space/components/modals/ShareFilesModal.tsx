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
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FolderOpen,
  Link as LinkIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
}

interface SharedFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'other';
  size: number;
  uploadDate: Date;
  sharedWith: string[];
  status: 'pending' | 'shared' | 'expired';
}

export const ShareFilesModal = ({ isOpen, onClose, schoolName, schoolId }: ShareFilesModalProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<SharedFile[]>([
    {
      id: '1',
      name: 'Rapport_Trimestriel_Q1.pdf',
      type: 'document',
      size: 2500000,
      uploadDate: new Date('2024-01-15'),
      sharedWith: ['teachers', 'admin'],
      status: 'shared',
    },
    {
      id: '2',
      name: 'Photos_Ceremonie_2024.zip',
      type: 'image',
      size: 15000000,
      uploadDate: new Date('2024-02-20'),
      sharedWith: ['all'],
      status: 'shared',
    },
    {
      id: '3',
      name: 'Presentation_Rentree.pptx',
      type: 'document',
      size: 5200000,
      uploadDate: new Date('2024-03-01'),
      sharedWith: ['parents'],
      status: 'pending',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  const fileTypeIcons = {
    document: FileText,
    image: ImageIcon,
    video: Video,
    audio: Music,
    other: File,
  };

  const fileTypeColors = {
    document: 'text-blue-600',
    image: 'text-green-600',
    video: 'text-purple-600',
    audio: 'text-orange-600',
    other: 'text-gray-600',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    shared: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: 'En attente',
    shared: 'Partagé',
    expired: 'Expiré',
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newFile: SharedFile = {
        id: Date.now().toString(),
        name: `Nouveau_Document_${files.length + 1}.pdf`,
        type: 'document',
        size: Math.floor(Math.random() * 10000000),
        uploadDate: new Date(),
        sharedWith: ['all'],
        status: 'shared',
      };
      setFiles([newFile, ...files]);
      setIsUploading(false);
      toast({
        title: "Fichier partagé !",
        description: "Le fichier a été partagé avec succès.",
      });
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast({
      title: "Fichier supprimé",
      description: "Le fichier a été retiré du partage.",
    });
  };

  const handleCopyLink = (fileName: string) => {
    toast({
      title: "Lien copié !",
      description: `Le lien de partage pour "${fileName}" a été copié.`,
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Partage de fichiers</DialogTitle>
              <DialogDescription>
                Gérer les fichiers partagés avec : <span className="font-semibold text-[#2A9D8F]">{schoolName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Actions rapides */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Partager un fichier
                </>
              )}
            </Button>
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              Créer un dossier
            </Button>
          </div>

          {/* Recherche et filtres */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un fichier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-[#2A9D8F]' : ''}
              >
                Tous
              </Button>
              <Button
                variant={filterType === 'document' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('document')}
                className={filterType === 'document' ? 'bg-[#2A9D8F]' : ''}
              >
                <FileText className="h-4 w-4 mr-1" />
                Documents
              </Button>
              <Button
                variant={filterType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('image')}
                className={filterType === 'image' ? 'bg-[#2A9D8F]' : ''}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Images
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-xs text-gray-600">Fichiers totaux</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {files.filter(f => f.status === 'shared').length}
              </div>
              <div className="text-xs text-gray-600">Partagés</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <Clock className="h-6 w-6 text-yellow-600 mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {files.filter(f => f.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">En attente</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <Share2 className="h-6 w-6 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {(files.reduce((acc, f) => acc + f.size, 0) / 1048576).toFixed(1)} MB
              </div>
              <div className="text-xs text-gray-600">Espace utilisé</div>
            </div>
          </div>

          {/* Liste des fichiers */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2A9D8F]" />
              Fichiers partagés ({filteredFiles.length})
            </Label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredFiles.map((file) => {
                  const Icon = fileTypeIcons[file.type];
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${fileTypeColors[file.type]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatDate(file.uploadDate)}</span>
                            <Badge className={statusColors[file.status]}>
                              {statusLabels[file.status]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(file.name)}
                          className="text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
