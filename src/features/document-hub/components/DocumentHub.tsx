/**
 * Hub Documentaire Principal - Feed de documents
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Upload,
  FileText,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentCard } from './DocumentCard';
import { UploadDocumentModal } from './UploadDocumentModal';
import { StatsCard } from '@/features/user-space/components/StatsCard';
import { useDocumentHub } from '../hooks/useDocumentHub';
import type { DocumentCategory } from '../types/document-hub.types';

interface DocumentHubProps {
  schoolGroupId: string;
  currentUserId: string;
  schools: Array<{ id: string; name: string }>;
  userRole: string;
}

const CATEGORIES: DocumentCategory[] = [
  'Administratif',
  'Pédagogique',
  'Financier',
  'RH',
  'Technique',
  'Autre',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'views', label: 'Plus vus' },
  { value: 'downloads', label: 'Plus téléchargés' },
  { value: 'comments', label: 'Plus commentés' },
];

export const DocumentHub = ({
  schoolGroupId,
  currentUserId,
  schools,
  userRole,
}: DocumentHubProps) => {
  const {
    documents,
    isLoading,
    filters,
    applyFilters,
    uploadDocument,
    downloadDocument,
    recordView,
    addReaction,
    togglePin,
    deleteDocument,
  } = useDocumentHub(schoolGroupId);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [sortBy, setSortBy] = useState('recent');

  // Permissions
  const canUpload = ['admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 'comptable'].includes(userRole);
  const canPin = userRole === 'admin_groupe';
  const canDeleteAny = userRole === 'admin_groupe';

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters({
      ...filters,
      search: query,
    });
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    applyFilters({
      ...filters,
      category: category === 'all' ? undefined : (category as DocumentCategory),
    });
  };

  const handleSchoolFilter = (schoolId: string) => {
    setSelectedSchool(schoolId);
    applyFilters({
      ...filters,
      school_id: schoolId === 'all' ? undefined : schoolId,
    });
  };

  const handleView = (documentId: string) => {
    recordView(documentId);
  };

  const handleDownload = (documentId: string) => {
    downloadDocument(documentId);
  };

  const handleComment = (documentId: string) => {
    // Ouvrir la section commentaires
    console.log('Comment on:', documentId);
  };

  const handleReact = (documentId: string, reactionType: any) => {
    addReaction(documentId, reactionType);
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteDocument(documentId);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Hub Documentaire
          </h1>
          <p className="text-gray-600 mt-1">
            Partagez et consultez les documents de votre groupe scolaire
          </p>
        </div>

        {canUpload && (
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Publier un document
          </Button>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Catégorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catégorie</label>
            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* École */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">École</label>
            <Select value={selectedSchool} onValueChange={handleSchoolFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tri */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Trier par</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Documents"
          value={documents.length}
          subtitle="Total publiés"
          icon={FileText}
          color="from-blue-500 to-blue-600"
          delay={0}
        />

        <StatsCard
          title="Cette semaine"
          value={documents.filter(d => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(d.created_at) > weekAgo;
          }).length}
          subtitle="Nouveaux documents"
          icon={Calendar}
          color="from-green-500 to-green-600"
          delay={0.1}
        />

        <StatsCard
          title="Épinglés"
          value={documents.filter(d => d.is_pinned).length}
          subtitle="Documents importants"
          icon={TrendingUp}
          color="from-purple-500 to-purple-600"
          delay={0.2}
        />

        <StatsCard
          title="Total vues"
          value={documents.reduce((sum, d) => sum + (d.views_count || 0), 0)}
          subtitle="Consultations"
          icon={TrendingUp}
          color="from-orange-500 to-orange-600"
          delay={0.3}
        />
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ))
        ) : documents.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun document trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedSchool !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Soyez le premier à publier un document !'}
            </p>
            {canUpload && (
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Publier un document
              </Button>
            )}
          </div>
        ) : (
          // Documents list
          documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onView={handleView}
              onDownload={handleDownload}
              onComment={handleComment}
              onReact={handleReact}
              onDelete={handleDelete}
              onPin={togglePin}
              canEdit={document.uploaded_by === currentUserId}
              canDelete={canDeleteAny || document.uploaded_by === currentUserId}
              canPin={canPin}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {/* Modal d'upload */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        schoolGroupId={schoolGroupId}
        schools={schools}
        onUpload={uploadDocument}
      />
    </div>
  );
};
