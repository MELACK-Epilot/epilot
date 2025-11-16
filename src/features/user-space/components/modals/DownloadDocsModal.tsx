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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Search,
  CheckCircle2,
  Clock,
  Archive,
  Filter,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DownloadDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
}

interface Document {
  id: string;
  name: string;
  category: 'administrative' | 'pedagogical' | 'financial' | 'reports';
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'other';
  size: number;
  date: Date;
  description: string;
  downloads: number;
}

export const DownloadDocsModal = ({ isOpen, onClose, schoolName }: DownloadDocsModalProps) => {
  const { toast } = useToast();
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Rapport_Annuel_2024.pdf',
      category: 'reports',
      type: 'pdf',
      size: 3500000,
      date: new Date('2024-01-15'),
      description: 'Rapport annuel complet des activités et performances',
      downloads: 45,
    },
    {
      id: '2',
      name: 'Calendrier_Scolaire_2024.pdf',
      category: 'administrative',
      type: 'pdf',
      size: 1200000,
      date: new Date('2024-02-01'),
      description: 'Calendrier des activités et vacances scolaires',
      downloads: 128,
    },
    {
      id: '3',
      name: 'Programmes_Pedagogiques.docx',
      category: 'pedagogical',
      type: 'docx',
      size: 2800000,
      date: new Date('2024-01-20'),
      description: 'Programmes détaillés par niveau et matière',
      downloads: 67,
    },
    {
      id: '4',
      name: 'Budget_Previsionnel_2024.xlsx',
      category: 'financial',
      type: 'xlsx',
      size: 1500000,
      date: new Date('2024-01-10'),
      description: 'Budget prévisionnel et dépenses planifiées',
      downloads: 23,
    },
    {
      id: '5',
      name: 'Resultats_Examens_T1.pdf',
      category: 'reports',
      type: 'pdf',
      size: 4200000,
      date: new Date('2024-03-15'),
      description: 'Résultats détaillés des examens du premier trimestre',
      downloads: 89,
    },
    {
      id: '6',
      name: 'Reglement_Interieur.pdf',
      category: 'administrative',
      type: 'pdf',
      size: 980000,
      date: new Date('2023-09-01'),
      description: 'Règlement intérieur de l\'établissement',
      downloads: 156,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const categories = [
    { value: 'all', label: 'Tous les documents', color: 'bg-gray-100 text-gray-800' },
    { value: 'administrative', label: 'Administratif', color: 'bg-blue-100 text-blue-800' },
    { value: 'pedagogical', label: 'Pédagogique', color: 'bg-green-100 text-green-800' },
    { value: 'financial', label: 'Financier', color: 'bg-purple-100 text-purple-800' },
    { value: 'reports', label: 'Rapports', color: 'bg-orange-100 text-orange-800' },
  ];

  const fileTypeIcons = {
    pdf: FileText,
    docx: FileText,
    xlsx: FileText,
    image: ImageIcon,
    other: File,
  };

  const categoryIcons = {
    administrative: FolderOpen,
    pedagogical: FileText,
    financial: Archive,
    reports: FileText,
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

  const handleSelectDoc = (id: string) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter(docId => docId !== id));
    } else {
      setSelectedDocs([...selectedDocs, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleDownload = async () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "Aucun document sélectionné",
        description: "Veuillez sélectionner au moins un document.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setTimeout(() => {
      toast({
        title: "Téléchargement réussi !",
        description: `${selectedDocs.length} document(s) téléchargé(s) avec succès.`,
      });
      setIsDownloading(false);
      setSelectedDocs([]);
    }, 2000);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Télécharger des documents</DialogTitle>
              <DialogDescription>
                Documents disponibles de : <span className="font-semibold text-[#2A9D8F]">{schoolName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
              <div className="text-xs text-gray-600">Documents totaux</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{selectedDocs.length}</div>
              <div className="text-xs text-gray-600">Sélectionnés</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <Archive className="h-6 w-6 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {(documents.reduce((acc, doc) => acc + doc.size, 0) / 1048576).toFixed(1)} MB
              </div>
              <div className="text-xs text-gray-600">Taille totale</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <Download className="h-6 w-6 text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {documents.reduce((acc, doc) => acc + doc.downloads, 0)}
              </div>
              <div className="text-xs text-gray-600">Téléchargements</div>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres par catégorie */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#2A9D8F]" />
              Catégories
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
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Liste des documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2A9D8F]" />
                Documents disponibles ({filteredDocuments.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
              >
                {selectedDocs.length === filteredDocuments.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredDocuments.map((doc) => {
                  const Icon = fileTypeIcons[doc.type];
                  const CategoryIcon = categoryIcons[doc.category];
                  const isSelected = selectedDocs.includes(doc.id);

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-start gap-4 p-4 border rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2A9D8F]/5 border-[#2A9D8F] shadow-md'
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                      onClick={() => handleSelectDoc(doc.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectDoc(doc.id)}
                        className="mt-1"
                      />
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-[#2A9D8F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                          </div>
                          <Badge className={getCategoryColor(doc.category)}>
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categories.find(c => c.value === doc.category)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Archive className="h-3 w-3" />
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {doc.downloads} téléchargements
                          </span>
                        </div>
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
              onClick={handleDownload}
              disabled={isDownloading || selectedDocs.length === 0}
              className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              {isDownloading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger ({selectedDocs.length})
                </>
              )}
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
