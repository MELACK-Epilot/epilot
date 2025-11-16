/**
 * Page Hub Documentaire OPTIMISÉE
 * Avec Zustand + Realtime + Optimistic Updates
 */

import { useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDocumentStore } from '@/features/document-hub/store/useDocumentStore';
import { useRealtimeDocuments } from '@/features/document-hub/hooks/useRealtimeDocuments';
import { useDocumentHubOptimized } from '@/features/document-hub/hooks/useDocumentHubOptimized';
import { DocumentCard } from '@/features/document-hub/components/DocumentCard';
import { UploadDocumentModal } from '@/features/document-hub/components/UploadDocumentModal';
import { StatsCard } from '../components/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Upload, FileText, Calendar, TrendingUp, Download, MessageSquare, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

const useSchools = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['schools', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) return [];
      
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('school_group_id', schoolGroupId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolGroupId,
  });
};

const CATEGORIES = [
  'Administratif',
  'Pédagogique',
  'Financier',
  'RH',
  'Technique',
  'Autre',
];

export const DocumentHubPageOptimized = () => {
  const { data: user } = useCurrentUser();
  const { data: schools = [] } = useSchools(user?.schoolGroupId);
  const { documents } = useDocumentStore();
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'views' | 'downloads' | 'comments'>('recent');

  // Active le temps réel
  useRealtimeDocuments(user?.schoolGroupId || '');

  // Hook optimisé avec actions instantanées
  const {
    handleReaction,
    handleView,
    handleDownload,
    handleAddComment,
    handleDeleteComment,
    uploadDocument,
  } = useDocumentHubOptimized(user?.schoolGroupId || '', user?.id || '');

  // Filtrer et trier les documents
  const filteredDocuments = documents
    .filter(doc => {
      // Recherche dans titre, description et tags
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(query);
        const matchDescription = doc.description?.toLowerCase().includes(query);
        const matchTags = doc.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchDescription && !matchTags) {
          return false;
        }
      }
      
      // Filtre par catégorie
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
      
      // Filtre par école
      if (selectedSchool !== 'all' && doc.school_id !== selectedSchool) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Tri par critère sélectionné
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0);
        case 'downloads':
          return (b.downloads_count || 0) - (a.downloads_count || 0);
        case 'comments':
          return (b.comments_count || 0) - (a.comments_count || 0);
        default:
          return 0;
      }
    });

  // Permissions
  const canUpload = ['admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 'comptable'].includes(user?.role || '');
  const canPin = user?.role === 'admin_groupe';
  const canDeleteAny = user?.role === 'admin_groupe';

  if (!user) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Statistiques avec StatsCard - Grille 2x3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ligne 1 */}
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

        {/* Ligne 2 */}
        <StatsCard
          title="Total vues"
          value={documents.reduce((sum, d) => sum + (d.views_count || 0), 0)}
          subtitle="Consultations"
          icon={TrendingUp}
          color="from-orange-500 to-orange-600"
          delay={0.3}
        />

        <StatsCard
          title="Téléchargements"
          value={documents.reduce((sum, d) => sum + (d.downloads_count || 0), 0)}
          subtitle="Total téléchargements"
          icon={Download}
          color="from-indigo-500 to-indigo-600"
          delay={0.4}
        />

        <StatsCard
          title="Commentaires"
          value={documents.reduce((sum, d) => sum + (d.comments_count || 0), 0)}
          subtitle="Total interactions"
          icon={MessageSquare}
          color="from-pink-500 to-pink-600"
          delay={0.5}
        />
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher dans titre, description ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filtres et tri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Catégorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catégorie</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
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
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Trier par
            </label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">📅 Plus récents</SelectItem>
                <SelectItem value="oldest">📅 Plus anciens</SelectItem>
                <SelectItem value="views">👁️ Plus vus</SelectItem>
                <SelectItem value="downloads">📥 Plus téléchargés</SelectItem>
                <SelectItem value="comments">💬 Plus commentés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Indicateur de résultats */}
        {(searchQuery || selectedCategory !== 'all' || selectedSchool !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredDocuments.length}</span> document(s) trouvé(s)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSchool('all');
                setSortBy('recent');
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
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
          filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onView={handleView}
              onDownload={handleDownload}
              onComment={() => {}}
              onReact={handleReaction}
              onDelete={(id) => {
                if (confirm('Supprimer ce document ?')) {
                  // TODO: implement delete
                }
              }}
              onPin={() => {
                // TODO: implement pin
              }}
              canEdit={document.uploaded_by === user.id}
              canDelete={canDeleteAny || document.uploaded_by === user.id}
              canPin={canPin}
              currentUserId={user.id}
            />
          ))
        )}
      </div>

      {/* Modal d'upload */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        schoolGroupId={user.schoolGroupId || ''}
        schools={schools}
        onUpload={uploadDocument}
      />
    </div>
  );
};
