import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  CheckCircle2,
  AlertCircle,
  Cloud,
  FolderOpen,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  category: string;
  description: string;
}

export const UploadFilesModal = ({ isOpen, onClose, schoolName }: UploadFilesModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('administrative');

  const categories = [
    { value: 'administrative', label: 'Administratif', icon: FolderOpen, color: 'bg-blue-100 text-blue-800' },
    { value: 'pedagogical', label: 'Pédagogique', icon: FileText, color: 'bg-green-100 text-green-800' },
    { value: 'financial', label: 'Financier', icon: FileText, color: 'bg-purple-100 text-purple-800' },
    { value: 'reports', label: 'Rapports', icon: FileText, color: 'bg-orange-100 text-orange-800' },
    { value: 'media', label: 'Médias', icon: ImageIcon, color: 'bg-pink-100 text-pink-800' },
  ];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return ImageIcon;
    if (['mp4', 'avi', 'mov'].includes(ext || '')) return Video;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return Music;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      category: selectedCategory,
      description: '',
    }));
    setFiles([...files, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const updateFileDescription = (id: string, description: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, description } : f));
  };

  const updateFileCategory = (id: string, category: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, category } : f));
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress, status: 'uploading' } : f
        ));
      }
    }, 500);
  };

  const handleUploadAll = () => {
    if (files.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez ajouter des fichiers à uploader.",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.status === 'pending') {
        simulateUpload(file.id);
      }
    });

    setTimeout(() => {
      toast({
        title: "Upload terminé !",
        description: `${files.length} fichier(s) envoyé(s) à ${schoolName}.`,
      });
    }, 3000);
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const completedFiles = files.filter(f => f.status === 'completed').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Envoyer des fichiers</DialogTitle>
              <DialogDescription>
                Uploader des fichiers vers : <span className="font-semibold text-[#2A9D8F]">{schoolName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-xs text-gray-600">Fichiers en attente</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
              <div className="text-xs text-gray-600">Fichiers envoyés</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <Cloud className="h-6 w-6 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">{formatFileSize(totalSize)}</div>
              <div className="text-xs text-gray-600">Taille totale</div>
            </div>
          </div>

          {/* Catégorie par défaut */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#2A9D8F]" />
              Catégorie par défaut
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.value}
                  className={`cursor-pointer px-4 py-2 ${
                    selectedCategory === category.value
                      ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                      : category.color
                  }`}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <category.icon className="h-3 w-3 mr-1" />
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Zone de drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive
                ? 'border-[#2A9D8F] bg-[#2A9D8F]/5'
                : 'border-gray-300 hover:border-[#2A9D8F] hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Glissez-déposez vos fichiers ici
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez sur le bouton ci-dessous pour sélectionner
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4, etc.
            </p>
          </div>

          {/* Liste des fichiers */}
          {files.length > 0 && (
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2A9D8F]" />
                Fichiers à envoyer ({files.length})
              </Label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {files.map((uploadFile) => {
                    const Icon = getFileIcon(uploadFile.file.name);
                    const statusIcons = {
                      pending: AlertCircle,
                      uploading: Upload,
                      completed: CheckCircle2,
                      error: AlertCircle,
                    };
                    const StatusIcon = statusIcons[uploadFile.status];
                    const statusColors = {
                      pending: 'text-gray-500',
                      uploading: 'text-blue-500',
                      completed: 'text-green-500',
                      error: 'text-red-500',
                    };

                    return (
                      <motion.div
                        key={uploadFile.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 bg-white border border-gray-200 rounded-xl"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-[#2A9D8F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 truncate">{uploadFile.file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`h-5 w-5 ${statusColors[uploadFile.status]}`} />
                                {uploadFile.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(uploadFile.id)}
                                    className="text-red-500 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {uploadFile.status === 'uploading' && (
                              <Progress value={uploadFile.progress} className="mb-2" />
                            )}

                            {uploadFile.status === 'pending' && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  {categories.map((cat) => (
                                    <Badge
                                      key={cat.value}
                                      className={`cursor-pointer text-xs ${
                                        uploadFile.category === cat.value
                                          ? 'bg-[#2A9D8F] text-white'
                                          : cat.color
                                      }`}
                                      onClick={() => updateFileCategory(uploadFile.id, cat.value)}
                                    >
                                      {cat.label}
                                    </Badge>
                                  ))}
                                </div>
                                <Input
                                  placeholder="Description (optionnelle)"
                                  value={uploadFile.description}
                                  onChange={(e) => updateFileDescription(uploadFile.id, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleUploadAll}
              disabled={files.length === 0 || files.every(f => f.status !== 'pending')}
              className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Envoyer tous les fichiers ({files.filter(f => f.status === 'pending').length})
            </Button>
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
